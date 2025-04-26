import React, { FormEvent, RefObject } from 'react';
import { ChevronLeft, Send, AlertCircle, X } from 'lucide-react';
import { CheckItem } from '../../types';
import BarcodeScanner from '../BarcodeScanner';

interface MedicalInspectionFormProps {
  goBack: () => void;
  form2Ref: RefObject<HTMLFormElement>;
  handleSubmitForm2: (e: FormEvent) => void;
  numeroVehicule: string;
  handleVehiculeNumberChange: (value: string) => void;
  pointDeService: string;
  setPointDeService: (value: string) => void;
  vehiculeItems: CheckItem[];
  handleVehiculeCheckChange: (id: string) => void;
  error: string;
  isSubmitting: boolean;
  showConfirmation: boolean;
  setShowConfirmation: (value: boolean) => void;
  confirmSubmitForm2: () => void;
  showScanner: boolean;
  setShowScanner: (value: boolean) => void;
  handleScanSuccess: (value: string) => void;
}

const MedicalInspectionForm: React.FC<MedicalInspectionFormProps> = ({
  goBack,
  form2Ref,
  handleSubmitForm2,
  numeroVehicule,
  handleVehiculeNumberChange,
  pointDeService,
  setPointDeService,
  vehiculeItems,
  handleVehiculeCheckChange,
  error,
  isSubmitting,
  showConfirmation,
  setShowConfirmation,
  confirmSubmitForm2,
  showScanner,
  setShowScanner,
  handleScanSuccess
}) => {
  // Obtenir l'heure et la date actuelles
  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleString('fr-CA', { 
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  // Grouper les éléments par catégorie
  const categorizedItems = vehiculeItems.reduce<Record<string, CheckItem[]>>((acc, item) => {
    if (!acc[item.category || 'Autres']) acc[item.category || 'Autres'] = [];
    acc[item.category || 'Autres'].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <header className="bg-[#102947] text-white p-4 rounded-lg shadow-md flex items-center justify-between mb-6">
        <div className="flex items-center">
          <img src="https://res.cloudinary.com/dxyvj8rka/image/upload/f_auto,q_auto/v1/cambi/iazjhbzvu6dv5fad398u" alt="Logo CAMBI" className="h-8 mr-2 filter brightness-0 invert" />
          <h1 className="text-xl font-bold">Inspection Médicale</h1>
        </div>
        <button onClick={goBack} className="flex items-center text-white">
          <ChevronLeft size={20} /> Retour
        </button>
      </header>
      
      <form ref={form2Ref} onSubmit={handleSubmitForm2} className="bg-white rounded-xl shadow-md p-4 mb-20">
        <div className="flex flex-col mb-6 space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <div className="md:w-1/3">
            <label htmlFor="numeroVehicule" className="block text-sm font-medium text-gray-700 mb-1">
              Véhicule # :
            </label>
            <input
              type="text"
              id="numeroVehicule"
              value={numeroVehicule}
              onChange={(e) => handleVehiculeNumberChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#102947] focus:border-[#102947]"
              required
              placeholder="Ex: 9198"
            />
          </div>
          
          <div className="md:w-1/3">
            <label htmlFor="pointDeServiceVehicule" className="block text-sm font-medium text-gray-700 mb-1">
              Point de service (PDS) :
            </label>
            <select
              id="pointDeServiceVehicule"
              value={pointDeService}
              onChange={(e) => setPointDeService(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#102947] focus:border-[#102947]"
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
                <th className="border border-gray-300 p-2 bg-[#102947] text-white w-4/5">INSPECTION (10-84) DU MATÉRIELS CLINIQUES</th>
                <th className="border border-gray-300 p-2 bg-[#102947] text-white w-1/5">Vérifié</th>
              </tr>
            </thead>
            <tbody>
              {/* Grouper les items par catégorie */}
              {Object.entries(categorizedItems).map(([category, items]) => (
                <React.Fragment key={category}>
                  <tr>
                    <td colSpan={2} className="border border-gray-300 p-2 bg-gray-200 font-bold">
                      {category}
                    </td>
                  </tr>
                  
                  {items.map(item => (
                    <tr 
                      key={item.id}
                      className={`${item.checked ? 'bg-green-100' : ''} cursor-pointer transition-colors`}
                      onClick={() => handleVehiculeCheckChange(item.id)}
                    >
                      <td className="border border-gray-300 p-2 text-sm">
                        {item.label}
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        <input 
                          type="checkbox" 
                          checked={item.checked}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => handleVehiculeCheckChange(item.id)}
                          className="w-5 h-5 accent-[#102947]"
                          required
                        />
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
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
            className={`w-full ${isSubmitting ? 'bg-[#102947]/70' : 'bg-[#102947] hover:bg-[#102947]/90'} text-white py-3 px-6 rounded-lg transition-colors flex items-center justify-center`}
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
                onClick={confirmSubmitForm2}
                className="px-4 py-2 bg-[#102947] text-white rounded-md hover:bg-[#102947]/90"
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
          onScanSuccess={handleScanSuccess} 
          onClose={() => setShowScanner(false)} 
        />
      )}
    </div>
  );
};

export default MedicalInspectionForm; 