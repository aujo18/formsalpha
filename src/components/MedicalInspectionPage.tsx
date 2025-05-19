import React, { useState, useRef, FormEvent, useEffect } from 'react';
import { ChevronLeft, Send, AlertCircle, X } from 'lucide-react';
import { CheckItem } from '../types';

interface MedicalInspectionPageProps {
  goBack: () => void;
  matricule: string;
  handleMatriculeChange: (value: string) => void;
  numeroVehicule: string;
  handleVehiculeNumberChange: (value: string) => void;
  pointDeService: string;
  setPointDeService: (value: string) => void;
  getCurrentDateTime: () => string;
  sendInspectionToMakecom: (formType: string, data: any) => Promise<boolean>;
  onSubmissionComplete: (message: string) => void;
}

const MedicalInspectionPage: React.FC<MedicalInspectionPageProps> = ({
  goBack,
  matricule,
  handleMatriculeChange,
  numeroVehicule,
  handleVehiculeNumberChange,
  pointDeService,
  setPointDeService,
  getCurrentDateTime,
  sendInspectionToMakecom,
  onSubmissionComplete
}) => {
  const ITEMS_REQUIRING_EXPIRATION = [
    'medkit_salbutamol_125',
    'medkit_salbutamol_25',
    'medkit_aspirine',
    'medkit_nitroglycerine_general',
    'medkit_glucagon',
    'medkit_naloxone',
    'medkit_epinephrine',
  ];

  // États spécifiques
  const [vehiculeItems, setVehiculeItems] = useState<CheckItem[]>([
    { id: 'trousse1', label: 'Trousse support vital', category: 'TROUSSES', checked: false },
    { id: 'trousse3', label: 'Trousse d\'oxygène (800 ou plus) - CYLINDRE 1', category: 'TROUSSES', checked: false },
    { id: 'trousse4', label: 'Trousse d\'oxygène (800 ou plus) - CYLINDRE 2', category: 'TROUSSES', checked: false },
    { id: 'trousse5', label: 'Trousse pédiatrique/obstétrique (vérification du scellé/péremption)', category: 'TROUSSES', checked: false },
    { id: 'trousse6', label: 'Trousse mesure d\'urgence', category: 'TROUSSES', checked: false },
    { id: 'trousse7', label: 'Kit à glycémie/Résultat du test hebdomadaire', category: 'TROUSSES', checked: false },
    { id: 'medkit_gel_indicator', label: 'Indicateur de gel "3M 0° celcius" (Qté: 1)', category: 'Trousse à médicaments', checked: false },
    { id: 'medkit_salbutamol_125', label: 'Salbutamol 1.25 mg (Qté: 4)', category: 'Trousse à médicaments', checked: false },
    { id: 'medkit_salbutamol_25', label: 'Salbutamol 2.5 mg (Qté: 10)', category: 'Trousse à médicaments', checked: false },
    { id: 'medkit_epinephrine', label: 'Épinéphrine 1mg/ml + ampoule break (Qté: 6)', category: 'Trousse à médicaments', checked: false },
    { id: 'medkit_nitroglycerine_general', label: 'Nitroglycérine (Qté: 1)', category: 'Trousse à médicaments', checked: false },
    { id: 'medkit_brumisateur', label: 'Brumisateur (Qté: 6)', category: 'Trousse à médicaments', checked: false },
    { id: 'medkit_echelle_douleur', label: 'Échelle de douleur (Qté: 1)', category: 'Trousse à médicaments', checked: false },
    { id: 'medkit_seringue_3ml', label: 'Seringue 3ml (Qté: 4)', category: 'Trousse à médicaments', checked: false },
    { id: 'medkit_seringue_1ml', label: 'Seringue 1ml (Qté: 4)', category: 'Trousse à médicaments', checked: false },
    { id: 'medkit_glucagon', label: 'Glucagon 1mg (Boitié orange) (Qté: 2)', category: 'Trousse à médicaments', checked: false },
    { id: 'medkit_garrot_veineux', label: 'Garrot veineux (Qté: 1)', category: 'Trousse à médicaments', checked: false },
    { id: 'medkit_naloxone', label: 'Naloxone 2 mg/2ml (Qté: 4)', category: 'Trousse à médicaments', checked: false },
    { id: 'medkit_autopiqueur', label: 'Autopiqueur (Qté: 7)', category: 'Trousse à médicaments', checked: false },
    { id: 'medkit_bandelette_supp', label: 'Bandelette supplémentaire (Qté: 1)', category: 'Trousse à médicaments', checked: false },
    { id: 'medkit_glucometre', label: 'Glucomètre (Qté: 1)', category: 'Trousse à médicaments', checked: false },
    { id: 'medkit_batterie_gluco', label: 'Batterie de rechange Glucomètre (Qté: 1)', category: 'Trousse à médicaments', checked: false },
    { id: 'medkit_instatglucose', label: 'Instatglucose/ Dextrose (Qté: 2)', category: 'Trousse à médicaments', checked: false },
    { id: 'medkit_gaz_2x2', label: 'Gaz 2X2 (Qté: 6)', category: 'Trousse à médicaments', checked: false },
    { id: 'medkit_tampon_alcool', label: 'Tampon d\'alcool/Nail remover (Qté: 6)', category: 'Trousse à médicaments', checked: false },
    { id: 'medkit_diachylon', label: 'Diachylon (Qté: 6)', category: 'Trousse à médicaments', checked: false },
    { id: 'medkit_aspirine', label: 'Sachet d\'aspirine 320 mg (Qté: 5)', category: 'Trousse à médicaments', checked: false },
    { id: 'armoire1', label: 'Armoires (vérification des scellés/péremptions)', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire2', label: 'CIVIÈRE: Rescue seat', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire3', label: 'Médi-toile', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire4', label: 'Planche de transfert', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire6', label: 'Civière-chaise', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire7', label: 'Vomit-bag', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire8', label: 'Pen light', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire9', label: 'Stéri-gel, matelas immobilisateur, pompe', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire10', label: 'Neutralisateur d\'odeur, clorox, essuie-tout', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire11', label: 'Kit colliers cervicaux (scellé): Adulte, pédiatrique', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire12', label: 'Urinoir, bassine, housse mortuaire, pied de biche, VIP', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire13', label: 'Draps de flanelle, couvertures', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire14', label: 'Succion murale, tubulure, tige rigide', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire15', label: 'Gros cylindre d\'oxygène (700 ou plus) - INSCRIRE NIVEAU PSI', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire16', label: 'Clé anglaise, clés du véhicule', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire17', label: 'Planche, Ked, Pédi-pac (scellé), MégaMover, sac bio-risque', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire18', label: 'Ceintures fast clip, Immobilisateur de tête', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire19', label: 'Attelles sous vide/pompe, abrasif, attelle en carton, lave-vitre', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire20', label: 'Trousse VPI (Ébola)', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false }
  ]);
  const [glycemieNormal, setGlycemieNormal] = useState('');
  const [glycemieHigh, setGlycemieHigh] = useState('');
  const [glycemieLow, setGlycemieLow] = useState('');
  const [cylindre1PSI, setCylindre1PSI] = useState('');
  const [cylindre2PSI, setCylindre2PSI] = useState('');
  const [grosCylindrePSI, setGrosCylindrePSI] = useState('');
  const [expirationDates, setExpirationDates] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Fonctions spécifiques
  const handleVehiculeCheckChange = (itemId: string) => {
    setVehiculeItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleExpirationDateChange = (itemId: string, date: string) => {
    // Basic validation for MM/AA format
    const cleanedDate = date.replace(/[^0-9/]/g, '');
    let formattedDate = cleanedDate;
    if (cleanedDate.length === 2 && !cleanedDate.includes('/')) {
      formattedDate = cleanedDate + '/';
    }
    if (cleanedDate.length > 2 && cleanedDate.charAt(2) !== '/') {
      formattedDate = cleanedDate.substring(0,2) + '/' + cleanedDate.substring(2);
    }
    
    setExpirationDates(prev => ({ ...prev, [itemId]: formattedDate.slice(0,5) })); // MM/AA is 5 chars
  };

  // Auto-check "Kit glycémie" if NORMAL, HIGH, or LOW values are entered
  useEffect(() => {
    if (glycemieNormal || glycemieHigh || glycemieLow) {
      const glycemieItem = vehiculeItems.find(item => item.id === 'trousse7');
      if (glycemieItem && !glycemieItem.checked) {
        handleVehiculeCheckChange('trousse7');
      }
    }
  }, [glycemieNormal, glycemieHigh, glycemieLow, vehiculeItems]);

  const validateVehiculeForm = (): string | null => {
    for (const item of vehiculeItems) {
      if (!item.checked) {
        return `Veuillez cocher: ${item.label}`;
      }
      if (item.id === 'trousse3' && !cylindre1PSI) return "PSI cylindre 1 manquant";
      if (item.id === 'trousse4' && !cylindre2PSI) return "PSI cylindre 2 manquant";
      if (item.id === 'armoire15' && !grosCylindrePSI) return "PSI gros cylindre manquant";

      if (ITEMS_REQUIRING_EXPIRATION.includes(item.id)) {
        const expDate = expirationDates[item.id];
        if (!expDate) {
          return `Date d'expiration manquante pour ${item.label.replace(/ \\(Qté: [^)]+\\)/, '')}`;
        }
        // Validate MM/AA format more strictly
        const datePattern = new RegExp("^(0[1-9]|1[0-2])\/([0-9]{2})$");
        if (!datePattern.test(expDate)) {
          return `Format de date d'expiration invalide pour ${item.label.replace(/ \\(Qté: [^)]+\\)/, '')} (attendu MM/AA)`;
        }
      }
    }
    if (!matricule) return "Matricule manquant";
    if (!numeroVehicule) return "Numéro véhicule manquant";
    if (!pointDeService) return "Point de service manquant";
    return null;
  };

  const generateVehiculeHTML = (): string => {
    let html = `
      <!DOCTYPE html>
      <html><head><title>Inspection Médicale</title><meta charset="UTF-8"><style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        h1 { color: #102947; text-align: center; margin-bottom: 20px; }
        .info { margin-bottom: 20px; } .info p { margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background-color: #102947; color: white; text-align: left; padding: 8px; }
        td { border: 1px solid #ddd; padding: 8px; }
        .category { background-color: #cfe2f3; font-weight: bold; } /* Light blue */
        .checked { color: green; font-weight: bold; } .not-checked { color: red; }
        footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style></head><body>
      <h1>Inspection Médicale (10-84)</h1>
      <div class="info">
        <p><strong>Matricule:</strong> ${matricule}</p>
        <p><strong>Numéro du véhicule:</strong> ${numeroVehicule}</p>
        <p><strong>Point de service:</strong> ${pointDeService}</p>
        <p><strong>Date et heure:</strong> ${getCurrentDateTime()}</p>
      </div>
      <table><thead><tr><th>Élément</th><th>Vérifié</th></tr></thead><tbody>
    `;

    const groupedItems = vehiculeItems.reduce<Record<string, CheckItem[]>>((acc, item) => {
      const categoryKey = item.category || 'Autres';
      if (!acc[categoryKey]) acc[categoryKey] = [];
      acc[categoryKey].push(item);
      return acc;
    }, {});

    (Object.entries(groupedItems) as [string, CheckItem[]][]).forEach(([category, items]) => {
      html += `<tr><td colspan="2" class="category">${category}</td></tr>`;
      items.forEach(item => {
        let itemLabel = item.label.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        if (item.id === 'trousse3' && cylindre1PSI) itemLabel += ` (PSI: ${cylindre1PSI})`;
        else if (item.id === 'trousse4' && cylindre2PSI) itemLabel += ` (PSI: ${cylindre2PSI})`;
        else if (item.id === 'armoire15' && grosCylindrePSI) itemLabel += ` (PSI: ${grosCylindrePSI})`;
        
        if (ITEMS_REQUIRING_EXPIRATION.includes(item.id) && expirationDates[item.id]) {
          itemLabel += ` (Exp: ${expirationDates[item.id]})`;
        }
        
        if (item.id === 'trousse7' && (glycemieNormal || glycemieHigh || glycemieLow)) {
          itemLabel += ` (Normal: ${glycemieNormal || '-'}, High: ${glycemieHigh || '-'}, Low: ${glycemieLow || '-'})`;
        }
        html += `<tr><td>${itemLabel}</td><td class="${item.checked ? 'checked' : 'not-checked'}">${item.checked ? '✓' : '✗'}</td></tr>`;
      });
    });

    html += `</tbody></table><footer>Inspection Médicale effectuée le ${getCurrentDateTime()}</footer></body></html>`;
    return html;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const validationError = validateVehiculeForm();
    if (validationError) {
      setError(validationError);
    } else {
      setShowConfirmation(true);
    }
  };

  const confirmSubmit = async () => {
    setShowConfirmation(false);
    setIsSubmitting(true);
    setError(null);
    try {
      const htmlContent = generateVehiculeHTML();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `inspection_vehicule_${numeroVehicule}_${timestamp}.html`;
      const webhookData = {
        type: 'Véhicule', matricule, dateTime: getCurrentDateTime(), pointDeService,
        numeroIdentifiant: numeroVehicule, htmlContent, fileName, mimeType: "text/html"
      };
      const success = await sendInspectionToMakecom('Véhicule', webhookData);
      if (success) {
        onSubmissionComplete("L'inspection Véhicule a été générée et envoyée avec succès.");
        setCylindre1PSI(''); setCylindre2PSI(''); setGrosCylindrePSI('');
        setGlycemieNormal(''); setGlycemieHigh(''); setGlycemieLow('');
        setExpirationDates({}); // Reset expiration dates
        setVehiculeItems(prev => prev.map(item => ({ ...item, checked: false })));
      } else {
        throw new Error("L'envoi des données a échoué.");
      }
    } catch (err) {
      const error = err as Error;
      console.error('Erreur soumission Véhicule:', error);
      setError(`Échec: ${error.message}`);
      onSubmissionComplete(`Échec Véhicule: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rendu JSX
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <header className="bg-[#102947] text-white p-4 rounded-lg shadow-md flex items-center justify-between mb-6">
        <div className="flex items-center">
          <img src="https://res.cloudinary.com/dxyvj8rka/image/upload/f_auto,q_auto/v1/cambi/iazjhbzvu6dv5fad398u" alt="Logo CAMBI" className="h-8 mr-2 filter brightness-0 invert" />
          <h1 className="text-xl font-bold">Inspection Médicale</h1>
        </div>
        <button onClick={goBack} className="flex items-center text-white"><ChevronLeft size={20} /> Retour</button>
      </header>
      <form ref={formRef} onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-4 mb-20">
        <div className="flex flex-col mb-6 space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <div className="md:w-1/3">
            <label htmlFor="numeroVehicule" className="block text-sm font-medium text-gray-700 mb-1">Véhicule # :</label>
            <input type="text" id="numeroVehicule" value={numeroVehicule} onChange={(e) => handleVehiculeNumberChange(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#102947]" required placeholder="Ex: 9198" />
          </div>
          <div className="md:w-1/3">
            <label htmlFor="pointDeServiceVehicule" className="block text-sm font-medium text-gray-700 mb-1">Point de service (PDS) :</label>
            <select id="pointDeServiceVehicule" value={pointDeService} onChange={(e) => setPointDeService(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#102947]" required>
              <option value="">Sélectionner PDS</option><option value="Sainte-Adèle">Sainte-Adèle</option><option value="Grenville">Grenville</option><option value="Saint-Donat">Saint-Donat</option>
            </select>
          </div>
           <div className="md:w-1/3">
              <label htmlFor="matriculeMedical" className="block text-sm font-medium text-gray-700 mb-1">Matricule TAP:</label>
              <input type="text" id="matriculeMedical" value={matricule} onChange={(e) => handleMatriculeChange(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#102947]" required placeholder="Ex: N-0100" />
            </div>
        </div>
         <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Date et heure :</label>
          <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-100">{getCurrentDateTime()}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead><tr><th className="border border-gray-300 p-2 bg-[#102947] text-white w-4/5">INSPECTION (10-84) DU MATÉRIEL CLINIQUE</th><th className="border border-gray-300 p-2 bg-[#102947] text-white w-1/5">Vérifié</th></tr></thead>
            <tbody>
              {Object.entries(vehiculeItems.reduce<Record<string, CheckItem[]>>((acc, item) => {
                const cat = item.category || 'Autres'; if (!acc[cat]) acc[cat] = []; acc[cat].push(item); return acc;
              }, {})).map(([category, items]) => (
                <React.Fragment key={category}>
                  <tr><td colSpan={2} className="border border-gray-300 p-2 bg-[#102947]/10 font-semibold">{category}</td></tr>
                  {items.map((item) => (
                    <tr 
                      key={item.id}
                      className={`${item.disabled ? 'bg-gray-200' : (item.checked ? 'bg-green-100' : '')} ${!item.disabled ? 'cursor-pointer' : ''} transition-colors`}
                      role="checkbox" 
                      aria-checked={item.checked}
                      tabIndex={item.disabled ? -1 : 0} 
                      onKeyDown={(e) => { if (!item.disabled && (e.key === ' ' || e.key === 'Enter')) handleVehiculeCheckChange(item.id); }}
                    >
                      <td className="border border-gray-300 p-2 text-sm" onClick={() => !item.disabled && handleVehiculeCheckChange(item.id)}>
                        {item.label}
                        {item.id === 'trousse3' && item.checked && <div className="mt-2" onClick={e => e.stopPropagation()}><input type="number" value={cylindre1PSI} onChange={e => setCylindre1PSI(e.target.value)} className="p-1 border rounded w-32" placeholder="PSI" required aria-label="PSI Cylindre 1"/></div>}
                        {item.id === 'trousse4' && item.checked && <div className="mt-2" onClick={e => e.stopPropagation()}><input type="number" value={cylindre2PSI} onChange={e => setCylindre2PSI(e.target.value)} className="p-1 border rounded w-32" placeholder="PSI" required aria-label="PSI Cylindre 2"/></div>}
                        {item.id === 'armoire15' && item.checked && <div className="mt-2" onClick={e => e.stopPropagation()}><input type="number" value={grosCylindrePSI} onChange={e => setGrosCylindrePSI(e.target.value)} className="p-1 border rounded w-32" placeholder="PSI" required aria-label="PSI Gros Cylindre"/></div>}
                        {item.id === 'trousse7' && item.checked && (
                          <div className="mt-2 space-y-2" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center"><span className="w-16 text-xs">NORMAL:</span><input type="number" value={glycemieNormal} onChange={e => setGlycemieNormal(e.target.value)} className="p-1 border rounded w-24" placeholder="mmol/L" aria-label="Glycemie Normal"/><span className="text-xs ml-2">(6,7-8,4)</span></div>
                            <div className="flex items-center"><span className="w-16 text-xs">HIGH:</span><input type="number" value={glycemieHigh} onChange={e => setGlycemieHigh(e.target.value)} className="p-1 border rounded w-24" placeholder="mmol/L" aria-label="Glycemie High"/><span className="text-xs ml-2">(19,4-24,3)</span></div>
                            <div className="flex items-center"><span className="w-16 text-xs">LOW:</span><input type="number" value={glycemieLow} onChange={e => setGlycemieLow(e.target.value)} className="p-1 border rounded w-24" placeholder="mmol/L" aria-label="Glycemie Low"/><span className="text-xs ml-2">(2,2-2,8)</span></div>
                          </div>
                        )}
                        {item.checked && ITEMS_REQUIRING_EXPIRATION.includes(item.id) && (
                          <div className="mt-2" onClick={e => e.stopPropagation()}>
                            <label htmlFor={`exp-${item.id}`} className="block text-xs font-medium text-gray-600 mb-0.5">Date d'exp.:</label>
                            <input
                              type="text"
                              id={`exp-${item.id}`}
                              value={expirationDates[item.id] || ''}
                              onChange={e => handleExpirationDateChange(item.id, e.target.value)}
                              className="p-1 border rounded w-24 text-sm focus:ring-1 focus:ring-[#102947] focus:border-[#102947]"
                              placeholder="MM/AA"
                              required
                              aria-label={`Date d'expiration pour ${item.label.replace(/ \\(Qté: [^)]+\\)/, '')}`}
                              maxLength={5}
                            />
                          </div>
                        )}
                      </td>
                      <td className="border border-gray-300 p-2 text-center w-20">
                        <input 
                          type="checkbox" 
                          checked={item.checked}
                          disabled={item.disabled}
                          onChange={() => handleVehiculeCheckChange(item.id)}
                          className="w-5 h-5 accent-[#102947] cursor-pointer"
                          required={item.id !== 'trousse7'} 
                          tabIndex={-1} 
                          aria-labelledby={`lab-${item.id}`}
                        />
                        <span id={`lab-${item.id}`} className="sr-only">{item.label}</span>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {error && <div role="alert" className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4 mb-4"><p>{error}</p></div>}
        <div className="sticky bottom-0 bg-white p-4 border-t mt-4">
          <button type="submit" className={`w-full ${isSubmitting ? 'bg-[#102947]/70 cursor-not-allowed' : 'bg-[#102947] hover:bg-[#102947]/90'} text-white py-3 px-6 rounded-lg transition-colors flex items-center justify-center`} disabled={isSubmitting}>
            {isSubmitting ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>Traitement...</> : <><Send className="mr-2" size={20} />Envoyer</>}
          </button>
        </div>
      </form>
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4"><h3 id="confirm-title" className="text-lg font-semibold">Confirmation</h3><button onClick={() => setShowConfirmation(false)} className="text-gray-500 hover:text-gray-700" aria-label="Fermer"><X size={20} /></button></div>
            <div className="mb-6"><div className="flex items-start mb-4"><AlertCircle className="text-[#102947] mr-3 mt-0.5 flex-shrink-0" size={24} aria-hidden="true" /><p>Finaliser et envoyer cette inspection au système central?</p></div></div>
            <div className="flex justify-end space-x-4"><button onClick={() => setShowConfirmation(false)} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100">Annuler</button><button onClick={confirmSubmit} className="px-4 py-2 bg-[#102947] text-white rounded-md hover:bg-[#102947]/90">Confirmer</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalInspectionPage; 