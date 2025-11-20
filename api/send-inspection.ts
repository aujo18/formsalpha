import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios, { AxiosError } from 'axios';

const RESEND_API_URL = 'https://api.resend.com/emails';
const RESEND_FROM_EMAIL = 'nepasrepondre@inspection.cambi.app';
const RESEND_TO_EMAIL = 'nicolas.cuerrier@tap.cambi.ca';
const FORM_SUBJECTS: Record<string, string> = {
  MDSA: 'Inspection MDSA',
  Véhicule: 'Inspection Médicale',
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

interface SendInspectionRequest {
  formType?: string;
  payload?: InspectionPayload;
}

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

const buildEmailHtml = (
  formType: string,
  payload: InspectionPayload,
  getCurrentDateTime: () => string,
) => {
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

const now = () =>
  new Date().toLocaleString('fr-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  let body: SendInspectionRequest;
  try {
    if (typeof req.body === 'string') {
      body = JSON.parse(req.body);
    } else {
      body = req.body as SendInspectionRequest;
    }
  } catch {
    return res.status(400).json({ error: 'Payload JSON invalide' });
  }

  const { formType, payload } = body || {};
  if (!formType || !payload) {
    return res.status(400).json({ error: 'Paramètres formType et payload requis' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
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
  const emailHtml = buildEmailHtml(formType, payload, now);

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
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Erreur serveur Resend: ${response.status} - ${response.data}`);
    }

    return res.status(200).json({ success: true, id: response.data?.id });
  } catch (error) {
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
    }

    console.error(`[send-inspection] Échec de l'envoi ${formType}: ${errorMessage}`);
    return res.status(500).json({ error: errorMessage });
  }
}

