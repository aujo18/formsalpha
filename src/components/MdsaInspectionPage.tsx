import React, { useState, useRef, FormEvent, useEffect } from 'react';
import { ChevronLeft, Send, AlertCircle, X, Camera } from 'lucide-react';
import { CheckItem } from '../types';
import BarcodeScanner from './BarcodeScanner';

interface MdsaInspectionPageProps {
  goBack: () => void;
  matricule: string;
  handleMatriculeChange: (value: string) => void;
  pointDeService: string;
  setPointDeService: (value: string) => void;
  getCurrentDateTime: () => string;
  sendInspectionToMakecom: (formType: string, data: any) => Promise<boolean>;
  onSubmissionComplete: (message: string) => void;
}

const MdsaInspectionPage: React.FC<MdsaInspectionPageProps> = ({
  goBack,
  matricule,
  handleMatriculeChange,
  pointDeService,
  setPointDeService,
  getCurrentDateTime,
  sendInspectionToMakecom,
  onSubmissionComplete
}) => {
  const [numeroMoniteur, setNumeroMoniteur] = useState('');
  const [expireDateElectrode1, setExpireDateElectrode1] = useState('');
  const [expireDateElectrode2, setExpireDateElectrode2] = useState('');
  const [mdsaItems, setMdsaItems] = useState<CheckItem[]>([
    { id: 'cable1', label: 'Câbles d\'oxymétrie (capteur et rallonge)', category: 'Câbles et raccords', checked: false },
    { id: 'cable2', label: 'Câbles de surveillance ECG à 4 brins et 6 brins', category: 'Câbles et raccords', checked: false },
    { id: 'cable3', label: 'Câble pour défibrillation incluant le connecteur de test et l\'Adaptateur CPRD', category: 'Câbles et raccords', checked: false },
    { id: 'cable4', label: 'Boyau de PNI et les connecteurs de brassards', category: 'Câbles et raccords', checked: false },
    { id: 'brassard1', label: 'Brassard adulte petit (bleu)', category: 'Brassards et PNI (pochette de droite)', checked: false },
    { id: 'brassard2', label: 'Brassard adulte standard (marine)', category: 'Brassards et PNI (pochette de droite)', checked: false },
    { id: 'brassard3', label: 'Brassard adulte grand (rouge)', category: 'Brassards et PNI (pochette de droite)', checked: false },
    { id: 'brassard4', label: 'Boyeau pour tension manuelle (sans brassard)', category: 'Brassards et PNI (pochette de droite)', checked: false },
    { id: 'brassard5', label: '***Rotation des batteries***', category: 'Brassards et PNI (pochette de droite)', checked: false },
    { id: 'electrode1', label: '1 jeu d\'électrodes (scellé) adulte et pré-connecté', category: 'Électrodes de défibrillations', checked: false, expireDate: '' },
    { id: 'electrode2', label: '1 jeu d\'électrodes (scellé) Uni-Padz', category: 'Électrodes de défibrillations', checked: false, expireDate: '' },
    { id: 'produit1', label: '1 paquet de papier pour imprimante ZOLL', category: 'Produits consommables', checked: false },
    { id: 'produit2', label: '4 ensembles d\'électrodes (4 unités) pour la surveillance ECG', category: 'Produits consommables', checked: false },
    { id: 'produit3', label: '4 ensembles d\'électrodes (6unités)', category: 'Produits consommables', checked: false },
    { id: 'produit4', label: 'Nettoyant à vernis', category: 'Produits consommables', checked: false },
    { id: 'produit5', label: 'Électrodes Skin Prep Pad', category: 'Produits consommables', checked: false },
    { id: 'produit6', label: '2 Rasoirs', category: 'Produits consommables', checked: false },
    { id: 'test1', label: 'a) Raccordez le câble multifonctions au connecteur de test', category: 'CONTRÔLE DE FONCTIONNEMENT', subcategory: 'Test de l\'appareil', checked: false },
    { id: 'test2', label: 'b) Mettez l\'appareil en fonction; 1 bip et les témoins d\'alarme visuels s\'allument', category: 'CONTRÔLE DE FONCTIONNEMENT', subcategory: 'Test de l\'appareil', checked: false },
    { id: 'test3', label: 'c) Confirmez le résultat auto test réussi à l\'écran', category: 'CONTRÔLE DE FONCTIONNEMENT', subcategory: 'Test de l\'appareil', checked: false },
    { id: 'defib1', label: 'a) Appuyez sur le bouton 30 j test', category: 'CONTRÔLE DE FONCTIONNEMENT', subcategory: 'Défibrillation', checked: false },
    { id: 'defib2', label: 'b) Appuyez sur le bouton CHOC, confirmez le résultat test défib réussi à l\'écran', category: 'CONTRÔLE DE FONCTIONNEMENT', subcategory: 'Défibrillation', checked: false },
    { id: 'defib3', label: 'c) Reconnectez câble de défibrillation sur les électrodes de défibrillation', category: 'CONTRÔLE DE FONCTIONNEMENT', subcategory: 'Défibrillation', checked: false },
    { id: 'oxy1', label: 'a) Fixez le capteur SPO2 à votre doigt; confirmez l\'affichage des valeurs', category: 'CONTRÔLE DE FONCTIONNEMENT', subcategory: 'Oxymétrie de pouls', checked: false },
    { id: 'oxy2', label: 'b) Retirez le capteur; vérifier capteur s\'affiche', category: 'CONTRÔLE DE FONCTIONNEMENT', subcategory: 'Oxymétrie de pouls', checked: false }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleMdsaCheckChange = (itemId: string) => {
    setMdsaItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleCategoryAllChecked = (category: string) => {
    setMdsaItems(prevItems =>
      prevItems.map(item =>
        item.category === category ? { ...item, checked: true } : item
      )
    );
  };

  const validateMdsaForm = (): string | null => {
    for (const item of mdsaItems) {
      if (!item.checked) return `Veuillez cocher tous les éléments: ${item.label}`;
      if (item.id === 'electrode1' && !expireDateElectrode1) return "Veuillez indiquer la date d\'expiration pour les électrodes adulte";
      if (item.id === 'electrode2' && !expireDateElectrode2) return "Veuillez indiquer la date d\'expiration pour les électrodes Uni-Padz";
    }
    if (!matricule) return "Veuillez entrer votre matricule";
    if (!numeroMoniteur) return "Veuillez entrer le numéro du moniteur";
    if (!pointDeService) return "Veuillez sélectionner le point de service";
    return null;
  };

  const generateMdsaHTML = (): string => {
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Inspection MDSA</title>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          h1 { color: #b22a2e; text-align: center; margin-bottom: 20px; }
          .info { margin-bottom: 20px; }
          .info p { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background-color: #b22a2e; color: white; text-align: left; padding: 8px; }
          td { border: 1px solid #ddd; padding: 8px; }
          .category { background-color: #f8d7da; font-weight: bold; }
          .subcategory { background-color: #fde4e4; font-weight: bold; }
          .checked { color: green; font-weight: bold; }
          .not-checked { color: red; }
          footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <h1>Inspection MDSA</h1>
        <div class="info">
          <p><strong>Matricule:</strong> ${matricule}</p>
          <p><strong>Numéro du moniteur:</strong> ${numeroMoniteur}</p>
          <p><strong>Point de service:</strong> ${pointDeService}</p>
          <p><strong>Date et heure:</strong> ${getCurrentDateTime()}</p>
        </div>
        <table>
          <thead><tr><th>Élément</th><th>Vérifié</th></tr></thead>
          <tbody>
    `;

    const groupedItems = mdsaItems.reduce<Record<string, Record<string, CheckItem[]>>>((acc, item) => {
      const categoryKey = item.category || 'Autres';
      if (!acc[categoryKey]) acc[categoryKey] = {};
      const subcategoryKey = item.subcategory || 'default';
      if (!acc[categoryKey][subcategoryKey]) acc[categoryKey][subcategoryKey] = [];
      acc[categoryKey][subcategoryKey].push(item);
      return acc;
    }, {});

    (Object.entries(groupedItems) as [string, Record<string, CheckItem[]>][]).forEach(([category, subcategories]) => {
      html += `<tr><td colspan="2" class="category">${category}</td></tr>`;
      (Object.entries(subcategories) as [string, CheckItem[]][]).forEach(([subcategory, items]) => {
        if (subcategory !== 'default') {
          html += `<tr><td colspan="2" class="subcategory">${subcategory}</td></tr>`;
        }
        items.forEach(item => {
          let itemLabel = item.label.replace(/</g, "&lt;").replace(/>/g, "&gt;"); // Sanitize label
          if (item.id === 'electrode1' && expireDateElectrode1) {
            itemLabel += ` (Expiration: ${expireDateElectrode1})`;
          } else if (item.id === 'electrode2' && expireDateElectrode2) {
            itemLabel += ` (Expiration: ${expireDateElectrode2})`;
          }
          html += `<tr><td>${itemLabel}</td><td class="${item.checked ? 'checked' : 'not-checked'}">${item.checked ? '✓' : '✗'}</td></tr>`;
        });
      });
    });

    html += `
          </tbody></table>
        <footer>Inspection MDSA effectuée le ${getCurrentDateTime()}</footer>
      </body></html>
    `;
    return html;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const validationError = validateMdsaForm();
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
      const htmlContent = generateMdsaHTML();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `inspection_mdsa_${numeroMoniteur}_${timestamp}.html`;
      const webhookData = {
        type: 'MDSA', matricule, dateTime: getCurrentDateTime(), pointDeService,
        numeroIdentifiant: numeroMoniteur, htmlContent, fileName, mimeType: "text/html"
      };
      const success = await sendInspectionToMakecom('MDSA', webhookData);
      if (success) {
        onSubmissionComplete("L'inspection MDSA a été générée et envoyée avec succès.");
        setNumeroMoniteur('');
        setExpireDateElectrode1('');
        setExpireDateElectrode2('');
        setMdsaItems(prev => prev.map(item => ({ ...item, checked: false, expireDate: '' })));
      } else {
        throw new Error("L'envoi des données a échoué.");
      }
    } catch (err) {
      const error = err as Error;
      console.error('Erreur soumission MDSA:', error);
      setError(`Échec: ${error.message}`);
      onSubmissionComplete(`Échec MDSA: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScanSuccess = (result: string) => {
    setNumeroMoniteur(result.trim());
    setShowScanner(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <header className="bg-[#b22a2e] text-white p-4 rounded-lg shadow-md flex items-center justify-between mb-6">
        <div className="flex items-center">
          <img src="https://res.cloudinary.com/dxyvj8rka/image/upload/f_auto,q_auto/v1/cambi/iazjhbzvu6dv5fad398u" alt="Logo CAMBI" className="h-8 mr-2 filter brightness-0 invert" />
          <h1 className="text-xl font-bold">Inspection MDSA</h1>
        </div>
        <button onClick={goBack} className="flex items-center text-white"><ChevronLeft size={20} /> Retour</button>
      </header>
      <form ref={formRef} onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-4 mb-20">
        <div className="mb-4">
          <label htmlFor="numeroMoniteur" className="block text-sm font-medium text-gray-700 mb-1">Numéro du moniteur :</label>
          <div className="flex">
            <input type="text" id="numeroMoniteur" value={numeroMoniteur} onChange={(e) => setNumeroMoniteur(e.target.value)} className="flex-1 p-2 border rounded-l-md focus:ring-2 focus:ring-[#b22a2e] focus:border-transparent" placeholder="Scanner ou entrer" required />
            <button type="button" onClick={() => setShowScanner(true)} className="bg-[#b22a2e] text-white p-2 rounded-r-md hover:bg-[#b22a2e]/90 z-10" aria-label="Scanner code-barres"><Camera size={20} /></button>
          </div>
        </div>
        <div className="flex flex-col mb-6 space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <div className="md:w-1/2">
            <label htmlFor="pointDeService" className="block text-sm font-medium text-gray-700 mb-1">Point de service (PDS) :</label>
            <select id="pointDeService" value={pointDeService} onChange={(e) => setPointDeService(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#b22a2e] focus:border-[#b22a2e]" required>
              <option value="">Sélectionner PDS</option><option value="Sainte-Adèle">Sainte-Adèle</option><option value="Grenville">Grenville</option><option value="Saint-Donat">Saint-Donat</option>
            </select>
          </div>
          <div className="md:w-1/2">
            <label htmlFor="matricule" className="block text-sm font-medium text-gray-700 mb-1">Matricule TAP:</label>
            <input type="text" id="matricule" value={matricule} onChange={(e) => handleMatriculeChange(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#b22a2e] focus:border-[#b22a2e]" required placeholder="Ex: N-0100" />
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Date et heure :</label>
          <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-100">{getCurrentDateTime()}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead><tr><th className="border border-gray-300 p-2 bg-[#b22a2e] text-white w-4/5">INSPECTION DU MDSA</th><th className="border border-gray-300 p-2 bg-[#b22a2e] text-white w-1/5">Vérifié</th></tr></thead>
            <tbody>
              {Object.entries(mdsaItems.reduce<Record<string, Record<string, CheckItem[]>>>((acc, item) => {
                const cat = item.category || 'Autres'; if (!acc[cat]) acc[cat] = {};
                const sub = item.subcategory || 'default'; if (!acc[cat][sub]) acc[cat][sub] = [];
                acc[cat][sub].push(item); return acc;
              }, {})).map(([category, subcategories]) => (
                <React.Fragment key={category}>
                  <tr><td colSpan={2} className="border border-gray-300 p-2 bg-[#b22a2e]/10 font-semibold"><div className="flex justify-between items-center"><span>{category}</span><div className="flex items-center"><span className="text-xs mr-2">Tout cocher</span><input type="checkbox" onChange={() => handleCategoryAllChecked(category)} className="w-5 h-5 accent-green-600 cursor-pointer" aria-label={`Tout cocher ${category}`} /></div></div></td></tr>
                  {Object.entries(subcategories).map(([subcategory, items]) => (
                    <React.Fragment key={subcategory}>
                      {subcategory !== 'default' && <tr><td colSpan={2} className="border border-gray-300 p-2 bg-gray-100 font-medium">{subcategory}</td></tr>}
                      {items.map(item => (
                        <tr 
                          key={item.id}
                          className={`${item.checked ? 'bg-green-100' : ''} ${!item.disabled ? 'cursor-pointer' : ''} transition-colors`}
                          role="checkbox"
                          aria-checked={item.checked}
                          tabIndex={item.disabled ? -1 : 0} 
                          onKeyDown={(e) => { if (!item.disabled && (e.key === ' ' || e.key === 'Enter')) handleMdsaCheckChange(item.id); }}
                        >
                          <td className="border border-gray-300 p-2 text-sm" onClick={() => !item.disabled && handleMdsaCheckChange(item.id)}>
                            {item.label}
                            {item.id === 'electrode1' && <div className="mt-2" onClick={e => e.stopPropagation()}><label htmlFor="exp1" className="sr-only">Exp Adult</label><input type="date" id="exp1" value={expireDateElectrode1} onChange={e => setExpireDateElectrode1(e.target.value)} className="p-1 border rounded w-full" required aria-label="Exp Adult" /></div>}
                            {item.id === 'electrode2' && <div className="mt-2" onClick={e => e.stopPropagation()}><label htmlFor="exp2" className="sr-only">Exp Uni</label><input type="date" id="exp2" value={expireDateElectrode2} onChange={e => setExpireDateElectrode2(e.target.value)} className="p-1 border rounded w-full" required aria-label="Exp Uni" /></div>}
                          </td>
                          <td className="border border-gray-300 p-2 text-center w-20">
                            <input 
                              type="checkbox" 
                              checked={item.checked}
                              onChange={() => handleMdsaCheckChange(item.id)}
                              className="w-5 h-5 accent-[#b22a2e] cursor-pointer"
                              disabled={item.disabled}
                              required
                              tabIndex={-1} 
                              aria-labelledby={`lab-${item.id}`}
                            />
                            <span id={`lab-${item.id}`} className="sr-only">{item.label}</span>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {error && <div role="alert" className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4 mb-4"><p>{error}</p></div>}
        <div className="sticky bottom-0 bg-white p-4 border-t mt-4">
          <button type="submit" className={`w-full ${isSubmitting ? 'bg-[#b22a2e]/70 cursor-not-allowed' : 'bg-[#b22a2e] hover:bg-[#b22a2e]/90'} text-white py-3 px-6 rounded-lg transition-colors flex items-center justify-center`} disabled={isSubmitting}>
            {isSubmitting ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>Traitement...</> : <><Send className="mr-2" size={20} />Envoyer</>}
          </button>
        </div>
      </form>
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4"><h3 id="confirm-title" className="text-lg font-semibold">Confirmation</h3><button onClick={() => setShowConfirmation(false)} className="text-gray-500 hover:text-gray-700" aria-label="Fermer"><X size={20} /></button></div>
            <div className="mb-6"><div className="flex items-start mb-4"><AlertCircle className="text-[#b22a2e] mr-3 mt-0.5 flex-shrink-0" size={24} aria-hidden="true" /><p>Finaliser et envoyer cette inspection au système central?</p></div></div>
            <div className="flex justify-end space-x-4"><button onClick={() => setShowConfirmation(false)} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100">Annuler</button><button onClick={confirmSubmit} className="px-4 py-2 bg-[#b22a2e] text-white rounded-md hover:bg-[#b22a2e]/90">Confirmer</button></div>
          </div>
        </div>
      )}
      {showScanner && <BarcodeScanner onScanSuccess={handleScanSuccess} onClose={() => setShowScanner(false)} />}
    </div>
  );
};

export default MdsaInspectionPage; 