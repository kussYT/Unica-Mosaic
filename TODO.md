# UNICA — Suivi du projet
Mis à jour le 6 novembre 2026. Lire et mettre à jour ce fichier à chaque intervention. Ne cocher qu'après vérification.

## 1. Première version
- [x] Dépôt relié à GitHub ; base Astro, composants et contenu centralisé.
- [x] Accueil avec « L’art de recoller les morceaux », univers, créations et ateliers.
- [x] Palette de la charte, logos SVG et Montserrat hébergée localement.
- [x] Catalogue ateliers et quatre fiches : Ré-colle-toi meuf, Pixel Kids, Ma croix mes couleurs, Numéro de maison.
- [x] Galerie : six créations, filtres et agrandissement.
- [x] Contact : choix atelier prérempli, champs validés, brouillon copiable et téléchargeable.
- [x] Page 404, menu mobile, focus visible, lien d'évitement et mouvement réduit.
- [x] Onze photos en trois tailles WebP ; manifeste de provenance et originaux préservés.
- [x] Build de neuf pages réussi.
- [x] Contrôle navigateur en 320, 768 et 1440 px ; menu et parcours mobile en 390 px.
- [x] Filtre, visionneuse, préremplissage, copie et téléchargement du brouillon testés.
- [x] Contrôle final des liens et fichiers du build.

## 1b. Socle Next.js + Payload — lot 1
- [x] Commit local sur `main` : `Conserver la version Astro de référence avant le portage`. Tag local `reference-astro`. Branche `portage-next-payload`. Aucun push.
- [x] Node.js 24.22.2 installé à côté du Node système 24.19.0, sans le remplacer.
- [x] PostgreSQL local dédié, base `unica_mosaic_local` sur 127.0.0.1:5433. Aucune base existante ni le VPS modifié.
- [x] Next.js 16.4.5 et Payload 3.93.0 dans `web/`. Les sources Astro restent à la racine.
- [x] Comptes administrateur et éditeur, droits séparés, médias avec texte alternatif obligatoire.
- [x] Secrets uniquement dans `web/.env`, ignoré par Git.
- [x] Pages portées : accueil, ateliers, fiches, réalisations, contact en brouillon, 404. noindex conservé.
- [x] Build Next, build Astro et vérifications locales réussis. Contrôle navigateur en 1440, 768 et 390 px.
- [x] Assets de `public/` synchronisés vers `web/public` à chaque dev, build et start. La copie n'est pas versionnée. Installation propre `npm ci` vérifiée.
- [x] `web/.env.example` ne contient aucun secret. Le script administrateur refuse `NODE_ENV=production`.
- [x] Démarrage Node 24.22.2, PostgreSQL local et application documenté dans `docs/DEVELOPPEMENT.md`.
- [ ] Calendrier, réservations et Stripe : non commencés, volontairement hors de ce lot.

## 2. Validation avec Marie — prochain lot
- [ ] Valider le rendu réel sur ordinateur et téléphone.
- [ ] Valider les textes et titres de galerie, actuellement des propositions éditoriales.
- [ ] Obtenir Arsenica avec licence web ; Cormorant Garamond est provisoire.
- [ ] Confirmer e-mail, téléphone, adresse, horaires et réseaux sociaux.
- [ ] Confirmer Pixel Kids / Mosaic Kids et la distinction ateliers/kits.
- [ ] Pour chaque atelier : tarif, durée, âge, accompagnement, capacité, matériel, lieu, dates et conditions.
- [ ] Recevoir une photo dédiée Numéro de maison ; la photo actuelle illustre seulement le geste.
- [ ] Valider l'utilisation du reportage anniversaire pour illustrer les ateliers.
- [ ] Confirmer les autorisations de publication des photos de personnes, notamment des enfants.
- [ ] Compléter noms, dimensions, matières et contexte des réalisations ; valider les références de marques visibles.
- [ ] Compléter la présentation de Marie avec son histoire validée.

## 3. Contact et réservation
- [ ] Configurer la vraie adresse de réception et le service d'envoi serveur.
- [ ] Ajouter anti-spam, validation serveur, limites de débit et états d'erreur.
- [ ] Tester envoi/réception de bout en bout ; aucun succès fictif.
- [ ] Choisir avec Marie l'outil de réservation et la gestion des disponibilités/places.
- [ ] Ajouter calendrier, confirmations, annulations et paiement si prévu.
- [ ] Tester places épuisées, double réservation, paiement échoué et remboursements.

## 4. Boutique, kits et contenus complémentaires
- [ ] Valider le périmètre marchand prévu au devis.
- [ ] Obtenir catalogue, prix, photos, variantes, stocks et contenu des kits.
- [ ] Créer catégories et fiches produit ; panier/commande si vente en ligne retenue.
- [ ] Définir livraison, retrait, frais, retours et moyens de paiement.
- [ ] Tester commandes, e-mails et gestion administrative.
- [ ] Ajouter des témoignages réels approuvés.
- [ ] Choisir les vidéos, préparer compression, affiches et sous-titres utiles.

## 5. Qualité et lancement
- [ ] Confirmer domaine, hébergement, comptes et accès.
- [ ] Compléter mentions légales, confidentialité et conditions commerciales adaptées.
- [ ] Définir conservation des messages et consentements ; cookies si services non essentiels.
- [ ] Configurer URL publique, canonicals, sitemap, Open Graph absolu et données structurées exactes.
- [ ] Retirer noindex et Disallow uniquement au lancement validé.
- [ ] Audit complet contraste, clavier, lecteur d'écran et zoom 200 %.
- [ ] Tester iOS/Android et Safari, Firefox, Edge/Chrome.
- [ ] Mesurer la performance avec les contenus finaux.
- [ ] Ajouter intégration continue (build et vérifications).
- [ ] Revue finale, commit et push de la version validée.
- [ ] Déployer et vérifier HTTPS, redirections, 404, formulaires, sauvegardes.
- [ ] Préparer un guide de mise à jour pour Marie.

## Journal
- 6 novembre 2026 : accueil resserré. Navbar sans filet sur l’accueil seulement, hero plus compact, trois entrées Réalisations / Ateliers / Mosaic Kids, ruban violet déplacé sous les cartes. « Mosaic Kids » mène à l’atelier Pixel Kids, le nom reste à confirmer.
- 6 novembre 2026 : flèche des pastilles jaunes recentrée. Le glyphe ↗ de Montserrat est masqué ; un tracé SVG géométrique le remplace dans tous les ronds (univers, cartes ateliers, galerie).
- 6 novembre 2026 : la variante géométrique du collage et des cartes a été retirée. Retour à la composition précédente : trois cartes de même famille, rond « Chaque pièce est unique » rétabli. Trois petits éclats ajoutés au contact des photos du hero. Mosaic Kids mène toujours à l’atelier Pixel Kids.
- 6 novembre 2026 : copie de sauvegarde de la version Astro, hors du dossier de travail, 102 fichiers, sans node_modules, dist ni .astro. Aucun commit ni push effectué.
- 6 novembre 2026 : version Astro commitée localement (`f59469a`), taguée `reference-astro`, puis branche `portage-next-payload`. Socle Next.js 16.4.5, Payload 3.93.0 et PostgreSQL `unica_mosaic_local`. Pages existantes portées dans `web/`. Builds et vérifications réussis. Aucun push.
- 6 novembre 2026 : finalisation du lot 1. Synchronisation reproductible des assets, exemple d'environnement sans secret, création d'administrateur refusée en production. `npm ci`, builds et vérifications relancés.

## Décisions de cette version
- Travail local, sans push ni publication.
- Astro statique pour la présentation ; aucun compte client ni paiement ajouté.
- Le portage validé vit sur `portage-next-payload` : une application Next.js + Payload 3 + PostgreSQL. La référence visuelle reste le tag `reference-astro`.
- Rose #F00087, crème #FCF4F1, violet #59003D. Rose clair selon RVB ; jaune de la campagne Ré-colle-toi meuf et des maquettes.
- La charte répète le code violet sur deux autres couleurs : utiliser les valeurs RVB et les exports.
- Aucun âge, tarif, durée, date ou témoignage inventé à partir des maquettes.
- Images réelles fournies ; aucune image générée présentée comme réalisation.
- Le contact prépare un brouillon local et ne transmet rien par défaut.
