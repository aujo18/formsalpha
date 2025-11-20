import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;

const RESEND_API_URL = 'https://api.resend.com/emails';
const RESEND_FROM_EMAIL = 'nepasrepondre@inspection.cambi.app';
const RESEND_TO_EMAIL = 'nicolas.cuerrier@tap.cambi.ca';
const FORM_SUBJECTS = {
  MDSA: 'Inspection MDSA',
  Véhicule: 'Inspection Médicale',
  Defectuosites: 'Inspection mécanique',
  NettoyageInventaire: 'Nettoyage et inventaire',
};

app.use(cors());
app.use(express.json());

const extractBodyContent = (html) => {
  if (!html) return '';
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return bodyMatch && bodyMatch[1] ? bodyMatch[1] : html;
};

const extractStyles = (html) => {
  if (!html) return '';
  const matches = html.match(/<style[^>]*>[\s\S]*?<\/style>/gi);
  return matches ? matches.join('\n') : '';
};

const buildSummaryTable = (rows) => `
  <table style="width:100%; border-collapse:collapse; margin:16px 0; font-size:14px;">
    ${rows.map(row => `
      <tr>
        <td style="width:35%; padding:8px; border:1px solid #e5e7eb; background:#f9fafb; font-weight:600;">${row.label}</td>
        <td style="padding:8px; border:1px solid #e5e7eb;">${row.value || 'Non précisé'}</td>
      </tr>
    `).join('')}
  </table>
`;

const buildEmailHtml = (formType, payload) => {
  const subjectBase = FORM_SUBJECTS[formType] || `Inspection ${formType}`;
  const identifier =
    payload?.numeroIdentifiant ||
    payload?.numeroVehicule ||
    payload?.numeroMoniteur ||
    payload?.numero ||
    '';

  const summaryRows = [
    { label: 'Formulaire', value: subjectBase },
    { label: 'Type', value: formType },
    { label: 'Identifiant', value: identifier || 'Non précisé' },
    { label: 'Matricule', value: payload?.matricule || 'Non précisé' },
    { label: 'Point de service', value: payload?.pointDeService || 'Non précisé' },
    { label: 'Date de soumission', value: payload?.dateTime || new Date().toLocaleString('fr-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) },
  ];

  const reportStyles = extractStyles(payload?.htmlContent);
  const reportBody = extractBodyContent(payload?.htmlContent);
  const htmlReportSection = payload?.htmlContent
    ? `<div style="border:1px solid #e5e7eb; border-radius:8px; padding:16px; margin-top:12px;">${reportStyles}${reportBody}</div>`
    : '<p style="margin-top:12px;">Aucun rapport HTML fourni.</p>';

  return `
    <div style="font-family:Arial, sans-serif; color:#1f2937;">
      <p>Bonjour,</p>
      <p>Un nouveau formulaire a été soumis via l'application d'inspection.</p>
      ${buildSummaryTable(summaryRows)}
      <h3 style="margin-top:24px; font-size:16px; font-weight:600;">Rapport détaillé</h3>
      ${htmlReportSection}
    </div>
  `;
};

// Route API pour l'envoi d'inspection
app.post('/api/send-inspection', async (req, res) => {
  console.log('[API] ✅ POST /api/send-inspection');
  console.log('[API] Body:', JSON.stringify(req.body).slice(0, 200));
  
  try {
    const { formType, payload } = req.body;

    if (!formType || !payload) {
      console.error('[API] ❌ Paramètres manquants');
      return res.status(400).json({ error: 'Paramètres formType et payload requis' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('[API] ❌ RESEND_API_KEY manquante');
      return res.status(500).json({ error: 'RESEND_API_KEY manquante sur le serveur' });
    }

    const subjectBase = FORM_SUBJECTS[formType] || `Inspection ${formType}`;
    const identifier =
      payload?.numeroIdentifiant ||
      payload?.numeroVehicule ||
      payload?.numeroMoniteur ||
      payload?.numero ||
      '';
    const subject = identifier ? `${subjectBase} - ${identifier}` : subjectBase;
    const emailHtml = buildEmailHtml(formType, payload);

    console.log(`[API] 📧 Envoi email Resend pour ${formType}...`);
    const response = await axios.post(
      RESEND_API_URL,
      {
        from: `CAMBI Inspections <${RESEND_FROM_EMAIL}>`,
        to: [RESEND_TO_EMAIL],
        subject,
        html: emailHtml,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Erreur serveur Resend: ${response.status}`);
    }

    console.log(`[API] ✅ Email envoyé (ID: ${response.data?.id || 'inconnu'})`);
    return res.status(200).json({ success: true, id: response.data?.id });
  } catch (error) {
    let errorMessage = 'Erreur inconnue';
    if (axios.isAxiosError(error)) {
      const axiosError = error;
      const responseData = axiosError.response?.data;
      if (typeof responseData === 'string') {
        errorMessage = responseData;
      } else if (responseData && typeof responseData === 'object') {
        errorMessage = responseData.message || JSON.stringify(responseData);
      } else {
        errorMessage = axiosError.message || 'Erreur Axios inconnue';
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    console.error(`[API] ❌ Échec: ${errorMessage}`);
    return res.status(500).json({ error: errorMessage });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur API démarré sur http://localhost:${PORT}`);
  console.log(`📧 Resend API: ${process.env.RESEND_API_KEY ? '✅ Clé trouvée' : '❌ Clé manquante'}`);
  console.log(`📝 Route disponible: POST http://localhost:${PORT}/api/send-inspection`);
});

