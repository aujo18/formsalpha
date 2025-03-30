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
    
    // Sauvegarder l'image
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`Icon ${size}x${size} created at ${outputPath}`);
  } catch (err) {
    console.error(`Error creating icon ${size}x${size}:`, err);
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
    
    // Créer les icônes
    await createIcon(192, output192Path);
    await createIcon(512, output512Path);
    await createIcon(180, appleIconPath); // Icône Apple Touch (généralement 180x180)
    
    // Note: favicon.ico nécessite un traitement spécial (multi-taille)
    // Pour simplifier, nous utilisons juste l'icône 192x192 comme favicon.ico
    fs.copyFileSync(output192Path, outputIconPath);
    console.log(`Favicon created at ${outputIconPath}`);
    console.log(`Apple Touch Icon created at ${appleIconPath}`);
    
    console.log('All PWA icons generated successfully!');
  } catch (err) {
    console.error('Error generating PWA icons:', err);
  }
}

// Exécuter le script
main(); 