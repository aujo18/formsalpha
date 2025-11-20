import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const RESEND_API_URL = 'https://api.resend.com/emails';
const RESEND_FROM_EMAIL = 'nepasrepondre@inspection.cambi.app';
const RESEND_TO_EMAIL = 'nicolas.cuerrier@tap.cambi.ca';
const FORM_SUBJECTS = {
  MDSA: 'Inspection MDSA',
  Véhicule: 'Inspection Médicale',
  Defectuosites: 'Inspection mécanique',
  NettoyageInventaire: 'Nettoyage et inventaire',
};

const extractBodyContent = (html) => {
  if (!html) return '';
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch && bodyMatch[1]) {
    return bodyMatch[1];
  }
  return html;
};

const extractStyles = (html) => {
  if (!html) return '';
  const matches = html.match(/<style[^>]*>[\s\S]*?<\/style>/gi);
  return matches ? matches.join('\n') : '';
};

const buildSummaryTable = (rows) => `
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
    ? `
      <div style="border:1px solid #e5e7eb; border-radius:8px; padding:16px; margin-top:12px;">
        ${reportStyles}
        ${reportBody}
      </div>
    `
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

async function createServer() {
  const app = express();

  // Middleware de base
  app.use(cors());
  app.use(express.json());

  // Middleware de logging pour déboguer
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // ===== ROUTES API - DOIVENT ÊTRE AVANT LE MIDDLEWARE VITE =====
  
  // Route API pour l'envoi d'inspection
  app.post('/api/send-inspection', async (req, res) => {
    console.log('[API] ✅ Route /api/send-inspection appelée');
    console.log('[API] Body:', JSON.stringify(req.body).slice(0, 200));
    
    try {
      const { formType, payload } = req.body;

      if (!formType || !payload) {
        console.error('[API] ❌ Paramètres manquants:', { formType, hasPayload: !!payload });
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
        throw new Error(`Erreur serveur Resend: ${response.status} - ${response.data}`);
      }

      console.log(`[API] ✅ Email envoyé via Resend pour ${formType} (ID: ${response.data?.id || 'inconnu'})`);
      return res.status(200).json({ success: true, id: response.data?.id });
    } catch (error) {
      let errorMessage = 'Erreur inconnue';
      if (axios.isAxiosError(error)) {
        const axiosError = error;
        const responseData = axiosError.response?.data;
        let responseMessage;
        if (typeof responseData === 'string') {
          responseMessage = responseData;
        } else if (responseData && typeof responseData === 'object') {
          responseMessage = responseData.message;
        }
        errorMessage = responseMessage || axiosError.message || 'Erreur Axios inconnue';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      console.error(`[API] ❌ Échec de l'envoi ${req.body?.formType || 'inconnu'}: ${errorMessage}`);
      return res.status(500).json({ error: errorMessage });
    }
  });

  // Handler 404 pour les routes API non trouvées
  app.use('/api', (req, res) => {
    console.error(`[API] ❌ Route API non trouvée: ${req.method} ${req.path}`);
    res.status(404).json({ error: `Route API non trouvée: ${req.method} ${req.path}` });
  });

  // ===== MIDDLEWARE VITE - APRÈS TOUTES LES ROUTES API =====
  
  // Créer le serveur Vite en mode middleware
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  // Appliquer le middleware Vite UNIQUEMENT aux routes qui ne sont PAS /api
  app.use((req, res, next) => {
    // Si c'est une route API, ne PAS passer par Vite
    if (req.path.startsWith('/api')) {
      // Ne devrait jamais arriver ici car les routes API sont gérées ci-dessus
      console.error(`[API] ⚠️ Route API atteinte dans middleware Vite: ${req.method} ${req.path}`);
      return res.status(404).json({ error: 'Route API non trouvée' });
    }
    // Pour toutes les autres routes, utiliser le middleware Vite
    vite.middlewares(req, res, next);
  });

  return app;
}

createServer().then((app) => {
  const port = process.env.PORT || 5173;
  app.listen(port, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${port}`);
    console.log(`📧 API Resend configurée: ${process.env.RESEND_API_KEY ? '✅ Clé trouvée' : '❌ Clé manquante (définir RESEND_API_KEY)'}`);
    console.log(`📝 Routes API disponibles: POST /api/send-inspection`);
  });
});
