import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Plus, Search, Thermometer, FileText, Trash2, X,
  Moon, Sun, Utensils, Star, Clock, Droplets,
} from 'lucide-react';
import type { AppData, NoteEntry, SleepEntry, FeedingEntry, MilestoneEntry } from '../types';
import { addNote, deleteNote, addSleep, deleteSleep, addFeeding, deleteFeeding, addMilestone, deleteMilestone, uid } from '../storage';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { FormField, TextareaField } from '../components/FormField';

interface Props { data: AppData; onRefresh: () => void; }

type Tab = 'notes' | 'sommeil' | 'alimentation' | 'jalons';

// ─── CONSTANTES ─────────────────────────────────────────────────────────────

const SYMPTOMS = ['Fièvre', 'Toux', 'Rhume', 'Pleurs excessifs', 'Régurgitations', 'Diarrhée', 'Constipation', 'Éruption cutanée', 'Perte d\'appétit', 'Agitation', 'Somnolence excessive'];
const MOODS = ['Calme', 'Souriant', 'Agité', 'Grognon', 'Fatigué'];

const FEEDING_TYPES: { value: FeedingEntry['type']; label: string; emoji: string }[] = [
  { value: 'sein_gauche', label: 'Sein gauche', emoji: '🤱' },
  { value: 'sein_droit',  label: 'Sein droit',  emoji: '🤱' },
  { value: 'sein_deux',   label: 'Sein (les deux)', emoji: '🤱' },
  { value: 'biberon',     label: 'Biberon',     emoji: '🍼' },
  { value: 'mixte',       label: 'Mixte',       emoji: '🍼' },
  { value: 'solide',      label: 'Diversification', emoji: '🥣' },
];

const MILESTONE_EMOJIS = [
  '😀', '😴', '🍼', '👶', '🎉', '💪', '🦷', '🚶', '🗣️',
  '👁️', '🤲', '❤️', '🌟', '🎂', '📸', '🐣', '🌈', '🏆',
  '👣', '🎵', '🧸', '🌸', '🍎', '🚗', '📚', '🛁', '🌙',
];

const now = () => format(new Date(), 'HH:mm');
const today = () => format(new Date(), 'yyyy-MM-dd');

function calcDuration(start: string, end?: string): number | undefined {
  if (!end) return undefined;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60; // nuit qui passe minuit
  return mins;
}

function fmtDuration(mins?: number) {
  if (!mins) return '–';
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h${mins % 60 > 0 ? String(mins % 60).padStart(2, '0') : ''}`;
}

// ─── TAB BAR ────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'notes',        label: 'Notes',     icon: <FileText size={15} /> },
  { id: 'sommeil',      label: 'Sommeil',   icon: <Moon size={15} /> },
  { id: 'alimentation', label: 'Biberon',   icon: <Utensils size={15} /> },
  { id: 'jalons',       label: 'Jalons',    icon: <Star size={15} /> },
];

// ─── COMPOSANT PRINCIPAL ────────────────────────────────────────────────────

export function Journal({ data, onRefresh }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'notes');

  // Sync URL → tab au chargement et quand l'URL change
  useEffect(() => {
    const t = searchParams.get('tab') as Tab;
    if (t && t !== tab) setTab(t);
  }, [searchParams]);

  const changeTab = (t: Tab) => {
    setTab(t);
    setSearchParams({ tab: t }, { replace: true });
  };

  return (
    <div className="pb-24 fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-400 via-pink-300 to-pink-400 px-5 pt-12 pb-6 text-white">
        <p className="text-purple-100 text-sm font-medium">Journal de bébé</p>
        <h1 className="text-3xl font-bold mt-1">📓 Journal</h1>
        <p className="text-purple-100 text-sm mt-1">Notes · Sommeil · Alimentation · Jalons</p>
      </div>

      {/* Tab bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-pink-50 px-4 py-2 -mt-1">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => changeTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                tab === t.id
                  ? 'bg-white text-pink-500 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        {tab === 'notes'        && <NotesTab        data={data} onRefresh={onRefresh} />}
        {tab === 'sommeil'      && <SommeilTab      data={data} onRefresh={onRefresh} />}
        {tab === 'alimentation' && <AlimentationTab data={data} onRefresh={onRefresh} />}
        {tab === 'jalons'       && <JalonsTab       data={data} onRefresh={onRefresh} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB : NOTES
// ═══════════════════════════════════════════════════════════════════════════

function NotesTab({ data, onRefresh }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'note' | 'symptom'>('all');
  const [form, setForm] = useState({
    date: today(),
    type: 'note' as 'note' | 'symptom',
    content: '',
    temperature: '',
    symptoms: [] as string[],
    mood: '',
  });

  const toggleSymptom = (s: string) =>
    setForm(f => ({ ...f, symptoms: f.symptoms.includes(s) ? f.symptoms.filter(x => x !== s) : [...f.symptoms, s] }));

  const handleAdd = () => {
    if (!form.content && form.symptoms.length === 0) return;
    const entry: NoteEntry = {
      id: uid(), date: form.date, type: form.type, content: form.content,
      temperature: form.temperature ? Number(form.temperature) : undefined,
      symptoms: form.symptoms, mood: form.mood || undefined,
    };
    addNote(entry);
    onRefresh();
    setForm({ date: today(), type: 'note', content: '', temperature: '', symptoms: [], mood: '' });
    setShowAdd(false);
  };

  const filtered = data.notes.filter(n => {
    const matchType = typeFilter === 'all' || n.type === typeFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || n.content.toLowerCase().includes(q) || n.symptoms.some(s => s.toLowerCase().includes(q));
    return matchType && matchSearch;
  });

  return (
    <div className="px-4 space-y-3">
      {/* Search + add */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…"
            className="w-full pl-9 pr-8 py-2.5 bg-white border border-pink-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={14} /></button>}
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-gradient-to-r from-pink-400 to-purple-400 text-white p-2.5 rounded-xl flex-shrink-0">
          <Plus size={20} />
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {([['all', 'Tout'], ['note', '📝 Notes'], ['symptom', '🌡️ Symptômes']] as const).map(([val, label]) => (
          <button key={val} onClick={() => setTypeFilter(val)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${typeFilter === val ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-500'}`}>
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="p-8 text-center">
          <FileText size={32} className="text-pink-200 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Aucune note pour l'instant</p>
          <button onClick={() => setShowAdd(true)} className="mt-3 text-pink-400 text-sm font-medium">+ Ajouter une note</button>
        </Card>
      )}

      {filtered.map(note => (
        <Card key={note.id} className="p-4 scale-in">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${note.type === 'symptom' ? 'bg-red-50 text-red-400' : 'bg-blue-50 text-blue-400'}`}>
                  {note.type === 'symptom' ? '🌡️ Symptôme' : '📝 Note'}
                </span>
                <span className="text-xs text-gray-400">{format(parseISO(note.date), 'EEEE d MMMM', { locale: fr })}</span>
              </div>
              {note.content && <p className="text-sm text-gray-700 leading-relaxed">{note.content}</p>}
              {note.temperature && (
                <div className="flex items-center gap-1 mt-1.5">
                  <Thermometer size={12} className="text-red-400" />
                  <span className="text-xs font-semibold text-red-500">{note.temperature}°C</span>
                  {note.temperature >= 38 && <span className="text-xs bg-red-50 text-red-400 px-1.5 py-0.5 rounded-full">Fièvre</span>}
                </div>
              )}
              {note.symptoms.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {note.symptoms.map(s => <span key={s} className="text-xs bg-orange-50 text-orange-400 px-2 py-0.5 rounded-full">{s}</span>)}
                </div>
              )}
              {note.mood && <p className="text-xs text-gray-400 mt-1.5">😊 {note.mood}</p>}
            </div>
            <button onClick={() => { deleteNote(note.id); onRefresh(); }} className="p-1 text-gray-200 hover:text-red-400 transition-colors ml-2">
              <Trash2 size={14} />
            </button>
          </div>
        </Card>
      ))}

      <Modal open={showAdd} title="Nouvelle note" onClose={() => setShowAdd(false)}>
        <div className="flex gap-2 mb-4">
          {(['note', 'symptom'] as const).map(t => (
            <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all border ${form.type === t ? 'bg-pink-50 text-pink-500 border-pink-200' : 'bg-white text-gray-400 border-gray-100'}`}>
              {t === 'note' ? '📝 Note' : '🌡️ Symptôme'}
            </button>
          ))}
        </div>
        <FormField label="Date" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
        {form.type === 'symptom' && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Symptômes</label>
              <div className="flex flex-wrap gap-2">
                {SYMPTOMS.map(s => (
                  <button key={s} onClick={() => toggleSymptom(s)}
                    className={`text-xs px-2.5 py-1.5 rounded-full border transition-all ${form.symptoms.includes(s) ? 'bg-orange-50 text-orange-500 border-orange-200' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <FormField label="Température (°C)" type="number" value={form.temperature} onChange={v => setForm(f => ({ ...f, temperature: v }))} placeholder="37.5" step="0.1" min="35" max="43" />
          </>
        )}
        <TextareaField label="Note" value={form.content} onChange={v => setForm(f => ({ ...f, content: v }))} placeholder="Observations, comportement, remarques…" rows={3} />
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Humeur</label>
          <div className="flex flex-wrap gap-2">
            {MOODS.map(m => (
              <button key={m} onClick={() => setForm(f => ({ ...f, mood: f.mood === m ? '' : m }))}
                className={`text-xs px-2.5 py-1.5 rounded-full border transition-all ${form.mood === m ? 'bg-pink-50 text-pink-500 border-pink-200' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                {m}
              </button>
            ))}
          </div>
        </div>
        <button onClick={handleAdd} disabled={!form.content && form.symptoms.length === 0}
          className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white py-3 rounded-xl font-semibold disabled:opacity-50 mt-2">
          Enregistrer
        </button>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB : SOMMEIL
// ═══════════════════════════════════════════════════════════════════════════

function SommeilTab({ data, onRefresh }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    date: today(),
    startTime: now(),
    endTime: '',
    type: 'nuit' as SleepEntry['type'],
    quality: '' as SleepEntry['quality'] | '',
    notes: '',
  });

  const handleAdd = () => {
    if (!form.startTime) return;
    const duration = calcDuration(form.startTime, form.endTime || undefined);
    const entry: SleepEntry = {
      id: uid(), date: form.date, startTime: form.startTime,
      endTime: form.endTime || undefined, duration,
      type: form.type,
      quality: (form.quality as SleepEntry['quality']) || undefined,
      notes: form.notes || undefined,
    };
    addSleep(entry);
    onRefresh();
    setForm({ date: today(), startTime: now(), endTime: '', type: 'nuit', quality: '', notes: '' });
    setShowAdd(false);
  };

  // Stats: total sommeil aujourd'hui
  const todayStr = today();
  const totalMins = data.sleep
    .filter(s => s.date === todayStr)
    .reduce((acc, s) => acc + (s.duration ?? 0), 0);

  const sorted = [...data.sleep].sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));

  const qualityColor = (q?: SleepEntry['quality']) =>
    q === 'bonne' ? 'text-green-500 bg-green-50' : q === 'moyenne' ? 'text-orange-500 bg-orange-50' : q === 'mauvaise' ? 'text-red-500 bg-red-50' : 'text-gray-400 bg-gray-50';
  const qualityLabel = (q?: SleepEntry['quality']) =>
    q === 'bonne' ? '😊 Bonne' : q === 'moyenne' ? '😐 Moyenne' : q === 'mauvaise' ? '😮‍💨 Difficile' : '–';

  return (
    <div className="px-4 space-y-3">
      {/* Stats du jour */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3 text-center">
          <Moon size={18} className="text-purple-400 mx-auto mb-1" />
          <p className="text-xs text-gray-500">Sommeil aujourd'hui</p>
          <p className="text-sm font-bold text-gray-800">{fmtDuration(totalMins)}</p>
        </Card>
        <Card className="p-3 text-center">
          <Sun size={18} className="text-yellow-400 mx-auto mb-1" />
          <p className="text-xs text-gray-500">Siestes</p>
          <p className="text-sm font-bold text-gray-800">
            {data.sleep.filter(s => s.date === todayStr && s.type === 'sieste').length}
          </p>
        </Card>
      </div>

      {/* Bouton ajouter */}
      <button onClick={() => setShowAdd(true)}
        className="w-full bg-gradient-to-r from-purple-400 to-pink-400 text-white py-3 rounded-2xl font-semibold flex items-center justify-center gap-2">
        <Plus size={18} /> Enregistrer un sommeil
      </button>

      {sorted.length === 0 && (
        <Card className="p-8 text-center">
          <Moon size={32} className="text-purple-200 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Aucun enregistrement de sommeil</p>
        </Card>
      )}

      {sorted.map(entry => (
        <Card key={entry.id} className="p-4 scale-in">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${entry.type === 'nuit' ? 'bg-purple-50 text-purple-500' : 'bg-yellow-50 text-yellow-600'}`}>
                  {entry.type === 'nuit' ? '🌙 Nuit' : '☀️ Sieste'}
                </span>
                <span className="text-xs text-gray-400">{format(parseISO(entry.date), 'EEE d MMM', { locale: fr })}</span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1">
                  <Clock size={12} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{entry.startTime}</span>
                  {entry.endTime && <>
                    <span className="text-gray-300">→</span>
                    <span className="text-sm font-medium text-gray-700">{entry.endTime}</span>
                  </>}
                </div>
                <span className="text-sm font-bold text-purple-500">{fmtDuration(entry.duration)}</span>
              </div>
              {entry.quality && (
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1.5 font-medium ${qualityColor(entry.quality)}`}>
                  {qualityLabel(entry.quality)}
                </span>
              )}
              {entry.notes && <p className="text-xs text-gray-400 mt-1">{entry.notes}</p>}
            </div>
            <button onClick={() => { deleteSleep(entry.id); onRefresh(); }} className="p-1 text-gray-200 hover:text-red-400 transition-colors ml-2">
              <Trash2 size={14} />
            </button>
          </div>
        </Card>
      ))}

      <Modal open={showAdd} title="Enregistrer un sommeil" onClose={() => setShowAdd(false)}>
        <div className="flex gap-2 mb-4">
          {(['nuit', 'sieste'] as const).map(t => (
            <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${form.type === t ? 'bg-purple-50 text-purple-500 border-purple-200' : 'bg-white text-gray-400 border-gray-100'}`}>
              {t === 'nuit' ? '🌙 Nuit' : '☀️ Sieste'}
            </button>
          ))}
        </div>
        <FormField label="Date" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Heure de début" type="time" value={form.startTime} onChange={v => setForm(f => ({ ...f, startTime: v }))} />
          <FormField label="Heure de fin" type="time" value={form.endTime} onChange={v => setForm(f => ({ ...f, endTime: v }))} />
        </div>
        {form.startTime && form.endTime && (
          <div className="bg-purple-50 rounded-xl p-3 mb-4 text-center">
            <p className="text-sm text-purple-600 font-medium">
              Durée : <strong>{fmtDuration(calcDuration(form.startTime, form.endTime))}</strong>
            </p>
          </div>
        )}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Qualité du sommeil</label>
          <div className="flex gap-2">
            {(['bonne', 'moyenne', 'mauvaise'] as const).map(q => (
              <button key={q} onClick={() => setForm(f => ({ ...f, quality: f.quality === q ? '' : q }))}
                className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${form.quality === q
                  ? q === 'bonne' ? 'bg-green-50 text-green-500 border-green-200'
                    : q === 'moyenne' ? 'bg-orange-50 text-orange-500 border-orange-200'
                    : 'bg-red-50 text-red-500 border-red-200'
                  : 'bg-white text-gray-400 border-gray-100'}`}>
                {q === 'bonne' ? '😊 Bonne' : q === 'moyenne' ? '😐 Moyenne' : '😮‍💨 Difficile'}
              </button>
            ))}
          </div>
        </div>
        <TextareaField label="Notes" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="Agitation, réveil, observations…" rows={2} />
        <button onClick={handleAdd} disabled={!form.startTime}
          className="w-full bg-gradient-to-r from-purple-400 to-pink-400 text-white py-3 rounded-xl font-semibold disabled:opacity-50 mt-2">
          Enregistrer
        </button>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB : ALIMENTATION
// ═══════════════════════════════════════════════════════════════════════════

function AlimentationTab({ data, onRefresh }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    date: today(),
    time: now(),
    type: 'biberon' as FeedingEntry['type'],
    duration: '',
    quantity: '',
    food: '',
    notes: '',
  });

  const handleAdd = () => {
    const entry: FeedingEntry = {
      id: uid(), date: form.date, time: form.time, type: form.type,
      duration: form.duration ? Number(form.duration) : undefined,
      quantity: form.quantity ? Number(form.quantity) : undefined,
      food: form.food || undefined,
      notes: form.notes || undefined,
    };
    addFeeding(entry);
    onRefresh();
    setForm({ date: today(), time: now(), type: 'biberon', duration: '', quantity: '', food: '', notes: '' });
    setShowAdd(false);
  };

  const todayStr = today();
  const todayFeeds = data.feeding.filter(f => f.date === todayStr);
  const totalMlToday = todayFeeds.filter(f => f.quantity).reduce((acc, f) => acc + (f.quantity ?? 0), 0);
  const totalMinsToday = todayFeeds.filter(f => f.duration).reduce((acc, f) => acc + (f.duration ?? 0), 0);

  const sorted = [...data.feeding].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  const typeInfo = (t: FeedingEntry['type']) => FEEDING_TYPES.find(x => x.value === t) ?? FEEDING_TYPES[3];

  return (
    <div className="px-4 space-y-3">
      {/* Stats du jour */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3 text-center">
          <Utensils size={16} className="text-blue-400 mx-auto mb-1" />
          <p className="text-xs text-gray-500">Tétées/bib.</p>
          <p className="text-sm font-bold text-gray-800">{todayFeeds.length}</p>
        </Card>
        <Card className="p-3 text-center">
          <Droplets size={16} className="text-cyan-400 mx-auto mb-1" />
          <p className="text-xs text-gray-500">Total (ml)</p>
          <p className="text-sm font-bold text-gray-800">{totalMlToday > 0 ? `${totalMlToday} ml` : '–'}</p>
        </Card>
        <Card className="p-3 text-center">
          <Clock size={16} className="text-purple-400 mx-auto mb-1" />
          <p className="text-xs text-gray-500">Durée</p>
          <p className="text-sm font-bold text-gray-800">{totalMinsToday > 0 ? fmtDuration(totalMinsToday) : '–'}</p>
        </Card>
      </div>

      {/* Bouton ajouter */}
      <button onClick={() => setShowAdd(true)}
        className="w-full bg-gradient-to-r from-blue-400 to-cyan-400 text-white py-3 rounded-2xl font-semibold flex items-center justify-center gap-2">
        <Plus size={18} /> Enregistrer une prise
      </button>

      {sorted.length === 0 && (
        <Card className="p-8 text-center">
          <Utensils size={32} className="text-blue-200 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Aucun enregistrement d'alimentation</p>
        </Card>
      )}

      {sorted.map(entry => {
        const info = typeInfo(entry.type);
        return (
          <Card key={entry.id} className="p-4 scale-in">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{info.emoji}</span>
                  <span className="text-sm font-semibold text-gray-800">{info.label}</span>
                  <span className="text-xs text-gray-400 ml-auto">{entry.time}</span>
                </div>
                <p className="text-xs text-gray-400">{format(parseISO(entry.date), 'EEEE d MMMM', { locale: fr })}</p>
                <div className="flex gap-3 mt-1.5 flex-wrap">
                  {entry.quantity && <span className="text-xs bg-cyan-50 text-cyan-600 px-2 py-0.5 rounded-full font-medium">💧 {entry.quantity} ml</span>}
                  {entry.duration && <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">⏱ {fmtDuration(entry.duration)}</span>}
                  {entry.food && <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">🥄 {entry.food}</span>}
                </div>
                {entry.notes && <p className="text-xs text-gray-400 mt-1">{entry.notes}</p>}
              </div>
              <button onClick={() => { deleteFeeding(entry.id); onRefresh(); }} className="p-1 text-gray-200 hover:text-red-400 transition-colors ml-2">
                <Trash2 size={14} />
              </button>
            </div>
          </Card>
        );
      })}

      <Modal open={showAdd} title="Enregistrer une prise" onClose={() => setShowAdd(false)}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <div className="grid grid-cols-3 gap-2">
            {FEEDING_TYPES.map(t => (
              <button key={t.value} onClick={() => setForm(f => ({ ...f, type: t.value }))}
                className={`py-2.5 px-2 rounded-xl text-xs font-medium border transition-all text-center ${
                  form.type === t.value ? 'bg-blue-50 text-blue-500 border-blue-200' : 'bg-white text-gray-400 border-gray-100'}`}>
                <div className="text-base mb-0.5">{t.emoji}</div>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Date" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
          <FormField label="Heure" type="time" value={form.time} onChange={v => setForm(f => ({ ...f, time: v }))} />
        </div>
        {['sein_gauche', 'sein_droit', 'sein_deux', 'mixte'].includes(form.type) && (
          <FormField label="Durée (minutes)" type="number" value={form.duration} onChange={v => setForm(f => ({ ...f, duration: v }))} placeholder="15" min="1" max="60" />
        )}
        {['biberon', 'mixte'].includes(form.type) && (
          <FormField label="Quantité (ml)" type="number" value={form.quantity} onChange={v => setForm(f => ({ ...f, quantity: v }))} placeholder="120" min="10" max="400" step="5" />
        )}
        {form.type === 'solide' && (
          <FormField label="Aliment(s)" value={form.food} onChange={v => setForm(f => ({ ...f, food: v }))} placeholder="Purée carottes, compote…" />
        )}
        <TextareaField label="Notes" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="Appétit, comportement…" rows={2} />
        <button onClick={handleAdd}
          className="w-full bg-gradient-to-r from-blue-400 to-cyan-400 text-white py-3 rounded-xl font-semibold mt-2">
          Enregistrer
        </button>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB : JALONS
// ═══════════════════════════════════════════════════════════════════════════

function JalonsTab({ data, onRefresh }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ date: today(), emoji: '⭐', title: '', notes: '' });

  const handleAdd = () => {
    if (!form.title) return;
    const entry: MilestoneEntry = { id: uid(), date: form.date, emoji: form.emoji, title: form.title, notes: form.notes || undefined };
    addMilestone(entry);
    onRefresh();
    setForm({ date: today(), emoji: '⭐', title: '', notes: '' });
    setShowAdd(false);
  };

  const sorted = [...data.milestones].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="px-4 space-y-3">
      <button onClick={() => setShowAdd(true)}
        className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white py-3 rounded-2xl font-semibold flex items-center justify-center gap-2">
        <Plus size={18} /> Nouveau jalon
      </button>

      {sorted.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-5xl mb-3">⭐</div>
          <p className="text-gray-700 font-medium mb-1">Aucun jalon enregistré</p>
          <p className="text-gray-400 text-sm">Notez les premières fois et les moments importants de bébé !</p>
          <button onClick={() => setShowAdd(true)} className="mt-3 text-yellow-500 text-sm font-medium">+ Premier jalon</button>
        </Card>
      )}

      <div className="space-y-2">
        {sorted.map(entry => (
          <Card key={entry.id} className="p-4 scale-in">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                {entry.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{entry.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {format(parseISO(entry.date), 'd MMMM yyyy', { locale: fr })}
                </p>
                {entry.notes && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{entry.notes}</p>}
              </div>
              <button onClick={() => { deleteMilestone(entry.id); onRefresh(); }} className="p-1 text-gray-200 hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={showAdd} title="Nouveau jalon" onClose={() => setShowAdd(false)}>
        <FormField label="Date" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Emoji</label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
            {MILESTONE_EMOJIS.map(e => (
              <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                className={`text-2xl w-10 h-10 flex items-center justify-center rounded-xl border-2 transition-all ${
                  form.emoji === e ? 'border-yellow-400 bg-yellow-50' : 'border-transparent hover:bg-gray-50'}`}>
                {e}
              </button>
            ))}
          </div>
        </div>

        <FormField label="Titre *" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="Premier sourire, a tenu sa tête…" required />
        <TextareaField label="Notes" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="Détails, contexte, émotion…" rows={3} />

        <button onClick={handleAdd} disabled={!form.title}
          className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white py-3 rounded-xl font-semibold disabled:opacity-50 mt-2">
          Enregistrer ce jalon 🌟
        </button>
      </Modal>
    </div>
  );
}
