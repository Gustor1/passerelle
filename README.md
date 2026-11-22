# Passerelle

**Transfère des fichiers entre ton PC et ton téléphone, sans câble, sans cloud, sans app à installer sur le téléphone.**

*Drop files on your PC, grab them on your phone (and the other way round) over your local network. Zero dependencies, one Node.js file.*

- Glisse un fichier sur la page du PC : il apparaît aussitôt sur le téléphone.
- Envoie photos, vidéos et documents depuis le téléphone : ils arrivent sur le PC.
- Une fois téléchargé, le fichier est marqué « téléchargé ✓ » et tu peux le supprimer.
- Mise à jour en temps réel, aperçu des images, Ctrl+V pour coller une capture d'écran.
- Les fichiers restent chez toi : ils ne passent par aucun serveur extérieur.

## Prérequis

- [Node.js](https://nodejs.org/) 18 ou plus récent sur le PC.
- Le PC et le téléphone sur le même réseau Wi-Fi, **ou** les deux connectés à [Tailscale](https://tailscale.com/) (fonctionne alors même en 4G/5G).

## Utilisation

```bash
git clone https://github.com/Gustor1/passerelle.git
cd passerelle
node server.js --open
```

Sous Windows, tu peux aussi double-cliquer sur `Lancer Passerelle.bat`.

1. La page s'ouvre sur le PC avec un QR code.
2. Au premier lancement, Windows demande d'autoriser Node sur le réseau : coche **Réseaux privés**.
3. Scanne le QR code avec le téléphone, puis ajoute la page à l'écran d'accueil.
4. Ferme la fenêtre du serveur pour arrêter Passerelle.

Les fichiers sont rangés dans le dossier `partage/` à côté de `server.js`.

### Options

| Variable | Défaut    | Rôle                         |
|----------|-----------|------------------------------|
| `PORT`   | `8765`    | Port d'écoute                |
| `HOST`   | `0.0.0.0` | Interface d'écoute           |

## Envoyer depuis la ligne de commande (scripts, agents IA)

```bash
node envoyer.js chemin/vers/video.mp4 [autres fichiers...] [--json]
```

Démarre Passerelle s'il ne tourne pas, envoie les fichiers et affiche un lien de
téléchargement direct par réseau (Wi-Fi, Tailscale…). Pratique pour qu'un agent
comme Claude Code te passe le rendu d'une vidéo : tu ouvres le lien sur ton
téléphone, même en 5G avec Tailscale. Les fichiers envoyés ainsi apparaissent
avec l'étiquette « envoyé par Claude ».

Un fichier copié directement dans `partage/` apparaît aussi en direct sur la page.

## Sécurité

- Le PC lui-même (localhost) a toujours accès.
- Les autres appareils ont besoin d'une clé secrète, incluse dans le lien du QR code et enregistrée dans `.token`. Supprime ce fichier pour en générer une nouvelle (il faudra rescanner).
- Le trafic passe en HTTP simple sur le réseau local : n'utilise pas Passerelle sur un Wi-Fi public. Avec Tailscale, le trafic est chiffré par le tunnel.

## Licence

[MIT](LICENSE)
