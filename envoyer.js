#!/usr/bin/env node
// Envoie un ou plusieurs fichiers dans Passerelle depuis la ligne de commande
// (pratique pour un script ou un agent comme Claude Code).
//   node envoyer.js <fichier> [autres fichiers...] [--open] [--json]
//   --open : ouvre aussi la page Passerelle sur le PC (si elle n'y est pas déjà ouverte)
// Lance le serveur s'il ne tourne pas, envoie les fichiers, puis affiche
// les liens de téléchargement directs (Wi-Fi et Tailscale).
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 8765;
const BASE = `http://127.0.0.1:${PORT}`;

const files = process.argv.slice(2).filter(a => !a.startsWith('--'));
const asJson = process.argv.includes('--json');
if (!files.length) {
  console.error('Usage : node envoyer.js <fichier> [autres fichiers...] [--open] [--json]');
  process.exit(2);
}

function getJson(url, timeout = 1500) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout }, res => {
      let body = '';
      res.on('data', c => (body += c));
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function ensureServer() {
  try { return await getJson(`${BASE}/api/info`); } catch {}
  if (!asJson) console.log('Passerelle ne tourne pas : démarrage (fenêtre réduite dans la barre des tâches)…');
  // stdio 'ignore' + unref : le serveur vit sa vie, cette commande peut se terminer
  const opts = { cwd: ROOT, env: { ...process.env, PORT: String(PORT) }, detached: true, stdio: 'ignore' };
  const child = process.platform === 'win32'
    ? spawn('cmd.exe', ['/c', `start "Passerelle" /min "${process.execPath}" server.js`], { ...opts, windowsVerbatimArguments: true })
    : spawn(process.execPath, ['server.js'], opts);
  child.unref();
  for (let i = 0; i < 40; i++) {
    await sleep(250);
    try { return await getJson(`${BASE}/api/info`); } catch {}
  }
  throw new Error(`le serveur n'a pas démarré sur le port ${PORT}`);
}

function upload(file) {
  return new Promise((resolve, reject) => {
    const size = fs.statSync(file).size;
    const req = http.request(`${BASE}/api/upload?name=${encodeURIComponent(path.basename(file))}`, {
      method: 'PUT',
      headers: { 'Content-Length': size, 'Content-Type': 'application/octet-stream', 'X-Passerelle-From': 'claude' },
    }, res => {
      let body = '';
      res.on('data', c => (body += c));
      res.on('end', () => res.statusCode === 200 ? resolve(JSON.parse(body).name) : reject(new Error(`HTTP ${res.statusCode} ${body}`)));
    });
    req.on('error', reject);
    fs.createReadStream(file).on('error', reject).pipe(req);
  });
}

const fmtSize = b => b < 1048576 ? (b / 1024).toFixed(0) + ' Ko' : b < 1073741824 ? (b / 1048576).toFixed(1) + ' Mo' : (b / 1073741824).toFixed(2) + ' Go';

(async () => {
  for (const f of files) {
    if (!fs.existsSync(f)) throw new Error(`fichier introuvable : ${f}`);
    if (!fs.statSync(f).isFile()) throw new Error(`ce n'est pas un fichier (zippe d'abord un dossier) : ${f}`);
  }
  const info = await ensureServer();
  const token = fs.readFileSync(path.join(ROOT, '.token'), 'utf8').trim();
  const nets = info.urls.map(u => ({ name: u.name, ip: u.ip, page: u.url }));

  const sent = [];
  for (const f of files) {
    const name = await upload(f);
    const size = fs.statSync(f).size;
    sent.push({
      file: path.resolve(f), name, size,
      links: nets.map(n => ({ network: n.name, url: `http://${n.ip}:${PORT}/api/dl/${encodeURIComponent(name)}?k=${token}` })),
    });
  }

  // --open : affiche la page Passerelle sur le PC (sauf si elle y est déjà ouverte)
  let pageOpened = false;
  if (process.argv.includes('--open')) {
    const now = await getJson(`${BASE}/api/info`).catch(() => ({}));
    if (!now.pcPageOpen) {
      const url = `http://localhost:${PORT}/`;
      const child = process.platform === 'win32'
        ? spawn('cmd.exe', ['/c', `start "" "${url}"`], { detached: true, stdio: 'ignore', windowsVerbatimArguments: true })
        : spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [url], { detached: true, stdio: 'ignore' });
      child.unref();
      pageOpened = true;
    }
  }

  if (asJson) { console.log(JSON.stringify({ sent, pages: nets, pageOpened }, null, 2)); return; }
  for (const s of sent) {
    console.log(`\n✓ ${s.name} (${fmtSize(s.size)})`);
    for (const l of s.links) console.log(`  ${l.network.padEnd(10)} ${l.url}`);
  }
  console.log('\nPage Passerelle :');
  for (const n of nets) console.log(`  ${n.name.padEnd(10)} ${n.page}`);
})().catch(e => { console.error('Échec : ' + e.message); process.exit(1); });
