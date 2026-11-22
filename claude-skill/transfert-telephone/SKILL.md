---
name: transfert-telephone
description: Envoie un fichier du PC vers le téléphone de l'utilisateur via Passerelle (accessible en Wi-Fi ou en 4G/5G par Tailscale) et lui donne un lien de téléchargement direct. À utiliser quand l'utilisateur dit « transfère téléphone », « transfert tel », « envoie-le sur mon tel », « mets-le sur Passerelle », « je veux le récupérer sur mon téléphone », ou demande d'accéder depuis son téléphone à un rendu vidéo, une image, un PDF ou tout fichier produit sur le PC.
---

# Transfert vers le téléphone (Passerelle)

Passerelle (https://github.com/Gustor1/passerelle) est un petit serveur de partage
de fichiers installé sur ce PC. Le téléphone y accède sur le même Wi-Fi, ou
partout (4G/5G) via Tailscale.

> **À configurer une fois :** remplace `<CHEMIN_PASSERELLE>` ci-dessous par le
> dossier où tu as cloné Passerelle, par exemple `C:\Users\moi\passerelle`.

## Étapes

1. **Identifier le ou les fichiers.** En général, le dernier fichier produit dans
   la conversation (rendu vidéo, export, image…). En cas de doute entre plusieurs
   fichiers, demander lequel. Vérifier que le fichier existe et que le rendu est
   terminé (taille stable, processus de rendu fini).
   - Pour un dossier, le zipper d'abord puis envoyer le `.zip`.

2. **Envoyer.** Le script démarre Passerelle tout seul si besoin, et `--open`
   ouvre la page Passerelle dans le navigateur du PC si elle n'y est pas déjà
   ouverte :

   ```
   node "<CHEMIN_PASSERELLE>/envoyer.js" "<chemin/du/fichier>" --open --json
   ```

   Plusieurs fichiers : les passer à la suite. Les vidéos lourdes peuvent prendre
   quelques secondes à copier ; prévoir un délai suffisant pour la commande.

3. **Répondre à l'utilisateur**, court :
   - le nom et la taille du fichier envoyé ;
   - le **lien Tailscale** de téléchargement direct (entrée `network` contenant
     « Tailscale », adresse en `100.x.x.x`), présenté comme lien markdown cliquable,
     par exemple `[Télécharger rendu.mp4](http://100.x.x.x:8765/api/dl/...?k=...)` ;
   - le lien Wi-Fi en second, pour quand le téléphone est sur le même réseau ;
   - un rappel d'une ligne : Tailscale doit être activé sur le téléphone.
   S'il n'y a pas d'adresse Tailscale dans le résultat, n'envoyer que le lien
   Wi-Fi et préciser qu'il ne marche que sur le même réseau.

## À savoir

- Le lien contient la clé secrète de Passerelle : ne le donner qu'à l'utilisateur,
  jamais dans un fichier versionné, un commit ou un service externe.
- Le fichier reste dans le dossier `partage/` de Passerelle jusqu'à ce que
  l'utilisateur le supprime depuis la page. Ne rien supprimer soi-même sans
  qu'il le demande.
- Le PC doit rester allumé et Passerelle ouvert tant que le téléchargement n'est
  pas fini. Le serveur continue de tourner après la fin de la conversation.
- Si l'envoi échoue avec « le serveur n'a pas démarré », vérifier que le port
  8765 n'est pas déjà pris (ou définir la variable `PORT`).
