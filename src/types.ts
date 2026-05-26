export interface BabyProfile {
  name: string;
  birthDate: string;
  birthWeight: number; // grams
  birthHeight: number; // cm
  birthHeadCirc: number; // cm
}

export interface GrowthEntry {
  id: string;
  date: string;
  weight?: number; // grams
  height?: number; // cm
  headCirc?: number; // cm
  notes: string;
}

export interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  doctor: string;
  location: string;
  notes: string;
  status: 'upcoming' | 'done' | 'missed';
  reminderSet: boolean;
}

export interface Vaccine {
  id: string;
  name: string;
  scheduledAge: string; // e.g. "2 mois"
  scheduledAgeMonths: number; // for sorting/alerts
  diseases: string[];
  done: boolean;
  doneDate?: string;
  batchNumber?: string;
  notes?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  done: boolean;
  doneDate?: string;
  category: 'medecin' | 'examen' | 'administratif' | 'personnalise';
  scheduledAge?: string;
}

export interface NoteEntry {
  id: string;
  date: string;
  type: 'note' | 'symptom';
  content: string;
  temperature?: number;
  symptoms: string[];
  sleep?: string;
  feeding?: string;
  mood?: string;
}

export interface Document {
  id: string;
  category: 'medecin' | 'pharmacie' | 'assurance' | 'urgence' | 'autre';
  label: string;
  value: string;
  notes?: string;
}

export interface AppData {
  profile: BabyProfile | null;
  growth: GrowthEntry[];
  appointments: Appointment[];
  vaccines: Vaccine[];
  checklist: ChecklistItem[];
  notes: NoteEntry[];
  documents: Document[];
}
