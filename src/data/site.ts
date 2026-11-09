export const site = {
  name: 'UNICA',
  tagline: 'L’art de recoller les morceaux',
  // Confirm with Marie before enabling actual mail delivery.
  email: '',
};

// « Mosaic Kids » reprend le nom de la maquette et mène à l’atelier Pixel Kids, en attendant la confirmation du nom.
export const homePaths = [
  { href: '/realisations/', title: 'Créations sur mesure', image: 'boutique', alt: 'Mosaïque figurative exposée dans la boutique.', tone: 'realisations' },
  { href: '/ateliers/', title: 'Ateliers', image: 'atelier-mains', alt: 'Des mains assemblent une mosaïque à l’atelier.', tone: 'ateliers' },
  { href: '/ateliers/pixel-kids/', title: 'Mosaic Kids', image: 'pixel-kids', alt: 'Des enfants composent une mosaïque colorée à l’atelier.', tone: 'kids' },
];

export const workshops = [
  { slug: 'recolle-toi-meuf', name: 'Recolle-toi meuf', label: 'UNE PAUSE POUR SOI', image: 'atelier-partage', tone: 'pink', intro: 'Des morceaux, des couleurs et un moment à partager. Une parenthèse créative pour laisser parler ses mains.', description: 'Un atelier autour de la mosaïque, pensé comme un temps de création et de rencontre. Choisir ses tesselles, essayer un assemblage, recommencer et voir une pièce prendre forme.', detail: 'Pour celles qui ont envie de découvrir un geste, de créer et de partager un moment ensemble.', alt: 'Deux participantes échangent autour de leur création pendant un atelier UNICA.' },
  { slug: 'pixel-kids', name: 'Pixel Kids', label: 'LES PETITES MAINS CRÉATIVES', image: 'pixel-kids', tone: 'blush', intro: 'La mosaïque devient un terrain de jeu. Des petits carrés, de grandes idées et le plaisir de créer avec ses mains.', description: 'Un univers coloré pour explorer la mosaïque et le pixel art. Les enfants composent un motif, jouent avec les couleurs et découvrent comment chaque petite pièce participe au dessin.', detail: 'Pour les enfants curieux de découvrir une activité manuelle. L’âge conseillé sera précisé pour chaque séance.', alt: 'Des enfants composent des mosaïques colorées à la table de l’atelier.' },
  { slug: 'ma-croix-mes-couleurs', name: 'Ma croix, mes couleurs', label: 'UNE CRÉATION PERSONNELLE', image: 'croix', tone: 'plum', intro: 'Composer une croix qui vous ressemble, en laissant les matières et les couleurs raconter votre histoire.', description: 'Une forme familière, une infinité de compositions. Cet atelier invite à associer des tesselles, des textures et des nuances pour imaginer une croix singulière.', detail: 'Pour découvrir la mosaïque à travers un objet personnel et expressif.', alt: 'Une croix en mosaïque aux tons dorés et roses, tenue dans une main.' },
  { slug: 'numero-de-maison', name: 'Numéro de maison', label: 'UNE TOUCHE À VOTRE IMAGE', image: 'atelier-mains', tone: 'cream', intro: 'Donner du caractère à son entrée avec un numéro de maison composé morceau par morceau.', description: 'Imaginer un chiffre, choisir une palette et assembler les matières : une invitation à créer un détail unique pour son chez-soi.', detail: 'Les supports, dimensions et conditions d’utilisation extérieure seront confirmés avec Marie. La photo présente un geste d’atelier, pas le modèle final.', alt: 'Gros plan sur les mains qui assemblent de petites tesselles sur un support.' },
];

export const works = [
  { image: 'boutique', title: 'Un regard, mille fragments', category: 'Décoration', alt: 'Grande mosaïque figurative installée dans la boutique UNICA.' },
  { image: 'blason', title: 'Le détail fait la différence', category: 'Sur mesure', alt: 'Blason Porsche composé de tesselles dorées, noires et rouges.' },
  { image: 'dalida', title: 'Matières & caractère', category: 'Décoration', alt: 'Pièce décorative en mosaïque à motif léopard, dans un décor rose.' },
  { image: 'lion', title: 'Une pièce prend vie', category: 'En atelier', alt: 'Travail à la main sur une mosaïque représentant une tête de lion.' },
  { image: 'tortue', title: 'La mosaïque habite les lieux', category: 'Sur mesure', alt: 'Mosaïque de tortue installée sur le mur d’un espace aquatique.' },
  { image: 'croix', title: 'Des couleurs qui vous ressemblent', category: 'Décoration', alt: 'Croix réalisée en mosaïque et présentée à la main.' },
  { image: 'atelier-mains', title: 'Le geste précis', category: 'En atelier', alt: 'Des mains assemblent patiemment des tesselles de mosaïque.' },
  { image: 'atelier-partage', title: 'Créer ensemble', category: 'En atelier', alt: 'Deux participantes échangent autour de leur création pendant un atelier UNICA.' },
  { image: 'atelier-table', title: 'La table de création', category: 'En atelier', alt: 'Une table couverte de tesselles et de créations en cours.' },
  { image: 'pixel-kids', title: 'Couleurs en partage', category: 'En atelier', alt: 'Des enfants composent des mosaïques colorées autour de la table.' },
  { image: 'recolle', title: 'Composer autrement', category: 'En atelier', alt: 'Une création en mosaïque prend forme pendant un atelier.' },
];
