import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Eye, Footprints, Hand, Smile, MessageCircle, Utensils, Check, ChevronDown, ChevronUp, Info } from 'lucide-react';
import type { AppData, DevelopmentMilestone, DevelopmentCategory } from '../types';
import { updateDevelopmentMilestone } from '../storage';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { FormField, TextareaField } from '../components/FormField';

interface Props { data: AppData; onRefresh: () => void; }

const CATEGORY_INFO: Record<DevelopmentCategory, { label: string; icon: React.ReactNode; color: string }> = {
  vision:             { label: 'Vision',                       icon: <Eye size={18} />,           color: 'blue' },
  motricite_globale:  { label: 'Motricité globale',            icon: <Footprints size={18} />,    color: 'purple' },
  motricite_fine:     { label: 'Motricité fine',                icon: <Hand size={18} />,          color: 'pink' },
  dents:              { label: 'Dents',                         icon: <Smile size={18} />,         color: 'amber' },
  langage:            { label: 'Langage',                       icon: <MessageCircle size={18} />, color: 'green' },
  alimentation:       { label: 'Diversification alimentaire',   icon: <Utensils size={18} />,      color: 'cyan' },
};

const CATEGORY_ORDER: DevelopmentCategory[] = ['vision', 'motricite_globale', 'motricite_fine', 'dents', 'langage', 'alimentation'];

const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-500',   border: 'border-blue-100' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-500', border: 'border-purple-100' },
  pink:   { bg: 'bg-pink-50',   text: 'text-pink-500',   border: 'border-pink-100' },
  amber:  { bg: 'bg-amber-50',  text: 'text-amber-500',  border: 'border-amber-100' },
  green:  { bg: 'bg-green-50',  text: 'text-green-500',  border: 'border-green-100' },
  cyan:   { bg: 'bg-cyan-50',   text: 'text-cyan-500',   border: 'border-cyan-100' },
};

function formatRange(m: DevelopmentMilestone): string {
  const [min, max] = m.ageRangeMonths;
  if (min === max) return `${min} mois`;
  return `${min}-${max} mois`;
}

export function Development({ data, onRefresh }: Props) {
  const [expanded, setExpanded] = useState<Set<DevelopmentCategory>>(new Set(CATEGORY_ORDER.slice(0, 1)));
  const [editing, setEditing] = useState<DevelopmentMilestone | null>(null);
  const [form, setForm] = useState({ date: format(new Date(), 'yyyy-MM-dd'), notes: '' });

  const toggleCategory = (c: DevelopmentCategory) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c); else next.add(c);
      return next;
    });
  };

  const openToggle = (m: DevelopmentMilestone) => {
    if (m.achieved) {
      updateDevelopmentMilestone({ ...m, achieved: false, achievedDate: undefined });
      onRefresh();
    } else {
      setForm({ date: format(new Date(), 'yyyy-MM-dd'), notes: m.notes ?? '' });
      setEditing(m);
    }
  };

  const confirmAchieved = () => {
    if (!editing) return;
    updateDevelopmentMilestone({ ...editing, achieved: true, achievedDate: form.date, notes: form.notes || undefined });
    onRefresh();
    setEditing(null);
  };

  const list = data.development ?? [];
  const doneCount = list.filter(m => m.achieved).length;
  const total = list.length;

  const byCategory = (c: DevelopmentCategory) => list.filter(m => m.category === c);

  return (
    <div className="pb-24 fade-in">
      <PageHeader title="Développement" subtitle="Étapes motrices, sensorielles et langagières" />

      <div className="px-4 mb-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-700">Étapes franchies</p>
            <p className="text-sm font-bold text-pink-500">{doneCount}/{total}</p>
          </div>
          <div className="w-full bg-pink-50 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-pink-400 to-purple-400 h-2.5 rounded-full transition-all"
              style={{ width: total ? `${(doneCount / total) * 100}%` : '0%' }}
            />
          </div>
          <div className="flex items-start gap-2 mt-3 bg-gray-50 rounded-xl p-3">
            <Info size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-500 leading-relaxed">
              Les âges indiqués sont des repères issus de l'OMS, du CDC, de l'Académie américaine d'ophtalmologie et de Santé publique France — pas une norme. Chaque bébé se développe à son propre rythme.
            </p>
          </div>
        </Card>
      </div>

      <div className="px-4 space-y-2">
        {CATEGORY_ORDER.map(cat => {
          const items = byCategory(cat);
          if (items.length === 0) return null;
          const info = CATEGORY_INFO[cat];
          const colors = colorClasses[info.color];
          const catDone = items.filter(m => m.achieved).length;
          const isOpen = expanded.has(cat);

          return (
            <Card key={cat} className="overflow-hidden">
              <button onClick={() => toggleCategory(cat)} className="w-full flex items-center gap-3 p-4 text-left">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.bg} ${colors.text}`}>
                  {info.icon}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{info.label}</p>
                  <p className="text-xs text-gray-400">{catDone}/{items.length} étape{items.length > 1 ? 's' : ''}</p>
                </div>
                {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>

              {isOpen && (
                <div className="border-t border-gray-50 divide-y divide-gray-50">
                  {items.map(m => (
                    <div key={m.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-sm font-semibold ${m.achieved ? 'text-green-600' : 'text-gray-800'}`}>{m.title}</p>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>{formatRange(m)}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{m.description}</p>
                          <p className="text-xs text-gray-400 mt-1 italic">Source : {m.source}</p>
                          {m.achieved && m.achievedDate && (
                            <p className="text-xs text-green-500 mt-1.5">
                              ✓ Atteint le {format(parseISO(m.achievedDate), 'd MMMM yyyy', { locale: fr })}
                            </p>
                          )}
                          {m.achieved && m.notes && <p className="text-xs text-gray-500 mt-1">{m.notes}</p>}
                        </div>
                        <button
                          onClick={() => openToggle(m)}
                          className={`flex-shrink-0 p-2 rounded-xl transition-colors ${m.achieved ? 'bg-green-50 text-green-500' : 'bg-gray-50 text-gray-300 hover:text-pink-400 hover:bg-pink-50'}`}
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 fade-in" onClick={() => setEditing(null)} />
          <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto slide-up">
            <div className="px-5 pt-5 pb-3">
              <h2 className="text-lg font-semibold text-gray-800">{editing.title}</h2>
              <p className="text-sm text-gray-400 mt-0.5">Marquer cette étape comme atteinte</p>
            </div>
            <div className="px-5 pb-8">
              <FormField label="Date" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
              <TextareaField label="Notes (optionnel)" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="Contexte, détails..." rows={2} />
              <button onClick={confirmAchieved} className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white py-3 rounded-xl font-semibold mt-2">
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
