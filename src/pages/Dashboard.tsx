import { useState } from 'react';
import { differenceInWeeks, differenceInMonths, format, parseISO, addMonths, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Scale, Ruler, Calendar, Shield, Edit2, Check } from 'lucide-react';
import type { AppData, BabyProfile } from '../types';
import { saveProfile } from '../storage';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { FormField, SelectField } from '../components/FormField';

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

export function Dashboard({ data, onRefresh }: Props) {
  const [showEdit, setShowEdit] = useState(!data.profile);
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

  const profile = data.profile;
  const lastWeight = getLastMeasure(data, 'weight');
  const lastHeight = getLastMeasure(data, 'height');
  const nextVaccine = profile ? getNextVaccine(data) : null;
  const nextAppt = profile ? getNextAppointment(data) : null;

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
        {/* Quick stats — poids + taille */}
        {profile && (
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3 text-center">
              <Scale size={20} className="text-pink-400 mx-auto mb-1" />
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
              <Ruler size={20} className="text-purple-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Dernière taille</p>
              <p className="text-sm font-bold text-gray-800">
                {lastHeight?.height ? `${lastHeight.height} cm` : `${profile.birthHeight} cm`}
              </p>
              <p className="text-xs text-gray-400">
                {lastHeight ? format(parseISO(lastHeight.date), 'd MMM', { locale: fr }) : 'naissance'}
              </p>
            </Card>
          </div>
        )}

        {/* Next appointment */}
        {nextAppt && (
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Calendar size={20} className="text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium">Prochain rendez-vous</p>
                <p className="text-sm font-semibold text-gray-800 truncate">{nextAppt.title}</p>
                <p className="text-xs text-gray-500">
                  {format(parseISO(nextAppt.date), 'd MMM yyyy', { locale: fr })}
                  {nextAppt.time && ` à ${nextAppt.time}`}
                </p>
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
