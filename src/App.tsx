import React, { useState, useRef } from 'react';
import { Ambulance, ClipboardCheck, Send, ChevronRight, ChevronLeft, CheckCircle2, X, Mail, Download, AlertCircle, Camera, RotateCcw, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';
import emailjs from '@emailjs/browser';
import BarcodeScanner from './components/BarcodeScanner';

// Interface pour les éléments à vérifier avec leur état de vérification
interface CheckItem {
  id: string;
  label: string;
  category?: string;
  subcategory?: string;
  checked: boolean;
  value?: string; // Pour stocker des valeurs comme PSI ou glycémie
  expireDate?: string; // Pour stocker les dates d'expiration
  disabled?: boolean; // Pour désactiver les items qui ne s'appliquent pas
  isConform?: boolean; // Pour indiquer si l'élément est conforme
  comment?: string; // Pour stocker un commentaire sur l'élément défectueux
}

function App() {
  const [currentForm, setCurrentForm] = useState<string | null>(null);
  const [matricule, setMatricule] = useState('');
  const [numeroMoniteur, setNumeroMoniteur] = useState('');
  const [numeroVehicule, setNumeroVehicule] = useState('');
  const [pointDeService, setPointDeService] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submissionDateTime, setSubmissionDateTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  
  // Références aux formulaires
  const form1Ref = useRef<HTMLFormElement>(null);
  const form2Ref = useRef<HTMLFormElement>(null);
  const form3Ref = useRef<HTMLFormElement>(null);
  
  // Valeurs pour les dates d'expiration des électrodes
  const [expireDateElectrode1, setExpireDateElectrode1] = useState('');
  const [expireDateElectrode2, setExpireDateElectrode2] = useState('');
  
  // Items pour le formulaire MDSA (version simplifiée)
  const [mdsaItems, setMdsaItems] = useState<CheckItem[]>([
    // Câbles et raccords
    { id: 'cable1', label: 'Câbles d\'oxymétrie (capteur et rallonge)', category: 'Câbles et raccords', checked: false },
    { id: 'cable2', label: 'Câbles de surveillance ECG à 4 brins et 6 brins', category: 'Câbles et raccords', checked: false },
    
    // Électrodes de défibrillations 
    { id: 'electrode1', label: '1 jeu d\'électrodes (scellé) adulte et pré-connecté', category: 'Électrodes de défibrillations', checked: false, expireDate: '' },
    { id: 'electrode2', label: '1 jeu d\'électrodes (scellé) Uni-Padz', category: 'Électrodes de défibrillations', checked: false, expireDate: '' },
  ]);

  // Fonction pour obtenir la date et l'heure actuelles
  const getCurrentDateTime = () => {
    const now = new Date();
    const date = now.toLocaleDateString('fr-CA', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = now.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
  };

  // Fonction pour gérer les cases à cocher du formulaire MDSA
  const handleMdsaCheckChange = (itemId: string) => {
    setMdsaItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, checked: !item.checked } 
          : item
      )
    );
  };

  // Fonction pour cocher tous les éléments d'une catégorie MDSA
  const handleCategoryAllChecked = (category: string) => {
    setMdsaItems(prevItems => 
      prevItems.map(item => 
        item.category === category
          ? { 
              ...item, 
              checked: true 
            } 
          : item
      )
    );
  };

  // Fonction pour mettre à jour le matricule
  const handleMatriculeChange = (value: string) => {
    setMatricule(value);
  };

  // Fonction pour gérer la soumission du formulaire MDSA
  const handleSubmitForm1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmation(true);
  };

  // Fonction pour revenir à l'écran d'accueil
  const goBack = () => {
    if (submitted) {
      setSubmitted(false);
    } else {
      setCurrentForm(null);
    }
  };

  // Page d'accueil avec les options de formulaire
  if (currentForm === null) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <header className="bg-[#b22a2e] text-white p-4 rounded-lg shadow-md flex items-center justify-between mb-8">
          <div className="flex items-center">
            <img src="https://res.cloudinary.com/dxyvj8rka/image/upload/f_auto,q_auto/v1/cambi/iazjhbzvu6dv5fad398u" alt="Logo CAMBI" className="h-8 mr-2 filter brightness-0 invert" />
            <h1 className="text-xl font-bold">Inspection AMC</h1>
          </div>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            onClick={() => setCurrentForm('form1')}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col items-center"
          >
            <div className="bg-[#b22a2e]/10 p-4 rounded-full mb-4">
              <ClipboardCheck size={32} className="text-[#b22a2e]" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Inspection MDSA</h2>
            <p className="text-gray-600 text-center text-sm">Vérification du moniteur défibrillateur semi-automatique</p>
          </button>
        </div>
      </div>
    );
  }

  // Formulaire 1: Inspection MDSA
  if (currentForm === 'form1') {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-6">
        <header className="bg-[#b22a2e] text-white p-4 rounded-lg shadow-md flex items-center justify-between mb-6">
          <div className="flex items-center">
            <img src="https://res.cloudinary.com/dxyvj8rka/image/upload/f_auto,q_auto/v1/cambi/iazjhbzvu6dv5fad398u" alt="Logo CAMBI" className="h-8 mr-2 filter brightness-0 invert" />
            <h1 className="text-xl font-bold">Inspection MDSA</h1>
          </div>
          <button onClick={goBack} className="flex items-center text-white">
            <ChevronLeft size={20} /> Retour
          </button>
        </header>
        
        <form ref={form1Ref} onSubmit={handleSubmitForm1} className="bg-white rounded-xl shadow-md p-4 mb-20">
          <div className="flex flex-col mb-6 space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="md:w-1/3">
              <label htmlFor="numeroMoniteur" className="block text-sm font-medium text-gray-700 mb-1">
                Numéro du moniteur :
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="numeroMoniteur"
                  value={numeroMoniteur}
                  onChange={(e) => setNumeroMoniteur(e.target.value)}
                  className="flex-1 p-2 border rounded-l-md focus:ring-2 focus:ring-[#b22a2e] focus:border-transparent"
                  placeholder="Scanner ou entrer le numéro"
                />
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="bg-[#b22a2e] text-white p-2 rounded-r-md hover:bg-[#b22a2e]/90"
                >
                  <Camera size={20} />
                </button>
              </div>
            </div>
            
            <div className="md:w-1/3">
              <label htmlFor="pointDeService" className="block text-sm font-medium text-gray-700 mb-1">
                Point de service (PDS) :
              </label>
              <select
                id="pointDeService"
                value={pointDeService}
                onChange={(e) => setPointDeService(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#b22a2e] focus:border-[#b22a2e]"
                required
              >
                <option value="">Sélectionner un PDS</option>
                <option value="Sainte-Adèle">Sainte-Adèle</option>
                <option value="Grenville">Grenville</option>
                <option value="Saint-Donat">Saint-Donat</option>
              </select>
            </div>
            
            <div className="md:w-1/3">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date et heure :
              </label>
              <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-100">
                {getCurrentDateTime()}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-2 bg-[#b22a2e] text-white w-4/5">INSPECTION DU MDSA</th>
                  <th className="border border-gray-300 p-2 bg-[#b22a2e] text-white w-1/5">Vérifié</th>
                </tr>
              </thead>
              <tbody>
                {/* Grouper les items par catégorie */}
                {Object.entries(
                  mdsaItems.reduce<Record<string, Record<string, CheckItem[]>>>((acc, item) => {
                    if (!acc[item.category || 'Autres']) acc[item.category || 'Autres'] = {};
                    
                    const subcategory = item.subcategory || 'default';
                    if (!acc[item.category || 'Autres'][subcategory]) {
                      acc[item.category || 'Autres'][subcategory] = [];
                    }
                    
                    acc[item.category || 'Autres'][subcategory].push(item);
                    return acc;
                  }, {})
                ).map(([category, subcategories]) => (
                  <React.Fragment key={category}>
                    <tr>
                      <td colSpan={2} className="border border-gray-300 p-2 bg-[#b22a2e]/10 font-semibold">
                        <div className="flex justify-between items-center">
                          <span>{category}</span>
                          <div className="flex items-center">
                            <span className="text-xs mr-2">Tout vérifié</span>
                            <input 
                              type="checkbox" 
                              onChange={() => handleCategoryAllChecked(category)}
                              className="w-5 h-5 accent-green-600 cursor-pointer"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                    
                    {Object.entries(subcategories).map(([subcategory, items]) => (
                      <React.Fragment key={subcategory}>
                        {subcategory !== 'default' && (
                          <tr>
                            <td colSpan={2} className="border border-gray-300 p-2 bg-gray-100 font-medium">
                              {subcategory}
                            </td>
                          </tr>
                        )}
                        
                        {/* Ici la partie qui était problématique, correctement implémentée avec .map() */}
                        {items.map(item => {
                          // Préparer le libellé avec les dates d'expiration si nécessaire
                          let itemLabel = item.label;
                          
                          if (item.id === 'electrode1' && expireDateElectrode1) {
                            itemLabel += ` (Expiration: ${expireDateElectrode1})`;
                          } else if (item.id === 'electrode2' && expireDateElectrode2) {
                            itemLabel += ` (Expiration: ${expireDateElectrode2})`;
                          }
                          
                          return (
                            <tr key={item.id} onClick={() => handleMdsaCheckChange(item.id)} className="cursor-pointer hover:bg-gray-50">
                              <td className="border border-gray-300 p-2">{itemLabel}</td>
                              <td className="border border-gray-300 p-2 text-center">
                                <div className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center ${item.checked ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                  {item.checked ? '✓' : '✗'}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))}
                
                <tr>
                  <td colSpan={2} className="border border-gray-300 p-2 bg-gray-100">
                    <div className="flex flex-col mb-6 space-y-4">
                      <div>
                        <label htmlFor="matricule" className="block text-sm font-medium text-gray-700 mb-1">
                          Matricule du TAP:
                        </label>
                        <input
                          type="text"
                          id="matricule"
                          value={matricule}
                          onChange={(e) => handleMatriculeChange(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#b22a2e] focus:border-[#b22a2e]"
                          required
                          placeholder="Ex: N-0100"
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4 mb-4">
              <p>{error}</p>
            </div>
          )}
          
          <div className="sticky bottom-0 bg-white p-4 border-t mt-4">
            <button
              type="submit"
              className={`w-full ${isSubmitting ? 'bg-[#b22a2e]/70' : 'bg-[#b22a2e] hover:bg-[#b22a2e]/90'} text-white py-3 px-6 rounded-lg transition-colors flex items-center justify-center`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Traitement en cours...
                </>
              ) : (
                <>
                  <Send className="mr-2" size={20} />
                  Envoyer l'inspection
                </>
              )}
            </button>
          </div>
        </form>
        
        {/* Boîte de dialogue de confirmation */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Confirmation</h3>
                <button onClick={() => setShowConfirmation(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={20} />
                </button>
              </div>
              <div className="mb-6">
                <div className="flex items-start mb-4">
                  <AlertCircle className="text-[#102947] mr-3 mt-0.5" size={24} />
                  <p>Êtes-vous sûr de vouloir finaliser cette inspection? Les données seront envoyées au système central.</p>
                </div>
              </div>
              <div className="flex justify-end space-x-4">
                <button 
                  onClick={() => setShowConfirmation(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => setShowConfirmation(false)}
                  className="px-4 py-2 bg-[#b22a2e] text-white rounded-md hover:bg-[#b22a2e]/90"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Scanner de code-barres */}
        {showScanner && (
          <BarcodeScanner 
            onScanSuccess={(result) => {
              setNumeroMoniteur(result);
              setShowScanner(false);
            }} 
            onClose={() => setShowScanner(false)} 
          />
        )}
      </div>
    );
  }

  return null;
}

export default App;
