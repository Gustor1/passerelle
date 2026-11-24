---
name: transfert-telephone
description: Envoie un fichier du PC directement sur le téléphone de l'utilisateur par Taildrop (Tailscale), en Wi-Fi comme en 4G/5G, avec Passerelle en secours (lien de téléchargement). À utiliser quand l'utilisateur dit « transfère téléphone », « transfert tel », « envoie-le sur mon tel », « mets-le sur Passerelle », « je veux le récupérer sur mon téléphone », ou demande d'accéder depuis son téléphone à un rendu vidéo, une image, un PDF ou tout fichier produit sur le PC.
---

# Transfert vers le téléphone

Méthode par défaut : **Taildrop** (envoi direct par Tailscale, le fichier arrive
tout seul sur le téléphone). Secours : **Passerelle**
(https://github.com/Gustor1/passerelle), qui donne un lien à ouvrir sur le téléphone.

> **À configurer une fois :**
> - `<NOM_DU_TELEPHONE>` : le nom du téléphone dans Tailscale. Pour le trouver :
>   `tailscale file cp --targets` (par exemple `iphone-de-moi`).
> - `<CHEMIN_PASSERELLE>` : le dossier où tu as cloné Passerelle
>   (par exemple `C:\Users\moi\passerelle`).
>
> Sous Windows, si la commande `tailscale` n'est pas reconnue, utilise
> `& "C:\Program Files\Tailscale\tailscale.exe"` à la place.

## 1. Identifier le ou les fichiers

En général, le dernier fichier produit dans la conversation (rendu vidéo, export,
image…). En cas de doute entre plusieurs fichiers, demander lequel. Vérifier que le
fichier existe et que le rendu est terminé (taille stable, processus de rendu fini).
Pour un dossier, le zipper d'abord puis envoyer le `.zip`.

## 2. Envoyer par Taildrop (par défaut)

```
tailscale file cp "<chemin/du/fichier>" <NOM_DU_TELEPHONE>:
```

- Plusieurs fichiers : les passer à la suite, avant `<NOM_DU_TELEPHONE>:`.
- Vidéos lourdes : donner à la commande un délai long (jusqu'à 10 min) ou la
  lancer en arrière-plan ; elle se termine quand le téléphone a tout reçu.
- Code de sortie 0 = reçu par le téléphone.

Réponse à l'utilisateur, courte :
- nom et taille du fichier envoyé ;
- où le trouver : sur iPhone, app **Fichiers** → dossier **Tailscale** ; sur Android,
  dossier **Téléchargements** (une notification Tailscale apparaît) ;
- sur iPhone, pour une photo ou une vidéo, rappeler en une ligne comment la mettre
  dans Photos : ouvrir le fichier → **Partager** → **Enregistrer la vidéo / l'image**.

Si l'envoi échoue (téléphone hors ligne, Tailscale coupé sur le téléphone, erreur
« no matching peer »), vérifier avec `tailscale file cp --targets`, le dire à
l'utilisateur, puis passer à Passerelle.

## 3. Secours : Passerelle

À utiliser si Taildrop échoue, ou si l'utilisateur demande un lien, Passerelle ou
la page web.

```
node "<CHEMIN_PASSERELLE>/envoyer.js" "<chemin/du/fichier>" --open --json
```

Le script démarre Passerelle si besoin et ouvre la page sur le PC. Donner à
l'utilisateur le **lien Tailscale** de téléchargement direct (entrée `network`
contenant « Tailscale », adresse en `100.x.x.x`) en lien markdown cliquable, puis
le lien Wi-Fi. S'il n'y a pas d'adresse Tailscale, n'envoyer que le lien Wi-Fi et
préciser qu'il ne marche que sur le même réseau.

## À savoir

- Le lien Passerelle contient une clé secrète : ne le donner qu'à l'utilisateur,
  jamais dans un fichier versionné, un commit ou un service externe.
- Ne supprimer aucun fichier envoyé (ni sur le PC ni dans Passerelle) sans que
  l'utilisateur le demande.
- Le PC doit rester allumé pendant l'envoi.
