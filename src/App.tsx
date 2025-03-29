import React, { useState, useRef } from 'react';
import { Ambulance, ClipboardCheck, Send, ChevronRight, ChevronLeft, CheckCircle2, X, Mail, Download, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import emailjs from '@emailjs/browser';

// Interface pour les éléments à vérifier avec leur état de vérification
interface CheckItem {
  id: string;
  label: string;
  category?: string;
  subcategory?: string;
  checked: boolean;
  value?: string; // Pour stocker des valeurs comme PSI ou glycémie
  expireDate?: string; // Pour stocker les dates d'expiration
}

function App() {
  const [currentForm, setCurrentForm] = useState<string | null>(null);
  const [matricule, setMatricule] = useState('');
  const [numeroMoniteur, setNumeroMoniteur] = useState('');
  const [numeroVehicule, setNumeroVehicule] = useState('');
  const [pointDeService, setPointDeService] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submissionDateTime, setSubmissionDateTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);
  
  // Référence aux formulaires
  const form1Ref = useRef<HTMLFormElement>(null);
  const form2Ref = useRef<HTMLFormElement>(null);
  
  // URLs des webhooks Make.com
  const WEBHOOK_URL_MRSA = 'https://hook.us1.make.com/6npqjkskt1d71ir3aypy7h6434s98b8u'; // URL du webhook MRSA
  const WEBHOOK_URL_VEHICULE = 'https://hook.us1.make.com/5unm52j98tg1nr5tz9esxk3jd2msj367'; // URL du webhook Véhicule
  
  // Valeurs pour la glycémie
  const [glycemieNormal, setGlycemieNormal] = useState('');
  const [glycemieHigh, setGlycemieHigh] = useState('');
  const [glycemieLow, setGlycemieLow] = useState('');
  
  // Valeurs pour les cylindres
  const [cylindre1PSI, setCylindre1PSI] = useState('');
  const [cylindre2PSI, setCylindre2PSI] = useState('');
  const [grosCylindrePSI, setGrosCylindrePSI] = useState('');
  
  // Valeurs pour les dates d'expiration des électrodes
  const [expireDateElectrode1, setExpireDateElectrode1] = useState('');
  const [expireDateElectrode2, setExpireDateElectrode2] = useState('');
  
  // Clés d'API pour EmailJS - intégrées directement dans le code
  const emailjsServiceId = 'service_op8kvgli';
  const emailjsTemplateId = 'template_ifzi0wm';
  // La clé peut être incorrecte, créons une solution de contournement
  const emailjsPublicKey = 'cMhKyGbQG-coeizSG';

  // Initialisation d'EmailJS
  React.useEffect(() => {
    // Initialiser EmailJS avec la clé
    try {
      emailjs.init(emailjsPublicKey);
      console.log("EmailJS initialisé avec succès");
    } catch (error) {
      console.error("Erreur lors de l'initialisation d'EmailJS:", error);
    }
  }, []);
  
  // Items pour le formulaire MRSA
  const [mrsaItems, setMrsaItems] = useState<CheckItem[]>([
    // Câbles et raccords
    { id: 'cable1', label: 'Câbles d\'oxymétrie (capteur et rallonge)', category: 'Câbles et raccords', checked: false },
    { id: 'cable2', label: 'Câbles de surveillance ECG à 4 brins et 6 brins', category: 'Câbles et raccords', checked: false },
    { id: 'cable3', label: 'Câble pour défibrillation incluant le connecteur de test et l\'Adaptateur CPRD', category: 'Câbles et raccords', checked: false },
    { id: 'cable4', label: 'Boyau de PNI et les connecteurs de brassards', category: 'Câbles et raccords', checked: false },
    
    // Brassards et PNI
    { id: 'brassard1', label: 'Brassard adulte petit (bleu)', category: 'Brassards et PNI (pochette de droite)', checked: false },
    { id: 'brassard2', label: 'Brassard adulte standard (marine)', category: 'Brassards et PNI (pochette de droite)', checked: false },
    { id: 'brassard3', label: 'Brassard adulte grand (rouge)', category: 'Brassards et PNI (pochette de droite)', checked: false },
    { id: 'brassard4', label: 'Boyeau pour tension manuelle (sans brassard)', category: 'Brassards et PNI (pochette de droite)', checked: false },
    { id: 'brassard5', label: '***Rotation des batteries***', category: 'Brassards et PNI (pochette de droite)', checked: false },
    
    // Électrodes de défibrillations
    { id: 'electrode1', label: '1 jeu d\'électrodes (scellé) adulte et pré-connecté', category: 'Électrodes de défibrillations', checked: false, expireDate: '' },
    { id: 'electrode2', label: '1 jeu d\'électrodes (scellé) Uni-Padz', category: 'Électrodes de défibrillations', checked: false, expireDate: '' },
    
    // Produits consommables
    { id: 'produit1', label: '1 paquet de papier pour imprimante ZOLL', category: 'Produits consommables', checked: false },
    { id: 'produit2', label: '4 ensembles d\'électrodes (4 unités) pour la surveillance ECG', category: 'Produits consommables', checked: false },
    { id: 'produit3', label: '4 ensembles d\'électrodes (6unités)', category: 'Produits consommables', checked: false },
    { id: 'produit4', label: 'Nettoyant à vernis', category: 'Produits consommables', checked: false },
    { id: 'produit5', label: 'Électrodes Skin Prep Pad', category: 'Produits consommables', checked: false },
    { id: 'produit6', label: '2 Rasoirs', category: 'Produits consommables', checked: false },
    
    // Contrôle de fonctionnement - Test de l'appareil
    { id: 'test1', label: 'a) Raccordez le câble multifonctions au connecteur de test', category: 'CONTRÔLE DE FONCTIONNEMENT', subcategory: 'Test de l\'appareil', checked: false },
    { id: 'test2', label: 'b) Mettez l\'appareil en fonction; 1 bip et les témoins d\'alarme visuels s\'allument', category: 'CONTRÔLE DE FONCTIONNEMENT', subcategory: 'Test de l\'appareil', checked: false },
    { id: 'test3', label: 'c) Confirmez le résultat auto test réussi à l\'écran', category: 'CONTRÔLE DE FONCTIONNEMENT', subcategory: 'Test de l\'appareil', checked: false },
    
    // Défibrillation
    { id: 'defib1', label: 'a) Appuyez sur le bouton 30 j test', category: 'CONTRÔLE DE FONCTIONNEMENT', subcategory: 'Défibrillation', checked: false },
    { id: 'defib2', label: 'b) Appuyez sur le bouton CHOC, confirmez le résultat test défib réussi à l\'écran', category: 'CONTRÔLE DE FONCTIONNEMENT', subcategory: 'Défibrillation', checked: false },
    { id: 'defib3', label: 'c) Reconnectez câble de défibrillation sur les électrodes de défibrillation', category: 'CONTRÔLE DE FONCTIONNEMENT', subcategory: 'Défibrillation', checked: false },
    
    // Oxymétrie de pouls
    { id: 'oxy1', label: 'a) Fixez le capteur SPO2 à votre doigt; confirmez l\'affichage des valeurs', category: 'CONTRÔLE DE FONCTIONNEMENT', subcategory: 'Oxymétrie de pouls', checked: false },
    { id: 'oxy2', label: 'b) Retirez le capteur; vérifier capteur s\'affiche', category: 'CONTRÔLE DE FONCTIONNEMENT', subcategory: 'Oxymétrie de pouls', checked: false }
  ]);

  // Items pour le formulaire Véhicule
  const [vehiculeItems, setVehiculeItems] = useState<CheckItem[]>([
    // Trousses
    { id: 'trousse1', label: 'Trousse support vital', category: 'TROUSSES', checked: false },
    { id: 'trousse2', label: 'Trousse à médicaments (vérification du scellé/péremption)', category: 'TROUSSES', checked: false },
    { id: 'trousse3', label: 'Trousse d\'oxygène (800 ou plus) - CYLINDRE 1', category: 'TROUSSES', checked: false },
    { id: 'trousse4', label: 'INSCRIRE NIVEAU PSI - CYLINDRE 2', category: 'TROUSSES', checked: false },
    { id: 'trousse5', label: 'Trousse pédiatrique/obstétrique (vérification du scellé/péremption)', category: 'TROUSSES', checked: false },
    { id: 'trousse6', label: 'Trousse mesure d\'urgence', category: 'TROUSSES', checked: false },
    { id: 'trousse7', label: 'Kit à glycémie/Résultat du test hebdomadaire', category: 'TROUSSES', checked: false },
    
    // Armoires
    { id: 'armoire1', label: 'Armoires (vérification des scellés/péremptions)', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire2', label: 'CIVIÈRE: Rescue seat', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire3', label: 'Médi-toile', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire4', label: 'Planche de transfert', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire5', label: '***Rotation de la batterie***', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire6', label: 'Civière-chaise', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire7', label: 'Vomit-bag', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire8', label: 'Pen light', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire9', label: 'Stéri-gel, matelas immobilisateur, pompe', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire10', label: 'Neutralisateur d\'odeur, clorox, essuie-tout', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire11', label: 'Kit colliers cervicaux (scellé): Adulte, pédiatrique', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire12', label: 'Urinoir, bassine, housse mortuaire, pied de biche, VIP', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire13', label: 'Draps de flanelle, couvertures', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire14', label: 'Succion murale, tubulure, tige rigide', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire15', label: 'Gros cylindre d\'oxygène (700 ou plus) - INSCRIRE NIVEAU PSI', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire16', label: 'Clé anglaise, clés du véhicule', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire17', label: 'Planche, Ked, Pédi-pac (scellé), MégaMover, sac bio-risque', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire18', label: 'Ceintures fast clip, Immobilisateur de tête', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire19', label: 'Attelles sous vide/pompe, abrasif, attelle en carton, lave-vitre', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire20', label: 'Trousse VPI (Ébola)', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false }
  ]);
  
  // Obtenir la date et l'heure actuelles au format lisible
  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleString('fr-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Fonction pour mettre à jour l'état d'une case à cocher du MRSA
  const handleMrsaCheckChange = (itemId: string) => {
    setMrsaItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              checked: !item.checked
            } 
          : item
      )
    );
  };

  // Fonction pour mettre à jour la date d'expiration d'un item du MRSA
  const handleMrsaExpireDateChange = (itemId: string, date: string) => {
    setMrsaItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              expireDate: date
            } 
          : item
      )
    );
  };

  // Fonction pour mettre à jour l'état d'une case à cocher du véhicule
  const handleVehiculeCheckChange = (itemId: string) => {
    setVehiculeItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              checked: !item.checked
            } 
          : item
      )
    );
  };

  // Vérifier si tous les champs requis sont remplis
  const validateMrsaForm = () => {
    // Vérifier si tous les éléments à cocher sont cochés
    for (const item of mrsaItems) {
      if (!item.checked) {
        return `Veuillez cocher tous les éléments: ${item.label}`;
      }
      
      // Vérifier les dates d'expiration pour les électrodes
      if (item.id === 'electrode1' && !expireDateElectrode1) {
        return "Veuillez indiquer la date d'expiration pour les électrodes adulte";
      }
      if (item.id === 'electrode2' && !expireDateElectrode2) {
        return "Veuillez indiquer la date d'expiration pour les électrodes Uni-Padz";
      }
    }
    
    // Vérifier les champs obligatoires
    if (!matricule) return "Veuillez entrer votre matricule";
    if (!numeroMoniteur) return "Veuillez entrer le numéro du moniteur";
    if (!pointDeService) return "Veuillez sélectionner le point de service";
    
    return null;
  };

  // Vérifier si tous les champs requis sont remplis pour le formulaire Véhicule
  const validateVehiculeForm = () => {
    // Vérifier si tous les éléments à cocher sont cochés
    for (const item of vehiculeItems) {
      if (!item.checked) {
        // Exception pour le kit à glycémie qui n'est pas obligatoire
        if (item.id === 'trousse7') continue;
        
        return `Veuillez cocher tous les éléments: ${item.label}`;
      }
      
      // Vérifier les valeurs PSI
      if (item.id === 'trousse3' && !cylindre1PSI) {
        return "Veuillez indiquer le niveau PSI du cylindre 1";
      }
      
      if (item.id === 'trousse4' && !cylindre2PSI) {
        return "Veuillez indiquer le niveau PSI du cylindre 2";
      }
      
      if (item.id === 'armoire15' && !grosCylindrePSI) {
        return "Veuillez indiquer le niveau PSI du gros cylindre d'oxygène";
      }
    }
    
    // Vérifier les champs obligatoires
    if (!matricule) return "Veuillez entrer votre matricule";
    if (!numeroVehicule) return "Veuillez entrer le numéro du véhicule";
    if (!pointDeService) return "Veuillez sélectionner le point de service";
    
    return null;
  };

  // Fonction pour formater le matricule (lettre-chiffres)
  const handleMatriculeChange = (value: string) => {
    // Supprimer tous les caractères qui ne sont pas des lettres, des chiffres ou un tiret
    let sanitizedValue = value.replace(/[^a-zA-Z0-9-]/g, '');
    
    // Si la chaîne est vide, ne rien faire
    if (sanitizedValue.length === 0) {
      setMatricule('');
      return;
    }
    
    // Extraire la première lettre et la mettre en majuscule
    const firstChar = sanitizedValue.charAt(0).toUpperCase();
    
    // Si la valeur n'a qu'un caractère, c'est juste la lettre
    if (sanitizedValue.length === 1) {
      setMatricule(firstChar);
      return;
    }
    
    // Si le second caractère n'est pas un tiret, l'ajouter
    if (sanitizedValue.charAt(1) !== '-') {
      sanitizedValue = firstChar + '-' + sanitizedValue.substring(1);
    } else {
      sanitizedValue = firstChar + sanitizedValue.substring(1);
    }
    
    // Limiter à une lettre, un tiret et 4 chiffres maximum
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

  // Fonction pour formater le numéro de véhicule (4 chiffres commençant par 9)
  const handleVehiculeNumberChange = (value: string) => {
    // Garder seulement les chiffres
    const sanitizedValue = value.replace(/[^0-9]/g, '');
    
    // Si la chaîne est vide, ne rien faire
    if (sanitizedValue.length === 0) {
      setNumeroVehicule('');
      return;
    }
    
    // Limiter à 4 chiffres maximum
    const truncatedValue = sanitizedValue.substring(0, 4);
    
    // Si l'utilisateur a terminé sa saisie (4 chiffres), on s'assure que ça commence par 9
    if (truncatedValue.length === 4 && truncatedValue.charAt(0) !== '9') {
      setNumeroVehicule('9' + truncatedValue.substring(1));
    } else {
      // Pendant la saisie, on garde ce que l'utilisateur entre
      setNumeroVehicule(truncatedValue);
    }
  };

  // Fonction pour générer un PDF de l'inspection MRSA
  const generateMrsaPDF = () => {
    const doc = new jsPDF();
    
    // Titre du document
    doc.setFontSize(18);
    doc.text('Inspection MRSA', 105, 15, { align: 'center' });
    
    // Informations générales
    doc.setFontSize(12);
    doc.text(`Matricule: ${matricule}`, 14, 30);
    doc.text(`Numéro du moniteur: ${numeroMoniteur}`, 14, 38);
    doc.text(`Point de service: ${pointDeService}`, 14, 46);
    doc.text(`Date et heure: ${getCurrentDateTime()}`, 14, 54);
    
    // Créer un tableau manuellement (sans autoTable)
    let yPosition = 60;
    
    // En-tête du tableau
    doc.setFillColor(66, 135, 245);
    doc.setTextColor(255, 255, 255);
    doc.rect(14, yPosition, 130, 10, 'F');
    doc.rect(144, yPosition, 52, 10, 'F');
    doc.text("Élément", 16, yPosition + 7);
    doc.text("Vérifié", 160, yPosition + 7);
    yPosition += 10;
    
    // Réinitialiser la couleur du texte
    doc.setTextColor(0, 0, 0);
    
    // Lignes de données
    let currentCategory = '';
    
    mrsaItems.forEach(item => {
      // Nouvelle catégorie
      if (item.category !== currentCategory) {
        currentCategory = item.category || 'Autre';
        
        // Dessiner la ligne de catégorie
        doc.setFillColor(200, 220, 255);
        doc.rect(14, yPosition, 182, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.text(currentCategory, 16, yPosition + 6);
        doc.setFont('helvetica', 'normal');
        yPosition += 8;
        
        // Vérifier si on a besoin d'une nouvelle page
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
      }
      
      // Sous-catégorie si nécessaire
      if (item.subcategory && (mrsaItems.find(i => i.category === item.category && i.subcategory === item.subcategory) === item)) {
        doc.setFillColor(240, 240, 240);
        doc.rect(14, yPosition, 182, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.text(item.subcategory, 16, yPosition + 6);
        doc.setFont('helvetica', 'normal');
        yPosition += 8;
        
        // Vérifier si on a besoin d'une nouvelle page
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
      }
      
      // Préparer le texte de l'élément
      let itemText = item.label;
      if (item.id === 'electrode1' && expireDateElectrode1) {
        itemText += ` (Expiration: ${expireDateElectrode1})`;
      } else if (item.id === 'electrode2' && expireDateElectrode2) {
        itemText += ` (Expiration: ${expireDateElectrode2})`;
      }
      
      // Couper le texte si nécessaire
      const maxWidth = 125;
      let lines = doc.splitTextToSize(itemText, maxWidth);
      
      // Dessiner la ligne d'élément
      const lineHeight = lines.length * 7;
      doc.rect(14, yPosition, 130, lineHeight + 5, 'S');
      doc.rect(144, yPosition, 52, lineHeight + 5, 'S');
      
      // Ajouter le texte
      for (let i = 0; i < lines.length; i++) {
        doc.text(lines[i], 16, yPosition + 5 + (i * 7));
      }
      
      // Ajouter la marque de vérification - AMÉLIORATION ICI
      if (item.checked) {
        // Dessiner un carré coloré avec un X à l'intérieur au lieu d'un simple checkmark
        const checkboxSize = 10;
        const centerX = 170;
        const centerY = yPosition + 5 + (lineHeight/2);
        
        // Rectangle coloré
        doc.setFillColor(50, 150, 50); // Vert foncé
        doc.rect(centerX - checkboxSize/2, centerY - checkboxSize/2, checkboxSize, checkboxSize, 'F');
        
        // X blanc à l'intérieur
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text('X', centerX - 1.5, centerY + 3);
        
        // Restaurer la couleur du texte
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
      } else {
        // Case vide pour les éléments non cochés
        const checkboxSize = 10;
        const centerX = 170;
        const centerY = yPosition + 5 + (lineHeight/2);
        
        // Rectangle vide
        doc.rect(centerX - checkboxSize/2, centerY - checkboxSize/2, checkboxSize, checkboxSize, 'S');
      }
      
      yPosition += lineHeight + 5;
      
      // Vérifier si on a besoin d'une nouvelle page
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 20;
      }
    });
    
    // Pied de page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(`Inspection MRSA - Page ${i} de ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
    }
    
    return doc;
  };
  
  // Fonction pour générer un PDF de l'inspection Véhicule
  const generateVehiculePDF = () => {
    const doc = new jsPDF();
    
    // Titre du document
    doc.setFontSize(18);
    doc.text('Inspection Véhicule', 105, 15, { align: 'center' });
    
    // Informations générales
    doc.setFontSize(12);
    doc.text(`Matricule: ${matricule}`, 14, 30);
    doc.text(`Numéro du véhicule: ${numeroVehicule}`, 14, 38);
    doc.text(`Point de service: ${pointDeService}`, 14, 46);
    doc.text(`Date et heure: ${getCurrentDateTime()}`, 14, 54);
    
    // Créer un tableau manuellement (sans autoTable)
    let yPosition = 60;
    
    // En-tête du tableau
    doc.setFillColor(66, 180, 80);
    doc.setTextColor(255, 255, 255);
    doc.rect(14, yPosition, 130, 10, 'F');
    doc.rect(144, yPosition, 52, 10, 'F');
    doc.text("Élément", 16, yPosition + 7);
    doc.text("Vérifié", 160, yPosition + 7);
    yPosition += 10;
    
    // Réinitialiser la couleur du texte
    doc.setTextColor(0, 0, 0);
    
    // Lignes de données
    let currentCategory = '';
    
    vehiculeItems.forEach(item => {
      // Nouvelle catégorie
      if (item.category !== currentCategory) {
        currentCategory = item.category || 'Autre';
        
        // Dessiner la ligne de catégorie
        doc.setFillColor(255, 240, 200);
        doc.rect(14, yPosition, 182, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.text(currentCategory, 16, yPosition + 6);
        doc.setFont('helvetica', 'normal');
        yPosition += 8;
        
        // Vérifier si on a besoin d'une nouvelle page
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
      }
      
      // Préparer le texte de l'élément
      let itemText = item.label;
      // Ajouter des informations supplémentaires pour les cylindres et la glycémie
      if (item.id === 'trousse3' && cylindre1PSI) {
        itemText += ` (PSI: ${cylindre1PSI})`;
      } else if (item.id === 'trousse4' && cylindre2PSI) {
        itemText += ` (PSI: ${cylindre2PSI})`;
      } else if (item.id === 'armoire15' && grosCylindrePSI) {
        itemText += ` (PSI: ${grosCylindrePSI})`;
      } else if (item.id === 'trousse7' && (glycemieNormal || glycemieHigh || glycemieLow)) {
        itemText += ` (Normal: ${glycemieNormal || '-'}, High: ${glycemieHigh || '-'}, Low: ${glycemieLow || '-'})`;
      }
      
      // Couper le texte si nécessaire
      const maxWidth = 125;
      let lines = doc.splitTextToSize(itemText, maxWidth);
      
      // Dessiner la ligne d'élément
      const lineHeight = lines.length * 7;
      doc.rect(14, yPosition, 130, lineHeight + 5, 'S');
      doc.rect(144, yPosition, 52, lineHeight + 5, 'S');
      
      // Ajouter le texte
      for (let i = 0; i < lines.length; i++) {
        doc.text(lines[i], 16, yPosition + 5 + (i * 7));
      }
      
      // Ajouter la marque de vérification - AMÉLIORATION ICI
      if (item.checked) {
        // Dessiner un carré coloré avec un X à l'intérieur au lieu d'un simple checkmark
        const checkboxSize = 10;
        const centerX = 170;
        const centerY = yPosition + 5 + (lineHeight/2);
        
        // Rectangle coloré
        doc.setFillColor(50, 150, 50); // Vert foncé
        doc.rect(centerX - checkboxSize/2, centerY - checkboxSize/2, checkboxSize, checkboxSize, 'F');
        
        // X blanc à l'intérieur
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text('X', centerX - 1.5, centerY + 3);
        
        // Restaurer la couleur du texte
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
      } else {
        // Case vide pour les éléments non cochés
        const checkboxSize = 10;
        const centerX = 170;
        const centerY = yPosition + 5 + (lineHeight/2);
        
        // Rectangle vide
        doc.rect(centerX - checkboxSize/2, centerY - checkboxSize/2, checkboxSize, checkboxSize, 'S');
      }
      
      yPosition += lineHeight + 5;
      
      // Vérifier si on a besoin d'une nouvelle page
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 20;
      }
    });
    
    // Pied de page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(`Inspection Véhicule - Page ${i} de ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
    }
    
    return doc;
  };
  
  // Fonction pour envoyer le PDF par e-mail
  const sendPdfByEmail = async (pdfBlob: Blob, formType: string) => {
    try {
      console.log(`Début de la préparation de l'envoi pour ${formType}...`);
      console.log(`Type du PDF blob:`, pdfBlob.type);
      console.log(`Taille du PDF blob:`, pdfBlob.size, "bytes");
      
      // Convertir le PDF en base64 AVEC le préfixe data:application/pdf;base64,
      const reader = new FileReader();
      const pdfBase64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const fullBase64 = reader.result as string;
          if (fullBase64) {
            // Gardons le préfixe data:application/pdf;base64, pour Make.com
            console.log(`PDF ${formType} converti en base64 avec succès, taille complète:`, fullBase64.length);
            // Vérifions si le préfixe est correct
            if (!fullBase64.startsWith('data:application/pdf;base64,')) {
              console.warn(`Le préfixe base64 n'est pas comme attendu:`, fullBase64.substring(0, 30) + '...');
            }
            resolve(fullBase64);
          } else {
            reject(new Error("Échec de la conversion du PDF en base64"));
          }
        };
        reader.onerror = () => {
          console.error("Erreur lors de la lecture du PDF:", reader.error);
          reject(reader.error);
        };
        // Utiliser readAsDataURL pour avoir le préfixe data:application/pdf;base64,
        reader.readAsDataURL(pdfBlob);
      });
      
      const pdfBase64 = await pdfBase64Promise;
      
      // Vérifier que la conversion a réussi et que les données semblent correctes
      if (!pdfBase64 || pdfBase64.length < 100) {
        throw new Error(`Conversion PDF en base64 incomplète ou incorrecte: ${pdfBase64.length} caractères`);
      }
      
      // Préparation des données pour l'envoi
      const currentDateTime = getCurrentDateTime();
      const webhookUrl = formType === 'MRSA' ? WEBHOOK_URL_MRSA : WEBHOOK_URL_VEHICULE;
      
      console.log(`Utilisation du webhook pour ${formType}:`, webhookUrl);
      
      // Créer un nom de fichier unique et significatif
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `inspection_${formType.toLowerCase()}_${formType === 'MRSA' ? numeroMoniteur : numeroVehicule}_${timestamp}.pdf`;
      
      // Préparation des données pour le webhook Make.com
      const webhookData = {
        type: formType,
        matricule: matricule,
        dateTime: currentDateTime,
        pointDeService: pointDeService,
        numeroIdentifiant: formType === 'MRSA' ? numeroMoniteur : numeroVehicule,
        pdfData: pdfBase64,
        fileName: fileName,
        mimeType: "application/pdf" // Ajout explicite du type MIME
      };
      
      console.log(`Préparation des données pour webhook ${formType} complète`);
      console.log(`Nom du fichier: ${fileName}`);
      console.log(`Type d'inspection: ${formType}`);
      console.log(`Envoi des données au webhook ${formType}...`);
      
      // Envoi au webhook Make.com
      try {
        // Créer un corps de requête simplifié si les données sont trop volumineuses
        let requestBody = JSON.stringify(webhookData);
        
        // Vérifier la taille des données JSON (limite approximative pour Make.com)
        if (requestBody.length > 5000000) { // 5MB est une estimation prudente
          console.warn(`Les données sont très volumineuses (${requestBody.length} octets), tentative de réduction...`);
          
          // Créer une version réduite du PDF si nécessaire
          // Note: cela pourrait réduire la qualité
          const doc = formType === 'MRSA' ? generateMrsaPDF() : generateVehiculePDF();
          const pdfBlobReduced = doc.output('blob');
          
          // Convertir à nouveau en base64
          const readerReduced = new FileReader();
          const pdfBase64ReducedPromise = new Promise<string>((resolve, reject) => {
            readerReduced.onload = () => {
              resolve(readerReduced.result as string);
            };
            readerReduced.onerror = () => reject(readerReduced.error);
            readerReduced.readAsDataURL(pdfBlobReduced);
          });
          
          const pdfBase64Reduced = await pdfBase64ReducedPromise;
          
          // Mettre à jour les données
          webhookData.pdfData = pdfBase64Reduced;
          requestBody = JSON.stringify(webhookData);
          console.log(`Données réduites à ${requestBody.length} octets`);
        }
        
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: requestBody
        });
        
        console.log(`Réponse du webhook ${formType} - Status:`, response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Erreur de réponse du webhook ${formType}:`, errorText);
          throw new Error(`Erreur du serveur: ${response.status} - ${errorText}`);
        }
        
        const responseText = await response.text();
        console.log(`Réponse complète du webhook ${formType}:`, responseText);
        
        console.log(`Données envoyées avec succès au webhook ${formType}`);
        
        // Message de succès
        alert(`L'inspection ${formType} a été envoyée avec succès aux superviseurs et chefs d'équipe.`);
        
        return true;
      } catch (fetchError) {
        console.error(`Erreur lors de la requête fetch pour ${formType}:`, fetchError);
        throw fetchError;
      }
    } catch (error) {
      console.error(`Erreur détaillée lors de l'envoi pour ${formType}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      alert(`Problème lors de l'envoi de l'inspection ${formType}: ${errorMessage}\nL'inspection a été générée mais n'a pas pu être envoyée.`);
      
      // Créer une URL de téléchargement pour le PDF comme solution de secours
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setGeneratedPdfUrl(pdfUrl);
      
      throw error;
    }
  };

  const handleSubmitForm1 = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Afficher la boîte de dialogue de confirmation
    setShowConfirmation(true);
  };
  
  const confirmSubmitForm1 = async () => {
    // Fermer la boîte de dialogue de confirmation
    setShowConfirmation(false);
    
    // Valider le formulaire
    const validationError = validateMrsaForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const currentDateTime = getCurrentDateTime();
      setSubmissionDateTime(currentDateTime);
      
      // Générer le PDF
      const doc = generateMrsaPDF();
      const pdfBlob = doc.output('blob');
      
      // Créer une URL pour le téléchargement
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setGeneratedPdfUrl(pdfUrl);
      
      // Envoyer par email avec EmailJS
      try {
        console.log("Tentative d'envoi du PDF par email...");
        const emailSent = await sendPdfByEmail(pdfBlob, 'MRSA');
        if (emailSent) {
          setSubmissionMessage("Le PDF a été généré et un email a été préparé. Vous pouvez télécharger le PDF manuellement.");
        } else {
          setSubmissionMessage("Le PDF a été généré mais la préparation de l'email a échoué. Vous pouvez télécharger le PDF manuellement.");
        }
      } catch (emailError) {
        console.error('Erreur envoi email détaillée:', emailError);
        setSubmissionMessage(`Le PDF a été généré mais l'envoi de l'email a échoué: ${emailError instanceof Error ? emailError.message : 'Erreur inconnue'}. Vous pouvez télécharger le PDF manuellement.`);
      }
      
      setSubmitted(true);
      
      // Réinitialiser le formulaire
      setMatricule('');
      setNumeroMoniteur('');
      setPointDeService('');
      setExpireDateElectrode1('');
      setExpireDateElectrode2('');
      setMrsaItems(prevItems => 
        prevItems.map(item => ({
          ...item,
          checked: false,
          expireDate: ''
        }))
      );
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      setError(`Échec de la génération: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForm2 = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Afficher la boîte de dialogue de confirmation
    setShowConfirmation(true);
  };
  
  const confirmSubmitForm2 = async () => {
    // Fermer la boîte de dialogue de confirmation
    setShowConfirmation(false);
    
    // Valider le formulaire
    const validationError = validateVehiculeForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log("Début du traitement du formulaire Véhicule");
      const currentDateTime = getCurrentDateTime();
      setSubmissionDateTime(currentDateTime);
      
      // Générer le PDF
      console.log("Génération du PDF Véhicule...");
      const doc = generateVehiculePDF();
      const pdfBlob = doc.output('blob');
      console.log("PDF Véhicule généré, taille:", pdfBlob.size, "bytes");
      
      // Créer une URL pour le téléchargement
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setGeneratedPdfUrl(pdfUrl);
      
      // Envoyer par email avec le webhook
      try {
        console.log("Tentative d'envoi du PDF Véhicule via webhook...");
        const emailSent = await sendPdfByEmail(pdfBlob, 'Véhicule');
        if (emailSent) {
          console.log("Envoi du PDF Véhicule réussi");
          setSubmissionMessage("Le PDF a été généré et envoyé avec succès.");
        } else {
          console.log("Échec de l'envoi du PDF Véhicule");
          setSubmissionMessage("Le PDF a été généré mais l'envoi a échoué. Vous pouvez télécharger le PDF manuellement.");
        }
      } catch (emailError) {
        console.error('Erreur envoi webhook détaillée pour Véhicule:', emailError);
        setSubmissionMessage(`Le PDF a été généré mais l'envoi a échoué: ${emailError instanceof Error ? emailError.message : 'Erreur inconnue'}. Vous pouvez télécharger le PDF manuellement.`);
      }
      
      setSubmitted(true);
      
      // Réinitialiser le formulaire
      setMatricule('');
      setNumeroVehicule('');
      setPointDeService('');
      setCylindre1PSI('');
      setCylindre2PSI('');
      setGrosCylindrePSI('');
      setGlycemieNormal('');
      setGlycemieHigh('');
      setGlycemieLow('');
      setVehiculeItems(prevItems => 
        prevItems.map(item => ({
          ...item,
          checked: false
        }))
      );
    } catch (error) {
      console.error('Erreur lors de la génération ou envoi du PDF Véhicule:', error);
      setError(`Échec de la génération ou de l'envoi: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    if (submitted) {
      setSubmitted(false);
    } else {
      setCurrentForm(null);
    }
  };

  // Page d'accueil avec les deux options de formulaire
  if (currentForm === null) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <header className="bg-blue-600 text-white p-4 rounded-lg shadow-md flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Ambulance className="mr-2" size={32} />
            <h1 className="text-2xl font-bold">Application TAP</h1>
          </div>
        </header>
        
        <div className="grid md:grid-cols-2 gap-6">
          <button 
            onClick={() => setCurrentForm('form1')}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col items-center"
          >
            <div className="bg-blue-100 p-4 rounded-full mb-4">
              <ClipboardCheck size={48} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Inspection MRSA</h2>
            <p className="text-gray-600 text-center">Vérification du moniteur défibrillateur</p>
            <ChevronRight className="mt-4 text-blue-600" />
          </button>
          
          <button 
            onClick={() => setCurrentForm('form2')}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col items-center"
          >
            <div className="bg-green-100 p-4 rounded-full mb-4">
              <ClipboardCheck size={48} className="text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Inspection Véhicule</h2>
            <p className="text-gray-600 text-center">Vérification du matériel clinique de l'ambulance</p>
            <ChevronRight className="mt-4 text-green-600" />
          </button>
        </div>
        
        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>© 2025 Application TAP - Tous droits réservés</p>
        </footer>
      </div>
    );
  }

  // Page de confirmation après soumission du formulaire
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full text-center">
          <div className="bg-green-100 p-4 rounded-full mx-auto w-20 h-20 flex items-center justify-center mb-4">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Inspection terminée avec succès!</h2>
          <p className="text-gray-600 mb-6">
            {submissionMessage || "Votre inspection a été traitée et un PDF a été généré avec succès."}
          </p>
          
          {!submissionMessage?.includes("email a été envoyé") && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-6">
              <p className="text-amber-700 text-sm">
                <AlertCircle size={16} className="inline mr-1" />
                <strong>Note:</strong> Pour que l'envoi d'emails fonctionne, vous devez configurer EmailJS avec vos propres identifiants.
              </p>
            </div>
          )}
          
          <p className="text-sm text-gray-500 mb-8">
            Terminé le {submissionDateTime}
          </p>
          
          {generatedPdfUrl && (
            <div className="mb-6">
              <a 
                href={generatedPdfUrl}
                download={`inspection_${currentForm === 'form1' ? 'mrsa' : 'vehicule'}_${Date.now()}.pdf`}
                className="bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center w-full mb-3"
              >
                <Download className="mr-2" size={24} />
                Télécharger le PDF
              </a>
              <p className="text-xs text-gray-500">Cliquez sur ce bouton pour télécharger et enregistrer le PDF sur votre appareil.</p>
            </div>
          )}
          
          <button 
            onClick={() => {
              setSubmitted(false);
              setCurrentForm(null);
              setGeneratedPdfUrl(null);
              setSubmissionMessage(null);
            }}
            className="bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors w-full"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  // Formulaire 1: Inspection MRSA
  if (currentForm === 'form1') {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-6">
        <header className="bg-blue-600 text-white p-4 rounded-lg shadow-md flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Ambulance className="mr-2" size={28} />
            <h1 className="text-xl font-bold">Inspection MRSA</h1>
          </div>
          <button onClick={goBack} className="flex items-center text-white">
            <ChevronLeft size={20} /> Retour
          </button>
        </header>
        
        <form ref={form1Ref} onSubmit={handleSubmitForm1} className="bg-white rounded-xl shadow-md p-4 mb-20">
          <div className="flex flex-col mb-6 space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="md:w-1/3">
              <label htmlFor="numeroMoniteur" className="block text-sm font-medium text-gray-700 mb-1">
                Numéro du moniteur :
              </label>
              <input
                type="text"
                id="numeroMoniteur"
                value={numeroMoniteur}
                onChange={(e) => setNumeroMoniteur(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="Entrez le numéro"
              />
            </div>
            
            <div className="md:w-1/3">
              <label htmlFor="pointDeService" className="block text-sm font-medium text-gray-700 mb-1">
                Point de service (PDS) :
              </label>
              <select
                id="pointDeService"
                value={pointDeService}
                onChange={(e) => setPointDeService(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <th className="border border-gray-300 p-2 bg-gray-50 w-4/5">INSPECTION DU MRSA</th>
                  <th className="border border-gray-300 p-2 bg-gray-50 w-1/5">Vérifié</th>
                </tr>
              </thead>
              <tbody>
                {/* Grouper les items par catégorie */}
                {Object.entries(
                  mrsaItems.reduce<Record<string, Record<string, CheckItem[]>>>((acc, item) => {
                    if (!acc[item.category || 'Autres']) acc[item.category || 'Autres'] = {};
                    
                    const subcategory = item.subcategory || 'default';
                    if (!acc[item.category || 'Autres'][subcategory]) {
                      acc[item.category || 'Autres'][subcategory] = [];
                    }
                    
                    acc[item.category || 'Autres'][subcategory].push(item);
                    return acc;
                  }, {})
                ).map(([category, subcategories]) => (
                  <React.Fragment key={category}>
                    <tr>
                      <td colSpan={2} className="border border-gray-300 p-2 bg-blue-100 font-semibold">
                        {category}
                      </td>
                    </tr>
                    
                    {Object.entries(subcategories).map(([subcategory, items]) => (
                      <React.Fragment key={`${category}-${subcategory}`}>
                        {subcategory !== 'default' && (
                          <tr>
                            <td colSpan={2} className="border border-gray-300 p-2 bg-gray-100 font-medium">
                              {subcategory}
                            </td>
                          </tr>
                        )}
                        
                        {items.map((item) => (
                          <tr 
                            key={item.id} 
                            className={`cursor-pointer transition-colors ${item.checked ? 'bg-green-100' : ''}`}
                            onClick={() => handleMrsaCheckChange(item.id)}
                          >
                            <td className="border border-gray-300 p-2 text-sm">
                              {item.label}
                              
                              {/* Ajouter champ de date d'expiration pour les électrodes */}
                              {item.id === 'electrode1' && item.checked && (
                                <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                                  <label htmlFor="expireDateElectrode1" className="block text-xs font-medium text-gray-700 mb-1">
                                    Date d'expiration:
                                  </label>
                                  <input
                                    type="date"
                                    id="expireDateElectrode1"
                                    value={expireDateElectrode1}
                                    onChange={(e) => setExpireDateElectrode1(e.target.value)}
                                    className="p-1 border border-gray-300 rounded w-full"
                                    required
                                  />
                                </div>
                              )}
                              
                              {item.id === 'electrode2' && item.checked && (
                                <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                                  <label htmlFor="expireDateElectrode2" className="block text-xs font-medium text-gray-700 mb-1">
                                    Date d'expiration:
                                  </label>
                                  <input
                                    type="date"
                                    id="expireDateElectrode2"
                                    value={expireDateElectrode2}
                                    onChange={(e) => setExpireDateElectrode2(e.target.value)}
                                    className="p-1 border border-gray-300 rounded w-full"
                                    required
                                  />
                                </div>
                              )}
                            </td>
                            <td className="border border-gray-300 p-2 text-center">
                              <input 
                                type="checkbox" 
                                checked={item.checked}
                                onClick={(e) => e.stopPropagation()}
                                onChange={() => handleMrsaCheckChange(item.id)}
                                className="w-5 h-5"
                                required
                              />
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))}
                
                <tr>
                  <td colSpan={2} className="border border-gray-300 p-2 bg-gray-100">
                    <div className="flex flex-col mb-6 space-y-4">
                      <div>
                        <label htmlFor="matricule" className="block text-sm font-medium text-gray-700 mb-1">
                          Matricule du TAP:
                        </label>
                        <input
                          type="text"
                          id="matricule"
                          value={matricule}
                          onChange={(e) => handleMatriculeChange(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                          placeholder="Ex: N-0100"
                        />
                      </div>
                    </div>
                  </td>
                </tr>
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
              className={`w-full ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white py-3 px-6 rounded-lg transition-colors flex items-center justify-center`}
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
                  <AlertCircle className="text-amber-500 mr-3 mt-0.5" size={24} />
                  <p>Êtes-vous sûr de vouloir finaliser cette inspection? Un PDF sera généré et envoyé par email.</p>
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
                  onClick={confirmSubmitForm1}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Formulaire 2: Inspection Véhicule
  if (currentForm === 'form2') {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-6">
        <header className="bg-green-600 text-white p-4 rounded-lg shadow-md flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Ambulance className="mr-2" size={28} />
            <h1 className="text-xl font-bold">Inspection Véhicule</h1>
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
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                  <th className="border border-gray-300 p-2 bg-gray-50 w-4/5">INSPECTION (10-84) DU MATÉRIELS CLINIQUES</th>
                  <th className="border border-gray-300 p-2 bg-gray-50 w-1/5">Vérifié</th>
                </tr>
              </thead>
              <tbody>
                {/* Grouper les items par catégorie */}
                {Object.entries(
                  vehiculeItems.reduce<Record<string, CheckItem[]>>((acc, item) => {
                    if (!acc[item.category || 'Autres']) acc[item.category || 'Autres'] = [];
                    acc[item.category || 'Autres'].push(item);
                    return acc;
                  }, {})
                ).map(([category, items]) => (
                  <React.Fragment key={category}>
                    <tr>
                      <td colSpan={2} className="border border-gray-300 p-2 bg-yellow-100 font-semibold">
                        {category}
                      </td>
                    </tr>
                    
                    {category === 'TROUSSES' && (
                      <>
                        {items.map((item) => (
                          <tr 
                            key={item.id}
                            className={`cursor-pointer transition-colors ${item.checked ? 'bg-green-100' : ''}`}
                            onClick={() => handleVehiculeCheckChange(item.id)}
                          >
                            <td className="border border-gray-300 p-2 text-sm">
                              {item.label}
                              
                              {/* Ajouter un champ pour le Cylindre 1 PSI seulement si checked */}
                              {item.id === 'trousse3' && item.checked && (
                                <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="number"
                                    value={cylindre1PSI}
                                    onChange={(e) => setCylindre1PSI(e.target.value)}
                                    className="p-1 border border-gray-300 rounded w-32"
                                    placeholder="Niveau PSI"
                                    required
                                  />
                                </div>
                              )}
                              
                              {/* Ajouter un champ pour le Cylindre 2 PSI seulement si checked */}
                              {item.id === 'trousse4' && item.checked && (
                                <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="number"
                                    value={cylindre2PSI}
                                    onChange={(e) => setCylindre2PSI(e.target.value)}
                                    className="p-1 border border-gray-300 rounded w-32"
                                    placeholder="Niveau PSI"
                                    required
                                  />
                                </div>
                              )}
                              
                              {/* Ajouter des champs pour la glycémie seulement si checked */}
                              {item.id === 'trousse7' && item.checked && (
                                <div className="mt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center">
                                    <span className="w-16 text-xs">NORMAL:</span>
                                    <input
                                      type="number"
                                      value={glycemieNormal}
                                      onChange={(e) => setGlycemieNormal(e.target.value)}
                                      className="p-1 border border-gray-300 rounded w-24"
                                      placeholder="mmol/L"
                                    />
                                    <span className="text-xs ml-2">(6,7 à 8,4 mmol/L)</span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="w-16 text-xs">HIGH:</span>
                                    <input
                                      type="number"
                                      value={glycemieHigh}
                                      onChange={(e) => setGlycemieHigh(e.target.value)}
                                      className="p-1 border border-gray-300 rounded w-24"
                                      placeholder="mmol/L"
                                    />
                                    <span className="text-xs ml-2">(19,4 à 24,3 mmol/L)</span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="w-16 text-xs">LOW:</span>
                                    <input
                                      type="number"
                                      value={glycemieLow}
                                      onChange={(e) => setGlycemieLow(e.target.value)}
                                      className="p-1 border border-gray-300 rounded w-24"
                                      placeholder="mmol/L"
                                    />
                                    <span className="text-xs ml-2">(2,2 à 2,8 mmol/L)</span>
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="border border-gray-300 p-2 text-center">
                              <input 
                                type="checkbox" 
                                checked={item.checked}
                                onClick={(e) => e.stopPropagation()}
                                onChange={() => handleVehiculeCheckChange(item.id)}
                                className="w-5 h-5"
                                required={item.id !== 'trousse7'} // Pas obligatoire pour kit glycémie
                              />
                            </td>
                          </tr>
                        ))}
                      </>
                    )}
                    
                    {category === 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)' && (
                      <>
                        {items.map((item) => (
                          <tr 
                            key={item.id}
                            className={`cursor-pointer transition-colors ${item.checked ? 'bg-green-100' : ''}`}
                            onClick={() => handleVehiculeCheckChange(item.id)}
                          >
                            <td className="border border-gray-300 p-2 text-sm">
                              {item.label}
                              
                              {/* Ajouter un champ pour le niveau PSI du gros cylindre seulement si checked */}
                              {item.id === 'armoire15' && item.checked && (
                                <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="number"
                                    value={grosCylindrePSI}
                                    onChange={(e) => setGrosCylindrePSI(e.target.value)}
                                    className="p-1 border border-gray-300 rounded w-32"
                                    placeholder="Niveau PSI"
                                    required
                                  />
                                </div>
                              )}
                            </td>
                            <td className="border border-gray-300 p-2 text-center">
                              <input 
                                type="checkbox" 
                                checked={item.checked}
                                onClick={(e) => e.stopPropagation()}
                                onChange={() => handleVehiculeCheckChange(item.id)}
                                className="w-5 h-5"
                                required
                              />
                            </td>
                          </tr>
                        ))}
                      </>
                    )}
                  </React.Fragment>
                ))}
                
                <tr>
                  <td colSpan={2} className="border border-gray-300 p-2 bg-gray-100">
                    <div className="flex flex-col mb-6 space-y-4">
                      <div>
                        <label htmlFor="matriculeVehicule" className="block text-sm font-medium text-gray-700 mb-1">
                          Matricule du TAP:
                        </label>
                        <input
                          type="text"
                          id="matriculeVehicule"
                          value={matricule}
                          onChange={(e) => handleMatriculeChange(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          required
                          placeholder="Ex: N-0100"
                        />
                      </div>
                    </div>
                  </td>
                </tr>
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
              className={`w-full ${isSubmitting ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'} text-white py-3 px-6 rounded-lg transition-colors flex items-center justify-center`}
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
                  <AlertCircle className="text-amber-500 mr-3 mt-0.5" size={24} />
                  <p>Êtes-vous sûr de vouloir finaliser cette inspection? Un PDF sera généré et envoyé par email.</p>
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
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default App;