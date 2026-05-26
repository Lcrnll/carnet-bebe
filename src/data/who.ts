/**
 * Courbes de croissance OMS — Filles, 0-24 mois
 * Source : WHO Child Growth Standards (https://www.who.int/tools/child-growth-standards)
 * Percentiles P3, P50 (médiane), P97
 */

export interface WHOPoint {
  month: number;
  p3: number;
  p50: number;
  p97: number;
}

/** Poids pour l'âge — filles (kg) */
export const WHO_WEIGHT_GIRLS: WHOPoint[] = [
  { month: 0,  p3: 2.4,  p50: 3.2,  p97: 4.2  },
  { month: 1,  p3: 3.2,  p50: 4.2,  p97: 5.4  },
  { month: 2,  p3: 4.0,  p50: 5.1,  p97: 6.6  },
  { month: 3,  p3: 4.6,  p50: 5.8,  p97: 7.5  },
  { month: 4,  p3: 5.1,  p50: 6.4,  p97: 8.2  },
  { month: 5,  p3: 5.5,  p50: 6.9,  p97: 8.8  },
  { month: 6,  p3: 5.8,  p50: 7.3,  p97: 9.3  },
  { month: 7,  p3: 6.1,  p50: 7.6,  p97: 9.8  },
  { month: 8,  p3: 6.3,  p50: 7.9,  p97: 10.2 },
  { month: 9,  p3: 6.5,  p50: 8.2,  p97: 10.5 },
  { month: 10, p3: 6.7,  p50: 8.5,  p97: 10.9 },
  { month: 11, p3: 6.9,  p50: 8.7,  p97: 11.2 },
  { month: 12, p3: 7.0,  p50: 8.9,  p97: 11.5 },
  { month: 15, p3: 7.6,  p50: 9.6,  p97: 12.4 },
  { month: 18, p3: 8.0,  p50: 10.2, p97: 13.2 },
  { month: 21, p3: 8.5,  p50: 10.9, p97: 14.0 },
  { month: 24, p3: 9.0,  p50: 11.5, p97: 14.8 },
];

/** Taille pour l'âge — filles (cm) */
export const WHO_HEIGHT_GIRLS: WHOPoint[] = [
  { month: 0,  p3: 45.6, p50: 49.1, p97: 52.7 },
  { month: 1,  p3: 49.8, p50: 53.7, p97: 57.6 },
  { month: 2,  p3: 52.8, p50: 57.1, p97: 61.1 },
  { month: 3,  p3: 55.3, p50: 59.8, p97: 64.0 },
  { month: 4,  p3: 57.4, p50: 62.1, p97: 66.4 },
  { month: 5,  p3: 59.0, p50: 64.0, p97: 68.5 },
  { month: 6,  p3: 60.6, p50: 65.7, p97: 70.4 },
  { month: 7,  p3: 61.9, p50: 67.3, p97: 72.1 },
  { month: 8,  p3: 63.2, p50: 68.7, p97: 73.5 },
  { month: 9,  p3: 64.5, p50: 70.1, p97: 75.0 },
  { month: 10, p3: 65.7, p50: 71.5, p97: 76.4 },
  { month: 11, p3: 66.7, p50: 72.8, p97: 77.6 },
  { month: 12, p3: 67.7, p50: 74.0, p97: 79.2 },
  { month: 15, p3: 70.3, p50: 77.5, p97: 83.2 },
  { month: 18, p3: 73.0, p50: 80.7, p97: 88.1 },
  { month: 21, p3: 75.6, p50: 83.7, p97: 91.4 },
  { month: 24, p3: 78.0, p50: 86.4, p97: 94.3 },
];
