import { useState } from 'react';
import { differenceInWeeks, differenceInMonths, format, parseISO, differenceInDays } from 'date-fns';
import { Edit2, Droplets, Utensils, Sparkles } from 'lucide-react';
import type { AppData, BabyProfile, FeedingEntry, NoteEntry } from '../types';
import { saveProfile, addFeeding, addNote, uid } from '../storage';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { FormField, SelectField, TextareaField } from '../components/FormField';

interface Props { data: AppData; onRefresh: () => void; }

const BLOOD_TYPES = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

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

const today = () => format(new Date(), 'yyyy-MM-dd');
const nowTime = () => format(new Date(), 'HH:mm');

export function Dashboard({ data, onRefresh }: Props) {
  const [showEdit, setShowEdit] = useState(!data.profile);
  const [showAddBottle, setShowAddBottle] = useState(false);
  const [showMoment, setShowMoment] = useState(false);
  const [bottleForm, setBottleForm] = useState({ time: nowTime(), quantity: '' });
  const [momentForm, setMomentForm] = useState({ content: '' });

  const [form, setForm] = useState<BabyProfile>(data.profile || {
    name: '', birthDate: '', birthWeight: 0, birthHeight: 0, birthHeadCirc: 0, bloodType: '',
  });

  const profile = data.profile;

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

  const handleAddBottle = () => {
    if (!bottleForm.quantity) return;
    const entry: FeedingEntry = {
      id: uid(), date: today(), time: bottleForm.time, type: 'biberon',
      quantity: Number(bottleForm.quantity),
    };
    addFeeding(entry);
    onRefresh();
    setBottleForm({ time: nowTime(), quantity: '' });
    setShowAddBottle(false);
  };

  const handleAddMoment = () => {
    if (!momentForm.content) return;
    const entry: NoteEntry = { id: uid(), date: today(), type: 'note', content: momentForm.content, symptoms: [] };
    addNote(entry);
    onRefresh();
    setMomentForm({ content: '' });
    setShowMoment(false);
  };

  const todayStr = today();
  const todayBottles = data.feeding.filter(f => f.date === todayStr && (f.type === 'biberon' || f.type === 'mixte') && f.quantity);
  const totalMlToday = todayBottles.reduce((acc, f) => acc + (f.quantity ?? 0), 0);
  const momentsToday = data.notes.filter(n => n.date === todayStr && n.type === 'note').length;

  return (
    <div className="pb-24 fade-in min-h-svh flex flex-col">
      {/* Hero */}
      <div className="bg-gradient-to-br from-pink-400 via-pink-300 to-purple-300 px-5 pt-10 pb-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-pink-100 text-sm font-medium">Mon carnet de santé</p>
            <h1 className="text-2xl font-bold mt-1">
              {profile ? `💕 ${profile.name}` : 'Bébé'}
            </h1>
            {profile && (
              <p className="text-pink-100 text-sm mt-0.5">
                {getAge(profile.birthDate)} · {differenceInDays(new Date(), parseISO(profile.birthDate))} jours de vie
              </p>
            )}
          </div>
          <button onClick={openEdit} className="bg-white/20 backdrop-blur p-2 rounded-full hover:bg-white/30 transition-colors">
            <Edit2 size={18} />
          </button>
        </div>
      </div>

      {profile && (
        <div className="px-4 -mt-3 space-y-3 flex-1">
          {/* Biberons du jour */}
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-cyan-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Droplets size={22} className="text-cyan-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-medium">Biberons aujourd'hui</p>
                <p className="text-xl font-bold text-gray-800">
                  {totalMlToday > 0 ? `${totalMlToday} ml` : '–'}
                  {todayBottles.length > 0 && <span className="text-sm text-gray-400 font-normal ml-1.5">· {todayBottles.length} prise{todayBottles.length > 1 ? 's' : ''}</span>}
                </p>
              </div>
            </div>
          </Card>

          {/* Raccourcis */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowAddBottle(true)}
              className="bg-gradient-to-br from-blue-400 to-cyan-400 text-white rounded-2xl py-5 px-3 flex flex-col items-center gap-1.5 active:scale-95 transition-transform">
              <Utensils size={24} />
              <span className="text-sm font-semibold">+ Biberon</span>
            </button>
            <button
              onClick={() => setShowMoment(true)}
              className="bg-gradient-to-br from-amber-400 to-orange-400 text-white rounded-2xl py-5 px-3 flex flex-col items-center gap-1.5 active:scale-95 transition-transform">
              <Sparkles size={24} />
              <span className="text-sm font-semibold">Moment particulier</span>
              {momentsToday > 0 && <span className="text-xs text-amber-100">{momentsToday} aujourd'hui</span>}
            </button>
          </div>
        </div>
      )}

      {/* Welcome card when no profile */}
      {!profile && (
        <div className="px-4 -mt-3">
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
        </div>
      )}

      {/* Modal ajout rapide biberon */}
      <Modal open={showAddBottle} title="🍼 Ajouter une prise" onClose={() => setShowAddBottle(false)}>
        <FormField label="Heure" type="time" value={bottleForm.time} onChange={v => setBottleForm(f => ({ ...f, time: v }))} />
        <FormField label="Quantité (ml)" type="number" value={bottleForm.quantity} onChange={v => setBottleForm(f => ({ ...f, quantity: v }))} placeholder="120" min="10" max="400" step="5" />
        <button
          onClick={handleAddBottle}
          disabled={!bottleForm.quantity}
          className="w-full bg-gradient-to-r from-blue-400 to-cyan-400 text-white py-3 rounded-xl font-semibold disabled:opacity-50 mt-2">
          Enregistrer
        </button>
      </Modal>

      {/* Modal moment particulier */}
      <Modal open={showMoment} title="✨ Moment particulier" onClose={() => setShowMoment(false)}>
        <TextareaField
          label="Que s'est-il passé ?"
          value={momentForm.content}
          onChange={v => setMomentForm({ content: v })}
          placeholder="Ex : a beaucoup pleuré avant le coucher, a bien dormi après le bain…"
          rows={4}
        />
        <p className="text-xs text-gray-400 -mt-2 mb-3">Enregistré dans le Journal, onglet Moments.</p>
        <button
          onClick={handleAddMoment}
          disabled={!momentForm.content}
          className="w-full bg-gradient-to-r from-amber-400 to-orange-400 text-white py-3 rounded-xl font-semibold disabled:opacity-50">
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
