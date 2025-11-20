import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import axios, { AxiosError } from 'axios'; // Utilisé pour les appels à l'API Resend

// Importer les nouveaux composants
import HomePage from './components/HomePage'; // Assurez-vous que ce composant existe et est correct
import MdsaInspectionPage from './components/MdsaInspectionPage';
import MedicalInspectionPage from './components/MedicalInspectionPage';
import MechanicalInspectionPage from './components/MechanicalInspectionPage';
import MonthlyCleaningInventoryPage from './components/MonthlyCleaningInventoryPage';

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

  // Configuration Resend
  const RESEND_API_URL = 'https://api.resend.com/emails';
  const RESEND_API_KEY = 're_Dvt67PKr_3nrJf1tvYVcaEw2GByDSS3Sp';
  const RESEND_FROM_EMAIL = 'nepasrepondre@Inspection.cambi.app';
  const RESEND_TO_EMAIL = 'nicolas.cuerrier@tap.cambi.ca';
  const FORM_SUBJECTS: Record<string, string> = {
    MDSA: 'Inspection MDSA',
    'Véhicule': 'Inspection Médicale',
    Defectuosites: 'Inspection mécanique',
    NettoyageInventaire: 'Nettoyage et inventaire',
  };

  interface InspectionPayload {
    htmlContent?: string;
    matricule?: string;
    pointDeService?: string;
    dateTime?: string;
    numeroIdentifiant?: string;
    numeroVehicule?: string;
    numeroMoniteur?: string;
    numero?: string;
    [key: string]: unknown;
  }

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

  // Helpers pour formatter le rapport dans l'email
  const extractBodyContent = (html?: string) => {
    if (!html) return '';
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch && bodyMatch[1]) {
      return bodyMatch[1];
    }
    return html;
  };

  const extractStyles = (html?: string) => {
    if (!html) return '';
    const matches = html.match(/<style[^>]*>[\s\S]*?<\/style>/gi);
    return matches ? matches.join('\n') : '';
  };

  const buildSummaryTable = (rows: { label: string; value: string }[]) => `
    <table style="width:100%; border-collapse:collapse; margin:16px 0; font-size:14px;">
      ${rows
        .map(
          (row) => `
            <tr>
              <td style="width:35%; padding:8px; border:1px solid #e5e7eb; background:#f9fafb; font-weight:600;">${row.label}</td>
              <td style="padding:8px; border:1px solid #e5e7eb;">${row.value || 'Non précisé'}</td>
            </tr>
          `,
        )
        .join('')}
    </table>
  `;

  // Fonction d'envoi partagée (désormais via Resend)
  const sendInspectionToMakecom = async (formType: string, payload: InspectionPayload): Promise<boolean> => {
    const subjectBase = FORM_SUBJECTS[formType] || `Inspection ${formType}`;
    const identifier =
      payload?.numeroIdentifiant ||
      payload?.numeroVehicule ||
      payload?.numeroMoniteur ||
      payload?.numero ||
      '';
    const subject = identifier ? `${subjectBase} - ${identifier}` : subjectBase;
    const summaryRows = [
      { label: 'Formulaire', value: subjectBase },
      { label: 'Type', value: formType },
      { label: 'Identifiant', value: identifier || 'Non précisé' },
      { label: 'Matricule', value: payload?.matricule || matricule || 'Non précisé' },
      { label: 'Point de service', value: payload?.pointDeService || pointDeService || 'Non précisé' },
      { label: 'Date de soumission', value: payload?.dateTime || getCurrentDateTime() },
    ];

    const reportStyles = extractStyles(payload?.htmlContent);
    const reportBody = extractBodyContent(payload?.htmlContent);
    const htmlReportSection = payload?.htmlContent
      ? `
        <div style="border:1px solid #e5e7eb; border-radius:8px; padding:16px; margin-top:12px;">
          ${reportStyles}
          ${reportBody}
        </div>
      `
      : '<p style="margin-top:12px;">Aucun rapport HTML fourni.</p>';

    const emailHtml = `
      <div style="font-family:Arial, sans-serif; color:#1f2937;">
        <p>Bonjour,</p>
        <p>Un nouveau formulaire a été soumis via l'application d'inspection.</p>
        ${buildSummaryTable(summaryRows)}
        <h3 style="margin-top:24px; font-size:16px; font-weight:600;">Rapport détaillé</h3>
        ${htmlReportSection}
      </div>
    `;

    try {
      const response = await axios.post<{ id?: string }>(
        RESEND_API_URL,
        {
          from: `CAMBI Inspections <${RESEND_FROM_EMAIL}>`,
          to: [RESEND_TO_EMAIL],
          subject,
          html: emailHtml,
        },
        {
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Erreur serveur Resend: ${response.status} - ${response.data}`);
      }

      console.log(`Email envoyé via Resend pour ${formType} (ID: ${response.data?.id || 'inconnu'})`);
      return true;
    } catch (error) {
      console.error(`Erreur lors de l'envoi via Resend (${formType}):`, error);
      let errorMessage = 'Erreur inconnue';
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string } | string>;
        const responseData = axiosError.response?.data;
        let responseMessage: string | undefined;
        if (typeof responseData === 'string') {
          responseMessage = responseData;
        } else if (responseData && typeof responseData === 'object') {
          responseMessage = responseData.message;
        }
        errorMessage = responseMessage || axiosError.message || 'Erreur Axios inconnue';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
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
    onSubmissionComplete: handleSubmissionComplete,
    numeroVehicule,
    handleVehiculeNumberChange
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

  // Ajouter la condition pour le nouveau formulaire
  if (currentForm === 'form4') {
    // Passer les commonProps qui incluent maintenant sendInspection... et onSubmission...
    return <MonthlyCleaningInventoryPage {...commonProps} />;
  }

  // Fallback si currentForm a une valeur inattendue
  return (
    <div>Formulaire non trouvé. <button onClick={goBack}>Retour</button></div>
  );
}

export default App;