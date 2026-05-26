import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, Bell, BellOff, Check, X, Trash2, Calendar, ExternalLink } from 'lucide-react';
import type { AppData, Appointment } from '../types';
import { addAppointment, updateAppointment, deleteAppointment, uid } from '../storage';
import { getGCalEmails } from './Settings';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { FormField, SelectField, TextareaField } from '../components/FormField';

interface Props { data: AppData; onRefresh: () => void; }

const emptyForm = (): Omit<Appointment, 'id'> => ({
  title: '', date: format(new Date(), 'yyyy-MM-dd'), time: '', doctor: '',
  location: '', notes: '', status: 'upcoming', reminderSet: false,
});

function StatusBadge({ status }: { status: Appointment['status'] }) {
  const map = {
    upcoming: { label: 'À venir', cls: 'bg-blue-50 text-blue-500' },
    done: { label: 'Effectué', cls: 'bg-green-50 text-green-500' },
    missed: { label: 'Manqué', cls: 'bg-red-50 text-red-500' },
  };
  const { label, cls } = map[status];
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

/** Génère un lien Google Agenda avec les invités pré-remplis */
function buildGCalUrl(form: Omit<Appointment, 'id'>): string {
  const emails = getGCalEmails().filter(Boolean);
  const startDate = form.date.replace(/-/g, '');
  const time = form.time || '09:00';
  const [h, m] = time.split(':').map(Number);
  const endH = String(h + 1).padStart(2, '0');
  const start = `${startDate}T${time.replace(':', '')}00`;
  const end   = `${startDate}T${endH}${String(m).padStart(2, '0')}00`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: form.title,
    dates: `${start}/${end}`,
    details: [form.doctor && `Médecin : ${form.doctor}`, form.notes].filter(Boolean).join('\n'),
    location: form.location,
  });
  emails.forEach(e => params.append('add', e));
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

async function requestNotification(appointment: Appointment) {
  if (!('Notification' in window)) return false;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  const apptDate = new Date(`${appointment.date}T${appointment.time || '09:00'}`);
  const delay = apptDate.getTime() - Date.now() - 86400000;
  if (delay > 0) {
    setTimeout(() => {
      new Notification(`Rappel : ${appointment.title}`, {
        body: `Demain ${appointment.time ? 'à ' + appointment.time : ''} — ${appointment.doctor || appointment.location}`,
        icon: '/icon-192.png',
      });
    }, delay);
  }
  return true;
}

export function Appointments({ data, onRefresh }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [editAppt, setEditAppt] = useState<Appointment | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [filter, setFilter] = useState<'all' | Appointment['status']>('all');

  const gcalEmails = getGCalEmails().filter(Boolean);
  const hasGcalEmails = gcalEmails.length > 0;

  const handleAdd = () => {
    if (!form.title || !form.date) return;
    addAppointment({ ...form, id: uid() } as Appointment);
    onRefresh();
    setForm(emptyForm());
    setShowAdd(false);
  };

  const handleAddAndGcal = () => {
    if (!form.title || !form.date) return;
    addAppointment({ ...form, id: uid() } as Appointment);
    onRefresh();
    window.open(buildGCalUrl(form), '_blank');
    setForm(emptyForm());
    setShowAdd(false);
  };

  const handleEdit = () => {
    if (!editAppt) return;
    updateAppointment({ ...editAppt, ...form });
    onRefresh();
    setEditAppt(null);
  };

  const openEdit = (a: Appointment) => {
    setForm({ title: a.title, date: a.date, time: a.time, doctor: a.doctor, location: a.location, notes: a.notes, status: a.status, reminderSet: a.reminderSet });
    setEditAppt(a);
  };

  const toggleStatus = (a: Appointment, status: Appointment['status']) => {
    updateAppointment({ ...a, status });
    onRefresh();
  };

  const toggleReminder = async (a: Appointment) => {
    const set = await requestNotification(a);
    updateAppointment({ ...a, reminderSet: set || !a.reminderSet });
    onRefresh();
  };

  const filtered = data.appointments
    .filter(a => filter === 'all' || a.status === filter)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="pb-24 fade-in">
      <PageHeader
        title="Rendez-vous"
        subtitle="Pédiatre, spécialistes, examens"
        action={
          <button onClick={() => { setForm(emptyForm()); setShowAdd(true); }} className="bg-gradient-to-r from-pink-400 to-purple-400 text-white p-2.5 rounded-xl">
            <Plus size={20} />
          </button>
        }
      />

      {/* Filter tabs */}
      <div className="px-4 mb-4">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {([['all', 'Tous'], ['upcoming', 'À venir'], ['done', 'Effectués'], ['missed', 'Manqués']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${filter === val ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-500'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-3">
        {filtered.length === 0 && (
          <Card className="p-8 text-center">
            <Calendar size={32} className="text-pink-200 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Aucun rendez-vous</p>
          </Card>
        )}

        {filtered.map(a => (
          <Card key={a.id} className="p-4" onClick={() => openEdit(a)}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={a.status} />
                  {a.reminderSet && <Bell size={12} className="text-amber-400" />}
                </div>
                <p className="font-semibold text-gray-800 truncate">{a.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {format(parseISO(a.date), 'EEEE d MMMM yyyy', { locale: fr })}
                  {a.time && <span className="ml-1">à {a.time}</span>}
                </p>
                {a.doctor && <p className="text-xs text-gray-400 mt-0.5">{a.doctor}</p>}
                {a.location && <p className="text-xs text-gray-400">{a.location}</p>}
              </div>
            </div>

            <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
              {a.status !== 'done' && (
                <button onClick={() => toggleStatus(a, 'done')} className="flex items-center gap-1 text-xs bg-green-50 text-green-500 px-2 py-1 rounded-lg">
                  <Check size={12} /> Effectué
                </button>
              )}
              {a.status !== 'missed' && a.status !== 'done' && (
                <button onClick={() => toggleStatus(a, 'missed')} className="flex items-center gap-1 text-xs bg-red-50 text-red-400 px-2 py-1 rounded-lg">
                  <X size={12} /> Manqué
                </button>
              )}
              {a.status === 'upcoming' && (
                <button onClick={() => toggleReminder(a)} className="flex items-center gap-1 text-xs bg-amber-50 text-amber-500 px-2 py-1 rounded-lg">
                  {a.reminderSet ? <BellOff size={12} /> : <Bell size={12} />}
                  {a.reminderSet ? 'Rappel actif' : 'Rappel'}
                </button>
              )}
              {a.status === 'upcoming' && (
                <button onClick={() => window.open(buildGCalUrl(a), '_blank')} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-400 px-2 py-1 rounded-lg">
                  <Calendar size={12} /> Agenda
                </button>
              )}
              <button onClick={() => { deleteAppointment(a.id); onRefresh(); }} className="ml-auto p-1 text-gray-300 hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal Ajout */}
      <Modal open={showAdd} title="Nouveau rendez-vous" onClose={() => setShowAdd(false)}>
        <FormField label="Titre *" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="Consultation pédiatre" required />
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Date *" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} required />
          <FormField label="Heure" type="time" value={form.time} onChange={v => setForm(f => ({ ...f, time: v }))} />
        </div>
        <FormField label="Médecin / Praticien" value={form.doctor} onChange={v => setForm(f => ({ ...f, doctor: v }))} placeholder="Dr Dupont" />
        <FormField label="Lieu / Adresse" value={form.location} onChange={v => setForm(f => ({ ...f, location: v }))} placeholder="Cabinet médical, 5 rue..." />
        <SelectField label="Statut" value={form.status} onChange={v => setForm(f => ({ ...f, status: v as Appointment['status'] }))} options={[
          { value: 'upcoming', label: 'À venir' },
          { value: 'done', label: 'Effectué' },
          { value: 'missed', label: 'Manqué' },
        ]} />
        <TextareaField label="Notes" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="Ordonnance, questions à poser..." rows={2} />
        <button
          onClick={handleAdd}
          disabled={!form.title || !form.date}
          className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white py-3 rounded-xl font-semibold disabled:opacity-50 mt-2"
        >
          Enregistrer
        </button>
        {hasGcalEmails && (
          <button
            onClick={handleAddAndGcal}
            disabled={!form.title || !form.date}
            className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-500 border border-blue-100 py-3 rounded-xl font-semibold disabled:opacity-50 mt-2"
          >
            <Calendar size={16} />
            Enregistrer + ouvrir dans Google Agenda
            <ExternalLink size={13} />
          </button>
        )}
        {!hasGcalEmails && (
          <p className="text-center text-xs text-gray-400 mt-2">
            💡 Ajoutez des emails dans Réglages pour envoyer des invitations Google Agenda
          </p>
        )}
      </Modal>

      {/* Modal Édition */}
      <Modal open={!!editAppt} title="Modifier le rendez-vous" onClose={() => setEditAppt(null)}>
        <FormField label="Titre *" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="Consultation pédiatre" required />
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Date *" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} required />
          <FormField label="Heure" type="time" value={form.time} onChange={v => setForm(f => ({ ...f, time: v }))} />
        </div>
        <FormField label="Médecin / Praticien" value={form.doctor} onChange={v => setForm(f => ({ ...f, doctor: v }))} placeholder="Dr Dupont" />
        <FormField label="Lieu / Adresse" value={form.location} onChange={v => setForm(f => ({ ...f, location: v }))} placeholder="Cabinet médical, 5 rue..." />
        <SelectField label="Statut" value={form.status} onChange={v => setForm(f => ({ ...f, status: v as Appointment['status'] }))} options={[
          { value: 'upcoming', label: 'À venir' },
          { value: 'done', label: 'Effectué' },
          { value: 'missed', label: 'Manqué' },
        ]} />
        <TextareaField label="Notes" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="Ordonnance, questions à poser..." rows={2} />
        <button
          onClick={handleEdit}
          disabled={!form.title || !form.date}
          className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white py-3 rounded-xl font-semibold disabled:opacity-50 mt-2"
        >
          Enregistrer les modifications
        </button>
        {hasGcalEmails && (
          <button
            onClick={() => window.open(buildGCalUrl(form), '_blank')}
            className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-500 border border-blue-100 py-3 rounded-xl font-semibold mt-2"
          >
            <Calendar size={16} />
            Ouvrir dans Google Agenda
            <ExternalLink size={13} />
          </button>
        )}
      </Modal>
    </div>
  );
}
