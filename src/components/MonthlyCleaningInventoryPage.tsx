import React, { useState } from 'react';
import { ChevronLeft, Send, AlertCircle, X } from 'lucide-react'; // Importer les icônes nécessaires

// Définir les props attendues par ce composant, similaires aux autres formulaires
interface MonthlyCleaningInventoryPageProps {
  goBack: () => void;
  matricule: string;
  handleMatriculeChange: (value: string) => void;
  // Ajoutez d'autres props communes si nécessaire (ex: pointDeService, sendInspectionToMakecom, onSubmissionComplete)
  getCurrentDateTime: () => string;
  sendInspectionToMakecom: (formType: string, data: any) => Promise<boolean>;
  onSubmissionComplete: (message: string) => void;
}

// Définir la structure d'une tâche
interface Task {
  id: string;
  description: string;
  details?: string; // Pour les détails comme "et son contenu COMP. D1 - D3"
  section: string; // Pour regrouper (ex: "Tâches Générales", "Armoires")
}

// Définir les colonnes de checkboxes
const CHECKBOX_COLUMNS = ['MX_144', 'MX_151_A', 'MX_151_B', 'TRANSIT', 'PICK_UP'] as const;
type CheckboxColumn = typeof CHECKBOX_COLUMNS[number];

// Définir l'état des checkboxes: { [taskId: string]: { [columnId: string]: boolean } }
type TaskStatus = Record<string, Partial<Record<CheckboxColumn, boolean>>>;

// Liste des tâches extraites de l'image
const TASKS: Task[] = [
  // Section 1
  { id: 'trousse_vital', description: 'TROUSSE SUPPORT VITAL', section: 'Général' },
  { id: 'trousse_medic', description: 'TROUSSE À MÉDICAMENT', section: 'Général' },
  { id: 'trousse_ped', description: 'TROUSSE PÉDIATRIQUE', section: 'Général' },
  { id: 'trousse_oxy', description: "TROUSSES D'OXYGÈNE", section: 'Général' },
  { id: 'mdsa', description: 'MDSA', section: 'Général' },
  { id: 'civiere_chaise', description: 'CIVIÈRE-CHAISE', section: 'Général' },
  { id: 'colliers', description: 'SAC DE COLLIERS CERVICAUX', section: 'Général' },
  { id: 'civiere_transport', description: 'CIVIÈRE DE TRANPORT (CIVIÈRE ET PLANCHE)', section: 'Général' },
  { id: 'sangles', description: 'SANGLES (CIVIÈRE ET PLANCHE)', section: 'Général' },
  { id: 'desinf_avant', description: "DÉSINFECTION DE L'HABITACLE AVANT", section: 'Général' },
  { id: 'desinf_arriere', description: "DÉSINFECTION DE L'HABITACLE ARRIÈRE", section: 'Général' },
  // Section 2: Armoires (Numérotées de bas en haut sur l'image?)
  { id: 'armoire1', description: 'ARMOIRE #1', details: 'et son contenu COMP. G1', section: 'Armoires' },
  { id: 'armoire2', description: 'ARMOIRE #2', details: 'et son contenu COMP. A1', section: 'Armoires' },
  { id: 'armoire3', description: 'ARMOIRE #3', details: 'et son contenu COMP. D3', section: 'Armoires' },
  { id: 'armoire4', description: 'ARMOIRE #4', details: 'et son contenu COMP. G1 - G2 - G3', section: 'Armoires' },
  { id: 'armoire5', description: 'ARMOIRE #5', details: 'et son contenu COMP. A1', section: 'Armoires' },
  { id: 'armoire6', description: 'ARMOIRE #6', details: 'et son contenu COMP. G1-G2', section: 'Armoires' },
  { id: 'armoire7', description: 'ARMOIRE #7', details: 'et son contenu COMP. D2', section: 'Armoires' },
  { id: 'armoire8', description: 'ARMOIRE #8', details: 'et son contenu COMP. D2 - D3', section: 'Armoires' },
  { id: 'armoire9', description: 'ARMOIRE #9', details: 'et son contenu COMP. D1 - D3', section: 'Armoires' },
];

const MonthlyCleaningInventoryPage: React.FC<MonthlyCleaningInventoryPageProps> = ({
  goBack,
  matricule,
  handleMatriculeChange,
  getCurrentDateTime,
  sendInspectionToMakecom,
  onSubmissionComplete,
}) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]); // Utiliser une chaîne pour la date HTML
  const [taskStatus, setTaskStatus] = useState<TaskStatus>({}); // Initialiser l'état des checkboxes
  const [isSubmitting, setIsSubmitting] = useState(false); // État de chargement
  const [error, setError] = useState<string | null>(null); // État d'erreur

  // Fonction pour générer le HTML
  const generateCleaningInventoryHTML = (): string => {
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Nettoyage et Inventaire Mensuel</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          h1 { color: #006400; text-align: center; margin-bottom: 20px; }
          .info { margin-bottom: 20px; }
          .info p { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }
          th { background-color: #f2f2f2; color: #333; text-align: left; padding: 6px; border: 1px solid #ddd; }
          td { border: 1px solid #ddd; padding: 6px; vertical-align: middle; }
          th.check-col, td.check-col { text-align: center; width: 60px; }
          .task-desc { font-weight: bold; }
          .task-details { font-size: 9px; color: #555; }
          .checked { color: green; font-weight: bold; text-align: center; }
          .not-checked { color: red; text-align: center; }
          footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <h1>Nettoyage et Inventaire Mensuel</h1>
        <div class="info">
          <p><strong>Matricule:</strong> ${matricule || 'Non spécifié'}</p>
          <p><strong>Date du formulaire:</strong> ${date}</p>
          <p><strong>Date et heure de soumission:</strong> ${getCurrentDateTime()}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Tâche</th>
              ${CHECKBOX_COLUMNS.map(col => `<th class="check-col">${col.replace('_', ' ')}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
    `;

    // Regrouper et ajouter les lignes de tâches
    const tasksBySection = TASKS.reduce<Record<string, Task[]>>((acc, task) => {
      if (!acc[task.section]) acc[task.section] = [];
      acc[task.section].push(task);
      return acc;
    }, {});

    Object.entries(tasksBySection).forEach(([/* section */, tasksInSection]) => {
       // On pourrait ajouter un en-tête de section ici si désiré
       tasksInSection.forEach(task => {
         html += '<tr>';
         html += `<td class="task-desc">${task.description}${task.details ? `<br><span class="task-details">${task.details}</span>` : ''}</td>`;
         CHECKBOX_COLUMNS.forEach(col => {
            const isChecked = !!taskStatus[task.id]?.[col];
            html += `<td class="check-col ${isChecked ? 'checked' : 'not-checked'}">${isChecked ? '✓' : '✗'}</td>`;
         });
         html += '</tr>';
       });
    });

    html += `
          </tbody>
        </table>
        <footer>Rapport généré le ${getCurrentDateTime()}</footer>
      </body>
      </html>
    `;
    return html;
  };

  // Mettre à jour handleSubmit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // --- Validation (Exemple simple : vérifier si matricule et date sont présents) ---
    if (!matricule || !date) {
      setError("Le matricule et la date sont obligatoires.");
      return;
    }
    // TODO: Ajouter une validation plus complexe si nécessaire (ex: toutes les cases cochées?)

    setIsSubmitting(true);
    try {
      const htmlContent = generateCleaningInventoryHTML();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `nettoyage_inventaire_${matricule}_${timestamp}.html`;

      const webhookData = {
        type: 'NettoyageInventaire', // <- Doit correspondre au cas dans App.tsx
        matricule,
        dateFormulaire: date,
        dateTime: getCurrentDateTime(),
        htmlContent, // <- Contenu HTML généré
        fileName,    // <- Nom de fichier suggéré
        mimeType: "text/html"
      };

      console.log("Envoi des données:", webhookData);
      const success = await sendInspectionToMakecom('NettoyageInventaire', webhookData);

      if (success) {
        onSubmissionComplete("Le rapport de nettoyage et inventaire a été envoyé avec succès.");
        // Réinitialiser l'état local si nécessaire (ou laisser App.tsx le faire via goBack)
         setTaskStatus({}); // Réinitialiser les checkboxes
      } else {
        // L'erreur devrait être déjà gérée et relancée par sendInspectionToMakecom
        // Mais on peut ajouter un message générique ici au cas où
        throw new Error("L'envoi des données vers Make.com a échoué.");
      }
    } catch (err) {
      const error = err as Error;
      console.error('Erreur lors de la soumission:', error);
      setError(`Échec de la soumission: ${error.message}`);
      // Ne pas appeler onSubmissionComplete ici, car l'erreur est affichée
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fonction pour gérer le changement de date
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
  };

  // Gérer le changement d'état d'une checkbox
  const handleCheckboxChange = (taskId: string, column: CheckboxColumn) => {
    setTaskStatus(prevStatus => ({
      ...prevStatus,
      [taskId]: {
        ...prevStatus[taskId],
        [column]: !prevStatus[taskId]?.[column] // Basculer l'état coché/décoché
      }
    }));
  };

  // Regrouper les tâches par section pour l'affichage
  const tasksBySection = TASKS.reduce<Record<string, Task[]>>((acc, task) => {
    if (!acc[task.section]) {
      acc[task.section] = [];
    }
    acc[task.section].push(task);
    return acc;
  }, {});

  return (
    // Utiliser une structure et des classes Tailwind similaires aux autres formulaires
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <header className="bg-white p-4 rounded-lg shadow-md mb-8 flex items-center justify-between">
        <button onClick={goBack} className="flex items-center text-gray-600 hover:text-gray-900">
          <ChevronLeft size={24} className="mr-2" />
          Retour
        </button>
        <h1 className="text-xl font-bold text-center flex-grow">NETTOYAGE ET INVENTAIRE MENSUEL</h1>
        {/* Espace réservé pour aligner le titre au centre, peut être ajusté */}
        <div style={{ width: '80px' }}></div>
      </header>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
        {/* Afficher l'erreur si elle existe */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex justify-between items-center" role="alert">
            <div>
              <strong className="font-bold"><AlertCircle size={18} className="inline mr-2" /> Erreur: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
               <X size={20} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Matricule */}
          <div className="space-y-2">
            <label htmlFor="matricule" className="block text-sm font-medium text-gray-700">Matricule</label>
            <input
              type="text"
              id="matricule"
              value={matricule}
              onChange={(e) => handleMatriculeChange(e.target.value)} // Utiliser la fonction passée en props
              placeholder="Ex: A-1234"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={handleDateChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
        </div>

        {/* Section Description des tâches */} 
        <h2 className="text-lg font-semibold border-t pt-4">Description des tâches</h2>
        {/* Structure de la table pour les tâches */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Tâche</th>
                {/* Générer les en-têtes de colonnes dynamiquement */}
                {CHECKBOX_COLUMNS.map(col => (
                  <th key={col} scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">{col.replace('_', ' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Itérer sur les sections puis sur les tâches */}
              {Object.entries(tasksBySection).map(([section, tasksInSection]) => (
                <React.Fragment key={section}>
                  {/* Optionnel: Ajouter un en-tête de section si nécessaire */}
                  {/*
                  <tr>
                    <td colSpan={1 + CHECKBOX_COLUMNS.length} className="px-6 py-2 bg-gray-100 text-sm font-medium text-gray-700">{section}</td>
                  </tr>
                  */}
                  {tasksInSection.map((task) => (
                    <tr key={task.id}>
                      <td className="px-6 py-4 whitespace-normal text-sm font-medium text-gray-900 border-r">
                        {task.description}
                        {task.details && <span className="block text-xs text-gray-500">{task.details}</span>}
                      </td>
                      {/* Générer les checkboxes pour chaque colonne */}
                      {CHECKBOX_COLUMNS.map(col => (
                        <td key={`${task.id}-${col}`} className="px-2 py-4 text-center border-r">
                          <input
                            type="checkbox"
                            id={`${task.id}-${col}`}
                            checked={!!taskStatus[task.id]?.[col]} // Utiliser l'état pour déterminer si c'est coché
                            onChange={() => handleCheckboxChange(task.id, col)} // Appeler le handler au changement
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Boutons Annuler/Soumettre */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
           <button type="button" onClick={goBack} disabled={isSubmitting} className="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
             Annuler
           </button>
           <button type="submit" disabled={isSubmitting} className="inline-flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#b22a2e] hover:bg-[#b22a2e]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b22a2e] disabled:opacity-50">
             {isSubmitting ? (
               <>
                 <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 Envoi en cours...
               </>
             ) : (
               <>
                 <Send size={18} className="mr-2" />
                 Soumettre
               </>
             )}
           </button>
        </div>
      </form>
    </div>
  );
};

export default MonthlyCleaningInventoryPage; 