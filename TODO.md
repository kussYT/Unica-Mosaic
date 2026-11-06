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
- [x] Agenda public des sessions publiées. Aucune réservation ni paiement.

## 1c. Catalogue des ateliers — lot 2
- [x] Collections Payload Ateliers et Sessions, avec brouillon et publication.
- [x] Tarif non négatif, acompte entre zéro et le tarif, fin de session après le début.
- [x] Publication d’un atelier refusée tant que le tarif et l’acompte ne sont pas des nombres.
- [x] Marie, via un compte éditeur, peut créer et modifier ; la suppression reste réservée à l’administrateur. Les visiteurs ne peuvent pas écrire.
- [x] Migrations PostgreSQL appliquées sur `unica_mosaic_local`. Aucun tarif, aucune date et aucune capacité inventés.
- [x] Le site public reprend les ateliers publiés et conserve le catalogue statique en secours. L’agenda reste vide sans session confirmée.
- [x] Build Next et vérifications réussis. Contrôle visuel en 1440, 768 et 390 px. Administration en français contrôlée.
- [ ] Réservations, paiement et Stripe : non commencés.

## 1d. Calendrier dynamique — lot 3
- [x] Une session ne peut pas être publiée si la capacité est absente, nulle, négative ou non entière. Un brouillon peut rester sans capacité.
- [x] Les quatre ateliers existants sont préparés en brouillons Payload, sans tarif, sans date et sans écrasement. Publier une fiche ne retire pas les autres.
- [x] Calendrier sur l’accueil : mois, jours identifiables, sélection, horaires, tarif, photo, description et capacité. Journée sans atelier et état vide contrôlés.
- [x] Contrôle visuel en 1440, 768 et 390 px, avec des sessions temporaires ensuite supprimées. Aucune place restante ni bouton de réservation.
- [x] Build Next et vérifications réussis après retrait des données de contrôle. Aucune session ni média de test en base.

## 1e. Préproduction — 6 novembre 2026
- [x] Commit `2128621` vérifié localement, puis garde de base adapté : locale sur le port 5433, préproduction seulement sur `127.0.0.1:5432/unica_mosaic_preview`.
- [x] Préproduction en ligne sur `https://unica-preview.versatech-dev.fr`, HTTPS Let’s Encrypt, accès protégé, service `unica-mosaic-preview` sur `127.0.0.1:3028`.
- [x] Base dédiée, quatre brouillons sans tarif ni date, aucune session ni média. Les autres sites du VPS répondent comme avant.
- [ ] Réservations, paiement et Stripe : non commencés.

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
- 6 novembre 2026 : lot 2 commité localement sur `portage-next-payload`. Collections Ateliers et Sessions, migrations PostgreSQL, agenda public vide tant qu’aucune session n’est publiée. Aucun push.
- 6 novembre 2026 : lot 3. Calendrier de l’accueil branché sur les sessions publiées. Capacité entière exigée pour publier. Quatre fiches préparées en brouillon. Les sessions de contrôle et leur photo ont été supprimées. Aucune place restante affichée. Aucun push.
- 6 novembre 2026 : audit de préproduction interrompu avant toute installation. Le VPS n’a pas été modifié. Le sous-domaine proposé n’a pas d’enregistrement DNS.
- 6 novembre 2026 : préproduction installée sur `unica-preview.versatech-dev.fr`. Service, base et compte séparés de Maro Créa et de VersaTech OS. Aucun push.
- 6 novembre 2026 : la photo du hero n’apparaît plus deux fois. La petite copie, bougie comprise, a été retirée. Le grand visuel léopard et le blason restent. Vérifié en local, puis repris sur la préproduction.
- 6 novembre 2026 : la bougie est replacée devant le blason. Le grand visuel léopard ne la reprend plus. Vérifié en local sur ordinateur et téléphone, puis repris en préproduction.
- 6 novembre 2026 : la bougie devant le blason est retirée. La photo de droite passe devant le blason, sur ordinateur et téléphone, puis en préproduction.
- 6 novembre 2026 : les flèches et les astérisques décoratifs sont des tracés SVG, pour éviter les emojis colorés d’iOS. Contrôlé en local à 1440, 768 et 390 px. Safari iOS n’a pas été ouvert ici.

## Décisions de cette version
- Travail local, sans push ni publication.
- Astro statique pour la présentation ; aucun compte client ni paiement ajouté.
- Le portage validé vit sur `portage-next-payload` : une application Next.js + Payload 3 + PostgreSQL. La référence visuelle reste le tag `reference-astro`.
- Rose #F00087, crème #FCF4F1, violet #59003D. Rose clair selon RVB ; jaune de la campagne Ré-colle-toi meuf et des maquettes.
- La charte répète le code violet sur deux autres couleurs : utiliser les valeurs RVB et les exports.
- Aucun âge, tarif, durée, date ou témoignage inventé à partir des maquettes.
- Un atelier publié dans Payload remplace la fiche statique du même slug. Sans atelier publié, le catalogue statique reste affiché. Une session n’apparaît que si elle est publiée, à venir et non annulée.
- Le calendrier prépare l’affichage des places restantes, mais n’en montre aucune tant qu’elles ne sont pas calculées depuis de vraies réservations.
- Images réelles fournies ; aucune image générée présentée comme réalisation.
- Le contact prépare un brouillon local et ne transmet rien par défaut.
