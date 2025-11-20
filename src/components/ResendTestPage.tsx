import React, { useState } from 'react';
import { ChevronLeft, Send, AlertCircle, CheckCircle2 } from 'lucide-react';

type SendInspectionFn = (formType: string, data: Record<string, unknown>) => Promise<boolean>;

interface ResendTestPageProps {
  goBack: () => void;
  getCurrentDateTime: () => string;
  sendInspectionToMakecom: SendInspectionFn;
}

const ResendTestPage: React.FC<ResendTestPageProps> = ({
  goBack,
  getCurrentDateTime,
  sendInspectionToMakecom,
}) => {
  const [testMatricule, setTestMatricule] = useState('T-0000');
  const [testNumero, setTestNumero] = useState('TEST-0001');
  const [customMessage, setCustomMessage] = useState(
    'Ceci est un envoi de test via Resend pour valider la configuration.',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus('idle');
    setFeedback('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: Arial, sans-serif; color: #1f2937; }
            .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
            .title { font-size: 18px; font-weight: 600; margin-bottom: 8px; color: #102947; }
            .content { font-size: 14px; line-height: 1.5; }
            .footer { margin-top: 16px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="title">Test d'envoi Resend</div>
            <div class="content">
              <p><strong>Matricule test :</strong> ${testMatricule}</p>
              <p><strong>Identifiant test :</strong> ${testNumero}</p>
              <p>${customMessage}</p>
            </div>
            <div class="footer">
              Généré automatiquement le ${getCurrentDateTime()}.
            </div>
          </div>
        </body>
      </html>
    `;

  try {
      await sendInspectionToMakecom('TestResend', {
        type: 'TestResend',
        matricule: testMatricule,
        numeroIdentifiant: testNumero,
        pointDeService: 'Test - Resend',
        dateTime: getCurrentDateTime(),
        htmlContent,
      });
      setStatus('success');
      setFeedback("Succès! L'email de test a été envoyé via Resend.");
    } catch (error) {
      setStatus('error');
      if (error instanceof Error) {
        setFeedback(error.message);
      } else if (typeof error === 'string') {
        setFeedback(error);
      } else {
        setFeedback('Erreur inconnue lors de lenvoi.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <header className="bg-[#1f2937] text-white p-4 rounded-lg shadow-md flex items-center justify-between mb-6">
        <div className="flex items-center">
          <img
            src="https://res.cloudinary.com/dxyvj8rka/image/upload/f_auto,q_auto/v1/cambi/iazjhbzvu6dv5fad398u"
            alt="Logo CAMBI"
            className="h-8 mr-2 filter brightness-0 invert"
          />
          <h1 className="text-xl font-bold">Test d'envoi Resend</h1>
        </div>
        <button onClick={goBack} className="flex items-center text-white">
          <ChevronLeft size={20} className="mr-1" />
          Retour
        </button>
      </header>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-4 md:p-6">
        <p className="text-gray-600 text-sm mb-6">
          Cette page permet d'envoyer un email de test via la configuration Resend actuelle. Utilisez-la pour
          vérifier la variable d'environnement <code>RESEND_API_KEY</code> et le fonctionnement de la
          fonction serverless.
        </p>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Matricule test</label>
            <input
              type="text"
              value={testMatricule}
              onChange={(e) => setTestMatricule(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1f2937]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Identifiant test</label>
            <input
              type="text"
              value={testNumero}
              onChange={(e) => setTestNumero(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1f2937]"
              required
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Message personnalisé</label>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1f2937]"
            rows={5}
          />
        </div>

        {status !== 'idle' && (
          <div
            className={`flex items-center p-4 rounded-md mb-4 ${
              status === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}
            role="alert"
          >
            {status === 'success' ? (
              <CheckCircle2 className="mr-2" size={20} />
            ) : (
              <AlertCircle className="mr-2" size={20} />
            )}
            <span>{feedback}</span>
          </div>
        )}

        <div className="sticky bottom-0 bg-white p-4 border-t -mx-4 md:-mx-6">
          <button
            type="submit"
            className={`w-full ${
              isSubmitting ? 'bg-[#1f2937]/70 cursor-not-allowed' : 'bg-[#1f2937] hover:bg-[#111827]/90'
            } text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="mr-2" size={20} />
                Envoyer un email de test
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResendTestPage;

