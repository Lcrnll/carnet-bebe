import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { differenceInWeeks, differenceInMonths, format, parseISO, addMonths, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Scale, Ruler, Calendar, Shield, Edit2, Check, Droplet,
  Pill, Phone, TrendingUp, Utensils, AlertCircle,
} from 'lucide-react';
import type { AppData, BabyProfile, GrowthEntry } from '../types';
import { saveProfile, addGrowth, uid } from '../storage';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { FormField, SelectField } from '../components/FormField';

interface Props { data: AppData; onRefresh: () => void; }

const BLOOD_TYPES = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Numéros d'urgence par défaut
const DEFAULT_EMERGENCY = [
  { label: 'SAMU', value: '15', notes: 'Urgences médicales' },
  { label: 'Pompiers', value: '18', notes: 'Secours' },
  { label: '🇪🇺 Urgences EU', value: '112', notes: 'Europe' },
  { label: 'Antipoison', value: '09 74 75 00 00', notes: 'Intoxications' },
];

function getAge(birthDate: string) {
  const bd = parseISO(birthDate);
  const now = new Date();
  const weeks = differenceInWeeks(now, bd);
  const months = differenceInMonths(now, bd);
  if (months < 2) return `${weeks} semaine${weeks > 1 ? 's' : ''}`;
  if (months < 24) return `${months} mois`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years} an${years > 1 ? 's' : ''} et ${rem} mois` : `${years} an${years > 1 ? 's' : ''}`;
}

function getNextVaccine(data: AppData) {
  if (!data.profile) return null;
  const bd = parseISO(data.profile.birthDate);
  const pending = data.vaccines.filter(v => !v.done);
  if (!pending.length) return null;
  const sorted = [...pending].sort((a, b) => a.scheduledAgeMonths - b.scheduledAgeMonths);
  const next = sorted[0];
  const dueDate = addMonths(bd, next.scheduledAgeMonths);
  return { name: next.name, dueDate, age: next.scheduledAge };
}

function getNextAppointment(data: AppData) {
  const upcoming = data.appointments
    .filter(a => a.status === 'upcoming')
    .sort((a, b) => a.date.localeCompare(b.date));
  return upcoming[0] || null;
}

function getLastMeasure(data: AppData, field: 'weight' | 'height') {
  const entries = [...data.growth]
    .filter(g => g[field] !== undefined)
    .sort((a, b) => b.date.localeCompare(a.date));
  return entries[0] || null;
}

// Calcul dose Doliprane (paracétamol)
function calcDoliprane(weightG: number) {
  const kg = weightG / 1000;
  const dose = Math.round(kg * 15); // 15 mg/kg par prise
  const doseMax = Math.min(Math.round(kg * 60), 4000); // 60 mg/kg/jour
  const ml = +(dose / 24).toFixed(1); // Doliprane 2,4% (24 mg/ml)
  const sachet80 = Math.round(dose / 80 * 10) / 10;
  const sachet100 = Math.round(dose / 100 * 10) / 10;
  return { dose, doseMax, ml, sachet80, sachet100 };
}

export function Dashboard({ data, onRefresh }: Props) {
  const navigate = useNavigate();
  const [showEdit, setShowEdit] = useState(!data.profile);
  const [showDoliprane, setShowDoliprane] = useState(false);
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [weightForm, setWeightForm] = useState({ weight: '', height: '', date: format(new Date(), 'yyyy-MM-dd') });

  const [form, setForm] = useState<BabyProfile>(data.profile || {
    name: '', birthDate: '', birthWeight: 0, birthHeight: 0, birthHeadCirc: 0, bloodType: '',
  });

  const handleSave = () => {
    if (!form.name || !form.birthDate) return;
    saveProfile(form);
    onRefresh();
    setShowEdit(false);
  };

  const openEdit = () => {
    setForm(profile || { name: '', birthDate: '', birthWeight: 0, birthHeight: 0, birthHeadCirc: 0, bloodType: '' });
    setShowEdit(true);
  };

  const handleAddWeight = () => {
    if (!weightForm.weight && !weightForm.height) return;
    const entry: GrowthEntry = {
      id: uid(),
      date: weightForm.date,
      weight: weightForm.weight ? Math.round(Number(weightForm.weight) * 1000) : undefined,
      height: weightForm.height ? Number(weightForm.height) : undefined,
      notes: '',
    };
    addGrowth(entry);
    onRefresh();
    setWeightForm({ weight: '', height: '', date: format(new Date(), 'yyyy-MM-dd') });
    setShowAddWeight(false);
  };

  const profile = data.profile;
  const lastWeight = getLastMeasure(data, 'weight');
  const lastHeight = getLastMeasure(data, 'height');
  const nextVaccine = profile ? getNextVaccine(data) : null;
  const nextAppt = profile ? getNextAppointment(data) : null;

  // Contacts d'urgence : priorité aux données documents, sinon défauts
  const urgencyContacts = data.documents.filter(d => d.category === 'urgence').length > 0
    ? data.documents.filter(d => d.category === 'urgence').slice(0, 4)
    : DEFAULT_EMERGENCY;

  // Poids courant pour Doliprane
  const currentWeightG = lastWeight?.weight ?? profile?.birthWeight ?? 0;
  const doli = currentWeightG > 0 ? calcDoliprane(currentWeightG) : null;

  return (
    <div className="pb-24 fade-in">
      {/* Hero */}
      <div className="bg-gradient-to-br from-pink-400 via-pink-300 to-purple-300 px-5 pt-12 pb-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-pink-100 text-sm font-medium">Mon carnet de santé</p>
            <h1 className="text-3xl font-bold mt-1">
              {profile ? `💕 ${profile.name}` : 'Bébé'}
            </h1>
            {profile && (
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <p className="text-pink-100 text-sm">
                  Née le {format(parseISO(profile.birthDate), 'd MMMM yyyy', { locale: fr })}
                </p>
                {profile.bloodType && (
                  <span className="bg-white/25 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    🩸 {profile.bloodType}
                  </span>
                )}
              </div>
            )}
          </div>
          <button onClick={openEdit} className="bg-white/20 backdrop-blur p-2 rounded-full hover:bg-white/30 transition-colors">
            <Edit2 size={18} />
          </button>
        </div>

        {profile && (
          <div className="mt-5 bg-white/20 backdrop-blur rounded-2xl px-4 py-3">
            <p className="text-xs text-pink-100 uppercase tracking-wide font-medium">Âge</p>
            <p className="text-2xl font-bold mt-0.5">{getAge(profile.birthDate)}</p>
            <p className="text-xs text-pink-100 mt-0.5">
              {differenceInDays(new Date(), parseISO(profile.birthDate))} jours de vie
            </p>
          </div>
        )}
      </div>

      <div className="px-4 -mt-4 space-y-3">
        {/* Quick stats — poids + taille + groupe sanguin */}
        {profile && (
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 text-center">
              <Scale size={18} className="text-pink-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Dernier poids</p>
              <p className="text-sm font-bold text-gray-800">
                {lastWeight?.weight
                  ? `${(lastWeight.weight / 1000).toFixed(2)} kg`
                  : `${(profile.birthWeight / 1000).toFixed(2)} kg`}
              </p>
              <p className="text-xs text-gray-400">
                {lastWeight ? format(parseISO(lastWeight.date), 'd MMM', { locale: fr }) : 'naissance'}
              </p>
            </Card>
            <Card className="p-3 text-center">
              <Ruler size={18} className="text-purple-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Dernière taille</p>
              <p className="text-sm font-bold text-gray-800">
                {lastHeight?.height ? `${lastHeight.height} cm` : `${profile.birthHeight} cm`}
              </p>
              <p className="text-xs text-gray-400">
                {lastHeight ? format(parseISO(lastHeight.date), 'd MMM', { locale: fr }) : 'naissance'}
              </p>
            </Card>
            <Card className="p-3 text-center">
              <Droplet size={18} className="text-red-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Groupe sanguin</p>
              <p className="text-sm font-bold text-gray-800">
                {profile.bloodType || '—'}
              </p>
              <p className="text-xs text-gray-400">profil</p>
            </Card>
          </div>
        )}

        {/* Raccourcis rapides */}
        {profile && (
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setShowAddWeight(true)}
              className="bg-gradient-to-br from-pink-400 to-pink-500 text-white rounded-2xl py-3 px-2 flex flex-col items-center gap-1 active:scale-95 transition-transform">
              <Scale size={20} />
              <span className="text-xs font-semibold">+ Poids</span>
            </button>
            <button
              onClick={() => navigate('/journal?tab=notes', { state: { openAdd: true, type: 'symptom' } })}
              className="bg-gradient-to-br from-orange-400 to-red-400 text-white rounded-2xl py-3 px-2 flex flex-col items-center gap-1 active:scale-95 transition-transform">
              <TrendingUp size={20} />
              <span className="text-xs font-semibold">+ Symptôme</span>
            </button>
            <button
              onClick={() => navigate('/journal?tab=alimentation')}
              className="bg-gradient-to-br from-blue-400 to-cyan-400 text-white rounded-2xl py-3 px-2 flex flex-col items-center gap-1 active:scale-95 transition-transform">
              <Utensils size={20} />
              <span className="text-xs font-semibold">+ Biberon</span>
            </button>
          </div>
        )}

        {/* Next appointment — toujours visible */}
        {profile && (
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Calendar size={20} className="text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium">Prochain rendez-vous</p>
                {nextAppt ? (
                  <>
                    <p className="text-sm font-semibold text-gray-800 truncate">{nextAppt.title}</p>
                    <p className="text-xs text-gray-500">
                      {format(parseISO(nextAppt.date), 'd MMM yyyy', { locale: fr })}
                      {nextAppt.time && ` à ${nextAppt.time}`}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">Aucun RDV prévu</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Next vaccine */}
        {nextVaccine && (
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <Shield size={20} className="text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium">Prochain vaccin</p>
                <p className="text-sm font-semibold text-gray-800 truncate">{nextVaccine.name}</p>
                <p className="text-xs text-gray-500">
                  À {nextVaccine.age} — {format(nextVaccine.dueDate, 'd MMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Calculateur Doliprane */}
        {profile && currentWeightG > 0 && (
          <Card className="p-4" onClick={() => setShowDoliprane(true)}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <Pill size={20} className="text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium">Calculateur Doliprane</p>
                <p className="text-sm font-semibold text-gray-800">
                  {doli ? `${doli.dose} mg par prise` : 'Appuyez pour calculer'}
                </p>
                <p className="text-xs text-gray-500">
                  {doli ? `≈ ${doli.ml} ml (sirop 2,4%)` : ''}
                </p>
              </div>
              <div className="text-gray-300 text-xs">›</div>
            </div>
          </Card>
        )}

        {/* Contacts d'urgence */}
        {profile && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={16} className="text-red-400" />
              <p className="text-sm font-semibold text-gray-700">Contacts d'urgence</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {urgencyContacts.map((contact, i) => (
                <a
                  key={i}
                  href={`tel:${contact.value.replace(/\s/g, '')}`}
                  className="flex items-center gap-2 bg-red-50 rounded-xl px-3 py-2 active:scale-95 transition-transform no-underline"
                >
                  <Phone size={14} className="text-red-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-red-500 truncate">{contact.label}</p>
                    <p className="text-xs text-red-400 font-mono">{contact.value}</p>
                  </div>
                </a>
              ))}
            </div>
          </Card>
        )}

        {/* Checklist progress */}
        {data.checklist.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center">
                <Check size={20} className="text-pink-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Suivi premières semaines</p>
                <p className="text-sm font-semibold text-gray-800">
                  {data.checklist.filter(c => c.done).length} / {data.checklist.length} réalisés
                </p>
              </div>
            </div>
            <div className="w-full bg-pink-50 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-pink-400 to-purple-400 h-2 rounded-full transition-all"
                style={{ width: `${(data.checklist.filter(c => c.done).length / data.checklist.length) * 100}%` }}
              />
            </div>
          </Card>
        )}

        {/* Welcome card when no profile */}
        {!profile && (
          <Card className="p-6 text-center">
            <div className="text-5xl mb-3">👶</div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Bienvenue !</h2>
            <p className="text-sm text-gray-500 mb-4">
              Commencez par renseigner le profil de votre bébé, ou activez la synchronisation si vous avez déjà des données sur un autre appareil.
            </p>
            <button
              onClick={() => setShowEdit(true)}
              className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white px-6 py-2.5 rounded-xl font-medium text-sm mb-2"
            >
              Créer le profil
            </button>
            <p className="text-xs text-gray-400">
              Données déjà existantes ? →{' '}
              <span className="text-pink-400 font-medium">Réglages ⚙️ → Activer la synchronisation</span>
            </p>
          </Card>
        )}
      </div>

      {/* Modal Doliprane */}
      <Modal open={showDoliprane} title="💊 Calculateur Doliprane" onClose={() => setShowDoliprane(false)}>
        {doli && (
          <div className="space-y-4">
            <div className="bg-amber-50 rounded-2xl p-4 text-center">
              <p className="text-xs text-amber-600 font-medium mb-1">Poids actuel</p>
              <p className="text-2xl font-bold text-amber-700">{(currentWeightG / 1000).toFixed(2)} kg</p>
            </div>

            <div className="bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl p-5 text-white text-center">
              <p className="text-sm font-medium text-amber-100 mb-1">Dose par prise (15 mg/kg)</p>
              <p className="text-4xl font-bold">{doli.dose} mg</p>
              <p className="text-amber-100 text-sm mt-1">max {doli.doseMax} mg/jour (4 prises)</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">💧 Sirop 2,4%</p>
                <p className="text-xl font-bold text-gray-800">{doli.ml} ml</p>
                <p className="text-xs text-gray-400">Doliprane nourrissons</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">📦 Sachet 80 mg</p>
                <p className="text-xl font-bold text-gray-800">
                  {doli.sachet80 >= 1 ? Math.round(doli.sachet80) : `½`}
                </p>
                <p className="text-xs text-gray-400">sachet{doli.sachet80 >= 2 ? 's' : ''}</p>
              </Card>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-600 mb-2">ℹ️ Rappels importants</p>
              <p className="text-xs text-gray-500">• Minimum 6h entre chaque prise</p>
              <p className="text-xs text-gray-500">• Maximum 4 prises par 24h</p>
              <p className="text-xs text-gray-500">• Si fièvre &gt; 38°C chez un nourrisson &lt; 3 mois : consultez un médecin</p>
              <p className="text-xs text-gray-500">• Ne pas combiner avec d'autres produits à base de paracétamol</p>
            </div>

            <p className="text-xs text-gray-400 text-center">
              Ces valeurs sont indicatives. Consultez toujours un médecin ou pharmacien.
            </p>
          </div>
        )}
      </Modal>

      {/* Modal ajout rapide poids */}
      <Modal open={showAddWeight} title="⚖️ Ajouter un poids" onClose={() => setShowAddWeight(false)}>
        <FormField label="Date" type="date" value={weightForm.date} onChange={v => setWeightForm(f => ({ ...f, date: v }))} />
        <FormField label="Poids (kg)" type="number" value={weightForm.weight} onChange={v => setWeightForm(f => ({ ...f, weight: v }))} placeholder="5.23" step="0.01" min="0" max="30" />
        <FormField label="Taille (cm)" type="number" value={weightForm.height} onChange={v => setWeightForm(f => ({ ...f, height: v }))} placeholder="56" step="0.1" min="0" max="120" />
        <button
          onClick={handleAddWeight}
          disabled={!weightForm.weight && !weightForm.height}
          className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white py-3 rounded-xl font-semibold disabled:opacity-50 mt-2">
          Enregistrer
        </button>
      </Modal>

      {/* Edit profile modal */}
      <Modal open={showEdit} title="Profil de bébé" onClose={() => setShowEdit(false)}>
        <FormField label="Prénom *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Zoé" required />
        <FormField label="Date de naissance *" type="date" value={form.birthDate} onChange={v => setForm(f => ({ ...f, birthDate: v }))} required />
        <FormField label="Poids à la naissance (g)" type="number" value={form.birthWeight || ''} onChange={v => setForm(f => ({ ...f, birthWeight: Number(v) }))} placeholder="3200" step="1" min="0" />
        <FormField label="Taille à la naissance (cm)" type="number" value={form.birthHeight || ''} onChange={v => setForm(f => ({ ...f, birthHeight: Number(v) }))} placeholder="50" step="0.1" min="0" />
        <FormField label="Périmètre crânien à la naissance (cm)" type="number" value={form.birthHeadCirc || ''} onChange={v => setForm(f => ({ ...f, birthHeadCirc: Number(v) }))} placeholder="34" step="0.1" min="0" />
        <SelectField
          label="Groupe sanguin"
          value={form.bloodType ?? ''}
          onChange={v => setForm(f => ({ ...f, bloodType: v }))}
          options={BLOOD_TYPES.map(t => ({ value: t, label: t || 'Inconnu' }))}
        />
        <button
          onClick={handleSave}
          disabled={!form.name || !form.birthDate}
          className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white py-3 rounded-xl font-semibold disabled:opacity-50 mt-2"
        >
          Enregistrer
        </button>
      </Modal>
    </div>
  );
}
