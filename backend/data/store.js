const bcrypt = require('bcryptjs');

const users = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    password: bcrypt.hashSync('admin123', 8),
    role: 'admin',
  },
  {
    id: '2',
    username: 'client',
    email: 'client@example.com',
    password: bcrypt.hashSync('client123', 8),
    role: 'user',
  },
];

const suppliers = [
  { id: '1', name: 'Auto Distribution Europe', contact: 'supply@ade.example' },
  { id: '2', name: 'Garage Parts Nord', contact: 'contact@gpn.example' },
];

const products = [
  {
    id: '1',
    name: 'Filtre a huile Bosch',
    description: 'Filtre moteur compatible citadines essence et diesel recentes.',
    price: 12.9,
    quantity: 24,
    supplierId: '1',
    category: 'Filtres',
  },
  {
    id: '2',
    name: 'Plaquettes de frein avant',
    description: 'Jeu de plaquettes haute resistance pour freinage quotidien.',
    price: 38.5,
    quantity: 12,
    supplierId: '2',
    category: 'Freinage',
  },
  {
    id: '3',
    name: 'Batterie 12V 60Ah',
    description: 'Batterie sans entretien avec bonne tenue au demarrage a froid.',
    price: 96,
    quantity: 8,
    supplierId: '1',
    category: 'Electricite',
  },
  {
    id: '4',
    name: 'Amortisseur arriere',
    description: 'Amortisseur hydraulique pour conduite stable sur route degradee.',
    price: 72.75,
    quantity: 6,
    supplierId: '2',
    category: 'Suspension',
  },
  {
    id: '5',
    name: 'Bougie allumage iridium',
    description: 'Bougie longue duree pour moteur essence performant.',
    price: 9.8,
    quantity: 32,
    supplierId: '1',
    category: 'Moteur',
  },
  {
    id: '6',
    name: 'Courroie accessoire',
    description: 'Courroie striee resistant aux variations de temperature.',
    price: 21.4,
    quantity: 0,
    supplierId: '2',
    category: 'Moteur',
  },
];

module.exports = {
  users,
  suppliers,
  products,
  orders: [],
  movements: [],
};