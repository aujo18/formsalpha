// Script pour générer les icônes PWA à partir du logo CAMBI
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas, loadImage } from 'canvas';

// Obtenir le chemin du répertoire actuel (équivalent à __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemin de l'image source et des destinations
const sourceImagePath = path.join(__dirname, 'cambi-logo.png');
const output192Path = path.join(__dirname, 'public', 'pwa-192x192.png');
const output512Path = path.join(__dirname, 'public', 'pwa-512x512.png');
const outputIconPath = path.join(__dirname, 'public', 'favicon.ico');
const appleIconPath = path.join(__dirname, 'public', 'apple-touch-icon.png');
const apple152Path = path.join(__dirname, 'public', 'apple-icon-152x152.png');
const apple167Path = path.join(__dirname, 'public', 'apple-icon-167x167.png');
const appleSplashPath = path.join(__dirname, 'public', 'apple-splash-screen.png');

// Fonction pour créer une icône avec fond rouge
async function createIcon(size, outputPath) {
  // Créer un canvas avec la taille spécifiée
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Remplir avec la couleur rouge CAMBI (#b22a2e)
  ctx.fillStyle = '#b22a2e';
  ctx.fillRect(0, 0, size, size);
  
  try {
    // Charger l'image source
    const img = await loadImage(sourceImagePath);
    
    // Calculer les dimensions pour maintenir le ratio d'aspect
    const ratio = Math.min(size / img.width, size / img.height) * 0.7; // 70% de la taille pour laisser une marge
    const newWidth = img.width * ratio;
    const newHeight = img.height * ratio;
    
    // Centrer l'image
    const x = (size - newWidth) / 2;
    const y = (size - newHeight) / 2;
    
    // Dessiner l'image
    ctx.drawImage(img, x, y, newWidth, newHeight);
    
    // Convertir les pixels transparents en blanc pour assurer la visibilité sur iOS
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      // Si le pixel est transparent, le convertir en blanc
      if (data[i + 3] < 128) {
        data[i] = 255;      // R
        data[i + 1] = 255;  // G
        data[i + 2] = 255;  // B
        data[i + 3] = 255;  // A
      } else if (data[i + 3] < 255) {
        // Pour les pixels semi-transparents, les rendre complètement opaques
        data[i + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    
    // Sauvegarder l'image
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`Icon ${size}x${size} created at ${outputPath}`);
  } catch (err) {
    console.error(`Error creating icon ${size}x${size}:`, err);
  }
}

// Fonction pour créer un écran de démarrage pour iOS
async function createSplashScreen(width, height, outputPath) {
  // Créer un canvas avec la taille spécifiée
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Remplir avec la couleur rouge CAMBI (#b22a2e)
  ctx.fillStyle = '#b22a2e';
  ctx.fillRect(0, 0, width, height);
  
  try {
    // Charger l'image source
    const img = await loadImage(sourceImagePath);
    
    // Calculer les dimensions pour maintenir le ratio d'aspect
    // Logo plus grand pour l'écran de démarrage (50% de la plus petite dimension)
    const minDimension = Math.min(width, height);
    const logoSize = minDimension * 0.5;
    const ratio = Math.min(logoSize / img.width, logoSize / img.height);
    const newWidth = img.width * ratio;
    const newHeight = img.height * ratio;
    
    // Centrer l'image
    const x = (width - newWidth) / 2;
    const y = (height - newHeight) / 2;
    
    // Dessiner l'image
    ctx.drawImage(img, x, y, newWidth, newHeight);
    
    // Ajouter le texte "Inspection CAMBI" sous le logo
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Inspection CAMBI', width / 2, y + newHeight + 30);
    
    // Sauvegarder l'image
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`Splash screen ${width}x${height} created at ${outputPath}`);
  } catch (err) {
    console.error(`Error creating splash screen:`, err);
  }
}

// Fonction principale
async function main() {
  console.log('Generating PWA icons from CAMBI logo...');
  
  try {
    // Vérifier si l'image source existe
    if (!fs.existsSync(sourceImagePath)) {
      console.error(`Source image not found at ${sourceImagePath}`);
      return;
    }
    
    // Créer le dossier public s'il n'existe pas
    if (!fs.existsSync(path.join(__dirname, 'public'))) {
      fs.mkdirSync(path.join(__dirname, 'public'));
    }
    
    // Créer les icônes standard PWA
    await createIcon(192, output192Path);
    await createIcon(512, output512Path);
    
    // Créer les icônes pour iOS
    await createIcon(180, appleIconPath); // Icône Apple Touch principale (généralement 180x180)
    await createIcon(152, apple152Path);  // iPad, iPad mini
    await createIcon(167, apple167Path);  // iPad Pro
    
    // Créer un écran de démarrage de taille standard
    await createSplashScreen(1125, 2436, appleSplashPath); // Taille adaptée à la plupart des iPhones modernes
    
    // Copier l'icône principale pour le favicon
    fs.copyFileSync(output192Path, outputIconPath);
    console.log(`Favicon created at ${outputIconPath}`);
    
    console.log('All PWA icons generated successfully!');
  } catch (err) {
    console.error('Error generating PWA icons:', err);
  }
}

// Exécuter le script
main(); 