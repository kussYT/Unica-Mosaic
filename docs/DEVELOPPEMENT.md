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
`npm run migrate` applique les migrations PostgreSQL. La base locale créée avant ces migrations a déjà le socle utilisateurs et médias : la première migration est enregistrée, seule la migration des ateliers et des sessions modifie les tables. Une base vide exécute les deux. Le schéma n'est plus poussé automatiquement au démarrage.
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

## Vérifications
Build de 9 pages. Contrôles des liens/ressources via npm run verify. Inspection navigateur des pages principales en 320, 768 et 1440 px ; parcours mobile en 390 px. Menu, filtre Sur mesure, visionneuse, préremplissage Pixel Kids, préparation/copie/téléchargement validés. Aucun envoi externe.
Tests tous navigateurs, audit accessibilité complet et performance restent ouverts dans TODO.md.
Documentation : https://docs.astro.build/en/basics/project-structure/
