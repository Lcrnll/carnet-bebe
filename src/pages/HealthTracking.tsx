import { useState } from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, Trash2, TrendingUp } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import type { AppData, GrowthEntry } from '../types';
import { addGrowth, deleteGrowth, uid } from '../storage';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { FormField, TextareaField } from '../components/FormField';

interface Props { data: AppData; onRefresh: () => void; }

type Tab = 'poids' | 'taille' | 'crâne';

export function HealthTracking({ data, onRefresh }: Props) {
  const [tab, setTab] = useState<Tab>('poids');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ date: format(new Date(), 'yyyy-MM-dd'), weight: '', height: '', headCirc: '', notes: '' });

  const handleAdd = () => {
    const entry: GrowthEntry = {
      id: uid(),
      date: form.date,
      weight: form.weight ? Number(form.weight) : undefined,
      height: form.height ? Number(form.height) : undefined,
      headCirc: form.headCirc ? Number(form.headCirc) : undefined,
      notes: form.notes,
    };
    addGrowth(entry);
    onRefresh();
    setForm({ date: format(new Date(), 'yyyy-MM-dd'), weight: '', height: '', headCirc: '', notes: '' });
    setShowAdd(false);
  };

  const sorted = [...data.growth].sort((a, b) => a.date.localeCompare(b.date));

  const chartData = sorted.map(g => {
    const bd = data.profile?.birthDate;
    const label = bd
      ? `J+${differenceInDays(parseISO(g.date), parseISO(bd))}`
      : format(parseISO(g.date), 'dd/MM');
    return {
      name: label,
      poids: g.weight ? +(g.weight / 1000).toFixed(3) : undefined,
      taille: g.height,
      crâne: g.headCirc,
    };
  });

  const tabs: Tab[] = ['poids', 'taille', 'crâne'];
  const colors = { poids: '#f472b6', taille: '#a855f7', crâne: '#60a5fa' };
  const units = { poids: 'kg', taille: 'cm', crâne: 'cm' };

  const latest = sorted[sorted.length - 1];

  return (
    <div className="pb-24 fade-in">
      <PageHeader
        title="Croissance"
        subtitle="Poids, taille et périmètre crânien"
        action={
          <button
            onClick={() => setShowAdd(true)}
            className="bg-gradient-to-r from-pink-400 to-purple-400 text-white p-2.5 rounded-xl"
          >
            <Plus size={20} />
          </button>
        }
      />

      {/* Last values */}
      {latest && (
        <div className="px-4 mb-4">
          <div className="grid grid-cols-3 gap-2">
            {latest.weight && (
              <Card className="p-3 text-center bg-pink-50 border-pink-100">
                <p className="text-xs text-pink-400 font-medium">Poids</p>
                <p className="text-base font-bold text-pink-600">{(latest.weight / 1000).toFixed(2)} kg</p>
                <p className="text-xs text-gray-400">{format(parseISO(latest.date), 'd MMM', { locale: fr })}</p>
              </Card>
            )}
            {latest.height && (
              <Card className="p-3 text-center bg-purple-50 border-purple-100">
                <p className="text-xs text-purple-400 font-medium">Taille</p>
                <p className="text-base font-bold text-purple-600">{latest.height} cm</p>
                <p className="text-xs text-gray-400">{format(parseISO(latest.date), 'd MMM', { locale: fr })}</p>
              </Card>
            )}
            {latest.headCirc && (
              <Card className="p-3 text-center bg-blue-50 border-blue-100">
                <p className="text-xs text-blue-400 font-medium">Crâne</p>
                <p className="text-base font-bold text-blue-600">{latest.headCirc} cm</p>
                <p className="text-xs text-gray-400">{format(parseISO(latest.date), 'd MMM', { locale: fr })}</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="px-4 mb-4">
          <Card className="p-4">
            {/* Tab selector */}
            <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl">
              {tabs.map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all capitalize ${
                    tab === t ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(v) => [`${v} ${units[tab]}`, tab]}
                />
                <Line
                  type="monotone"
                  dataKey={tab}
                  stroke={colors[tab]}
                  strokeWidth={2.5}
                  dot={{ fill: colors[tab], strokeWidth: 0, r: 4 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* History */}
      <div className="px-4 space-y-2">
        <p className="text-sm font-semibold text-gray-600 mb-2">Historique</p>
        {sorted.length === 0 && (
          <Card className="p-8 text-center">
            <TrendingUp size={32} className="text-pink-200 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Aucune mesure enregistrée</p>
            <button onClick={() => setShowAdd(true)} className="mt-3 text-pink-400 text-sm font-medium">
              + Ajouter une mesure
            </button>
          </Card>
        )}
        {[...sorted].reverse().map(entry => (
          <Card key={entry.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">
                  {format(parseISO(entry.date), 'EEEE d MMMM yyyy', { locale: fr })}
                </p>
                <div className="flex gap-3 mt-1 flex-wrap">
                  {entry.weight && <span className="text-xs bg-pink-50 text-pink-500 px-2 py-0.5 rounded-full font-medium">{(entry.weight / 1000).toFixed(2)} kg</span>}
                  {entry.height && <span className="text-xs bg-purple-50 text-purple-500 px-2 py-0.5 rounded-full font-medium">{entry.height} cm</span>}
                  {entry.headCirc && <span className="text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full font-medium">PC {entry.headCirc} cm</span>}
                </div>
                {entry.notes && <p className="text-xs text-gray-400 mt-1">{entry.notes}</p>}
              </div>
              <button
                onClick={() => { deleteGrowth(entry.id); onRefresh(); }}
                className="p-1.5 rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors ml-2"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={showAdd} title="Nouvelle mesure" onClose={() => setShowAdd(false)}>
        <FormField label="Date" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
        <FormField label="Poids (g)" type="number" value={form.weight} onChange={v => setForm(f => ({ ...f, weight: v }))} placeholder="3500" step="1" min="0" />
        <FormField label="Taille (cm)" type="number" value={form.height} onChange={v => setForm(f => ({ ...f, height: v }))} placeholder="50" step="0.1" min="0" />
        <FormField label="Périmètre crânien (cm)" type="number" value={form.headCirc} onChange={v => setForm(f => ({ ...f, headCirc: v }))} placeholder="34" step="0.1" min="0" />
        <TextareaField label="Notes" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="Ex : visite pédiatre, bonne forme..." rows={2} />
        <button
          onClick={handleAdd}
          disabled={!form.date}
          className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
        >
          Enregistrer
        </button>
      </Modal>
    </div>
  );
}
