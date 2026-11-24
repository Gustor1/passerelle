# Passerelle

**Transfère des fichiers entre ton PC et ton téléphone, sans câble, sans cloud, sans app à installer sur le téléphone.**

*Drop files on your PC, grab them on your phone (and the other way round) over your local network. Zero dependencies, one Node.js file.*

- Glisse un fichier sur la page du PC : il apparaît aussitôt sur le téléphone.
- Envoie photos, vidéos et documents depuis le téléphone : ils arrivent sur le PC.
- Une fois téléchargé, le fichier est marqué « téléchargé ✓ » et tu peux le supprimer.
- Mise à jour en temps réel, aperçu des images, Ctrl+V pour coller une capture d'écran.
- Les fichiers restent chez toi : ils ne passent par aucun serveur extérieur.
- Avec [Claude Code](https://claude.com/claude-code) : dis « transfère téléphone » et le fichier que Claude vient de créer (vidéo, image, PDF…) arrive sur ton téléphone, même en 4G/5G.

## Installation rapide avec Claude Code (recommandé)

Tu n'as rien à configurer à la main : Claude s'en charge.

**1. Installe ce qu'il faut (une seule fois)**

| Où | Quoi |
|---|---|
| PC | [Node.js](https://nodejs.org/) (version LTS) |
| PC | [Tailscale](https://tailscale.com/download), connecté avec ton compte |
| Téléphone | L'app Tailscale ([iPhone](https://apps.apple.com/app/tailscale/id1470499037) / [Android](https://play.google.com/store/apps/details?id=com.tailscale.ipn)), connectée avec **le même compte** que le PC |

Vérifie dans l'app Tailscale du téléphone que le PC apparaît dans la liste des appareils.

**2. Demande à Claude Code de tout installer**

Ouvre Claude Code sur ton PC et colle ce message :

```text
Clone https://github.com/Gustor1/passerelle dans mon dossier Documents, puis
installe le skill claude-skill/transfert-telephone dans mes skills Claude Code
(~/.claude/skills/). Remplace <CHEMIN_PASSERELLE> par le dossier cloné et
<NOM_DU_TELEPHONE> par le nom de mon téléphone dans Tailscale (trouve-le avec
`tailscale file cp --targets`). Ensuite, envoie-moi une image test sur mon
téléphone pour vérifier que ça marche.
```

Claude clone le dépôt, installe le skill avec tes réglages et t'envoie une image
test. Sur iPhone, tu la trouves dans l'app **Fichiers** → dossier **Tailscale** ;
sur Android, dans **Téléchargements**.

**3. Utilise-le**

Ouvre une **nouvelle** conversation Claude Code (le skill n'est chargé qu'au
démarrage d'une conversation). Quand Claude a fini un fichier, dis-lui :

> transfère téléphone

Le fichier arrive sur ton téléphone. Pour mettre une vidéo ou une image dans
Photos sur iPhone : ouvre-la dans Fichiers → **Partager** → **Enregistrer**.

Si tu préfères un lien plutôt qu'un envoi direct, dis « donne-moi un lien » :
Claude passe alors par la page Passerelle (voir plus bas).

> **Ton PC doit rester allumé** pendant l'envoi, et **Tailscale doit être activé**
> sur le téléphone.

## Prérequis (utilisation sans Claude)

- [Node.js](https://nodejs.org/) 18 ou plus récent sur le PC.
- Le PC et le téléphone sur le même réseau Wi-Fi, **ou** les deux connectés à [Tailscale](https://tailscale.com/) (fonctionne alors même en 4G/5G).

## Utilisation

```bash
git clone https://github.com/Gustor1/passerelle.git
cd passerelle
node server.js --open
```

Sous Windows, tu peux aussi double-cliquer sur `Lancer Passerelle.bat`.

1. La page s'ouvre sur le PC avec deux QR codes : **Tailscale — partout** et **Wi-Fi — maison**.
2. Au premier lancement, Windows demande d'autoriser Node sur le réseau : clique sur **Autoriser**.
3. Scanne le QR **Tailscale — partout** avec le téléphone (il marche en Wi-Fi comme en 4G/5G), puis ajoute la page à l'écran d'accueil.
4. Ferme la fenêtre du serveur pour arrêter Passerelle.

Les fichiers sont rangés dans le dossier `partage/` à côté de `server.js`.

### Options

| Variable | Défaut    | Rôle                         |
|----------|-----------|------------------------------|
| `PORT`   | `8765`    | Port d'écoute                |
| `HOST`   | `0.0.0.0` | Interface d'écoute           |

## Envoyer depuis la ligne de commande (scripts, agents IA)

```bash
node envoyer.js chemin/vers/video.mp4 [autres fichiers...] [--open] [--json]
```

`--open` ouvre aussi la page Passerelle dans le navigateur du PC, sauf si elle y est déjà ouverte.

Démarre Passerelle s'il ne tourne pas, envoie les fichiers et affiche un lien de
téléchargement direct par réseau (Wi-Fi, Tailscale…). Pratique pour qu'un agent
comme Claude Code te passe le rendu d'une vidéo : tu ouvres le lien sur ton
téléphone, même en 5G avec Tailscale. Les fichiers envoyés ainsi apparaissent
avec l'étiquette « envoyé par Claude ».

Un fichier copié directement dans `partage/` apparaît aussi en direct sur la page.

### Skill Claude Code : « transfère téléphone »

Le dossier [`claude-skill/transfert-telephone`](claude-skill/transfert-telephone/SKILL.md)
contient un skill pour [Claude Code](https://claude.com/claude-code). Une fois
installé, il suffit de dire « transfère téléphone » à Claude quand il a fini un
rendu :

- **Par défaut, avec [Taildrop](https://tailscale.com/kb/1106/taildrop)** : le
  fichier arrive tout seul sur ton téléphone (sur iPhone : app Fichiers → dossier
  Tailscale), en Wi-Fi comme en 4G/5G. Aucun lien à ouvrir.
- **En secours, avec Passerelle** : Claude envoie le fichier dans Passerelle,
  ouvre la page sur le PC et te répond avec un lien à ouvrir sur ton téléphone.

Le plus simple est de laisser Claude l'installer (voir
[Installation rapide](#installation-rapide-avec-claude-code-recommandé)).
Installation à la main :

1. Copie le dossier `claude-skill/transfert-telephone` dans le dossier des skills
   de Claude Code : `~/.claude/skills/` (sous Windows :
   `C:\Users\<toi>\.claude\skills\`).
2. Dans le `SKILL.md` copié, remplace :
   - `<NOM_DU_TELEPHONE>` par le nom de ton téléphone dans Tailscale
     (`tailscale file cp --targets` le liste) ;
   - `<CHEMIN_PASSERELLE>` par le chemin de ton dossier Passerelle.
3. Ouvre une nouvelle conversation Claude Code : le skill y est disponible.

## Problèmes fréquents

| Problème | Solution |
|---|---|
| La page charge à l'infini sur le téléphone | Tu as sans doute scanné le QR **Wi-Fi** alors que le téléphone n'est pas sur le même Wi-Fi. Scanne le QR **Tailscale — partout**, avec Tailscale activé sur le téléphone. |
| Le QR **Wi-Fi** ne marche pas même à la maison | Windows considère sans doute ton Wi-Fi comme un réseau **public** et bloque Node. Utilise le QR Tailscale, ou passe le Wi-Fi en réseau **privé** (Paramètres → Réseau et Internet → Wi-Fi → ton réseau). |
| « transfère téléphone » ne trouve pas le téléphone | Ouvre l'app Tailscale sur le téléphone et vérifie qu'elle est connectée. `tailscale file cp --targets` doit lister le téléphone. |
| Claude ne connaît pas « transfère téléphone » | Ouvre une nouvelle conversation Claude Code : les skills sont chargés au démarrage. |

## Sécurité

- Le PC lui-même (localhost) a toujours accès.
- Les autres appareils ont besoin d'une clé secrète, incluse dans le lien du QR code et enregistrée dans `.token`. Supprime ce fichier pour en générer une nouvelle (il faudra rescanner).
- Le trafic passe en HTTP simple sur le réseau local : n'utilise pas Passerelle sur un Wi-Fi public. Avec Tailscale, le trafic est chiffré par le tunnel.

## Licence

[MIT](LICENSE)
