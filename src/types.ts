export interface BabyProfile {
  name: string;
  birthDate: string;
  birthWeight: number; // grams
  birthHeight: number; // cm
  birthHeadCirc: number; // cm
  bloodType?: string;
  updatedAt?: string;
}

export interface GrowthEntry {
  id: string;
  date: string;
  weight?: number; // grams
  height?: number; // cm
  headCirc?: number; // cm
  notes: string;
  updatedAt?: string;
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
  updatedAt?: string;
}

export interface Vaccine {
  id: string;
  name: string;
  scheduledAge: string;
  scheduledAgeMonths: number;
  diseases: string[];
  done: boolean;
  doneDate?: string;
  batchNumber?: string;
  notes?: string;
  updatedAt?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  done: boolean;
  doneDate?: string;
  category: 'medecin' | 'examen' | 'administratif' | 'personnalise';
  scheduledAge?: string;
  updatedAt?: string;
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
  updatedAt?: string;
}

export interface Document {
  id: string;
  category: 'medecin' | 'pharmacie' | 'assurance' | 'urgence' | 'autre';
  label: string;
  value: string;
  notes?: string;
  updatedAt?: string;
}

export interface AppData {
  profile: BabyProfile | null;
  growth: GrowthEntry[];
  appointments: Appointment[];
  vaccines: Vaccine[];
  checklist: ChecklistItem[];
  notes: NoteEntry[];
  documents: Document[];
  deletedIds?: string[]; // IDs supprimés, pour ne pas les faire réapparaître
}
