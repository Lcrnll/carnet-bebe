import type { DevelopmentMilestone } from '../types';

/**
 * Jalons du développement moteur, sensoriel et cognitif — 0-24 mois.
 * Chaque étape est sourcée ; aucune donnée n'est inventée.
 *
 * Sources principales :
 * - OMS, WHO Motor Development Study — "Windows of achievement for six gross
 *   motor development milestones", Acta Paediatrica Suppl. 450, 2006
 *   (https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/motor-development-milestones/)
 * - CDC, "Learn the Signs. Act Early." — Milestone checklists by age
 *   (https://www.cdc.gov/act-early/)
 * - American Academy of Ophthalmology — "Baby Vision Development: Newborn to 12 Months"
 *   (https://www.aao.org/eye-health/tips-prevention/baby-vision-development-first-year)
 * - Santé publique France / PNNS — recommandations sur la diversification
 *   alimentaire (2022), reprises par la HAS
 * - American Academy of Pediatrics / littérature odontologique — repères
 *   d'éruption des dents de lait
 *
 * Les âges OMS sont des fenêtres statistiques (1er-99e percentile) assorties
 * d'une médiane. Les âges CDC correspondent à l'âge auquel ~75 % des enfants
 * ont acquis l'étape ("généralement avant X mois"). Chaque bébé se développe
 * à son rythme : ce ne sont que des repères, pas une norme à atteindre.
 */
export function defaultDevelopmentMilestones(): DevelopmentMilestone[] {
  return [
    // ── VISION ──────────────────────────────────────────────────────────
    {
      id: 'd1', category: 'vision',
      title: 'Fixe un visage ou un objet contrasté',
      ageRangeMonths: [0, 1],
      description: "À la naissance, voit net à 20-30 cm et distingue surtout des contrastes noir/blanc. Fixe volontiers les visages.",
      source: 'American Academy of Ophthalmology — Baby Vision Development',
      achieved: false,
    },
    {
      id: 'd2', category: 'vision',
      title: 'Suit un objet en mouvement du regard',
      ageRangeMonths: [2, 3],
      medianMonths: 2,
      description: "Les deux yeux commencent à se coordonner pour suivre un objet qui se déplace.",
      source: 'CDC Milestones (2 mois) · American Academy of Ophthalmology',
      achieved: false,
    },
    {
      id: 'd3', category: 'vision',
      title: 'Distingue les couleurs vives',
      ageRangeMonths: [3, 4],
      description: "Vers 3 mois, peut distinguer le rouge, le jaune, le bleu et le vert.",
      source: 'American Academy of Ophthalmology — Baby Vision Development',
      achieved: false,
    },
    {
      id: 'd4', category: 'vision',
      title: 'Perception du relief (profondeur)',
      ageRangeMonths: [4, 6],
      medianMonths: 5,
      description: "La vision binoculaire se met en place et permet d'estimer la distance des objets.",
      source: 'American Academy of Ophthalmology — Baby Vision Development',
      achieved: false,
    },
    {
      id: 'd5', category: 'vision',
      title: 'Vision proche de celle d\'un adulte',
      ageRangeMonths: [6, 8],
      description: "Vers 6 mois, l'acuité visuelle et la vision des couleurs sont presque matures.",
      source: 'American Academy of Ophthalmology — Baby Vision Development',
      achieved: false,
    },

    // ── MOTRICITÉ GLOBALE ───────────────────────────────────────────────
    {
      id: 'd6', category: 'motricite_globale',
      title: 'Tient sa tête sans soutien',
      ageRangeMonths: [2, 4],
      description: "Tient la tête droite et stable quand on le porte.",
      source: 'CDC Milestones (4 mois)',
      achieved: false,
    },
    {
      id: 'd7', category: 'motricite_globale',
      title: 'Se retourne du ventre vers le dos',
      ageRangeMonths: [4, 6],
      description: "Premier retournement, généralement du ventre vers le dos avant l'inverse.",
      source: 'CDC Milestones (6 mois)',
      achieved: false,
    },
    {
      id: 'd8', category: 'motricite_globale',
      title: 'Tient assis sans soutien',
      ageRangeMonths: [4, 9],
      medianMonths: 6,
      description: "Fenêtre OMS (1er-99e percentile) : 3,8 à 9,2 mois. Médiane à 6 mois.",
      source: 'OMS, WHO Motor Development Study (2006)',
      achieved: false,
    },
    {
      id: 'd9', category: 'motricite_globale',
      title: 'Se tient debout avec appui',
      ageRangeMonths: [5, 11],
      medianMonths: 7,
      description: "Fenêtre OMS : 4,8 à 11,4 mois. Médiane à 7,4 mois.",
      source: 'OMS, WHO Motor Development Study (2006)',
      achieved: false,
    },
    {
      id: 'd10', category: 'motricite_globale',
      title: 'Rampe à quatre pattes',
      ageRangeMonths: [5, 14],
      medianMonths: 9,
      description: "Fenêtre OMS : 5,2 à 13,5 mois. Médiane à 8,5 mois. Certains bébés ne rampent jamais et passent directement à la marche.",
      source: 'OMS, WHO Motor Development Study (2006)',
      achieved: false,
    },
    {
      id: 'd11', category: 'motricite_globale',
      title: 'Marche en se tenant à un appui',
      ageRangeMonths: [6, 14],
      medianMonths: 9,
      description: "Fenêtre OMS : 5,9 à 13,7 mois. Médiane à 9,2 mois.",
      source: 'OMS, WHO Motor Development Study (2006)',
      achieved: false,
    },
    {
      id: 'd12', category: 'motricite_globale',
      title: 'Se tient debout seul',
      ageRangeMonths: [7, 17],
      medianMonths: 11,
      description: "Fenêtre OMS : 6,9 à 16,9 mois. Médiane à 11 mois.",
      source: 'OMS, WHO Motor Development Study (2006)',
      achieved: false,
    },
    {
      id: 'd13', category: 'motricite_globale',
      title: 'Marche seul',
      ageRangeMonths: [8, 18],
      medianMonths: 12,
      description: "Fenêtre OMS : 8,2 à 17,6 mois. Médiane à 12,1 mois.",
      source: 'OMS, WHO Motor Development Study (2006)',
      achieved: false,
    },

    // ── MOTRICITÉ FINE ──────────────────────────────────────────────────
    {
      id: 'd14', category: 'motricite_fine',
      title: 'Ouvre et ferme les mains',
      ageRangeMonths: [0, 2],
      description: "Mouvement réflexe qui devient progressivement volontaire.",
      source: 'CDC Milestones (2 mois)',
      achieved: false,
    },
    {
      id: 'd15', category: 'motricite_fine',
      title: 'Tient un jouet qu\'on lui met dans la main',
      ageRangeMonths: [3, 4],
      description: "Porte les mains à la bouche et tient un objet quelques instants.",
      source: 'CDC Milestones (4 mois)',
      achieved: false,
    },
    {
      id: 'd16', category: 'motricite_fine',
      title: 'Attrape un jouet qu\'il désire',
      ageRangeMonths: [4, 7],
      description: "Tend le bras et referme la main sur un objet convoité.",
      source: 'CDC Milestones (6 mois)',
      achieved: false,
    },
    {
      id: 'd17', category: 'motricite_fine',
      title: 'Fait passer un objet d\'une main à l\'autre',
      ageRangeMonths: [5, 8],
      description: "Transfère un jouet d'une main à l'autre pour l'explorer.",
      source: 'Littérature pédiatrique courante (AAP)',
      achieved: false,
    },
    {
      id: 'd18', category: 'motricite_fine',
      title: 'Prise en pince (pouce-index)',
      ageRangeMonths: [9, 12],
      description: "Ramasse un petit objet entre le pouce et l'index — étape clé avant de manger seul.",
      source: 'CDC Milestones (9-12 mois)',
      achieved: false,
    },

    // ── DENTS ───────────────────────────────────────────────────────────
    {
      id: 'd19', category: 'dents',
      title: 'Première dent',
      ageRangeMonths: [3, 12],
      medianMonths: 8,
      description: "Le plus souvent entre 6 et 10 mois, mais une fourchette de 3 à 12 mois reste normale. Les incisives centrales (bas ou haut) apparaissent généralement en premier.",
      source: 'American Academy of Pediatrics · chronologie d\'éruption dentaire',
      achieved: false,
    },
    {
      id: 'd20', category: 'dents',
      title: 'Les 20 dents de lait sont sorties',
      ageRangeMonths: [24, 33],
      description: "La dentition primaire complète (20 dents) est généralement en place vers 33 mois.",
      source: 'American Academy of Pediatrics · chronologie d\'éruption dentaire',
      achieved: false,
    },

    // ── LANGAGE ─────────────────────────────────────────────────────────
    {
      id: 'd21', category: 'langage',
      title: 'Gazouille (sons "areuh", "aaah")',
      ageRangeMonths: [2, 4],
      description: "Premiers sons vocaliques volontaires, en dehors des pleurs.",
      source: 'CDC Milestones (4 mois)',
      achieved: false,
    },
    {
      id: 'd22', category: 'langage',
      title: 'Babille des syllabes répétées ("mamama", "bababa")',
      ageRangeMonths: [6, 9],
      description: "Enchaîne des syllabes sans leur donner encore de sens précis.",
      source: 'CDC Milestones (9 mois)',
      achieved: false,
    },
    {
      id: 'd23', category: 'langage',
      title: 'Dit un premier mot avec sens ("maman", "papa")',
      ageRangeMonths: [10, 14],
      medianMonths: 12,
      description: "Utilise un mot de façon intentionnelle pour désigner une personne ou une chose.",
      source: 'CDC Milestones (12 mois)',
      achieved: false,
    },

    // ── ALIMENTATION / DIVERSIFICATION ─────────────────────────────────
    {
      id: 'd24', category: 'alimentation',
      title: 'Début de la diversification alimentaire',
      ageRangeMonths: [4, 6],
      description: "À introduire chez tout nourrisson né à terme et en bonne santé entre 4 mois révolus et 6 mois, sans ordre imposé entre les groupes d'aliments (y compris les allergènes).",
      source: 'Santé publique France / PNNS (2022), recommandations reprises par la HAS',
      achieved: false,
    },
    {
      id: 'd25', category: 'alimentation',
      title: 'Introduction des morceaux (textures non lisses)',
      ageRangeMonths: [6, 10],
      description: "Peut commencer dès 6 mois ; à ne pas retarder au-delà de 10 mois pour favoriser l'acceptation des textures.",
      source: 'Santé publique France / PNNS (2022)',
      achieved: false,
    },
  ];
}
