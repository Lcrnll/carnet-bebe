import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, Search, Thermometer, FileText, Trash2, X } from 'lucide-react';
import type { AppData, NoteEntry } from '../types';
import { addNote, deleteNote, uid } from '../storage';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { FormField, TextareaField } from '../components/FormField';

interface Props { data: AppData; onRefresh: () => void; }

const SYMPTOMS = ['Fièvre', 'Toux', 'Rhume', 'Pleurs excessifs', 'Régurgitations', 'Diarrhée', 'Constipation', 'Éruption cutanée', 'Perte d\'appétit', 'Agitation', 'Somnolence excessive'];
const MOODS = ['Calme', 'Souriant', 'Agité', 'Grognon', 'Fatigué'];
const SLEEP = ['Très bonne nuit', 'Bonne nuit', 'Nuit agitée', 'Nuit difficile'];
const FEEDING = ['Allaitement', 'Biberon', 'Mixte', 'Diversification'];

export function Notes({ data, onRefresh }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'note' | 'symptom'>('all');
  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'note' as 'note' | 'symptom',
    content: '',
    temperature: '',
    symptoms: [] as string[],
    sleep: '',
    feeding: '',
    mood: '',
  });

  const toggleSymptom = (s: string) => {
    setForm(f => ({
      ...f,
      symptoms: f.symptoms.includes(s) ? f.symptoms.filter(x => x !== s) : [...f.symptoms, s],
    }));
  };

  const handleAdd = () => {
    if (!form.content && form.symptoms.length === 0) return;
    const entry: NoteEntry = {
      id: uid(),
      date: form.date,
      type: form.type,
      content: form.content,
      temperature: form.temperature ? Number(form.temperature) : undefined,
      symptoms: form.symptoms,
      sleep: form.sleep || undefined,
      feeding: form.feeding || undefined,
      mood: form.mood || undefined,
    };
    addNote(entry);
    onRefresh();
    setForm({ date: format(new Date(), 'yyyy-MM-dd'), type: 'note', content: '', temperature: '', symptoms: [], sleep: '', feeding: '', mood: '' });
    setShowAdd(false);
  };

  const filtered = data.notes.filter(n => {
    const matchType = typeFilter === 'all' || n.type === typeFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || n.content.toLowerCase().includes(q) || n.symptoms.some(s => s.toLowerCase().includes(q));
    return matchType && matchSearch;
  });

  return (
    <div className="pb-24 fade-in">
      <PageHeader
        title="Journal & Symptômes"
        subtitle="Notes quotidiennes et observations"
        action={
          <button onClick={() => setShowAdd(true)} className="bg-gradient-to-r from-pink-400 to-purple-400 text-white p-2.5 rounded-xl">
            <Plus size={20} />
          </button>
        }
      />

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-pink-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="px-4 mb-4">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {([['all', 'Tout'], ['note', 'Notes'], ['symptom', 'Symptômes']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setTypeFilter(val)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${typeFilter === val ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-500'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes list */}
      <div className="px-4 space-y-3">
        {filtered.length === 0 && (
          <Card className="p-8 text-center">
            <FileText size={32} className="text-pink-200 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Aucune note</p>
          </Card>
        )}

        {filtered.map(note => (
          <Card key={note.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${note.type === 'symptom' ? 'bg-red-50 text-red-400' : 'bg-blue-50 text-blue-400'}`}>
                    {note.type === 'symptom' ? '🌡️ Symptôme' : '📝 Note'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {format(parseISO(note.date), 'EEEE d MMMM', { locale: fr })}
                  </span>
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
                    {note.symptoms.map(s => (
                      <span key={s} className="text-xs bg-orange-50 text-orange-400 px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                )}

                <div className="flex gap-3 mt-2 flex-wrap">
                  {note.mood && <span className="text-xs text-gray-400">😊 {note.mood}</span>}
                  {note.sleep && <span className="text-xs text-gray-400">😴 {note.sleep}</span>}
                  {note.feeding && <span className="text-xs text-gray-400">🍼 {note.feeding}</span>}
                </div>
              </div>

              <button onClick={() => { deleteNote(note.id); onRefresh(); }} className="p-1 text-gray-200 hover:text-red-400 transition-colors ml-2">
                <Trash2 size={14} />
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={showAdd} title="Nouvelle entrée" onClose={() => setShowAdd(false)}>
        <div className="flex gap-2 mb-4">
          {(['note', 'symptom'] as const).map(t => (
            <button
              key={t}
              onClick={() => setForm(f => ({ ...f, type: t }))}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all border ${
                form.type === t ? 'bg-pink-50 text-pink-500 border-pink-200' : 'bg-white text-gray-400 border-gray-100'
              }`}
            >
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
                  <button
                    key={s}
                    onClick={() => toggleSymptom(s)}
                    className={`text-xs px-2.5 py-1.5 rounded-full border transition-all ${
                      form.symptoms.includes(s) ? 'bg-orange-50 text-orange-500 border-orange-200' : 'bg-gray-50 text-gray-500 border-gray-100'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <FormField label="Température (°C)" type="number" value={form.temperature} onChange={v => setForm(f => ({ ...f, temperature: v }))} placeholder="37.5" step="0.1" min="35" />
          </>
        )}

        <TextareaField label="Note" value={form.content} onChange={v => setForm(f => ({ ...f, content: v }))} placeholder="Observations, comportement, remarques..." rows={3} />

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Humeur</label>
            <select value={form.mood} onChange={e => setForm(f => ({ ...f, mood: e.target.value }))} className="w-full text-xs px-2 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-300">
              <option value="">—</option>
              {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sommeil</label>
            <select value={form.sleep} onChange={e => setForm(f => ({ ...f, sleep: e.target.value }))} className="w-full text-xs px-2 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-300">
              <option value="">—</option>
              {SLEEP.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Alimentation</label>
            <select value={form.feeding} onChange={e => setForm(f => ({ ...f, feeding: e.target.value }))} className="w-full text-xs px-2 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-300">
              <option value="">—</option>
              {FEEDING.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        <button onClick={handleAdd} disabled={!form.content && form.symptoms.length === 0} className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white py-3 rounded-xl font-semibold disabled:opacity-50 mt-2">
          Enregistrer
        </button>
      </Modal>
    </div>
  );
}
