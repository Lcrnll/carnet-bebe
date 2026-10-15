import { useMemo, useState } from 'react';
import { format, parseISO, differenceInCalendarDays, differenceInMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, Search, X, Trash2, Carrot, CalendarDays, Lightbulb, TriangleAlert } from 'lucide-react';
import type { AppData, FoodTrial, FoodCategory, FoodLiking, FoodAmount, FoodTexture } from '../types';
import { addFoodTrial, updateFoodTrial, deleteFoodTrial, uid } from '../storage';
import { FOOD_CATALOG, FOOD_CATEGORIES, ALLERGENS, type CatalogFood } from '../data/foods';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { FormField, TextareaField } from '../components/FormField';

interface Props { data: AppData; onRefresh: () => void; }

// ─── CONSTANTES ─────────────────────────────────────────────────────────────

const LIKINGS: { value: FoodLiking; emoji: string; label: string; selected: string }[] = [
  { value: 'adore',  emoji: '😍', label: 'Adoré',    selected: 'bg-green-500/10 text-green-600 border-green-500/40' },
  { value: 'aime',   emoji: '🙂', label: 'Aimé',     selected: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/40' },
  { value: 'mitige', emoji: '😐', label: 'Mitigé',   selected: 'bg-amber-500/10 text-amber-600 border-amber-500/40' },
  { value: 'refuse', emoji: '😖', label: 'Pas aimé', selected: 'bg-orange-500/10 text-orange-600 border-orange-500/40' },
];

const AMOUNTS: { value: FoodAmount; label: string }[] = [
  { value: 'gout',      label: 'Juste goûté' },
  { value: 'cuilleres', label: 'Quelques cuillères' },
  { value: 'moitie',    label: 'La moitié' },
  { value: 'tout',      label: 'Tout mangé' },
];

const TEXTURES: { value: FoodTexture; label: string }[] = [
  { value: 'lisse',    label: 'Purée lisse' },
  { value: 'ecrase',   label: 'Écrasé' },
  { value: 'morceaux', label: 'Morceaux' },
];

type StatusFilter = 'all' | 'a_decouvrir' | 'aimes' | 'mitiges' | 'refuses' | 'reactions';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all',         label: 'Tous' },
  { value: 'a_decouvrir', label: 'À découvrir' },
  { value: 'aimes',       label: '😍 Aimés' },
  { value: 'mitiges',     label: '😐 Mitigés' },
  { value: 'refuses',     label: '😖 Pas aimés' },
  { value: 'reactions',   label: '⚠️ Réactions' },
];

const CATALOG_IDS = new Set(FOOD_CATALOG.map(f => f.id));

interface FoodStatus {
  trials: FoodTrial[]; // du plus récent au plus ancien
  first: FoodTrial;
  last: FoodTrial;
  liking?: FoodLiking;
  reaction: boolean;
}

interface TrialForm {
  food: CatalogFood | null;
  date: string;
  amount: FoodAmount | '';
  grams: string;
  texture: FoodTexture | '';
  liking: FoodLiking | '';
  reaction: boolean;
  notes: string;
}

const today = () => format(new Date(), 'yyyy-MM-dd');

const emptyForm = (food: CatalogFood | null = null): TrialForm => ({
  food, date: today(), amount: '', grams: '', texture: '', liking: '', reaction: false, notes: '',
});

const byNewest = (a: FoodTrial, b: FoodTrial) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id);

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const likingInfo = (l?: FoodLiking) => LIKINGS.find(x => x.value === l);

function matchesStatus(s: FoodStatus | undefined, filter: StatusFilter) {
  switch (filter) {
    case 'all':         return true;
    case 'a_decouvrir': return !s;
    case 'aimes':       return s?.liking === 'adore' || s?.liking === 'aime';
    case 'mitiges':     return s?.liking === 'mitige';
    case 'refuses':     return s?.liking === 'refuse';
    case 'reactions':   return !!s?.reaction;
  }
}

function tileStyle(s?: FoodStatus) {
  if (!s) return 'bg-white border-dashed border-gray-200';
  if (s.reaction) return 'bg-red-500/10 border-red-500/40';
  switch (s.liking) {
    case 'adore':
    case 'aime':   return 'bg-green-500/10 border-green-500/40';
    case 'mitige': return 'bg-amber-500/10 border-amber-500/40';
    case 'refuse': return 'bg-orange-500/10 border-orange-500/40';
    default:       return 'bg-sky-500/10 border-sky-500/30';
  }
}

function relDate(d: string) {
  const n = differenceInCalendarDays(new Date(), parseISO(d));
  if (n === 0) return "aujourd'hui";
  if (n === 1) return 'hier';
  if (n > 1 && n < 7) return `il y a ${n} jours`;
  return format(parseISO(d), 'd MMM', { locale: fr });
}

function amountLabel(t: FoodTrial) {
  const parts = [AMOUNTS.find(a => a.value === t.amount)?.label, t.grams ? `${t.grams} g` : undefined].filter(Boolean);
  return parts.join(' · ');
}

const chip = (active: boolean) =>
  `text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-all ${
    active ? 'bg-green-500/10 text-green-600 border-green-500/40 font-semibold' : 'bg-white text-gray-500 border-gray-100'}`;

// ─── COMPOSANT ──────────────────────────────────────────────────────────────

export function DiversificationTab({ data, onRefresh }: Props) {
  const [view, setView] = useState<'aliments' | 'historique'>('aliments');
  const [category, setCategory] = useState<FoodCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FoodTrial | null>(null);
  const [form, setForm] = useState<TrialForm>(emptyForm());
  const [pickerSearch, setPickerSearch] = useState('');

  const babyName = data.profile?.name || 'Bébé';
  const birthDate = data.profile?.birthDate;
  const ageAt = (d: string) => {
    if (!birthDate) return null;
    const m = differenceInMonths(parseISO(d), parseISO(birthDate));
    return m >= 0 ? `${m} mois` : null;
  };

  const trials = useMemo(() => [...(data.diversification ?? [])].sort(byNewest), [data.diversification]);

  const statusById = useMemo(() => {
    const groups = new Map<string, FoodTrial[]>();
    trials.forEach(t => groups.set(t.foodId, [...(groups.get(t.foodId) ?? []), t]));
    const m = new Map<string, FoodStatus>();
    groups.forEach((ts, id) => m.set(id, {
      trials: ts,
      first: ts[ts.length - 1],
      last: ts[0],
      liking: ts.find(t => t.liking)?.liking,
      reaction: ts.some(t => t.reaction),
    }));
    return m;
  }, [trials]);

  const allFoods = useMemo(() => {
    const custom = new Map<string, CatalogFood>();
    trials.forEach(t => {
      if (!CATALOG_IDS.has(t.foodId) && !custom.has(t.foodId)) {
        custom.set(t.foodId, { id: t.foodId, name: t.foodName, emoji: t.foodEmoji, category: t.category });
      }
    });
    return [...FOOD_CATALOG, ...custom.values()];
  }, [trials]);

  const foodById = (id: string) => allFoods.find(f => f.id === id);

  // ── Stats ──
  const statuses = [...statusById.values()];
  const triedCount = statuses.length;
  const triedCatalog = FOOD_CATALOG.filter(f => statusById.has(f.id)).length;
  const countWhere = (filter: StatusFilter) => statuses.filter(s => matchesStatus(s, filter)).length;
  const newThisWeek = statuses.filter(s => differenceInCalendarDays(new Date(), parseISO(s.first.date)) < 7).length;
  const startTrial = trials[trials.length - 1];
  const lastTrial = trials[0];
  const introducedAllergens = new Set(allFoods.filter(f => f.allergen && statusById.has(f.id)).map(f => f.allergen));
  const reactionAllergens = new Set(allFoods.filter(f => f.allergen && statusById.get(f.id)?.reaction).map(f => f.allergen));
  const toRetry = allFoods.filter(f => {
    const s = statusById.get(f.id);
    return s && !s.reaction && (s.liking === 'refuse' || s.liking === 'mitige');
  });
  const firstTrialIds = new Set(statuses.map(s => s.first.id));

  // ── Actions ──
  const openNew = (food: CatalogFood | null = null) => {
    setEditing(null);
    setForm(emptyForm(food));
    setPickerSearch('');
    setDetailId(null);
    setFormOpen(true);
  };

  const openEdit = (t: FoodTrial) => {
    setEditing(t);
    setForm({
      food: foodById(t.foodId) ?? { id: t.foodId, name: t.foodName, emoji: t.foodEmoji, category: t.category },
      date: t.date,
      amount: t.amount ?? '',
      grams: t.grams ? String(t.grams) : '',
      texture: t.texture ?? '',
      liking: t.liking ?? '',
      reaction: !!t.reaction,
      notes: t.notes ?? '',
    });
    setPickerSearch('');
    setDetailId(null);
    setFormOpen(true);
  };

  const closeForm = () => { setFormOpen(false); setEditing(null); };

  const save = () => {
    if (!form.food) return;
    const entry: FoodTrial = {
      id: editing?.id ?? uid(),
      date: form.date,
      foodId: form.food.id,
      foodName: form.food.name,
      foodEmoji: form.food.emoji,
      category: form.food.category,
      amount: form.amount || undefined,
      grams: form.grams ? Number(form.grams) : undefined,
      texture: form.texture || undefined,
      liking: form.liking || undefined,
      reaction: form.reaction || undefined,
      notes: form.notes.trim() || undefined,
    };
    if (editing) updateFoodTrial(entry); else addFoodTrial(entry);
    onRefresh();
    closeForm();
  };

  const remove = () => {
    if (!editing) return;
    deleteFoodTrial(editing.id);
    onRefresh();
    closeForm();
  };

  const onFoodTap = (food: CatalogFood) => {
    if (statusById.has(food.id)) setDetailId(food.id);
    else openNew(food);
  };

  // ── Filtrage de la grille ──
  const q = normalize(search);
  const visibleFoods = allFoods.filter(f =>
    (category === 'all' || f.category === category) &&
    matchesStatus(statusById.get(f.id), statusFilter) &&
    (!q || normalize(f.name).includes(q)),
  );

  const detailFood = detailId ? foodById(detailId) : undefined;
  const detailStatus = detailId ? statusById.get(detailId) : undefined;

  return (
    <div className="px-4 space-y-3">
      {/* ── Où on en est ── */}
      <Card className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Où on en est</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">
              {triedCount}
              <span className="text-base font-medium text-gray-500"> aliment{triedCount > 1 ? 's' : ''} goûté{triedCount > 1 ? 's' : ''}</span>
            </p>
          </div>
          {newThisWeek > 0 && (
            <span className="text-xs font-semibold bg-green-500/10 text-green-600 px-2.5 py-1 rounded-full whitespace-nowrap">
              +{newThisWeek} cette semaine
            </span>
          )}
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 mt-3">
          <div className="bg-gradient-to-r from-green-400 to-emerald-400 h-2 rounded-full transition-all"
            style={{ width: `${(triedCatalog / FOOD_CATALOG.length) * 100}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          {triedCatalog} sur {FOOD_CATALOG.length} aliments de la liste
          {startTrial && <> · débutée le {format(parseISO(startTrial.date), 'd MMM yyyy', { locale: fr })}{ageAt(startTrial.date) && ` (${ageAt(startTrial.date)})`}</>}
        </p>

        <div className="grid grid-cols-4 gap-2 mt-3">
          {([
            ['aimes', '😍', 'Aimés'],
            ['mitiges', '😐', 'Mitigés'],
            ['refuses', '😖', 'Pas aimés'],
            ['reactions', '⚠️', 'Réactions'],
          ] as const).map(([f, emoji, label]) => (
            <button key={f}
              onClick={() => { setStatusFilter(statusFilter === f ? 'all' : f); setView('aliments'); }}
              className={`rounded-xl py-2 text-center border transition-all ${statusFilter === f ? 'border-green-500/40 bg-green-500/10' : 'border-gray-100 bg-gray-50'}`}>
              <div className="text-lg leading-none">{emoji}</div>
              <div className="text-sm font-bold text-gray-800 mt-1">{countWhere(f)}</div>
              <div className="text-[10px] text-gray-500">{label}</div>
            </button>
          ))}
        </div>

        {lastTrial && (
          <button onClick={() => setDetailId(lastTrial.foodId)}
            className="w-full flex items-center gap-2 mt-3 bg-gray-50 rounded-xl px-3 py-2 text-left">
            <span className="text-xs text-gray-400 whitespace-nowrap">Dernier essai</span>
            <span className="text-base">{lastTrial.foodEmoji}</span>
            <span className="text-sm font-medium text-gray-700 truncate">{lastTrial.foodName}</span>
            <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">{relDate(lastTrial.date)}</span>
            {lastTrial.liking && <span>{likingInfo(lastTrial.liking)?.emoji}</span>}
          </button>
        )}
      </Card>

      {/* ── Allergènes ── */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-700">Allergènes introduits</p>
          <p className="text-sm font-bold text-purple-500">{introducedAllergens.size}/{ALLERGENS.length}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ALLERGENS.map(a => {
            const done = introducedAllergens.has(a.id);
            const reaction = reactionAllergens.has(a.id);
            const style = reaction ? 'bg-red-500/10 text-red-600 border-red-500/40 font-medium'
              : done ? 'bg-purple-500/10 text-purple-600 border-purple-500/30 font-medium'
              : 'bg-white text-gray-400 border-dashed border-gray-200';
            return (
              <span key={a.id} className={`text-xs px-2 py-1 rounded-full border ${style}`}>
                {reaction ? '⚠️ ' : done ? '✓ ' : ''}{a.emoji} {a.label}
              </span>
            );
          })}
        </div>
        <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
          Santé publique France recommande de les introduire comme les autres aliments, entre 4 et 6 mois, sans les retarder.
        </p>
      </Card>

      {/* ── À reproposer ── */}
      {toRetry.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb size={15} className="text-amber-500" />
            <p className="text-sm font-semibold text-gray-700">À reproposer</p>
          </div>
          <p className="text-[11px] text-gray-400 mb-2">Un refus est normal : un aliment doit souvent être proposé plusieurs fois avant d'être accepté.</p>
          <div className="flex flex-wrap gap-1.5">
            {toRetry.slice(0, 8).map(f => (
              <button key={f.id} onClick={() => openNew(f)}
                className="text-xs px-2.5 py-1.5 rounded-full border bg-white border-gray-100 text-gray-600">
                {f.emoji} {f.name} <span className="text-gray-400">×{statusById.get(f.id)?.trials.length}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* ── CTA ── */}
      <button onClick={() => openNew()}
        className="w-full bg-gradient-to-r from-green-400 to-emerald-400 text-white py-3 rounded-2xl font-semibold flex items-center justify-center gap-2">
        <Plus size={18} /> Nouvel essai
      </button>

      {/* ── Vue ── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {([['aliments', 'Aliments', <Carrot size={14} />], ['historique', 'Historique', <CalendarDays size={14} />]] as const).map(([v, label, icon]) => (
          <button key={v} onClick={() => setView(v)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${view === v ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}>
            {icon}{label}
          </button>
        ))}
      </div>

      {view === 'aliments' && (
        <>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Chercher un aliment…"
              className="w-full pl-9 pr-8 py-2.5 bg-white border border-pink-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={14} /></button>}
          </div>

          <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
            <button onClick={() => setCategory('all')} className={chip(category === 'all')}>Toutes</button>
            {FOOD_CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setCategory(c.id)} className={chip(category === c.id)}>{c.emoji} {c.label}</button>
            ))}
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
            {STATUS_FILTERS.map(s => (
              <button key={s.value} onClick={() => setStatusFilter(s.value)} className={chip(statusFilter === s.value)}>{s.label}</button>
            ))}
          </div>

          {visibleFoods.length === 0 && (
            <Card className="p-6 text-center">
              <p className="text-gray-400 text-sm">Aucun aliment ne correspond</p>
            </Card>
          )}

          {FOOD_CATEGORIES.map(c => {
            const foods = visibleFoods.filter(f => f.category === c.id);
            if (foods.length === 0) return null;
            const done = foods.filter(f => statusById.has(f.id)).length;
            return (
              <div key={c.id}>
                <div className="flex items-center justify-between px-1 mb-2 mt-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{c.emoji} {c.label}</p>
                  <p className="text-xs text-gray-400">{done}/{foods.length}</p>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {foods.map(food => {
                    const s = statusById.get(food.id);
                    return (
                      <button key={food.id} onClick={() => onFoodTap(food)}
                        className={`rounded-2xl border px-1 py-2.5 text-center transition-all active:scale-95 ${tileStyle(s)}`}>
                        <div className={`text-2xl leading-none ${s ? '' : 'opacity-40 grayscale'}`}>{food.emoji}</div>
                        <p className={`text-[11px] font-medium mt-1.5 leading-tight line-clamp-2 ${s ? 'text-gray-700' : 'text-gray-400'}`}>{food.name}</p>
                        {s
                          ? <p className="text-[10px] mt-1 text-gray-500">{s.reaction && '⚠️'}{likingInfo(s.liking)?.emoji ?? '✓'} ×{s.trials.length}</p>
                          : <p className="text-[10px] mt-1 text-gray-300">à découvrir</p>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <p className="text-[11px] text-gray-400 text-center pt-1">
            🟩 aimé · 🟨 mitigé · 🟧 pas aimé · 🟥 réaction · ⬜ à découvrir
          </p>
        </>
      )}

      {view === 'historique' && (
        <HistoryView trials={trials} firstTrialIds={firstTrialIds} ageAt={ageAt} onEdit={openEdit} onAdd={() => openNew()} />
      )}

      {/* ── Fiche aliment ── */}
      <Modal open={!!detailFood && !!detailStatus} title={detailFood ? `${detailFood.emoji} ${detailFood.name}` : ''} onClose={() => setDetailId(null)}>
        {detailFood && detailStatus && (
          <FoodDetail food={detailFood} status={detailStatus} babyName={babyName} ageAt={ageAt}
            onEdit={openEdit} onAdd={() => openNew(detailFood)} />
        )}
      </Modal>

      {/* ── Formulaire essai ── */}
      <Modal open={formOpen} title={editing ? "Modifier l'essai" : 'Nouvel essai'} onClose={closeForm}>
        <TrialFormBody
          form={form} setForm={setForm} allFoods={allFoods} statusById={statusById}
          pickerSearch={pickerSearch} setPickerSearch={setPickerSearch}
          isEditing={!!editing} babyName={babyName} ageAt={ageAt}
          onSave={save} onDelete={remove}
        />
      </Modal>
    </div>
  );
}

// ─── HISTORIQUE ─────────────────────────────────────────────────────────────

function TrialRow({ t, isFirst, onEdit }: { t: FoodTrial; isFirst: boolean; onEdit: (t: FoodTrial) => void }) {
  const liking = likingInfo(t.liking);
  const details = [amountLabel(t), TEXTURES.find(x => x.value === t.texture)?.label].filter(Boolean).join(' · ');
  return (
    <button onClick={() => onEdit(t)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
      <span className="text-2xl">{t.foodEmoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold text-gray-800">{t.foodName}</span>
          {isFirst && <span className="text-[10px] font-bold bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded-full">1ʳᵉ fois</span>}
          {t.reaction && <span className="text-[10px] font-bold bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded-full">⚠️ Réaction</span>}
        </div>
        {details && <p className="text-xs text-gray-500 mt-0.5">{details}</p>}
        {t.notes && <p className="text-xs text-gray-400 mt-0.5 italic truncate">{t.notes}</p>}
      </div>
      {liking && (
        <div className="text-center flex-shrink-0">
          <div className="text-xl leading-none">{liking.emoji}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">{liking.label}</div>
        </div>
      )}
    </button>
  );
}

function HistoryView({ trials, firstTrialIds, ageAt, onEdit, onAdd }: {
  trials: FoodTrial[];
  firstTrialIds: Set<string>;
  ageAt: (d: string) => string | null;
  onEdit: (t: FoodTrial) => void;
  onAdd: () => void;
}) {
  if (trials.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-4xl mb-2">🥄</div>
        <p className="text-gray-700 font-medium">Aucun essai pour l'instant</p>
        <p className="text-gray-400 text-sm mt-1">Chaque nouvel aliment goûté apparaîtra ici, jour par jour.</p>
        <button onClick={onAdd} className="mt-3 text-green-600 text-sm font-medium">+ Premier essai</button>
      </Card>
    );
  }

  const days = [...new Set(trials.map(t => t.date))];
  return (
    <div className="space-y-3">
      {days.map(d => {
        const dayTrials = trials.filter(t => t.date === d);
        const newCount = dayTrials.filter(t => firstTrialIds.has(t.id)).length;
        const age = ageAt(d);
        return (
          <div key={d}>
            <div className="flex items-center justify-between px-1 mb-1.5">
              <p className="text-xs font-semibold text-gray-500 first-letter:uppercase">
                {format(parseISO(d), 'EEEE d MMMM', { locale: fr })}
                {age && <span className="font-normal text-gray-400 normal-case"> · {age}</span>}
              </p>
              {newCount > 0 && <span className="text-[10px] text-green-600 font-semibold">+{newCount} nouveau{newCount > 1 ? 'x' : ''}</span>}
            </div>
            <Card className="divide-y divide-gray-50 overflow-hidden">
              {dayTrials.map(t => <TrialRow key={t.id} t={t} isFirst={firstTrialIds.has(t.id)} onEdit={onEdit} />)}
            </Card>
          </div>
        );
      })}
    </div>
  );
}

// ─── FICHE ALIMENT ──────────────────────────────────────────────────────────

function FoodDetail({ food, status, babyName, ageAt, onEdit, onAdd }: {
  food: CatalogFood;
  status: FoodStatus;
  babyName: string;
  ageAt: (d: string) => string | null;
  onEdit: (t: FoodTrial) => void;
  onAdd: () => void;
}) {
  const allergen = ALLERGENS.find(a => a.id === food.allergen);
  const chronological = [...status.trials].reverse();
  const firstAge = ageAt(status.first.date);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        <span className="text-xs bg-gray-50 text-gray-500 px-2 py-1 rounded-full">
          {FOOD_CATEGORIES.find(c => c.id === food.category)?.label}
        </span>
        {allergen && <span className="text-xs bg-purple-500/10 text-purple-600 px-2 py-1 rounded-full">Allergène : {allergen.label}</span>}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-50 rounded-xl p-2.5 text-center">
          <p className="text-lg font-bold text-gray-800">{status.trials.length}</p>
          <p className="text-[10px] text-gray-500">essai{status.trials.length > 1 ? 's' : ''}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2.5 text-center">
          <p className="text-sm font-bold text-gray-800 mt-0.5">{format(parseISO(status.first.date), 'd MMM yy', { locale: fr })}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">1ʳᵉ fois{firstAge && ` · ${firstAge}`}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2.5 text-center">
          <p className="text-sm font-bold text-gray-800 mt-0.5">{relDate(status.last.date)}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">dernier essai</p>
        </div>
      </div>

      {chronological.some(t => t.liking) && (
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1.5">Évolution</p>
          <div className="flex items-center gap-1 flex-wrap bg-gray-50 rounded-xl p-2.5">
            {chronological.map((t, i) => (
              <span key={t.id} className="flex items-center gap-1">
                {i > 0 && <span className="text-gray-300 text-xs">→</span>}
                <span className="text-xl" title={format(parseISO(t.date), 'd MMM', { locale: fr })}>
                  {t.reaction ? '⚠️' : likingInfo(t.liking)?.emoji ?? '·'}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {status.reaction && (
        <div className="flex gap-2 bg-red-500/10 rounded-xl p-3">
          <TriangleAlert size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-600 leading-relaxed">Une réaction a été notée. Parlez-en au médecin avant de reproposer cet aliment.</p>
        </div>
      )}
      {!status.reaction && status.liking === 'refuse' && (
        <div className="flex gap-2 bg-amber-500/10 rounded-xl p-3">
          <Lightbulb size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">{babyName} n'a pas aimé la dernière fois. C'est normal : retentez dans quelques jours, sous une autre forme si besoin.</p>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-gray-500 mb-1.5">Tous les essais</p>
        <div className="border border-gray-100 rounded-2xl divide-y divide-gray-50 overflow-hidden">
          {status.trials.map(t => {
            const liking = likingInfo(t.liking);
            const details = [amountLabel(t), TEXTURES.find(x => x.value === t.texture)?.label].filter(Boolean).join(' · ');
            return (
              <button key={t.id} onClick={() => onEdit(t)} className="w-full flex items-center gap-3 px-3 py-2.5 text-left">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 first-letter:uppercase">{format(parseISO(t.date), 'EEE d MMM yyyy', { locale: fr })}</p>
                  {details && <p className="text-xs text-gray-500">{details}</p>}
                  {t.notes && <p className="text-xs text-gray-400 italic truncate">{t.notes}</p>}
                </div>
                {t.reaction && <span className="text-sm">⚠️</span>}
                {liking && <span className="text-xl">{liking.emoji}</span>}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-gray-400 mt-1 text-center">Touchez un essai pour le modifier</p>
      </div>

      <button onClick={onAdd}
        className="w-full bg-gradient-to-r from-green-400 to-emerald-400 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
        <Plus size={18} /> Nouvel essai
      </button>
    </div>
  );
}

// ─── FORMULAIRE ─────────────────────────────────────────────────────────────

function TrialFormBody({ form, setForm, allFoods, statusById, pickerSearch, setPickerSearch, isEditing, babyName, ageAt, onSave, onDelete }: {
  form: TrialForm;
  setForm: React.Dispatch<React.SetStateAction<TrialForm>>;
  allFoods: CatalogFood[];
  statusById: Map<string, FoodStatus>;
  pickerSearch: string;
  setPickerSearch: (s: string) => void;
  isEditing: boolean;
  babyName: string;
  ageAt: (d: string) => string | null;
  onSave: () => void;
  onDelete: () => void;
}) {
  const [pickerCategory, setPickerCategory] = useState<FoodCategory | 'recent'>(statusById.size > 0 ? 'recent' : 'legumes');

  const q = normalize(pickerSearch);
  const recent = [...statusById.values()]
    .sort((a, b) => byNewest(a.last, b.last))
    .map(s => allFoods.find(f => f.id === s.last.foodId))
    .filter((f): f is CatalogFood => !!f)
    .slice(0, 12);

  const pickerFoods = q
    ? allFoods.filter(f => normalize(f.name).includes(q))
    : pickerCategory === 'recent' ? recent : allFoods.filter(f => f.category === pickerCategory);
  const exactMatch = allFoods.some(f => normalize(f.name) === q);

  const addCustom = () => {
    const name = pickerSearch.trim();
    const category = pickerCategory === 'recent' ? 'legumes' : pickerCategory;
    setForm(f => ({ ...f, food: { id: `perso:${normalize(name)}`, name, emoji: '🍽️', category } }));
  };

  const isNewFood = form.food && !statusById.has(form.food.id);
  const isCustomNew = form.food?.id.startsWith('perso:') && isNewFood;
  const age = ageAt(form.date);

  return (
    <>
      {/* Aliment */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Aliment</label>
        {form.food ? (
          <div>
            <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-2.5">
              <span className="text-2xl">{form.food.emoji}</span>
              <span className="text-sm font-semibold text-gray-800 flex-1">{form.food.name}</span>
              <button onClick={() => setForm(f => ({ ...f, food: null }))} className="text-xs text-green-600 font-medium">Changer</button>
            </div>
            {!isEditing && isNewFood && (
              <p className="text-xs text-green-600 mt-1.5">🎉 Première fois que {babyName} goûte cet aliment !</p>
            )}
            {isCustomNew && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1.5">Famille d'aliment</p>
                <div className="flex flex-wrap gap-1.5">
                  {FOOD_CATEGORIES.map(c => (
                    <button key={c.id} onClick={() => setForm(f => f.food ? ({ ...f, food: { ...f.food, category: c.id } }) : f)}
                      className={chip(form.food?.category === c.id)}>{c.emoji} {c.label}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="relative mb-2">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={pickerSearch} onChange={e => setPickerSearch(e.target.value)} placeholder="Chercher ou ajouter un aliment…"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-green-300" />
            </div>
            {!q && (
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
                {recent.length > 0 && <button onClick={() => setPickerCategory('recent')} className={chip(pickerCategory === 'recent')}>🕐 Récents</button>}
                {FOOD_CATEGORIES.map(c => (
                  <button key={c.id} onClick={() => setPickerCategory(c.id)} className={chip(pickerCategory === c.id)}>{c.emoji} {c.label}</button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
              {pickerFoods.map(f => {
                const s = statusById.get(f.id);
                return (
                  <button key={f.id} onClick={() => setForm(prev => ({ ...prev, food: f }))}
                    className={`text-xs px-2.5 py-1.5 rounded-full border transition-all ${s ? 'bg-white border-gray-200 text-gray-700' : 'bg-white border-dashed border-gray-200 text-gray-500'}`}>
                    {f.emoji} {f.name}{s ? ` ${likingInfo(s.liking)?.emoji ?? '✓'}` : ''}
                  </button>
                );
              })}
              {q && !exactMatch && (
                <button onClick={addCustom}
                  className="text-xs px-2.5 py-1.5 rounded-full border border-green-500/40 bg-green-500/10 text-green-600 font-medium">
                  + Ajouter « {pickerSearch.trim()} »
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <FormField label={`Date${age ? ` (${age})` : ''}`} type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />

      {/* Ressenti */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">{babyName} a…</label>
        <div className="grid grid-cols-4 gap-2">
          {LIKINGS.map(l => (
            <button key={l.value} onClick={() => setForm(f => ({ ...f, liking: f.liking === l.value ? '' : l.value }))}
              className={`py-2.5 rounded-xl border text-center transition-all ${form.liking === l.value ? l.selected : 'bg-white text-gray-500 border-gray-100'}`}>
              <div className="text-2xl leading-none">{l.emoji}</div>
              <div className="text-[11px] font-medium mt-1">{l.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Quantité */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Quantité</label>
        <div className="grid grid-cols-2 gap-2">
          {AMOUNTS.map(a => (
            <button key={a.value} onClick={() => setForm(f => ({ ...f, amount: f.amount === a.value ? '' : a.value }))}
              className={`py-2 rounded-xl text-xs font-medium border transition-all ${form.amount === a.value ? 'bg-green-500/10 text-green-600 border-green-500/40' : 'bg-white text-gray-500 border-gray-100'}`}>
              {a.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <input type="number" inputMode="numeric" min="0" step="5" value={form.grams}
            onChange={e => setForm(f => ({ ...f, grams: e.target.value }))} placeholder="Optionnel"
            className="w-28 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-green-300" />
          <span className="text-xs text-gray-500">grammes</span>
        </div>
      </div>

      {/* Texture */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Texture</label>
        <div className="grid grid-cols-3 gap-2">
          {TEXTURES.map(t => (
            <button key={t.value} onClick={() => setForm(f => ({ ...f, texture: f.texture === t.value ? '' : t.value }))}
              className={`py-2 rounded-xl text-xs font-medium border transition-all ${form.texture === t.value ? 'bg-green-500/10 text-green-600 border-green-500/40' : 'bg-white text-gray-500 border-gray-100'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Réaction */}
      <button onClick={() => setForm(f => ({ ...f, reaction: !f.reaction }))}
        className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 mb-4 text-left transition-all ${form.reaction ? 'bg-red-500/10 border-red-500/40' : 'bg-white border-gray-100'}`}>
        <span className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs ${form.reaction ? 'bg-red-500 border-red-500 text-white' : 'border-gray-300'}`}>
          {form.reaction && '✓'}
        </span>
        <div>
          <p className={`text-sm font-medium ${form.reaction ? 'text-red-600' : 'text-gray-700'}`}>⚠️ Réaction observée</p>
          <p className="text-[11px] text-gray-400">Rougeurs, boutons, vomissements, gonflement…</p>
        </div>
      </button>

      <TextareaField label="Notes" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))}
        placeholder="Mélangé avec…, grimace puis a redemandé…" rows={2} />

      <button onClick={onSave} disabled={!form.food}
        className="w-full bg-gradient-to-r from-green-400 to-emerald-400 text-white py-3 rounded-xl font-semibold disabled:opacity-50">
        Enregistrer
      </button>
      {isEditing && (
        <button onClick={onDelete} className="w-full flex items-center justify-center gap-1.5 text-red-400 text-sm font-medium py-3 mt-1">
          <Trash2 size={14} /> Supprimer cet essai
        </button>
      )}
    </>
  );
}
