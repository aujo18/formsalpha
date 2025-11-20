import { writeFileSync, existsSync } from 'fs';

const envPath = '.env';

if (!existsSync(envPath)) {
  const envContent = `# Clé API Resend pour l'envoi d'emails
RESEND_API_KEY=re_Dvt67PKr_3nrJf1tvYVcaEw2GByDSS3Sp

# Port du serveur API (optionnel, défaut: 3001)
API_PORT=3001
`;
  writeFileSync(envPath, envContent);
  console.log('✅ Fichier .env créé avec la clé API Resend');
} else {
  console.log('ℹ️  Fichier .env existe déjà');
}

