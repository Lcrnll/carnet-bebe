import { useState } from 'react';
import { format, parseISO, addMonths, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Shield, ShieldCheck, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { AppData, Vaccine } from '../types';
import { updateVaccine } from '../storage';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { FormField, TextareaField } from '../components/FormField';

interface Props { data: AppData; onRefresh: () => void; }

function groupByAge(vaccines: Vaccine[]): Record<string, Vaccine[]> {
  return vaccines.reduce((acc, v) => {
    if (!acc[v.scheduledAge]) acc[v.scheduledAge] = [];
    acc[v.scheduledAge].push(v);
    return acc;
  }, {} as Record<string, Vaccine[]>);
}

function isUpcoming(vaccine: Vaccine, birthDate: string | undefined): boolean {
  if (!birthDate || vaccine.done) return false;
  const bd = parseISO(birthDate);
  const due = addMonths(bd, vaccine.scheduledAgeMonths);
  const soon = new Date(); soon.setMonth(soon.getMonth() + 2);
  return isBefore(due, soon);
}

export function Vaccines({ data, onRefresh }: Props) {
  const [selected, setSelected] = useState<Vaccine | null>(null);
  const [doneForm, setDoneForm] = useState({ date: format(new Date(), 'yyyy-MM-dd'), batch: '', notes: '' });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (age: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(age)) next.delete(age); else next.add(age);
      return next;
    });
  };

  const markDone = () => {
    if (!selected) return;
    updateVaccine({ ...selected, done: true, doneDate: doneForm.date, batchNumber: doneForm.batch, notes: doneForm.notes });
    onRefresh();
    setSelected(null);
  };

  const markUndone = (v: Vaccine) => {
    updateVaccine({ ...v, done: false, doneDate: undefined, batchNumber: undefined });
    onRefresh();
  };

  const groups = groupByAge(data.vaccines);
  const ages = Object.keys(groups).sort((a, b) => {
    const ma = groups[a][0].scheduledAgeMonths;
    const mb = groups[b][0].scheduledAgeMonths;
    return ma - mb;
  });

  const doneCount = data.vaccines.filter(v => v.done).length;
  const totalCount = data.vaccines.length;

  return (
    <div className="pb-24 fade-in">
      <PageHeader title="Vaccins" subtitle="Calendrier vaccinal français" />

      {/* Progress */}
      <div className="px-4 mb-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-700">Progression</p>
            <p className="text-sm font-bold text-pink-500">{doneCount}/{totalCount}</p>
          </div>
          <div className="w-full bg-pink-50 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-pink-400 to-purple-400 h-2.5 rounded-full transition-all"
              style={{ width: `${(doneCount / totalCount) * 100}%` }}
            />
          </div>
          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-green-400" /> {doneCount} effectué{doneCount > 1 ? 's' : ''}</span>
            <span className="flex items-center gap-1"><Shield size={12} className="text-gray-300" /> {totalCount - doneCount} restant{totalCount - doneCount > 1 ? 's' : ''}</span>
          </div>
        </Card>
      </div>

      {/* Groups by age */}
      <div className="px-4 space-y-2">
        {ages.map(age => {
          const vaccines = groups[age];
          const allDone = vaccines.every(v => v.done);
          const someUpcoming = vaccines.some(v => isUpcoming(v, data.profile?.birthDate));
          const isOpen = expanded.has(age);

          return (
            <Card key={age} className="overflow-hidden">
              <button
                onClick={() => toggle(age)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${allDone ? 'bg-green-50' : someUpcoming ? 'bg-amber-50' : 'bg-gray-50'}`}>
                  {allDone
                    ? <ShieldCheck size={18} className="text-green-400" />
                    : someUpcoming
                      ? <AlertCircle size={18} className="text-amber-400" />
                      : <Shield size={18} className="text-gray-300" />
                  }
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{age}</p>
                  <p className="text-xs text-gray-400">
                    {vaccines.filter(v => v.done).length}/{vaccines.length} vaccin{vaccines.length > 1 ? 's' : ''}
                    {someUpcoming && <span className="text-amber-400 ml-2">● À venir</span>}
                  </p>
                </div>
                {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>

              {isOpen && (
                <div className="border-t border-gray-50 divide-y divide-gray-50">
                  {vaccines.map(v => (
                    <div key={v.id} className="px-4 py-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-semibold ${v.done ? 'text-green-600' : 'text-gray-800'}`}>{v.name}</p>
                            {v.done && <span className="text-xs bg-green-50 text-green-500 px-1.5 py-0.5 rounded-full">✓ Fait</span>}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{v.diseases.join(', ')}</p>
                          {v.done && v.doneDate && (
                            <p className="text-xs text-green-500 mt-1">
                              {format(parseISO(v.doneDate), 'd MMM yyyy', { locale: fr })}
                              {v.batchNumber && <span className="ml-2 text-gray-400">Lot : {v.batchNumber}</span>}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            if (v.done) {
                              markUndone(v);
                            } else {
                              setSelected(v);
                              setDoneForm({ date: format(new Date(), 'yyyy-MM-dd'), batch: '', notes: '' });
                            }
                          }}
                          className={`ml-2 flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            v.done ? 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-400' : 'bg-pink-50 text-pink-500 hover:bg-pink-100'
                          }`}
                        >
                          {v.done ? 'Annuler' : 'Marquer fait'}
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

      <Modal open={!!selected} title={`Vaccin effectué — ${selected?.name}`} onClose={() => setSelected(null)}>
        <p className="text-sm text-gray-500 mb-4">{selected?.diseases.join(', ')}</p>
        <FormField label="Date de vaccination" type="date" value={doneForm.date} onChange={v => setDoneForm(f => ({ ...f, date: v }))} />
        <FormField label="Numéro de lot" value={doneForm.batch} onChange={v => setDoneForm(f => ({ ...f, batch: v }))} placeholder="Ex : B23ABC456" />
        <TextareaField label="Notes / Réactions" value={doneForm.notes} onChange={v => setDoneForm(f => ({ ...f, notes: v }))} placeholder="Rougeur au point d'injection, fièvre légère..." rows={2} />
        <button onClick={markDone} className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white py-3 rounded-xl font-semibold mt-2">
          Confirmer
        </button>
      </Modal>
    </div>
  );
}
