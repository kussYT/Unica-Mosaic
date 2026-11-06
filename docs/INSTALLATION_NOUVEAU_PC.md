# Installation sur un nouvel ordinateur
Windows et PowerShell. Aucun mot de passe, aucune clé et aucune adresse réelle ne figurent ici. Les remplacer localement dans `web/.env`, jamais dans Git.

Le dépôt distant est `https://github.com/kussYT/Unica-Mosaic.git`. Le travail Next.js et Payload se poursuit sur `portage-next-payload`. Le tag `reference-astro` désigne la version Astro de référence, commit `f59469acc662d8a06f155bdf114b5a845c628cbf`.

## 1. Cloner le dépôt

```powershell
git clone https://github.com/kussYT/Unica-Mosaic.git
Set-Location Unica-Mosaic
```

## 2. Sélectionner la branche

```powershell
git switch portage-next-payload
```

`main` contient le portage déjà fusionné, sans les derniers ajustements de marque publiés seulement sur `portage-next-payload`.

## 3. Installer Node.js

Le fichier `.node-version` indique `24.22.2`. `web/package.json` exige Node `>= 24.22.1`.

Installer Node.js 24.22.2, puis vérifier :

```powershell
node -v
npm -v
```

## 4. Installer les dépendances

À la racine, pour le site Astro :

```powershell
npm ci
```

Puis dans `web/` :

```powershell
Set-Location web
npm ci
Set-Location ..
```

`npm ci` utilise les fichiers `package-lock.json`. Ne pas copier `node_modules` d’un ordinateur à l’autre.

## 5. PostgreSQL local

L’application refuse toute base qui n’est pas `unica_mosaic_local` sur `127.0.0.1` port `5433`.

Installer PostgreSQL pour Windows et le faire écouter sur le port `5433`. Avec `psql` connecté en superutilisateur local :

```sql
CREATE USER unica_local WITH PASSWORD 'choisir-un-mot-de-passe-local';
CREATE DATABASE unica_mosaic_local OWNER unica_local;
```

Le script `web/scripts/postgres-local.ps1` ne télécharge pas PostgreSQL. Il pilote seulement une copie déjà présente dans `%LOCALAPPDATA%\unica-postgres`. Sur un nouvel ordinateur, cette copie n’existe pas : utiliser l’installation PostgreSQL ci-dessus.

Si cette copie portable est installée plus tard au même emplacement :

```powershell
powershell -File web/scripts/postgres-local.ps1 start
powershell -File web/scripts/postgres-local.ps1 status
```

## 6. Créer `web/.env`

```powershell
Copy-Item web\.env.example web\.env
```

Ouvrir `web/.env` et remplacer les valeurs vides. Exemple de forme, sans secret réel :

```text
DATABASE_URL=postgresql://unica_local:LE_MOT_DE_PASSE@127.0.0.1:5433/unica_mosaic_local
PAYLOAD_SECRET=une-longue-chaine-aleatoire-locale
PAYLOAD_ADMIN_EMAIL=adresse-locale@exemple.test
PAYLOAD_ADMIN_PASSWORD=un-mot-de-passe-local
```

`web/.env` est ignoré par Git. Ne pas le commiter.

## 7. Migrations

Depuis `web/` :

```powershell
Set-Location web
npm run migrate
```

Une base vide applique les migrations des utilisateurs, des médias, des ateliers et des sessions. Le schéma n’est pas poussé automatiquement au démarrage.

## 8. Quatre ateliers en brouillon

Toujours depuis `web/`, seulement si la base ne contient pas encore ces fiches. Le script ne met pas de tarif, pas de date, et n’écrase pas une fiche déjà présente.

```powershell
npm run seed:workshops
```

Le script refuse de s’exécuter quand `NODE_ENV` vaut `production`.

## 9. Compte administrateur local

Renseigner `PAYLOAD_ADMIN_EMAIL` et `PAYLOAD_ADMIN_PASSWORD` dans `web/.env`, puis :

```powershell
npm run seed:admin
```

Le démarrage du site ne crée aucun compte. Le script refuse aussi `NODE_ENV=production`.

## 10. Démarrer et ouvrir l’administration

Depuis `web/` :

```powershell
npm run dev
```

- Site : http://127.0.0.1:3000/
- Administration : http://127.0.0.1:3000/admin/

`npm run dev`, `npm run build` et `npm run start` copient `public/` vers `web/public`. Cette copie est ignorée par Git. Les originaux versionnés restent dans `public/` à la racine. Si `web/public` est une jonction ou un lien créé sur un autre ordinateur, le script le retire puis recopie les fichiers. Aucune jonction n’est requise.

Sans `web/.env`, l’accueil s’affiche avec le catalogue statique et un calendrier vide. Payload, les migrations et l’administration demandent le fichier d’environnement et PostgreSQL.

## Vérifications utiles

Astro, depuis la racine :

```powershell
npm run build
npm run verify
```

Next.js, depuis `web/`, une fois `.env` et PostgreSQL prêts :

```powershell
npm run build
npm run verify
```

`npm run verify` dans `web/` interroge l’application déjà démarrée et écrit des données de contrôle dans la base locale. Ne pas le lancer contre une autre base.
