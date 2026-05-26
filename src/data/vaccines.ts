import type { Vaccine } from '../types';

export function defaultVaccines(): Vaccine[] {
  return [
    { id: 'v1', name: 'DTCaP-Hib-HepB', scheduledAge: '2 mois', scheduledAgeMonths: 2, diseases: ['Diphtérie', 'Tétanos', 'Coqueluche', 'Polio', 'Haemophilus influenzae b', 'Hépatite B'], done: false },
    { id: 'v2', name: 'Pneumocoque (PCV13)', scheduledAge: '2 mois', scheduledAgeMonths: 2, diseases: ['Pneumocoque'], done: false },
    { id: 'v3', name: 'Rotavirus', scheduledAge: '2 mois', scheduledAgeMonths: 2, diseases: ['Rotavirus'], done: false },
    { id: 'v4', name: 'DTCaP-Hib-HepB', scheduledAge: '4 mois', scheduledAgeMonths: 4, diseases: ['Diphtérie', 'Tétanos', 'Coqueluche', 'Polio', 'Haemophilus influenzae b', 'Hépatite B'], done: false },
    { id: 'v5', name: 'Rotavirus', scheduledAge: '4 mois', scheduledAgeMonths: 4, diseases: ['Rotavirus'], done: false },
    { id: 'v6', name: 'Pneumocoque (PCV13)', scheduledAge: '4 mois', scheduledAgeMonths: 4, diseases: ['Pneumocoque'], done: false },
    { id: 'v7', name: 'Méningocoque C', scheduledAge: '5 mois', scheduledAgeMonths: 5, diseases: ['Méningocoque C'], done: false },
    { id: 'v8', name: 'DTCaP-Hib-HepB (rappel)', scheduledAge: '11 mois', scheduledAgeMonths: 11, diseases: ['Diphtérie', 'Tétanos', 'Coqueluche', 'Polio', 'Haemophilus influenzae b', 'Hépatite B'], done: false },
    { id: 'v9', name: 'Pneumocoque (rappel)', scheduledAge: '11 mois', scheduledAgeMonths: 11, diseases: ['Pneumocoque'], done: false },
    { id: 'v10', name: 'ROR', scheduledAge: '12 mois', scheduledAgeMonths: 12, diseases: ['Rougeole', 'Oreillons', 'Rubéole'], done: false },
    { id: 'v11', name: 'Méningocoque C (rappel)', scheduledAge: '12 mois', scheduledAgeMonths: 12, diseases: ['Méningocoque C'], done: false },
    { id: 'v12', name: 'Varicelle', scheduledAge: '12 mois', scheduledAgeMonths: 12, diseases: ['Varicelle'], done: false },
    { id: 'v13', name: 'ROR (2e dose)', scheduledAge: '16-18 mois', scheduledAgeMonths: 17, diseases: ['Rougeole', 'Oreillons', 'Rubéole'], done: false },
    { id: 'v14', name: 'Varicelle (2e dose)', scheduledAge: '16-18 mois', scheduledAgeMonths: 17, diseases: ['Varicelle'], done: false },
    { id: 'v15', name: 'DTCaP', scheduledAge: '6 ans', scheduledAgeMonths: 72, diseases: ['Diphtérie', 'Tétanos', 'Coqueluche', 'Polio'], done: false },
    { id: 'v16', name: 'HPV', scheduledAge: '11-14 ans', scheduledAgeMonths: 132, diseases: ['Papillomavirus (HPV)'], done: false },
    { id: 'v17', name: 'dTcaP (rappel ado)', scheduledAge: '11-13 ans', scheduledAgeMonths: 132, diseases: ['Diphtérie', 'Tétanos', 'Coqueluche', 'Polio'], done: false },
    { id: 'v18', name: 'Méningocoque ACWY', scheduledAge: '11-14 ans', scheduledAgeMonths: 132, diseases: ['Méningocoque ACWY'], done: false },
  ];
}
