// Passerelle — transfert de fichiers PC <-> téléphone sur le réseau local.
// Aucune dépendance : node server.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const PORT = Number(process.env.PORT) || 8765;
const ROOT = __dirname;
const DIR = path.join(ROOT, 'partage');
const META = path.join(DIR, '.meta.json');
const TOKEN_FILE = path.join(ROOT, '.token');

fs.mkdirSync(DIR, { recursive: true });

// Clé secrète stable (le lien du téléphone reste valable d'un lancement à l'autre)
let TOKEN;
try { TOKEN = fs.readFileSync(TOKEN_FILE, 'utf8').trim(); } catch {}
if (!TOKEN) { TOKEN = crypto.randomBytes(9).toString('base64url'); fs.writeFileSync(TOKEN_FILE, TOKEN); }

let meta = {};
try { meta = JSON.parse(fs.readFileSync(META, 'utf8')); } catch {}
const saveMeta = () => fs.writeFileSync(META, JSON.stringify(meta, null, 1));

// --- Notifications temps réel (SSE)
const clients = new Set();
function notify() { for (const res of clients) res.write('data: change\n\n'); }

function addresses() {
  const out = [];
  for (const [name, list] of Object.entries(os.networkInterfaces())) {
    for (const a of list || []) {
      if (a.family === 'IPv4' && !a.internal && !a.address.startsWith('169.254')) out.push({ name, ip: a.address });
    }
  }
  // Wi-Fi / Ethernet d'abord, VPN ensuite
  return out.sort((x, y) => (/tailscale|vpn|virtual|vethernet/i.test(x.name) ? 1 : 0) - (/tailscale|vpn|virtual|vethernet/i.test(y.name) ? 1 : 0));
}

function safeName(raw) {
  let n = path.basename(String(raw || 'fichier')).replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim();
  if (!n || n.startsWith('.')) n = 'fichier' + n;
  return n.slice(0, 180);
}
function uniqueName(n) {
  if (!fs.existsSync(path.join(DIR, n))) return n;
  const ext = path.extname(n), base = n.slice(0, n.length - ext.length);
  for (let i = 2; ; i++) { const c = `${base} (${i})${ext}`; if (!fs.existsSync(path.join(DIR, c))) return c; }
}
function fileFromUrl(p) {
  const n = safeName(decodeURIComponent(p));
  const full = path.join(DIR, n);
  return full.startsWith(DIR + path.sep) && fs.existsSync(full) ? { n, full } : null;
}

function isLocal(req) {
  const a = req.socket.remoteAddress || '';
  return a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1';
}
function cookieToken(req) {
  const m = /(?:^|;\s*)pk=([^;]+)/.exec(req.headers.cookie || '');
  return m && m[1];
}
function send(res, code, body, type = 'application/json; charset=utf-8') {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;

  // Le PC (localhost) est toujours autorisé ; les autres appareils ont besoin de la clé.
  const qk = url.searchParams.get('k');
  const authed = isLocal(req) || qk === TOKEN || cookieToken(req) === TOKEN;
  if (!authed) return send(res, 403, '<meta name=viewport content="width=device-width"><p style="font:18px system-ui;padding:24px">Lien incomplet : scanne le QR code affiché sur le PC.</p>', 'text/html; charset=utf-8');

  if (p === '/' || p === '/index.html') {
    const headers = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' };
    if (qk === TOKEN) headers['Set-Cookie'] = `pk=${TOKEN}; Path=/; Max-Age=31536000; SameSite=Lax`;
    res.writeHead(200, headers);
    return fs.createReadStream(path.join(ROOT, 'index.html')).pipe(res);
  }

  if (p === '/api/info') {
    return send(res, 200, {
      local: isLocal(req),
      urls: addresses().map(a => ({ ...a, url: `http://${a.ip}:${PORT}/?k=${TOKEN}` })),
    });
  }

  if (p === '/api/files' && req.method === 'GET') {
    const files = fs.readdirSync(DIR).filter(n => !n.startsWith('.')).map(n => {
      const st = fs.statSync(path.join(DIR, n));
      if (!st.isFile()) return null;
      return { name: n, size: st.size, time: st.mtimeMs, from: meta[n]?.from || 'pc', downloads: meta[n]?.downloads || 0 };
    }).filter(Boolean).sort((a, b) => b.time - a.time);
    return send(res, 200, files);
  }

  if (p === '/api/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
    res.write('retry: 2000\n\n');
    clients.add(res);
    const ping = setInterval(() => res.write(': ping\n\n'), 25000);
    req.on('close', () => { clearInterval(ping); clients.delete(res); });
    return;
  }

  if (p === '/api/upload' && req.method === 'PUT') {
    const name = uniqueName(safeName(url.searchParams.get('name')));
    const tmp = path.join(DIR, `.part-${crypto.randomBytes(4).toString('hex')}`);
    const out = fs.createWriteStream(tmp);
    let failed = false;
    const fail = () => { if (failed) return; failed = true; out.destroy(); fs.rm(tmp, { force: true }, () => {}); };
    req.on('aborted', fail);
    req.pipe(out);
    out.on('error', () => { fail(); send(res, 500, { error: 'écriture impossible' }); });
    out.on('finish', () => {
      if (failed) return;
      fs.renameSync(tmp, path.join(DIR, name));
      const ua = req.headers['user-agent'] || '';
      meta[name] = { from: isLocal(req) ? 'pc' : (/Mobi|Android|iPhone|iPad/i.test(ua) ? 'tel' : 'autre'), downloads: 0 };
      saveMeta(); notify();
      send(res, 200, { name });
    });
    return;
  }

  if (p.startsWith('/api/dl/') && req.method === 'GET') {
    const f = fileFromUrl(p.slice(8));
    if (!f) return send(res, 404, { error: 'introuvable' });
    const st = fs.statSync(f.full);
    const inline = url.searchParams.has('voir');
    res.writeHead(200, {
      'Content-Type': inline ? mime(f.n) : 'application/octet-stream',
      'Content-Length': st.size,
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(f.n)}`,
      'Cache-Control': 'no-store',
    });
    const s = fs.createReadStream(f.full);
    s.pipe(res);
    if (!inline) s.on('end', () => { meta[f.n] = { ...(meta[f.n] || { from: 'pc' }), downloads: (meta[f.n]?.downloads || 0) + 1 }; saveMeta(); notify(); });
    return;
  }

  if (p.startsWith('/api/files/') && req.method === 'DELETE') {
    const f = fileFromUrl(p.slice(11));
    if (!f) return send(res, 404, { error: 'introuvable' });
    fs.rmSync(f.full); delete meta[f.n]; saveMeta(); notify();
    return send(res, 200, { ok: true });
  }

  if (p === '/api/open-folder' && req.method === 'POST' && isLocal(req)) {
    require('child_process').spawn('explorer', [DIR], { detached: true, stdio: 'ignore' }).unref();
    return send(res, 200, { ok: true });
  }

  send(res, 404, { error: 'not found' });
});

function mime(n) {
  const e = path.extname(n).toLowerCase().slice(1);
  return ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', heic: 'image/heic',
    mp4: 'video/mp4', mov: 'video/quicktime', mp3: 'audio/mpeg', pdf: 'application/pdf', txt: 'text/plain; charset=utf-8' })[e] || 'application/octet-stream';
}

server.requestTimeout = 0; // gros fichiers
server.listen(PORT, process.env.HOST || '0.0.0.0', () => {
  const local = `http://localhost:${PORT}`;
  console.log('\n  Passerelle est lancée.\n');
  console.log(`  Sur ce PC        : ${local}`);
  for (const a of addresses()) console.log(`  Téléphone (${a.name}) : http://${a.ip}:${PORT}/?k=${TOKEN}`);
  console.log(`\n  Fichiers rangés dans : ${DIR}`);
  console.log('  Ferme cette fenêtre pour arrêter.\n');
  if (process.argv.includes('--open')) require('child_process').exec(`start "" "${local}"`);
});
