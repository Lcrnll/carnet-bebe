import { useRef, useState } from 'react';
import { Download, Upload, Trash2, Check, Share2, Wifi, WifiOff, AlertTriangle, Calendar } from 'lucide-react';
import type { AppData } from '../types';
import { defaultVaccines } from '../data/vaccines';
import { defaultChecklist } from '../data/checklist';
import {
  isCloudConfigured, getFamilyCode,
  saveCloudSettings, getCloudConfig, clearCloudSettings, pullFromCloud, pushToCloud,
} from '../cloud';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Modal } from '../components/Modal';

const LOCAL_KEY = 'carnet-bebe-data';
export const GCAL_EMAILS_KEY = 'carnet-bebe-gcal-emails';

const DEFAULT_GCAL_EMAILS: [string, string, string] = [
  'carnaille.leonard@gmail.com',
  'leonard.mathilde06@gmail.com',
  'laurentcarnaille@gmail.com',
];

export function getGCalEmails(): [string, string, string] {
  try {
    const raw = localStorage.getItem(GCAL_EMAILS_KEY);
    if (raw) return JSON.parse(raw) as [string, string, string];
  } catch {}
  return DEFAULT_GCAL_EMAILS;
}

interface Props { data: AppData; onRefresh: () => void; }

export function Settings({ data, onRefresh }: Props) {
  const fileRef  = useRef<HTMLInputElement>(null);
  const [showReset, setShowReset]         = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [importError, setImportError]     = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [syncOk, setSyncOk]              = useState<boolean | null>(null);
  const [syncing, setSyncing]            = useState(false);
  const [familyCode, setFamilyCode]       = useState(getFamilyCode());
  const [gcalEmails, setGcalEmails]       = useState<[string, string, string]>(getGCalEmails);
  const [gcalSaved, setGcalSaved]         = useState(false);

  const configured = isCloudConfigured();

  const handleSaveCode = async () => {
    if (!familyCode.trim()) return;
    saveCloudSettings(getCloudConfig(), familyCode);
    setSyncing(true);
    try {
      await pushToCloud(data);
      setSyncOk(true);
    } catch {
      setSyncOk(false);
    }
    setSyncing(false);
    setShowCodeModal(false);
    // Rechargement pour démarrer l'abonnement temps réel
    window.location.reload();
  };

  const handleDisconnect = () => {
    clearCloudSettings();
    setSyncOk(null);
    setFamilyCode('');
    onRefresh();
  };

  /* ── Sync manuelle : tire depuis le cloud (ne pousse pas) ── */
  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const cloudData = await pullFromCloud();
      if (cloudData) {
        localStorage.setItem('carnet-bebe-data', JSON.stringify(cloudData));
        onRefresh();
        setSyncOk(true);
      } else {
        setSyncOk(false);
      }
    } catch { setSyncOk(false); }
    setSyncing(false);
  };

  /* ── Export JSON ── */
  const handleExport = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `carnet-${data.profile?.name?.toLowerCase() ?? 'bebe'}-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const name = `carnet-${data.profile?.name?.toLowerCase() ?? 'bebe'}.json`;
    const file = new File([blob], name, { type: 'application/json' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Carnet Bébé' });
    } else { handleExport(); }
  };

  /* ── Import JSON ── */
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(''); setImportSuccess(false);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as Partial<AppData>;
        if (!parsed.profile && !parsed.growth) throw new Error('invalide');
        const merged: AppData = {
          profile:      parsed.profile      ?? null,
          growth:       parsed.growth       ?? [],
          appointments: parsed.appointments ?? [],
          vaccines:     parsed.vaccines?.length  ? parsed.vaccines  : defaultVaccines(),
          checklist:    parsed.checklist?.length ? parsed.checklist : defaultChecklist(),
          notes:        parsed.notes        ?? [],
          documents:    parsed.documents    ?? [],
        };
        localStorage.setItem(LOCAL_KEY, JSON.stringify(merged));
        onRefresh();
        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 3000);
      } catch { setImportError('Fichier invalide.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  /* ── Google Calendar emails ── */
  const handleSaveGcalEmails = () => {
    localStorage.setItem(GCAL_EMAILS_KEY, JSON.stringify(gcalEmails));
    setGcalSaved(true);
    setTimeout(() => setGcalSaved(false), 2000);
  };

  /* ── Reset ── */
  const handleReset = () => {
    localStorage.removeItem(LOCAL_KEY);
    onRefresh();
    setShowReset(false);
  };

  const stats = [
    { label: 'Mesures de croissance',  value: data.growth.length },
    { label: 'Rendez-vous',            value: data.appointments.length },
    { label: 'Vaccins complétés',      value: `${data.vaccines.filter(v => v.done).length} / ${data.vaccines.length}` },
    { label: 'Notes & symptômes',      value: data.notes.length },
    { label: 'Documents',              value: data.documents.length },
  ];

  return (
    <div className="pb-28 fade-in">
      <PageHeader title="Réglages" subtitle="Synchronisation & données" />

      {/* ── Bloc synchro ── */}
      <div className="px-4 mb-3">
        <Card className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${configured ? 'bg-green-50' : 'bg-gray-50'}`}>
              {configured ? <Wifi size={20} className="text-green-500" /> : <WifiOff size={20} className="text-gray-300" />}
            </div>
            <div>
              <p className="font-semibold text-gray-800">
                {configured ? '✅ Sync automatique activée' : '☁️ Synchronisation automatique'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {configured
                  ? `Code famille : "${getFamilyCode()}" · Les deux téléphones sont synchronisés en temps réel.`
                  : 'Entrez un code famille pour synchroniser vos deux téléphones automatiquement.'}
              </p>
            </div>
          </div>

          {syncOk === true && (
            <div className="flex items-center gap-2 bg-green-50 text-green-600 text-xs px-3 py-2 rounded-xl mb-3">
              <Check size={14} /> Synchronisé avec le cloud !
            </div>
          )}
          {syncOk === false && (
            <div className="flex items-center gap-2 bg-red-50 text-red-500 text-xs px-3 py-2 rounded-xl mb-3">
              <AlertTriangle size={14} /> Erreur de connexion — vérifiez votre connexion internet.
            </div>
          )}

          {configured ? (
            <div className="flex gap-2">
              <button onClick={handleManualSync} disabled={syncing}
                className="flex-1 flex items-center justify-center gap-2 bg-green-50 text-green-600 border border-green-100 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
                <Wifi size={16} /> {syncing ? 'Sync…' : 'Synchroniser maintenant'}
              </button>
              <button onClick={handleDisconnect}
                className="px-4 bg-gray-50 text-gray-400 border border-gray-100 py-2.5 rounded-xl text-sm">
                Déconnecter
              </button>
            </div>
          ) : (
            <button onClick={() => setShowCodeModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-400 to-purple-400 text-white py-3 rounded-xl text-sm font-semibold">
              <Wifi size={16} /> Activer la synchronisation
            </button>
          )}
        </Card>
      </div>

      {/* ── Export / Import ── */}
      <div className="px-4 mb-3">
        <Card className="p-4">
          <h3 className="font-semibold text-gray-800 mb-1">📤 Sauvegarde manuelle</h3>
          <p className="text-xs text-gray-500 mb-3">Exportez vos données en JSON (en complément de la synchro).</p>
          <div className="flex gap-2 mb-3">
            <button onClick={handleExport}
              className="flex-1 flex items-center justify-center gap-2 bg-pink-50 text-pink-500 border border-pink-100 py-2 rounded-xl text-sm font-medium">
              <Download size={15} /> Télécharger
            </button>
            <button onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 bg-purple-50 text-purple-500 border border-purple-100 py-2 rounded-xl text-sm font-medium">
              <Share2 size={15} /> Partager
            </button>
          </div>
          {importSuccess && (
            <div className="flex items-center gap-2 bg-green-50 text-green-600 text-xs px-3 py-2 rounded-xl mb-2">
              <Check size={14} /> Données importées !
            </div>
          )}
          {importError && (
            <div className="flex items-center gap-2 bg-red-50 text-red-500 text-xs px-3 py-2 rounded-xl mb-2">
              <AlertTriangle size={14} /> {importError}
            </div>
          )}
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          <button onClick={() => fileRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-500 border border-blue-100 py-2 rounded-xl text-sm font-medium">
            <Upload size={15} /> Importer un fichier JSON
          </button>
        </Card>
      </div>

      {/* ── Google Calendar ── */}
      <div className="px-4 mb-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={16} className="text-blue-400" />
            <h3 className="font-semibold text-gray-800">Invitations Google Agenda</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Lors de l'ajout d'un RDV, un lien s'ouvrira dans Google Agenda avec ces 3 adresses en invités.
          </p>
          {(['Email 1', 'Email 2', 'Email 3'] as const).map((label, i) => (
            <div key={i} className="mb-2">
              <input
                type="email"
                placeholder={`${label} (ex: prenom@gmail.com)`}
                value={gcalEmails[i]}
                onChange={e => {
                  const updated = [...gcalEmails] as [string, string, string];
                  updated[i] = e.target.value;
                  setGcalEmails(updated);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          ))}
          {gcalSaved && (
            <div className="flex items-center gap-2 bg-green-50 text-green-600 text-xs px-3 py-2 rounded-xl mb-2">
              <Check size={14} /> Adresses enregistrées !
            </div>
          )}
          <button onClick={handleSaveGcalEmails}
            className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-500 border border-blue-100 py-2.5 rounded-xl text-sm font-semibold mt-1">
            <Calendar size={15} /> Enregistrer les adresses
          </button>
        </Card>
      </div>

      {/* ── Stats ── */}
      <div className="px-4 mb-3">
        <Card className="p-4">
          <h3 className="font-semibold text-gray-800 mb-3">📊 Vos données</h3>
          <div className="space-y-2">
            {stats.map(s => (
              <div key={s.label} className="flex justify-between py-1 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-500">{s.label}</span>
                <span className="text-xs font-semibold text-gray-800">{s.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Reset ── */}
      <div className="px-4">
        <Card className="p-4">
          <h3 className="font-semibold text-red-400 mb-1">🗑️ Réinitialiser cet appareil</h3>
          <p className="text-xs text-gray-500 mb-3">Supprime les données locales de cet appareil uniquement.</p>
          <button onClick={() => setShowReset(true)}
            className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-400 border border-red-100 py-2.5 rounded-xl text-sm font-semibold">
            <Trash2 size={16} /> Tout effacer sur cet appareil
          </button>
        </Card>
      </div>

      {/* ── Modal Code Famille ── */}
      <Modal open={showCodeModal} title="Code famille" onClose={() => setShowCodeModal(false)}>
        <div className="mb-2">
          <div className="bg-pink-50 border border-pink-100 rounded-xl p-4 mb-4">
            <p className="text-sm font-semibold text-pink-700 mb-1">🔑 Comment ça marche ?</p>
            <p className="text-xs text-pink-600 leading-relaxed">
              Inventez un code secret partagé entre vos deux téléphones.
              Les données se synchroniseront automatiquement dès que vous serez connecté à internet.
            </p>
          </div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Votre code famille
          </label>
          <input
            type="text"
            value={familyCode}
            onChange={e => setFamilyCode(e.target.value)}
            placeholder="ex: famille-martin-2024"
            autoCapitalize="none"
            autoCorrect="off"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-pink-300 mb-2"
          />
          <p className="text-xs text-gray-400 mb-4">
            Entrez le <strong>même code</strong> sur les deux téléphones. Minuscules, chiffres et tirets uniquement.
          </p>
          <button
            onClick={handleSaveCode}
            disabled={!familyCode.trim() || syncing}
            className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
          >
            {syncing ? 'Connexion…' : '✅ Activer la synchronisation'}
          </button>
        </div>
      </Modal>

      {/* ── Modal Reset ── */}
      <Modal open={showReset} title="Confirmer la suppression" onClose={() => setShowReset(false)}>
        <div className="text-center py-4">
          <div className="text-5xl mb-3">⚠️</div>
          <p className="text-gray-700 font-medium mb-2">Toutes les données locales seront supprimées</p>
          <p className="text-sm text-gray-500 mb-6">Si la synchro cloud est active, les données resteront sur Firebase.</p>
          <div className="flex gap-3">
            <button onClick={() => setShowReset(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm">Annuler</button>
            <button onClick={handleReset} className="flex-1 py-2.5 rounded-xl bg-red-400 text-white text-sm font-semibold">Supprimer</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
