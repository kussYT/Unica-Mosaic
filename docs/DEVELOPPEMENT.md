# Développement UNICA
Première version du 6 novembre 2026. Le suivi de référence est TODO.md à la racine.

## Application Next.js
Le portage vit dans `web/`, sur la branche `portage-next-payload`. Les sources Astro restent à la racine. Node.js 24.22.2 est utilisé pour cette application, sans remplacer le Node du système. Le binaire local est `%LOCALAPPDATA%\\node-versions\\node-v24.22.2-win-x64`. Le fichier `.node-version` indique `24.22.2`.

PostgreSQL local dédié, port 5433, base `unica_mosaic_local`. Les binaires et les données sont dans `%LOCALAPPDATA%\\unica-postgres`. Ce n'est pas un service Windows et ce n'est pas le dossier `C:\\Program Files\\PostgreSQL`.
```sh
powershell -File web/scripts/postgres-local.ps1 status
powershell -File web/scripts/postgres-local.ps1 start
powershell -File web/scripts/postgres-local.ps1 stop
```
Copier `web/.env.example` vers `web/.env`, puis renseigner l'URL, le secret Payload et, une seule fois en local, l'identifiant administrateur. Le démarrage ne crée aucun compte. `npm run seed:admin` refuse de s'exécuter quand `NODE_ENV=production`.

Depuis `web/`, avec Node 24.22.2 en tête du PATH :
```sh
npm ci
npm run migrate
npm run dev
```
`npm run migrate` applique les migrations PostgreSQL. La base locale créée avant ces migrations a déjà le socle utilisateurs et médias : la première migration est enregistrée ; les suivantes ajoutent ateliers/sessions puis réservations. Une base vide exécute toute la chaîne. Le schéma n'est plus poussé automatiquement au démarrage. `npm run seed:workshops` prépare les quatre fiches existantes en brouillon, sans tarif, sans date et sans écraser une fiche déjà présente. Publier une seule fiche ne retire pas les autres du site. Les places restantes se calculent depuis les réservations confirmées et les retenues actives ; l’inscription manuelle se fait dans Payload (collection Réservations). Aucun paiement Stripe dans ce lot.
Adresse : http://127.0.0.1:3000/. Administration : http://127.0.0.1:3000/admin/. `npm run dev`, `npm run build` et `npm run start` synchronisent `public/` vers `web/public`. Cette copie est ignorée par Git. Les originaux restent dans `public/`.
```sh
npm run build
npm run verify
npm run start
```

## Démarrage Astro
Ouvrir ce dépôt dans Cursor. Node.js 24 et npm sont requis.
```sh
npm install
npm run dev
```
Adresse habituelle : http://127.0.0.1:4321/. Utiliser npm ci pour une installation reproductible.
```sh
npm run build
npm run verify
npm run preview
```
Build statique dans dist/. Dépendances verrouillées dans package-lock.json.

## Organisation
- src/data/site.ts : ateliers, galerie, e-mail à confirmer.
- src/components/ : photos, cartes, appels à contact.
- src/layouts/Layout.astro : navigation, métadonnées, pied de page.
- src/styles/global.css : palette, typographie et responsive.
- public/images/ : 33 WebP, 3 SVG et manifeste de provenance/poids.
- scripts/prepare-assets.mjs : génération reproductible depuis les originaux.

## Images
11 photos en 480, 960, 1600 px, WebP qualité 80, sans agrandissement. Originaux conservés dans Documents/Unica-Mosaic/Assets-Classes. Logos : espace vide ajusté, tracés et couleurs intacts.
```sh
npm run assets -- "C:/chemin/vers/Assets-Classes"
```
Montserrat et Cormorant Garamond sont hébergées localement via Fontsource (licences dans leurs packages). Cormorant remplace provisoirement Arsenica.

## Contact et publication
Le formulaire conserve les données seulement dans la page et produit un brouillon copiable/téléchargeable. Renseigner site.email prépare un e-mail dans la messagerie du visiteur, sans l'envoyer automatiquement. Service d'envoi serveur et réservation restent à réaliser.
Version locale avec noindex et robots bloquant l'indexation. Domaine, SEO final, coordonnées, mentions légales et contenus à valider.

La préproduction est `https://unica-preview.versatech-dev.fr`. Elle n’est pas le lancement : `noindex`, `robots.txt` et un accès Caddy protégé restent en place. Le service systemd `unica-mosaic-preview` écoute seulement sur `127.0.0.1:3028`. Son dossier est `/var/www/unica-mosaic-preview`, son environnement `/etc/unica-mosaic-preview.env`, et les identifiants d’accès sont dans `/etc/unica-mosaic-preview.access`, lisible seulement par root. Node 24.22.2 est isolé dans `/opt/node-v24.22.2` ; le Node déjà présent n’a pas été remplacé.

La base locale de développement reste `unica_mosaic_local` sur `127.0.0.1:5433`. La préproduction utilise uniquement `unica_mosaic_preview` sur `127.0.0.1:5432`, avec le rôle `unica_preview`, et seulement si `UNICA_RUNTIME=preview`. Toute autre adresse est refusée. PostgreSQL n’écoute pas sur le réseau. La base `versatech_os` et le service Maro Créa ne sont pas utilisés.

Les sauvegardes de cette seule base vont dans `/var/backups/unica-mosaic-preview/`. Après avoir copié une nouvelle version dans le dossier, sans fichier `.env` local :

```sh
sudo bash /var/www/unica-mosaic-preview/deploy/preview/redeploy.sh
```

Le script sauvegarde, réinstalle, reconstruit et redémarre uniquement `unica-mosaic-preview`. Pour revenir en arrière, restaurer la sauvegarde SQL et l’arborescence précédente, puis redémarrer ce service. Le compte administrateur de préproduction n’est pas `admin@unica.local`.

## Vérifications
Build de 9 pages. Contrôles des liens/ressources via npm run verify. Inspection navigateur des pages principales en 320, 768 et 1440 px ; parcours mobile en 390 px. Menu, filtre Sur mesure, visionneuse, préremplissage Pixel Kids, préparation/copie/téléchargement validés. Aucun envoi externe.
Tests tous navigateurs, audit accessibilité complet et performance restent ouverts dans TODO.md.
Documentation : https://docs.astro.build/en/basics/project-structure/
