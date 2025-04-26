import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import axios from 'axios'; // Garder axios si sendInspectionToMakecom reste ici

// Importer les nouveaux composants
import HomePage from './components/HomePage'; // Assurez-vous que ce composant existe et est correct
import MdsaInspectionPage from './components/MdsaInspectionPage';
import MedicalInspectionPage from './components/MedicalInspectionPage';
import MechanicalInspectionPage from './components/MechanicalInspectionPage';

// Importer les types (si nécessaire, sinon les composants les importent)
// import { CheckItem } from './types';

import './index.css';

function App() {
  // États partagés
  const [currentForm, setCurrentForm] = useState<string | null>(null);
  const [matricule, setMatricule] = useState('');
  const [numeroVehicule, setNumeroVehicule] = useState('');
  const [pointDeService, setPointDeService] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submissionDateTime, setSubmissionDateTime] = useState('');
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);

  // URLs des API d'intégration (peuvent être déplacées dans un fichier config)
  const API_URL_MDSA = 'https://hook.us1.make.com/6npqjkskt1d71ir3aypy7h6434s98b8u';
  const API_URL_VEHICULE = 'https://hook.us2.make.com/c2vcdzy31bs3wmtubt46jx4a4f61xirq';
  const API_URL_DEFECTUOSITES = 'https://hook.us1.make.com/3xist7l1lcnruqvffssuyfv9sddmjxom';

  // Fonction utilitaire partagée
  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleString('fr-CA', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  // Fonctions de formatage partagées
  const handleMatriculeChange = (value: string) => {
    let sanitizedValue = value.replace(/[^a-zA-Z0-9-]/g, '');
    if (sanitizedValue.length === 0) { setMatricule(''); return; }
    const firstChar = sanitizedValue.charAt(0).toUpperCase();
    if (sanitizedValue.length === 1) { setMatricule(firstChar); return; }
    if (sanitizedValue.charAt(1) !== '-') {
      sanitizedValue = firstChar + '-' + sanitizedValue.substring(1);
    } else {
      sanitizedValue = firstChar + sanitizedValue.substring(1);
    }
    const regex = /^([A-Z])-?(\d{0,4}).*$/;
    const match = sanitizedValue.match(regex);
    if (match) {
      const letter = match[1];
      const numbers = match[2];
      setMatricule(`${letter}-${numbers}`);
    } else {
      setMatricule(sanitizedValue);
    }
  };

  const handleVehiculeNumberChange = (value: string) => {
    const sanitizedValue = value.replace(/[^0-9]/g, '');
    if (sanitizedValue.length === 0) { setNumeroVehicule(''); return; }
    const truncatedValue = sanitizedValue.substring(0, 4);
    if (truncatedValue.length === 4 && truncatedValue.charAt(0) !== '9') {
      setNumeroVehicule('9' + truncatedValue.substring(1));
    } else {
      setNumeroVehicule(truncatedValue);
    }
  };

  // Fonction d'envoi partagée
  const sendInspectionToMakecom = async (formType: string, webhookData: any): Promise<boolean> => {
    let webhookUrl = '';
    switch (formType) {
      case 'MDSA': webhookUrl = API_URL_MDSA; break;
      case 'Véhicule': webhookUrl = API_URL_VEHICULE; break;
      case 'Defectuosites': webhookUrl = API_URL_DEFECTUOSITES; break;
      default: throw new Error(`Type de formulaire inconnu pour webhook: ${formType}`);
    }

    console.log(`Envoi vers ${webhookUrl} pour ${formType}`);

    try {
        const response = await axios.post(webhookUrl, webhookData, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log(`Réponse ${formType} - Status:`, response.status);
        console.log(`Réponse complète ${formType}:`, response.data);

        if (response.status < 200 || response.status >= 300) {
            throw new Error(`Erreur serveur: ${response.status} - ${response.data}`);
        }

        console.log(`Données envoyées avec succès pour ${formType}`);
        return true;
    } catch (error) {
        console.error(`Erreur détaillée lors de l'envoi pour ${formType}:`, error);
        // Tenter d'extraire un message plus précis si c'est une erreur axios
        let errorMessage = 'Erreur inconnue';
        if (axios.isAxiosError(error)) {
            errorMessage = error.response?.data || error.message;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }
        console.error(`Problème lors de l'envoi de l'inspection ${formType}: ${errorMessage}`);
        // Relancer l'erreur pour que le composant appelant puisse la gérer
        throw new Error(`Échec de l'envoi (${formType}): ${errorMessage}`);
    }
  };

  // Gérer la fin de la soumission d'un formulaire
  const handleSubmissionComplete = (message: string) => {
    setSubmissionDateTime(getCurrentDateTime());
    setSubmissionMessage(message);
    setSubmitted(true);
    setCurrentForm(null); // Revenir à l'accueil après la page de succès

    // Réinitialiser les états partagés après soumission
    setMatricule('');
    setNumeroVehicule('');
    setPointDeService('');
  };

  // Fonction de retour (utilisée par les composants enfants)
  const goBack = () => {
    if (submitted) {
      setSubmitted(false);
      setSubmissionMessage(null);
    } 
    setCurrentForm(null); // Toujours revenir à l'accueil
    // Réinitialisation des états lors du retour à l'accueil ? Optionnel.
    // setMatricule('');
    // setNumeroVehicule('');
    // setPointDeService('');
  };

  // Rendu conditionnel

  // Page d'accueil
  if (currentForm === null && !submitted) {
    return <HomePage onFormSelect={setCurrentForm} />;
  }

  // Page de confirmation
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full text-center">
          <div className="bg-[#b22a2e]/10 p-4 rounded-full mx-auto w-20 h-20 flex items-center justify-center mb-4">
            <CheckCircle2 size={32} className="text-[#b22a2e]" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Inspection terminée!</h2>
          {submissionMessage && (
            <p className="text-gray-700 mb-4 whitespace-pre-wrap">{submissionMessage}</p>
          )}
          <p className="text-sm text-gray-500 mb-8">
            Terminé le {submissionDateTime}
          </p>
          <button 
            onClick={goBack} // Utilise goBack pour revenir à l'accueil
            className="bg-[#b22a2e] text-white py-3 px-6 rounded-lg hover:bg-[#b22a2e]/90 transition-colors w-full"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  // Rendu des formulaires spécifiques
  const commonProps = {
    goBack,
    matricule,
    handleMatriculeChange,
    pointDeService,
    setPointDeService,
    getCurrentDateTime,
    sendInspectionToMakecom,
    onSubmissionComplete,
    numeroVehicule, // Ajouté pour Médical et Mécanique
    handleVehiculeNumberChange // Ajouté pour Médical et Mécanique
  };

  if (currentForm === 'form1') {
    return <MdsaInspectionPage {...commonProps} />;
  }

  if (currentForm === 'form2') {
    return <MedicalInspectionPage {...commonProps} />;
  }

  if (currentForm === 'form3') {
    return <MechanicalInspectionPage {...commonProps} />;
  }

  // Fallback si currentForm a une valeur inattendue
  return (
    <div>Formulaire non trouvé. <button onClick={goBack}>Retour</button></div>
  );
}

export default App;