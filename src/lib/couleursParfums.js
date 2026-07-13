// Associe des mots-clés de parfum à une couleur representative,
// pour que chaque bougie ait une teinte qui evoque son odeur.
const PALETTE_PARFUMS = [
  { motsCles: ['vanille'], couleur: '#d9a86c' },
  { motsCles: ['lavande'], couleur: '#8b7bc7' },
  { motsCles: ['rose', 'pivoine', 'fleur de coton'], couleur: '#d98ba0' },
  { motsCles: ['jasmin', 'fleur d\'oranger', 'muguet', 'freesia'], couleur: '#e8dba8' },
  { motsCles: ['citron', 'agrume', 'orange', 'mandarine', 'pamplemousse', 'bergamote'], couleur: '#e8a13a' },
  { motsCles: ['pomme', 'poire', 'fruit'], couleur: '#c9622b' },
  { motsCles: ['fraise', 'framboise', 'fruits rouges', 'cerise'], couleur: '#c7405a' },
  { motsCles: ['pin', 'sapin', 'foret', 'forêt', 'eucalyptus', 'menthe'], couleur: '#4f7a5c' },
  { motsCles: ['bois', 'santal', 'cedre', 'cèdre', 'ambre'], couleur: '#8a5a3b' },
  { motsCles: ['cannelle', 'epice', 'épice', 'clou de girofle', 'gingembre', 'chai'], couleur: '#a8501f' },
  { motsCles: ['cafe', 'café', 'chocolat', 'caramel', 'praline', 'praliné'], couleur: '#6b4423' },
  { motsCles: ['vanille bourbon', 'brioche', 'gateau', 'gâteau', 'biscuit', 'patisserie', 'pâtisserie'], couleur: '#e0b877' },
  { motsCles: ['coco', 'noix de coco', 'monoi', 'tiare'], couleur: '#f0e4c8' },
  { motsCles: ['musc', 'poudre', 'cachemire', 'coton'], couleur: '#d8cbb8' },
  { motsCles: ['ocean', 'océan', 'marin', 'iode', 'brise'], couleur: '#4a7b8c' },
  { motsCles: ['noel', 'noël', 'hiver', 'pin des alpes', 'orange cannelle'], couleur: '#8a2b2b' },
  { motsCles: ['the vert', 'thé vert', 'the blanc', 'thé blanc'], couleur: '#a3b58c' },
  { motsCles: ['lin', 'linge propre', 'savon'], couleur: '#e5e0d3' },
]

const COULEUR_PAR_DEFAUT = '#c9622b' // braise — couleur de secours si aucun mot-clé ne correspond

export function suggererCouleur(texteParfum) {
  if (!texteParfum) return COULEUR_PAR_DEFAUT
  const texte = texteParfum.toLowerCase()
  for (const entree of PALETTE_PARFUMS) {
    if (entree.motsCles.some(mot => texte.includes(mot))) {
      return entree.couleur
    }
  }
  return COULEUR_PAR_DEFAUT
}
