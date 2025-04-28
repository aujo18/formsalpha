import React, { useState, useCallback } from 'react';
import { ChevronLeft, Send, AlertCircle, X } from 'lucide-react'; // Importer les icônes nécessaires

// Définir les props attendues par ce composant, similaires aux autres formulaires
interface MonthlyCleaningInventoryPageProps {
  goBack: () => void;
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

// Structure d'une ligne de tâche dans l'état
interface TaskRowData {
  id: string;
  description: string;
  details?: string;
  date: string; // Date spécifique à la ligne
  matricule: string; // Matricule spécifique à la ligne
  transitChecked: boolean;
  mx151Checked: boolean;
}

// Colonnes pour les checkboxes
const CHECKBOX_COLS_NEW = ['transitChecked', 'mx151Checked'] as const;
type CheckboxColNew = typeof CHECKBOX_COLS_NEW[number];

const MonthlyCleaningInventoryPage: React.FC<MonthlyCleaningInventoryPageProps> = ({
  goBack,
  getCurrentDateTime,
  sendInspectionToMakecom,
  onSubmissionComplete,
}) => {
  // Initialiser l'état avec une ligne pour chaque tâche initiale
  const [taskRows, setTaskRows] = useState<TaskRowData[]>(() =>
    TASKS.map(task => ({
      ...task,
      date: '', // Date initiale vide par ligne
      matricule: '', // Matricule initial vide par ligne
      transitChecked: false,
      mx151Checked: false,
    }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handler générique pour mettre à jour un champ d'une ligne spécifique
  const handleRowChange = useCallback((index: number, field: keyof TaskRowData, value: string | boolean) => {
    setTaskRows(currentRows => {
      const newRows = [...currentRows];
      // Type assertion pour satisfaire TypeScript, car 'value' peut être string ou boolean
      (newRows[index] as any)[field] = value;
      return newRows;
    });
  }, []);

  // Fonction pour générer le HTML mis à jour
  const generateCleaningInventoryHTML = (): string => {
    let html = `
      <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Nettoyage et Inventaire Mensuel</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 15px; color: #333; font-size: 10px; }
        h1 { color: #006400; text-align: center; margin-bottom: 15px; }
        .info { margin-bottom: 15px; }
        .info p { margin: 4px 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th { background-color: #f2f2f2; color: #333; text-align: left; padding: 5px; border: 1px solid #ddd; font-weight: bold; }
        td { border: 1px solid #ddd; padding: 5px; vertical-align: top; }
        .task-col { min-width: 200px; }
        .date-col, .matricule-col { width: 100px; }
        .check-col { width: 60px; text-align: center; }
        .checked { color: green; font-weight: bold; }
        .not-checked { color: red; }
        footer { text-align: center; margin-top: 15px; font-size: 10px; color: #666; }
      </style></head><body>
      <h1>Nettoyage et Inventaire Mensuel</h1>
      <div class="info"><p><strong>Rapport soumis le:</strong> ${getCurrentDateTime()}</p></div>
      <table><thead><tr>
        <th class="task-col">Tâche</th>
        <th class="date-col">Date</th>
        <th class="matricule-col">Matricule</th>
        <th class="check-col">TRANSIT</th>
        <th class="check-col">MX-151</th>
      </tr></thead><tbody>
    `;

    taskRows.forEach(row => {
      html += '<tr>';
      html += `<td class="task-col">${row.description}${row.details ? `<br><small>${row.details}</small>` : ''}</td>`;
      html += `<td class="date-col">${row.date || '-'}</td>`;
      html += `<td class="matricule-col">${row.matricule || '-'}</td>`;
      html += `<td class="check-col ${row.transitChecked ? 'checked' : 'not-checked'}">${row.transitChecked ? '✓' : '✗'}</td>`;
      html += `<td class="check-col ${row.mx151Checked ? 'checked' : 'not-checked'}">${row.mx151Checked ? '✓' : '✗'}</td>`;
      html += '</tr>';
    });

    html += `</tbody></table><footer>Rapport généré le ${getCurrentDateTime()}</footer></body></html>`;
    return html;
  };

  // Mettre à jour handleSubmit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // --- Validation: Vérifier si au moins une ligne a une date et un matricule? --- 
    // Ou une validation plus stricte par ligne si nécessaire.
    const isValid = taskRows.some(row => row.date && row.matricule);
    if (!isValid) { // Exemple simple
       setError("Veuillez remplir la date et le matricule pour au moins une tâche.");
       return;
     }

    setIsSubmitting(true);
    try {
      const htmlContent = generateCleaningInventoryHTML();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      // Utiliser une date ou une référence générale pour le nom de fichier?
      const fileName = `nettoyage_inventaire_${timestamp}.html`; 

      const webhookData = {
        type: 'NettoyageInventaire',
        dateTime: getCurrentDateTime(),
        tasksData: taskRows, // Envoyer le tableau complet des données par ligne
        htmlContent,
        fileName,
        mimeType: "text/html"
      };

      console.log("Envoi des données:", webhookData);
      const success = await sendInspectionToMakecom('NettoyageInventaire', webhookData);

      if (success) {
        onSubmissionComplete("Le rapport de nettoyage et inventaire a été envoyé avec succès.");
        // Réinitialiser ? Peut-être pas nécessaire si on quitte la page.
      } else {
        throw new Error("L'envoi des données vers Make.com a échoué.");
      }
    } catch (err) {
      const error = err as Error;
      console.error('Erreur lors de la soumission:', error);
      setError(`Échec de la soumission: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      {/* En-tête avec titre à côté du logo */}
      <header className="bg-[#b22a2e] text-white p-4 rounded-lg shadow-md mb-8 flex items-center justify-between">
        {/* Logo et Titre à gauche */}
        <div className="flex items-center">
          <img src="https://res.cloudinary.com/dxyvj8rka/image/upload/f_auto,q_auto/v1/cambi/iazjhbzvu6dv5fad398u" alt="Logo CAMBI" className="h-8 mr-3" /> {/* Ajout de marge à droite */}
          <h1 className="text-xl font-bold">NETTOYAGE ET INVENTAIRE MENSUEL</h1>
        </div>

        {/* Bouton Retour à droite */}
        <button onClick={goBack} className="flex items-center text-white hover:text-gray-200 ml-4">
          <ChevronLeft size={24} className="mr-1" />
          Retour
        </button>
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

        {/* Section Description des tâches - Nouvelle structure de table */}
        <h2 className="text-lg font-semibold border-t pt-4">Description des tâches</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Tâche</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Date</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Matricule</th>
                <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">TRANSIT</th>
                <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">MX-151</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {taskRows.map((row, index) => (
                <tr key={row.id}>
                  {/* Tâche Description */}
                  <td className="px-3 py-2 whitespace-normal text-sm font-medium text-gray-900 border-r">
                    {row.description}
                    {row.details && <span className="block text-xs text-gray-500 mt-1">{row.details}</span>}
                  </td>
                  {/* Date Input */}
                  <td className="px-3 py-2 border-r">
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => handleRowChange(index, 'date', e.target.value)}
                      className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </td>
                  {/* Matricule Input */}
                  <td className="px-3 py-2 border-r">
                    <input
                      type="text"
                      value={row.matricule}
                      onChange={(e) => handleRowChange(index, 'matricule', e.target.value)}
                      placeholder="A-1234"
                      className="mt-1 block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </td>
                  {/* Transit Checkbox */}
                  <td className="px-2 py-2 text-center border-r align-middle">
                    <input
                      type="checkbox"
                      checked={row.transitChecked}
                      onChange={(e) => handleRowChange(index, 'transitChecked', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                  </td>
                  {/* MX-151 Checkbox */}
                  <td className="px-2 py-2 text-center align-middle">
                     <input
                       type="checkbox"
                       checked={row.mx151Checked}
                       onChange={(e) => handleRowChange(index, 'mx151Checked', e.target.checked)}
                       className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                     />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Boutons Annuler/Soumettre - Remplacer par un conteneur sticky */}
        <div className="sticky bottom-0 bg-white p-4 border-t mt-4 -mx-6 -mb-6 rounded-b-lg"> {/* Ajuster les marges négatives pour compenser le padding parent et arrondir les coins bas */} 
           <button 
             type="submit" 
             disabled={isSubmitting} 
             // Style exact de MdsaInspectionPage (w-full, py-3, etc.)
             className={`w-full ${isSubmitting ? 'bg-[#b22a2e]/70 cursor-not-allowed' : 'bg-[#b22a2e] hover:bg-[#b22a2e]/90'} text-white py-3 px-6 rounded-lg transition-colors flex items-center justify-center text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b22a2e]`}
           >
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
                 <Send size={20} className="mr-2" />
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