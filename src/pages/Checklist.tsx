import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, CheckSquare, Square, Trash2 } from 'lucide-react';
import type { AppData, ChecklistItem } from '../types';
import { updateChecklistItem, addChecklistItem, deleteChecklistItem, uid } from '../storage';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { FormField, SelectField, TextareaField } from '../components/FormField';

interface Props { data: AppData; onRefresh: () => void; }

const categoryLabels: Record<ChecklistItem['category'], string> = {
  medecin: '👩‍⚕️ Médecin',
  examen: '🔬 Examen',
  administratif: '📋 Administratif',
  personnalise: '✏️ Personnalisé',
};

const categoryColors: Record<ChecklistItem['category'], string> = {
  medecin: 'bg-blue-50 text-blue-500',
  examen: 'bg-purple-50 text-purple-500',
  administratif: 'bg-amber-50 text-amber-500',
  personnalise: 'bg-pink-50 text-pink-500',
};

export function Checklist({ data, onRefresh }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ label: '', description: '', scheduledAge: '', category: 'personnalise' as ChecklistItem['category'] });
  const [filter, setFilter] = useState<'all' | 'done' | 'pending'>('all');

  const handleAdd = () => {
    if (!form.label) return;
    addChecklistItem({ id: uid(), ...form, done: false });
    onRefresh();
    setForm({ label: '', description: '', scheduledAge: '', category: 'personnalise' });
    setShowAdd(false);
  };

  const toggle = (item: ChecklistItem) => {
    updateChecklistItem({
      ...item,
      done: !item.done,
      doneDate: !item.done ? format(new Date(), 'yyyy-MM-dd') : undefined,
    });
    onRefresh();
  };

  const doneCount = data.checklist.filter(c => c.done).length;
  const total = data.checklist.length;

  const filtered = data.checklist.filter(item => {
    if (filter === 'done') return item.done;
    if (filter === 'pending') return !item.done;
    return true;
  });

  const grouped: Record<string, ChecklistItem[]> = filtered.reduce((acc, item) => {
    const key = item.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  return (
    <div className="pb-24 fade-in">
      <PageHeader
        title="Suivi premières semaines"
        subtitle="Examens et démarches essentiels"
        action={
          <button onClick={() => setShowAdd(true)} className="bg-gradient-to-r from-pink-400 to-purple-400 text-white p-2.5 rounded-xl">
            <Plus size={20} />
          </button>
        }
      />

      {/* Progress */}
      <div className="px-4 mb-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-gray-700">Avancement global</p>
              <p className="text-xs text-gray-400">{doneCount} sur {total} éléments réalisés</p>
            </div>
            <div className="text-2xl font-bold text-pink-500">
              {total > 0 ? Math.round((doneCount / total) * 100) : 0}%
            </div>
          </div>
          <div className="w-full bg-pink-50 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-pink-400 to-purple-400 h-2.5 rounded-full transition-all"
              style={{ width: `${total > 0 ? (doneCount / total) * 100 : 0}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Filter */}
      <div className="px-4 mb-4">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {([['all', 'Tous'], ['pending', 'À faire'], ['done', 'Réalisés']] as const).map(([val, label]) => (
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

      <div className="px-4 space-y-4">
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat}>
            <p className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mb-2 ${categoryColors[cat as ChecklistItem['category']]}`}>
              {categoryLabels[cat as ChecklistItem['category']]}
            </p>
            <div className="space-y-2">
              {items.map(item => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <button onClick={() => toggle(item)} className="mt-0.5 flex-shrink-0">
                      {item.done
                        ? <CheckSquare size={22} className="text-pink-400" />
                        : <Square size={22} className="text-gray-300" />
                      }
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${item.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                        {item.label}
                      </p>
                      {item.scheduledAge && (
                        <span className="text-xs bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded-full mr-1">{item.scheduledAge}</span>
                      )}
                      {item.description && (
                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{item.description}</p>
                      )}
                      {item.done && item.doneDate && (
                        <p className="text-xs text-green-500 mt-1">
                          ✓ Réalisé le {format(new Date(item.doneDate), 'd MMMM yyyy', { locale: fr })}
                        </p>
                      )}
                    </div>
                    {item.category === 'personnalise' && (
                      <button onClick={() => { deleteChecklistItem(item.id); onRefresh(); }} className="p-1 text-gray-200 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal open={showAdd} title="Ajouter un élément" onClose={() => setShowAdd(false)}>
        <FormField label="Titre *" value={form.label} onChange={v => setForm(f => ({ ...f, label: v }))} placeholder="Ex : Visite chez l'ostéopathe" required />
        <TextareaField label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="Informations complémentaires..." rows={2} />
        <FormField label="Âge prévu" value={form.scheduledAge} onChange={v => setForm(f => ({ ...f, scheduledAge: v }))} placeholder="Ex : 1 mois" />
        <SelectField label="Catégorie" value={form.category} onChange={v => setForm(f => ({ ...f, category: v as ChecklistItem['category'] }))} options={[
          { value: 'medecin', label: '👩‍⚕️ Médecin' },
          { value: 'examen', label: '🔬 Examen' },
          { value: 'administratif', label: '📋 Administratif' },
          { value: 'personnalise', label: '✏️ Personnalisé' },
        ]} />
        <button onClick={handleAdd} disabled={!form.label} className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white py-3 rounded-xl font-semibold disabled:opacity-50 mt-2">
          Ajouter
        </button>
      </Modal>
    </div>
  );
}
