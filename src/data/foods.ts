import type { FoodCategory } from '../types';

export interface CatalogFood {
  id: string;
  name: string;
  emoji: string;
  category: FoodCategory;
  allergen?: Allergen;
}

export type Allergen = 'gluten' | 'oeuf' | 'lait' | 'poisson' | 'crustaces' | 'arachide' | 'fruits_coque' | 'sesame' | 'soja';

// Allergènes majeurs (règlement UE 1169/2011) pertinents pour la diversification.
// Santé publique France (2022) recommande de les introduire comme les autres aliments,
// entre 4 et 6 mois, sans les retarder.
export const ALLERGENS: { id: Allergen; label: string; emoji: string }[] = [
  { id: 'gluten',       label: 'Gluten',         emoji: '🌾' },
  { id: 'oeuf',         label: 'Œuf',            emoji: '🥚' },
  { id: 'lait',         label: 'Lait de vache',  emoji: '🥛' },
  { id: 'poisson',      label: 'Poisson',        emoji: '🐟' },
  { id: 'crustaces',    label: 'Crustacés',      emoji: '🦐' },
  { id: 'arachide',     label: 'Arachide',       emoji: '🥜' },
  { id: 'fruits_coque', label: 'Fruits à coque', emoji: '🌰' },
  { id: 'sesame',       label: 'Sésame',         emoji: '⚪' },
  { id: 'soja',         label: 'Soja',           emoji: '🫘' },
];

export const FOOD_CATEGORIES: { id: FoodCategory; label: string; emoji: string }[] = [
  { id: 'legumes',   label: 'Légumes',            emoji: '🥕' },
  { id: 'fruits',    label: 'Fruits',             emoji: '🍎' },
  { id: 'feculents', label: 'Féculents',          emoji: '🍚' },
  { id: 'proteines', label: 'Viande, poisson, œuf', emoji: '🍗' },
  { id: 'laitiers',  label: 'Produits laitiers',  emoji: '🧀' },
  { id: 'autres',    label: 'Autres',             emoji: '🫒' },
];

const f = (id: string, name: string, emoji: string, category: FoodCategory, allergen?: Allergen): CatalogFood =>
  ({ id, name, emoji, category, allergen });

export const FOOD_CATALOG: CatalogFood[] = [
  // Légumes
  f('carotte', 'Carotte', '🥕', 'legumes'),
  f('courgette', 'Courgette', '🥒', 'legumes'),
  f('haricot_vert', 'Haricot vert', '🫛', 'legumes'),
  f('potiron', 'Potiron', '🎃', 'legumes'),
  f('butternut', 'Butternut', '🎃', 'legumes'),
  f('patate_douce', 'Patate douce', '🍠', 'legumes'),
  f('brocoli', 'Brocoli', '🥦', 'legumes'),
  f('chou_fleur', 'Chou-fleur', '🥦', 'legumes'),
  f('epinard', 'Épinard', '🥬', 'legumes'),
  f('petit_pois', 'Petit pois', '🫛', 'legumes'),
  f('poireau', 'Poireau', '🌱', 'legumes'),
  f('panais', 'Panais', '🥕', 'legumes'),
  f('betterave', 'Betterave', '🟣', 'legumes'),
  f('tomate', 'Tomate', '🍅', 'legumes'),
  f('avocat', 'Avocat', '🥑', 'legumes'),
  f('aubergine', 'Aubergine', '🍆', 'legumes'),
  f('poivron', 'Poivron', '🫑', 'legumes'),
  f('fenouil', 'Fenouil', '🌿', 'legumes'),
  f('navet', 'Navet', '⚪', 'legumes'),
  f('celeri', 'Céleri', '🥬', 'legumes'),
  f('concombre', 'Concombre', '🥒', 'legumes'),
  f('champignon', 'Champignon', '🍄', 'legumes'),
  f('mais', 'Maïs', '🌽', 'legumes'),
  f('artichaut', 'Artichaut', '🌱', 'legumes'),

  // Fruits
  f('pomme', 'Pomme', '🍎', 'fruits'),
  f('poire', 'Poire', '🍐', 'fruits'),
  f('banane', 'Banane', '🍌', 'fruits'),
  f('peche', 'Pêche', '🍑', 'fruits'),
  f('abricot', 'Abricot', '🍑', 'fruits'),
  f('prune', 'Prune', '🟣', 'fruits'),
  f('fraise', 'Fraise', '🍓', 'fruits'),
  f('framboise', 'Framboise', '🍓', 'fruits'),
  f('myrtille', 'Myrtille', '🫐', 'fruits'),
  f('mangue', 'Mangue', '🥭', 'fruits'),
  f('melon', 'Melon', '🍈', 'fruits'),
  f('pasteque', 'Pastèque', '🍉', 'fruits'),
  f('kiwi', 'Kiwi', '🥝', 'fruits'),
  f('orange', 'Orange', '🍊', 'fruits'),
  f('clementine', 'Clémentine', '🍊', 'fruits'),
  f('ananas', 'Ananas', '🍍', 'fruits'),
  f('cerise', 'Cerise', '🍒', 'fruits'),
  f('raisin', 'Raisin', '🍇', 'fruits'),
  f('figue', 'Figue', '🟤', 'fruits'),

  // Féculents
  f('pomme_de_terre', 'Pomme de terre', '🥔', 'feculents'),
  f('riz', 'Riz', '🍚', 'feculents'),
  f('pates', 'Pâtes', '🍝', 'feculents', 'gluten'),
  f('semoule', 'Semoule', '🌾', 'feculents', 'gluten'),
  f('pain', 'Pain', '🍞', 'feculents', 'gluten'),
  f('avoine', 'Flocons d\'avoine', '🥣', 'feculents', 'gluten'),
  f('boulgour', 'Boulgour', '🌾', 'feculents', 'gluten'),
  f('quinoa', 'Quinoa', '🌾', 'feculents'),
  f('polenta', 'Polenta', '🌽', 'feculents'),
  f('lentilles', 'Lentilles', '🫘', 'feculents'),
  f('pois_chiches', 'Pois chiches', '🫘', 'feculents'),

  // Viande, poisson, œuf
  f('poulet', 'Poulet', '🍗', 'proteines'),
  f('dinde', 'Dinde', '🦃', 'proteines'),
  f('boeuf', 'Bœuf', '🥩', 'proteines'),
  f('veau', 'Veau', '🥩', 'proteines'),
  f('agneau', 'Agneau', '🍖', 'proteines'),
  f('jambon', 'Jambon blanc', '🍖', 'proteines'),
  f('cabillaud', 'Cabillaud / poisson blanc', '🐟', 'proteines', 'poisson'),
  f('saumon', 'Saumon', '🐟', 'proteines', 'poisson'),
  f('sardine', 'Sardine', '🐟', 'proteines', 'poisson'),
  f('crevette', 'Crevette', '🦐', 'proteines', 'crustaces'),
  f('oeuf', 'Œuf', '🥚', 'proteines', 'oeuf'),
  f('tofu', 'Tofu', '🫘', 'proteines', 'soja'),

  // Produits laitiers
  f('yaourt', 'Yaourt nature', '🥛', 'laitiers', 'lait'),
  f('fromage_blanc', 'Fromage blanc', '🥛', 'laitiers', 'lait'),
  f('petit_suisse', 'Petit-suisse', '🥛', 'laitiers', 'lait'),
  f('fromage', 'Fromage (comté, emmental…)', '🧀', 'laitiers', 'lait'),
  f('beurre', 'Beurre', '🧈', 'laitiers', 'lait'),

  // Autres
  f('arachide', 'Beurre de cacahuète', '🥜', 'autres', 'arachide'),
  f('amande', 'Poudre d\'amande / noisette', '🌰', 'autres', 'fruits_coque'),
  f('sesame', 'Purée de sésame (tahini)', '⚪', 'autres', 'sesame'),
  f('huile_olive', 'Huile d\'olive', '🫒', 'autres'),
  f('huile_colza', 'Huile de colza', '🫗', 'autres'),
  f('herbes', 'Herbes aromatiques', '🌿', 'autres'),
  f('epices', 'Épices douces (cumin, curcuma…)', '🧂', 'autres'),
];
