import { useState } from 'react';
import { Phone, Heart, Shield, MapPin, FileText, Plus, Trash2, Edit2 } from 'lucide-react';
import type { AppData, Document } from '../types';
import { addDocument, updateDocument, deleteDocument, uid } from '../storage';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { FormField, SelectField, TextareaField } from '../components/FormField';

interface Props { data: AppData; onRefresh: () => void; }

const categoryConfig: Record<Document['category'], { label: string; icon: typeof Phone; color: string; bg: string }> = {
  medecin: { label: 'Médecins', icon: Heart, color: 'text-red-400', bg: 'bg-red-50' },
  pharmacie: { label: 'Pharmacie', icon: MapPin, color: 'text-green-400', bg: 'bg-green-50' },
  assurance: { label: 'Assurance / Sécu', icon: Shield, color: 'text-blue-400', bg: 'bg-blue-50' },
  urgence: { label: 'Numéros urgences', icon: Phone, color: 'text-orange-400', bg: 'bg-orange-50' },
  autre: { label: 'Autre', icon: FileText, color: 'text-purple-400', bg: 'bg-purple-50' },
};

const DEFAULT_DOCS: Omit<Document, 'id'>[] = [
  { category: 'urgence', label: 'SAMU', value: '15', notes: 'Urgences médicales' },
  { category: 'urgence', label: 'Pompiers', value: '18', notes: 'Urgences et secours' },
  { category: 'urgence', label: 'Police', value: '17', notes: '' },
  { category: 'urgence', label: 'Numéro européen', value: '112', notes: 'Toutes urgences en Europe' },
  { category: 'urgence', label: 'Centre antipoison', value: '09 74 75 00 00', notes: 'Urgences toxicologiques' },
];

export function Documents({ data, onRefresh }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [editDoc, setEditDoc] = useState<Document | null>(null);
  const [form, setForm] = useState<Omit<Document, 'id'>>({ category: 'medecin', label: '', value: '', notes: '' });

  const initDefaults = () => {
    DEFAULT_DOCS.forEach(d => addDocument({ ...d, id: uid() }));
    onRefresh();
  };

  const handleAdd = () => {
    if (!form.label) return;
    addDocument({ ...form, id: uid() });
    onRefresh();
    setForm({ category: 'medecin', label: '', value: '', notes: '' });
    setShowAdd(false);
  };

  const handleEdit = () => {
    if (!editDoc) return;
    updateDocument({ ...editDoc, ...form });
    onRefresh();
    setEditDoc(null);
  };

  const grouped: Record<string, Document[]> = data.documents.reduce((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = [];
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  const catOrder: Document['category'][] = ['urgence', 'medecin', 'pharmacie', 'assurance', 'autre'];

  return (
    <div className="pb-24 fade-in">
      <PageHeader
        title="Documents & Contacts"
        subtitle="Informations importantes"
        action={
          <button onClick={() => { setForm({ category: 'medecin', label: '', value: '', notes: '' }); setShowAdd(true); }} className="bg-gradient-to-r from-pink-400 to-purple-400 text-white p-2.5 rounded-xl">
            <Plus size={20} />
          </button>
        }
      />

      {data.documents.length === 0 && (
        <div className="px-4 mb-4">
          <Card className="p-6 text-center">
            <FileText size={32} className="text-pink-200 mx-auto mb-2" />
            <p className="text-gray-700 font-medium mb-1">Aucun contact enregistré</p>
            <p className="text-xs text-gray-400 mb-4">Ajoutez vos contacts importants ou commencez avec les numéros d'urgence.</p>
            <button onClick={initDefaults} className="bg-gradient-to-r from-pink-400 to-purple-400 text-white px-5 py-2.5 rounded-xl font-medium text-sm">
              Ajouter les numéros d'urgence
            </button>
          </Card>
        </div>
      )}

      <div className="px-4 space-y-4">
        {catOrder.filter(cat => grouped[cat]).map(cat => {
          const config = categoryConfig[cat];
          const Icon = config.icon;
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${config.bg}`}>
                  <Icon size={12} className={config.color} />
                </div>
                <p className="text-sm font-semibold text-gray-700">{config.label}</p>
              </div>
              <div className="space-y-2">
                {grouped[cat].map(doc => (
                  <Card key={doc.id} className="p-3.5">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 font-medium">{doc.label}</p>
                        <p className="text-base font-bold text-gray-800 mt-0.5 truncate">{doc.value}</p>
                        {doc.notes && <p className="text-xs text-gray-400 mt-0.5">{doc.notes}</p>}
                      </div>
                      <div className="flex gap-1">
                        {doc.value.match(/^[\d\s\+\-\.]+$/) && (
                          <a href={`tel:${doc.value.replace(/\s/g, '')}`} className={`p-1.5 rounded-lg ${config.bg} ${config.color}`}>
                            <Phone size={14} />
                          </a>
                        )}
                        <button onClick={() => { setForm({ category: doc.category, label: doc.label, value: doc.value, notes: doc.notes }); setEditDoc(doc); }} className="p-1.5 rounded-lg bg-gray-50 text-gray-400">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => { deleteDocument(doc.id); onRefresh(); }} className="p-1.5 rounded-lg bg-gray-50 text-gray-300 hover:text-red-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {[{ open: showAdd, title: 'Nouveau contact', onClose: () => setShowAdd(false), onSave: handleAdd },
        { open: !!editDoc, title: 'Modifier', onClose: () => setEditDoc(null), onSave: handleEdit }
      ].map(({ open, title, onClose, onSave }, i) => (
        <Modal key={i} open={open} title={title} onClose={onClose}>
          <SelectField label="Catégorie" value={form.category} onChange={v => setForm(f => ({ ...f, category: v as Document['category'] }))} options={[
            { value: 'medecin', label: '❤️ Médecins' },
            { value: 'pharmacie', label: '💊 Pharmacie' },
            { value: 'assurance', label: '🛡️ Assurance / Sécu' },
            { value: 'urgence', label: '📞 Urgences' },
            { value: 'autre', label: '📄 Autre' },
          ]} />
          <FormField label="Nom / Label *" value={form.label} onChange={v => setForm(f => ({ ...f, label: v }))} placeholder="Dr Martin, N° de sécu..." required />
          <FormField label="Numéro / Information" value={form.value} onChange={v => setForm(f => ({ ...f, value: v }))} placeholder="06 12 34 56 78, A123456..." />
          <TextareaField label="Notes" value={form.notes || ''} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="Spécialité, adresse, horaires..." rows={2} />
          <button onClick={onSave} disabled={!form.label} className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white py-3 rounded-xl font-semibold disabled:opacity-50 mt-2">
            Enregistrer
          </button>
        </Modal>
      ))}
    </div>
  );
}
