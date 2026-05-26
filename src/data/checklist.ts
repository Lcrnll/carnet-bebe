import type { ChecklistItem } from '../types';

export function defaultChecklist(): ChecklistItem[] {
  return [
    // Examens médicaux obligatoires
    { id: 'c1', label: 'Examen du 1er jour (maternité)', description: 'Examen clinique complet par le pédiatre ou la sage-femme', done: false, category: 'examen', scheduledAge: 'J1' },
    { id: 'c2', label: 'Test de Guthrie (dépistage néonatal)', description: 'Dépistage de 5 maladies (phénylcétonurie, hypothyroïdie, mucoviscidose, hyperplasie des surrénales, drépanocytose)', done: false, category: 'examen', scheduledAge: 'J3-J5' },
    { id: 'c3', label: 'Dépistage auditif néonatal', description: 'Test des otoémissions acoustiques ou des potentiels évoqués auditifs', done: false, category: 'examen', scheduledAge: 'Avant la sortie' },
    { id: 'c4', label: 'Dépistage de la luxation congénitale de la hanche', description: 'Examen clinique des hanches', done: false, category: 'examen', scheduledAge: 'J1-J8' },
    { id: 'c5', label: '1ère visite pédiatrique (8 jours)', description: 'Examen obligatoire du 8e jour — carnet de santé à apporter', done: false, category: 'medecin', scheduledAge: 'J8' },
    { id: 'c6', label: 'Examen du 1er mois', description: 'Visite médicale obligatoire — vérification de la croissance et du développement', done: false, category: 'medecin', scheduledAge: '1 mois' },
    { id: 'c7', label: 'Examen du 2e mois + 1ères vaccinations', description: 'Visite médicale + début du calendrier vaccinal', done: false, category: 'medecin', scheduledAge: '2 mois' },
    { id: 'c8', label: 'Examen du 4e mois', description: 'Visite médicale obligatoire', done: false, category: 'medecin', scheduledAge: '4 mois' },
    { id: 'c9', label: 'Examen du 5e mois', description: 'Visite médicale obligatoire', done: false, category: 'medecin', scheduledAge: '5 mois' },
    { id: 'c10', label: 'Examen du 9e mois', description: 'Visite médicale obligatoire', done: false, category: 'medecin', scheduledAge: '9 mois' },
    { id: 'c11', label: 'Examen du 12e mois', description: 'Visite médicale obligatoire', done: false, category: 'medecin', scheduledAge: '12 mois' },
    // Administratif
    { id: 'c12', label: 'Déclaration de naissance', description: 'À faire dans les 5 jours suivant la naissance à la mairie', done: false, category: 'administratif', scheduledAge: 'J1-J5' },
    { id: 'c13', label: 'Déclaration à la CAF', description: 'Allocations familiales et PAJE — à déclarer rapidement', done: false, category: 'administratif' },
    { id: 'c14', label: 'Rattachement à la sécurité sociale', description: 'Rattacher bébé à votre carte vitale', done: false, category: 'administratif' },
    { id: 'c15', label: 'Mutuelle bébé', description: 'Rattacher ou créer une couverture mutuelle pour bébé', done: false, category: 'administratif' },
    { id: 'c16', label: 'Acte de naissance', description: 'Récupérer plusieurs exemplaires à la mairie', done: false, category: 'administratif' },
    { id: 'c17', label: 'Choisir un pédiatre', description: 'Trouver et déclarer un médecin traitant pour bébé', done: false, category: 'administratif' },
    // Médecin
    { id: 'c18', label: 'Dépistage de la rétinopathie', description: 'Si prématuré ou facteurs de risque', done: false, category: 'examen', scheduledAge: 'Selon risque' },
    { id: 'c19', label: 'Fond d\'œil', description: 'Si facteurs de risque ophtalmologiques', done: false, category: 'examen' },
  ];
}
