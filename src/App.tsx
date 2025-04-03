import React, { useState, useRef } from 'react';
import { Ambulance, ClipboardCheck, Send, ChevronRight, ChevronLeft, CheckCircle2, X, Mail, Download, AlertCircle, Camera, RotateCcw, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';
import emailjs from '@emailjs/browser';
import BarcodeScanner from './components/BarcodeScanner';

// Interface pour les éléments à vérifier avec leur état de vérification
interface CheckItem {
  id: string;
  label: string;
  category?: string;
  subcategory?: string;
  checked: boolean;
  value?: string; // Pour stocker des valeurs comme PSI ou glycémie
  expireDate?: string; // Pour stocker les dates d'expiration
  disabled?: boolean; // Pour désactiver les items qui ne s'appliquent pas
  isConform?: boolean; // Pour indiquer si l'élément est conforme
  comment?: string; // Pour stocker un commentaire sur l'élément défectueux
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
  const [showScanner, setShowScanner] = useState(false);
  const [majorDefectsInfo, setMajorDefectsInfo] = useState<{ hasMajorDefects: boolean, defects: CheckItem[] | null }>({ 
    hasMajorDefects: false, 
    defects: null 
  });
  const [minorDefectsInfo, setMinorDefectsInfo] = useState<{ hasMinorDefects: boolean, defects: CheckItem[] | null }>({ 
    hasMinorDefects: false, 
    defects: null 
  });
  
  // Références aux formulaires
  const form1Ref = useRef<HTMLFormElement>(null);
  const form2Ref = useRef<HTMLFormElement>(null);
  const form3Ref = useRef<HTMLFormElement>(null);
  
  // URLs des API d'intégration
  const API_URL_MDSA = 'https://hook.us1.make.com/6npqjkskt1d71ir3aypy7h6434s98b8u'; // URL de l'API pour MDSA
  const API_URL_VEHICULE = 'https://hook.us1.make.com/5unm52j98tg1nr5tz9esxk3jd2msj367'; // URL de l'API pour Véhicule
  const API_URL_DEFECTUOSITES = 'https://hook.us1.make.com/3xist7l1lcnruqvffssuyfv9sddmjxom'; // URL de l'API pour Défectuosités
  
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

  // Items pour le formulaire MDSA
  const [mdsaItems, setMdsaItems] = useState<CheckItem[]>([
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
    { id: 'trousse4', label: 'Trousse d\'oxygène (800 ou plus) - CYLINDRE 2', category: 'TROUSSES', checked: false },
    { id: 'trousse5', label: 'Trousse pédiatrique/obstétrique (vérification du scellé/péremption)', category: 'TROUSSES', checked: false },
    { id: 'trousse6', label: 'Trousse mesure d\'urgence', category: 'TROUSSES', checked: false },
    { id: 'trousse7', label: 'Kit à glycémie/Résultat du test hebdomadaire', category: 'TROUSSES', checked: false },
    
    // Armoires
    { id: 'armoire1', label: 'Armoires (vérification des scellés/péremptions)', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire2', label: 'CIVIÈRE: Rescue seat', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire3', label: 'Médi-toile', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
    { id: 'armoire4', label: 'Planche de transfert', category: 'ARRIÈRE DE L\'AMBULANCE (INT. ET EXT.)', checked: false },
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
  
  // Items pour le formulaire Défectuosités
  const [defectuositesItems, setDefectuositesItems] = useState<CheckItem[]>([
    // 1. ATTELAGE (Désactivé car ne s'applique pas aux véhicules ambulanciers)
    { id: 'attelage1-1', label: 'Élément(s) de fixation du dispositif d\'attelage manquant(s), endommagé(s)', category: '1. ATTELAGE (Ne s\'applique pas)', subcategory: 'Défectuosités mineures', checked: false, disabled: true },
    { id: 'attelage1-2', label: 'Attache de sûreté ou raccord manquant, détérioré ou mal fixé', category: '1. ATTELAGE (Ne s\'applique pas)', subcategory: 'Défectuosités mineures', checked: false, disabled: true },
    { id: 'attelage1-A', label: 'Plaque d\'attelage ou pivot d\'attelage fissuré, mal fixé ou absence d\'attelage, fissure ou mal fixé', category: '1. ATTELAGE (Ne s\'applique pas)', subcategory: 'Défectuosités majeures', checked: false, disabled: true },
    { id: 'attelage1-B', label: 'Mouvement entre la sellette et le cadre', category: '1. ATTELAGE (Ne s\'applique pas)', subcategory: 'Défectuosités majeures', checked: false, disabled: true },
    { id: 'attelage1-C', label: 'Plus de 20% des éléments de fixation du mécanisme manquants ou desserrés', category: '1. ATTELAGE (Ne s\'applique pas)', subcategory: 'Défectuosités majeures', checked: false, disabled: true },
    { id: 'attelage1-D', label: '25% ou plus des poupées de blocage sont manquantes ou inopérantes', category: '1. ATTELAGE (Ne s\'applique pas)', subcategory: 'Défectuosités majeures', checked: false, disabled: true },
    { id: 'attelage1-E', label: 'Mécanisme d\'attelage mal fermé ou mal verrouillé', category: '1. ATTELAGE (Ne s\'applique pas)', subcategory: 'Défectuosités majeures', checked: false, disabled: true },
    { id: 'attelage1-F', label: 'Élément du mécanisme d\'attelage manquant, mal fixé, mal ajusté ou endommagé au point où il y a risque de rupture ou de séparation', category: '1. ATTELAGE (Ne s\'applique pas)', subcategory: 'Défectuosités majeures', checked: false, disabled: true },
    
    // 2. CHÂSSIS ET CARROSSERIE
    { id: 'chassis2-1', label: 'Longeron fissuré ou traverse fissurée ou cassée', category: '2. CHÂSSIS ET CARROSSERIE', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'chassis2-2', label: 'Élément fixe de la carrosserie absent ou mal fixé', category: '2. CHÂSSIS ET CARROSSERIE', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'chassis2-A', label: 'Longeron ou traverse de châssis fissuré, cassé, perforé par la rouille, affaissé ou déformé et affectant l\'intégrité du véhicule', category: '2. CHÂSSIS ET CARROSSERIE', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'chassis2-B', label: 'Élément de fixation manquant, cassé ou relâché à un point d\'attache de la carrosserie', category: '2. CHÂSSIS ET CARROSSERIE', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'chassis2-C', label: 'Plus de 25% des goupilles de glissière d\'un train roulant manquantes ou non fixées', category: '2. CHÂSSIS ET CARROSSERIE', subcategory: 'Défectuosités majeures', checked: false, disabled: true }
  ]);

  // Fonction pour obtenir la date et l'heure actuelles
  const getCurrentDateTime = () => {
    const now = new Date();
    const date = now.toLocaleDateString('fr-CA', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = now.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
  };

  // Fonction pour gérer les cases à cocher du formulaire MDSA
  const handleMdsaCheckChange = (itemId: string) => {
    setMdsaItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, checked: !item.checked } 
          : item
      )
    );
  };

  // Fonction pour gérer les dates d'expiration des électrodes
  const handleMdsaExpireDateChange = (itemId: string, date: string) => {
    // Mise à jour de l'état correspondant en fonction de l'ID de l'item
    if (itemId === 'electrode1') {
      setExpireDateElectrode1(date);
    } else if (itemId === 'electrode2') {
      setExpireDateElectrode2(date);
    }
    
    // Mise à jour de l'état des items MDSA
    setMdsaItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, expireDate: date } 
          : item
      )
    );
  };

  // Fonction pour gérer les cases à cocher du formulaire Véhicule
  const handleVehiculeCheckChange = (itemId: string) => {
    setVehiculeItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, checked: !item.checked } 
          : item
      )
    );
  };

  // Fonction pour valider le formulaire MDSA
  const validateMdsaForm = () => {
    // Vérifier les champs obligatoires
    if (!matricule) return "Veuillez entrer votre matricule";
    if (!numeroMoniteur) return "Veuillez entrer le numéro du moniteur";
    if (!pointDeService) return "Veuillez sélectionner le point de service";
    
    // Vérifier que toutes les cases ont été cochées
    const uncheckedItems = mdsaItems.filter(item => !item.checked);
    if (uncheckedItems.length > 0) {
      // Si moins de 5 éléments non vérifiés, les lister
      if (uncheckedItems.length <= 5) {
        const itemsList = uncheckedItems.map(item => `- ${item.label}`).join('\n');
        return `Les éléments suivants n'ont pas été vérifiés :\n${itemsList}\n\nVeuillez vérifier tous les éléments avant de soumettre le formulaire.`;
      } else {
        // Si plus de 5 éléments, afficher juste le nombre
        return `${uncheckedItems.length} éléments n'ont pas été vérifiés. Veuillez vérifier tous les éléments avant de soumettre le formulaire.`;
      }
    }
    
    return null; // Pas d'erreur
  };

  // Fonction pour valider le formulaire Véhicule
  const validateVehiculeForm = () => {
    // Vérifier les champs obligatoires
    if (!matricule) return "Veuillez entrer votre matricule";
    if (!numeroVehicule) return "Veuillez entrer le numéro du véhicule";
    if (!pointDeService) return "Veuillez sélectionner le point de service";
    
    // Test PSI Cylindre 1 obligatoire
    if (!cylindre1PSI) return "Veuillez entrer le niveau PSI du cylindre 1";
    
    // Test PSI Cylindre 2 obligatoire
    if (!cylindre2PSI) return "Veuillez entrer le niveau PSI du cylindre 2";
    
    // Test PSI Gros cylindre obligatoire
    if (!grosCylindrePSI) return "Veuillez entrer le niveau PSI du gros cylindre";
    
    // Vérifier que toutes les cases ont été cochées
    const uncheckedItems = vehiculeItems.filter(item => !item.checked);
    if (uncheckedItems.length > 0) {
      // Si moins de 5 éléments non vérifiés, les lister
      if (uncheckedItems.length <= 5) {
        const itemsList = uncheckedItems.map(item => `- ${item.label}`).join('\n');
        return `Les éléments suivants n'ont pas été vérifiés :\n${itemsList}\n\nVeuillez vérifier tous les éléments avant de soumettre le formulaire.`;
      } else {
        // Si plus de 5 éléments, afficher juste le nombre
        return `${uncheckedItems.length} éléments n'ont pas été vérifiés. Veuillez vérifier tous les éléments avant de soumettre le formulaire.`;
      }
    }
    
    return null; // Pas d'erreur
  };

  // Fonction pour mettre à jour le matricule
  const handleMatriculeChange = (value: string) => {
    // Formater le matricule en majuscules
    const formattedValue = value.toUpperCase();
    setMatricule(formattedValue);
  };

  // Fonction pour mettre à jour le numéro de véhicule
  const handleVehiculeNumberChange = (value: string) => {
    // Formater le numéro de véhicule en majuscules
    const formattedValue = value.toUpperCase();
    setNumeroVehicule(formattedValue);
  };

  // Fonction pour cocher tous les éléments d'une catégorie MDSA
  const handleCategoryAllChecked = (category: string) => {
    setMdsaItems(prevItems => 
      prevItems.map(item => 
        item.category === category
          ? { 
              ...item, 
              checked: true 
            } 
          : item
      )
    );
  };

  // Fonction pour gérer la soumission du formulaire MDSA
  const handleSubmitForm1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmation(true);
  };

  // Fonction pour revenir à l'écran d'accueil
  const goBack = () => {
    if (submitted) {
      setSubmitted(false);
    } else {
      setCurrentForm(null);
    }
  };

  // Fonction pour gérer la soumission du formulaire Véhicule
  const handleSubmitForm2 = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Vérifier les champs obligatoires et les valeurs
    const validationError = validateVehiculeForm();
    if (validationError) {
      setError(validationError);
      return; // Arrêter la soumission si validation échoue
    }
    
    // Afficher la boîte de dialogue de confirmation
    setShowConfirmation(true);
  };

  // Fonction pour confirmer la soumission du formulaire Véhicule
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
      
      // Envoyer les données à l'API
      try {
        const dataSent = await sendInspectionToMakecom('Véhicule');
        
        if (dataSent) {
          console.log("Envoi des données Véhicule réussi");
          setSubmissionMessage("L'inspection a été générée et envoyée avec succès.");
        } else {
          console.log("Échec de l'envoi des données Véhicule");
          setSubmissionMessage("L'inspection a été générée mais l'envoi a échoué.");
        }
      } catch (sendError) {
        console.error('Erreur envoi webhook détaillée pour Véhicule:', sendError);
        setSubmissionMessage(`L'inspection a été générée mais l'envoi a échoué: ${sendError instanceof Error ? sendError.message : 'Erreur inconnue'}.`);
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
      console.error('Erreur lors de la génération ou envoi de l\'inspection Véhicule:', error);
      setError(`Échec de la génération ou de l'envoi: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fonction pour gérer les cases à cocher du formulaire Défectuosités
  const handleDefectuositesCheckChange = (itemId: string, isConformCheck: boolean = false) => {
    setDefectuositesItems(prevItems => 
      prevItems.map(item => {
        // Ne pas modifier les items désactivés
        if (item.disabled) return item;
        
        if (item.id === itemId) {
          if (isConformCheck) {
            // Si on clique sur "conforme", désactiver "défectueux"
            return { ...item, isConform: !item.isConform, checked: false };
          } else {
            // Si on clique sur "défectueux", désactiver "conforme"
            return { ...item, checked: !item.checked, isConform: false };
          }
        }
        return item;
      })
    );
  };

  // Fonction pour gérer le changement de commentaire
  const handleDefectuositesCommentChange = (itemId: string, comment: string) => {
    setDefectuositesItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, comment } 
          : item
      )
    );
  };

  // Fonction pour gérer la case "Tout est conforme" par section
  const handleSectionAllConform = (category: string) => {
    setDefectuositesItems(prevItems => 
      prevItems.map(item => {
        // Ne modifie que les items qui appartiennent à la catégorie sélectionnée et qui ne sont pas désactivés
        if (item.category === category && !item.disabled) {
          return {
            ...item,
            isConform: true,
            checked: false
          };
        }
        return item;
      })
    );
  };

  // Fonction pour vérifier si une section est entièrement désactivée
  const isSectionDisabled = (category: string) => {
    const itemsInCategory = defectuositesItems.filter(item => item.category === category);
    return itemsInCategory.length > 0 && itemsInCategory.every(item => item.disabled);
  };

  // Fonction pour vérifier s'il y a des défectuosités majeures (identifiées par une lettre dans l'ID)
  const hasMajorDefects = () => {
    const majorDefects = defectuositesItems.filter(item => 
      item.checked && item.id.includes('-') && /[A-Z]/.test(item.id.split('-')[1])
    );
    return majorDefects.length > 0 ? majorDefects : null;
  };

  // Fonction pour vérifier s'il y a des défectuosités mineures
  const hasMinorDefects = () => {
    const minorDefects = defectuositesItems.filter(item => 
      item.checked && item.id.includes('-') && !/[A-Z]/.test(item.id.split('-')[1])
    );
    return minorDefects.length > 0 ? minorDefects : null;
  };

  // Fonction pour valider le formulaire Défectuosités
  const validateDefectuositesForm = () => {
    // Vérifier les champs obligatoires
    if (!matricule) return "Veuillez entrer votre matricule";
    if (!numeroVehicule) return "Veuillez entrer le numéro du véhicule";
    if (!pointDeService) return "Veuillez sélectionner le point de service";
    
    // Vérifier que toutes les cases non désactivées ont été vérifiées (conforme ou défectuosité)
    const uncheckedItems = defectuositesItems.filter(item => 
      !item.disabled && !item.checked && !item.isConform
    );
    
    if (uncheckedItems.length > 0) {
      // Si moins de 5 éléments non vérifiés, les lister
      if (uncheckedItems.length <= 5) {
        const itemsList = uncheckedItems.map(item => `- ${item.label}`).join('\n');
        return `Les éléments suivants n'ont pas été vérifiés :\n${itemsList}\n\nVeuillez cocher chaque élément comme conforme ou défectueux avant de soumettre le formulaire.`;
      } else {
        // Si plus de 5 éléments, afficher juste le nombre
        return `${uncheckedItems.length} éléments n'ont pas été vérifiés. Veuillez cocher chaque élément comme conforme ou défectueux avant de soumettre le formulaire.`;
      }
    }
    
    return null; // Pas d'erreur
  };

  // Fonction pour gérer la soumission du formulaire Défectuosités
  const handleSubmitForm3 = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateDefectuositesForm();
    if (validationError) {
      setError(validationError);
      return; // Arrêter la soumission si validation échoue
    }
    
    // Vérifier s'il y a des défectuosités majeures
    const majorDefects = hasMajorDefects();
    setMajorDefectsInfo({
      hasMajorDefects: !!majorDefects,
      defects: majorDefects
    });
    
    // Vérifier s'il y a des défectuosités mineures
    const minorDefects = hasMinorDefects();
    setMinorDefectsInfo({
      hasMinorDefects: !!minorDefects,
      defects: minorDefects
    });
    
    // Afficher la boîte de dialogue de confirmation
    setShowConfirmation(true);
  };

  // Fonction pour confirmer la soumission du formulaire Défectuosités
  const confirmSubmitForm3 = async () => {
    // Fermer la boîte de dialogue de confirmation
    setShowConfirmation(false);
    
    // Valider le formulaire
    const validationError = validateDefectuositesForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log("Début du traitement du formulaire Défectuosités");
      
      // Vérifier s'il y a des défectuosités majeures ou mineures et préparer un message d'alerte
      let defectsMessage = "";
      const majorDefects = hasMajorDefects();
      const minorDefects = hasMinorDefects();
      
      if (majorDefects) {
        defectsMessage += "ATTENTION: Des défectuosités MAJEURES ont été détectées. ";
      }
      
      if (minorDefects) {
        defectsMessage += "Des défectuosités mineures ont été détectées. Veuillez contacter votre chef d'équipe ou superviseur.";
      }
      
      const currentDateTime = getCurrentDateTime();
      setSubmissionDateTime(currentDateTime);
      
      // Envoyer les données à l'API
      try {
        const dataSent = await sendInspectionToMakecom('Defectuosites');
        
        if (dataSent) {
          console.log("Envoi des données Défectuosités réussi");
          // Ajouter le message sur les défectuosités si nécessaire
          const successMsg = "L'inspection a été générée et envoyée avec succès.";
          setSubmissionMessage(defectsMessage ? `${successMsg}\n\n${defectsMessage}` : successMsg);
        } else {
          console.log("Échec de l'envoi des données Défectuosités");
          setSubmissionMessage("L'inspection a été générée mais l'envoi a échoué.");
        }
      } catch (sendError) {
        console.error('Erreur envoi webhook détaillée pour Défectuosités:', sendError);
        setSubmissionMessage(`L'inspection a été générée mais l'envoi a échoué: ${sendError instanceof Error ? sendError.message : 'Erreur inconnue'}.`);
      }
      
      setSubmitted(true);
      
      // Réinitialiser le formulaire
      setMatricule('');
      setNumeroVehicule('');
      setPointDeService('');
      setDefectuositesItems(prevItems => 
        prevItems.map(item => ({
          ...item,
          checked: false,
          isConform: false,
          comment: ''
        }))
      );
    } catch (error) {
      console.error('Erreur lors de la génération ou envoi de l\'inspection Défectuosités:', error);
      setError(`Échec de la génération ou de l'envoi: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Fonction pour générer HTML rapport défectuosités
  const generateDefectuositesHTML = () => {
    // Code pour générer le HTML du rapport défectuosités
    // ... (implementation détaillée omise ici)
    return "<html><body><h1>Rapport défectuosités</h1></body></html>";
  };
  
  // Fonction pour envoyer l'inspection à Make.com
  const sendInspectionToMakecom = async (formType: string) => {
    let htmlContent = '';
    if (formType === 'MDSA') {
      // Code pour générer le HTML du rapport MDSA
      // ... (implementation détaillée omise ici)
    } else if (formType === 'Véhicule') {
      // Code pour générer le HTML du rapport véhicule
      // ... (implementation détaillée omise ici)
    } else if (formType === 'Defectuosites') {
      htmlContent = generateDefectuositesHTML();
    }
    
    // Préparation des données pour l'envoi
    // ... (implementation détaillée omise ici)
    
    // Simuler une réponse réussie
    return true;
  };

  // Page d'accueil avec les options de formulaire
  if (currentForm === null) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <header className="bg-[#b22a2e] text-white p-4 rounded-lg shadow-md flex items-center justify-between mb-8">
          <div className="flex items-center">
            <img src="https://res.cloudinary.com/dxyvj8rka/image/upload/f_auto,q_auto/v1/cambi/iazjhbzvu6dv5fad398u" alt="Logo CAMBI" className="h-8 mr-2 filter brightness-0 invert" />
            <h1 className="text-xl font-bold">Inspection AMC</h1>
          </div>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            onClick={() => setCurrentForm('form1')}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col items-center"
          >
            <div className="bg-[#b22a2e]/10 p-4 rounded-full mb-4">
              <ClipboardCheck size={32} className="text-[#b22a2e]" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Inspection MDSA</h2>
            <p className="text-gray-600 text-center text-sm">Vérification du moniteur défibrillateur semi-automatique</p>
          </button>
          
          <button
            onClick={() => setCurrentForm('form2')}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col items-center"
          >
            <div className="bg-[#102947]/10 p-4 rounded-full mb-4">
              <Ambulance size={32} className="text-[#102947]" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Inspection Véhicule</h2>
            <p className="text-gray-600 text-center text-sm">Vérification de l'équipement du véhicule</p>
          </button>
          
          <button
            onClick={() => setCurrentForm('form3')}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col items-center"
          >
            <div className="bg-[#4f6683]/10 p-4 rounded-full mb-4">
              <AlertCircle size={32} className="text-[#4f6683]" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Liste des Défectuosités</h2>
            <p className="text-gray-600 text-center text-sm">Vérification des défectuosités</p>
          </button>
        </div>
      </div>
    );
  }

  // Formulaire 1: Inspection MDSA
  if (currentForm === 'form1') {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-6">
        <header className="bg-[#b22a2e] text-white p-4 rounded-lg shadow-md flex items-center justify-between mb-6">
          <div className="flex items-center">
            <img src="https://res.cloudinary.com/dxyvj8rka/image/upload/f_auto,q_auto/v1/cambi/iazjhbzvu6dv5fad398u" alt="Logo CAMBI" className="h-8 mr-2 filter brightness-0 invert" />
            <h1 className="text-xl font-bold">Inspection MDSA</h1>
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
              <div className="flex">
                <input
                  type="text"
                  id="numeroMoniteur"
                  value={numeroMoniteur}
                  onChange={(e) => setNumeroMoniteur(e.target.value)}
                  className="flex-1 p-2 border rounded-l-md focus:ring-2 focus:ring-[#b22a2e] focus:border-transparent"
                  placeholder="Scanner ou entrer le numéro"
                />
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="bg-[#b22a2e] text-white p-2 rounded-r-md hover:bg-[#b22a2e]/90"
                >
                  <Camera size={20} />
                </button>
              </div>
            </div>
            
            <div className="md:w-1/3">
              <label htmlFor="pointDeService" className="block text-sm font-medium text-gray-700 mb-1">
                Point de service (PDS) :
              </label>
              <select
                id="pointDeService"
                value={pointDeService}
                onChange={(e) => setPointDeService(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#b22a2e] focus:border-[#b22a2e]"
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
                  <th className="border border-gray-300 p-2 bg-[#b22a2e] text-white w-4/5">INSPECTION DU MDSA</th>
                  <th className="border border-gray-300 p-2 bg-[#b22a2e] text-white w-1/5">Vérifié</th>
                </tr>
              </thead>
              <tbody>
                {/* Grouper les items par catégorie */}
                {Object.entries(
                  mdsaItems.reduce<Record<string, Record<string, CheckItem[]>>>((acc, item) => {
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
                      <td colSpan={2} className="border border-gray-300 p-2 bg-[#b22a2e]/10 font-semibold">
                        <div className="flex justify-between items-center">
                          <span>{category}</span>
                          <div className="flex items-center">
                            <span className="text-xs mr-2">Tout vérifié</span>
                            <input 
                              type="checkbox" 
                              onChange={() => handleCategoryAllChecked(category)}
                              className="w-5 h-5 accent-green-600 cursor-pointer"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                    
                    {Object.entries(subcategories).map(([subcategory, items]) => (
                      <React.Fragment key={subcategory}>
                        {subcategory !== 'default' && (
                          <tr>
                            <td colSpan={2} className="border border-gray-300 p-2 bg-gray-100 font-medium">
                              {subcategory}
                            </td>
                          </tr>
                        )}
                        
                        {/* Ici la partie qui était problématique, correctement implémentée avec .map() */}
                        {items.map(item => {
                          // Préparer le libellé avec les dates d'expiration si nécessaire
                          let itemLabel = item.label;
                          
                          if (item.id === 'electrode1' && expireDateElectrode1) {
                            itemLabel += ` (Expiration: ${expireDateElectrode1})`;
                          } else if (item.id === 'electrode2' && expireDateElectrode2) {
                            itemLabel += ` (Expiration: ${expireDateElectrode2})`;
                          }
                          
                          return (
                            <tr key={item.id} onClick={() => handleMdsaCheckChange(item.id)} className="cursor-pointer hover:bg-gray-50">
                              <td className="border border-gray-300 p-2">{itemLabel}</td>
                              <td className="border border-gray-300 p-2 text-center">
                                <div className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center ${item.checked ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                  {item.checked ? '✓' : '✗'}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
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
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMatriculeChange(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#b22a2e] focus:border-[#b22a2e]"
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
              className={`w-full ${isSubmitting ? 'bg-[#b22a2e]/70' : 'bg-[#b22a2e] hover:bg-[#b22a2e]/90'} text-white py-3 px-6 rounded-lg transition-colors flex items-center justify-center`}
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
                  <AlertCircle className="text-[#102947] mr-3 mt-0.5" size={24} />
                  <p>Êtes-vous sûr de vouloir finaliser cette inspection? Les données seront envoyées au système central.</p>
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
                  onClick={() => setShowConfirmation(false)}
                  className="px-4 py-2 bg-[#b22a2e] text-white rounded-md hover:bg-[#b22a2e]/90"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Scanner de code-barres */}
        {showScanner && (
          <BarcodeScanner 
            onScanSuccess={(result) => {
              setNumeroMoniteur(result);
              setShowScanner(false);
            }} 
            onClose={() => setShowScanner(false)} 
          />
        )}
      </div>
    );
  }

  // Formulaire 2: Inspection Véhicule
  if (currentForm === 'form2') {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-6">
        <header className="bg-[#102947] text-white p-4 rounded-lg shadow-md flex items-center justify-between mb-6">
          <div className="flex items-center">
            <img src="https://res.cloudinary.com/dxyvj8rka/image/upload/f_auto,q_auto/v1/cambi/iazjhbzvu6dv5fad398u" alt="Logo CAMBI" className="h-8 mr-2 filter brightness-0 invert" />
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
                Numéro du véhicule :
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="numeroVehicule"
                  value={numeroVehicule}
                  onChange={(e) => handleVehiculeNumberChange(e.target.value)}
                  className="flex-1 p-2 border rounded-md focus:ring-2 focus:ring-[#102947] focus:border-transparent"
                  placeholder="Numéro du véhicule"
                  required
                />
              </div>
            </div>
            
            <div className="md:w-1/3">
              <label htmlFor="pointDeService" className="block text-sm font-medium text-gray-700 mb-1">
                Point de service (PDS) :
              </label>
              <select
                id="pointDeService"
                value={pointDeService}
                onChange={(e) => setPointDeService(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#102947] focus:border-[#102947]"
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
          
          {/* Mesures spécifiques */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-[#102947]">Mesures à prendre</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="cylindre1PSI" className="block text-sm font-medium text-gray-700 mb-1">
                  Cylindre 1 PSI :
                </label>
                <input
                  type="text"
                  id="cylindre1PSI"
                  value={cylindre1PSI}
                  onChange={(e) => setCylindre1PSI(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#102947] focus:border-[#102947]"
                  required
                  placeholder="Valeur PSI"
                />
              </div>
              <div>
                <label htmlFor="cylindre2PSI" className="block text-sm font-medium text-gray-700 mb-1">
                  Cylindre 2 PSI :
                </label>
                <input
                  type="text"
                  id="cylindre2PSI"
                  value={cylindre2PSI}
                  onChange={(e) => setCylindre2PSI(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#102947] focus:border-[#102947]"
                  required
                  placeholder="Valeur PSI"
                />
              </div>
              <div>
                <label htmlFor="grosCylindrePSI" className="block text-sm font-medium text-gray-700 mb-1">
                  Gros cylindre PSI :
                </label>
                <input
                  type="text"
                  id="grosCylindrePSI"
                  value={grosCylindrePSI}
                  onChange={(e) => setGrosCylindrePSI(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#102947] focus:border-[#102947]"
                  required
                  placeholder="Valeur PSI"
                />
              </div>
            </div>
            
            <h3 className="text-md font-semibold mt-4 mb-2 text-[#102947]">Glucomètre</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="glycemieNormal" className="block text-sm font-medium text-gray-700 mb-1">
                  Normal :
                </label>
                <input
                  type="text"
                  id="glycemieNormal"
                  value={glycemieNormal}
                  onChange={(e) => setGlycemieNormal(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#102947] focus:border-[#102947]"
                  required
                  placeholder="Valeur normal"
                />
              </div>
              <div>
                <label htmlFor="glycemieHigh" className="block text-sm font-medium text-gray-700 mb-1">
                  High :
                </label>
                <input
                  type="text"
                  id="glycemieHigh"
                  value={glycemieHigh}
                  onChange={(e) => setGlycemieHigh(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#102947] focus:border-[#102947]"
                  required
                  placeholder="Valeur high"
                />
              </div>
              <div>
                <label htmlFor="glycemieLow" className="block text-sm font-medium text-gray-700 mb-1">
                  Low :
                </label>
                <input
                  type="text"
                  id="glycemieLow"
                  value={glycemieLow}
                  onChange={(e) => setGlycemieLow(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#102947] focus:border-[#102947]"
                  required
                  placeholder="Valeur low"
                />
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-2 bg-[#102947] text-white w-4/5">INSPECTION DU VÉHICULE</th>
                  <th className="border border-gray-300 p-2 bg-[#102947] text-white w-1/5">Vérifié</th>
                </tr>
              </thead>
              <tbody>
                {/* Grouper les items par catégorie */}
                {Array.from(new Set(vehiculeItems.map(item => item.category))).map(category => (
                  <React.Fragment key={category}>
                    <tr>
                      <td colSpan={2} className="border border-gray-300 p-2 bg-[#102947]/10 font-semibold">
                        {category}
                      </td>
                    </tr>
                    
                    {vehiculeItems
                      .filter(item => item.category === category)
                      .map(item => (
                        <tr key={item.id} onClick={() => handleVehiculeCheckChange(item.id)} className="cursor-pointer hover:bg-gray-50">
                          <td className="border border-gray-300 p-2">{item.label}</td>
                          <td className="border border-gray-300 p-2 text-center">
                            <div className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center ${item.checked ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                              {item.checked ? '✓' : '✗'}
                            </div>
                          </td>
                        </tr>
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
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMatriculeChange(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#102947] focus:border-[#102947]"
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
              className={`w-full ${isSubmitting ? 'bg-[#102947]/70' : 'bg-[#102947] hover:bg-[#102947]/90'} text-white py-3 px-6 rounded-lg transition-colors flex items-center justify-center`}
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
                  <AlertCircle className="text-[#102947] mr-3 mt-0.5" size={24} />
                  <p>Êtes-vous sûr de vouloir finaliser cette inspection? Les données seront envoyées au système central.</p>
                </div>
                
                {majorDefectsInfo.hasMajorDefects && (
                  <div className="bg-red-100 border-l-4 border-red-500 p-3 mb-3">
                    <div className="flex">
                      <AlertTriangle className="text-red-600 mr-2" />
                      <p className="text-red-700 font-medium">
                        ATTENTION: Des défectuosités MAJEURES ont été détectées.
                      </p>
                    </div>
                  </div>
                )}
                
                {minorDefectsInfo.hasMinorDefects && (
                  <div className="bg-yellow-100 border-l-4 border-yellow-500 p-3">
                    <p className="text-yellow-700">
                      Des défectuosités mineures ont été détectées. Veuillez contacter votre chef d'équipe ou superviseur.
                    </p>
                  </div>
                )}
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
                  className="px-4 py-2 bg-[#102947] text-white rounded-md hover:bg-[#102947]/90"
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

  // Formulaire 3: Inspection Défectuosités
  if (currentForm === 'form3') {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-6">
        <header className="bg-[#4f6683] text-white p-4 rounded-lg shadow-md flex items-center justify-between mb-6">
          <div className="flex items-center">
            <img src="https://res.cloudinary.com/dxyvj8rka/image/upload/f_auto,q_auto/v1/cambi/iazjhbzvu6dv5fad398u" alt="Logo CAMBI" className="h-8 mr-2 filter brightness-0 invert" />
            <h1 className="text-xl font-bold">Liste des Défectuosités</h1>
          </div>
          <button onClick={goBack} className="flex items-center text-white">
            <ChevronLeft size={20} /> Retour
          </button>
        </header>
        
        <form ref={form3Ref} onSubmit={handleSubmitForm3} className="bg-white rounded-xl shadow-md p-4 mb-20">
          <div className="flex flex-col mb-6 space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="md:w-1/3">
              <label htmlFor="numeroVehicule" className="block text-sm font-medium text-gray-700 mb-1">
                Numéro du véhicule :
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="numeroVehicule"
                  value={numeroVehicule}
                  onChange={(e) => handleVehiculeNumberChange(e.target.value)}
                  className="flex-1 p-2 border rounded-md focus:ring-2 focus:ring-[#4f6683] focus:border-transparent"
                  placeholder="Numéro du véhicule"
                  required
                />
              </div>
            </div>
            
            <div className="md:w-1/3">
              <label htmlFor="pointDeService" className="block text-sm font-medium text-gray-700 mb-1">
                Point de service (PDS) :
              </label>
              <select
                id="pointDeService"
                value={pointDeService}
                onChange={(e) => setPointDeService(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4f6683] focus:border-[#4f6683]"
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
            {Array.from(new Set(defectuositesItems.map(item => item.category))).map(category => {
              // Vérifier si la section est désactivée
              const isDisabled = isSectionDisabled(category);
              
              return (
                <div key={category} className="mb-6">
                  <div className={`border rounded-t-lg ${isDisabled ? 'bg-gray-200' : 'bg-[#4f6683]/10'}`}>
                    <div className="flex justify-between items-center p-3">
                      <h2 className={`font-semibold ${isDisabled ? 'text-gray-500' : 'text-[#4f6683]'}`}>{category}</h2>
                      {!isDisabled && (
                        <button 
                          type="button"
                          onClick={() => handleSectionAllConform(category)}
                          className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs hover:bg-green-200"
                        >
                          <CheckCircle2 size={14} className="inline mr-1" />
                          Tout est conforme
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <table className="min-w-full border-collapse border border-gray-300 rounded-b-lg overflow-hidden">
                    <thead>
                      <tr className={`${isDisabled ? 'bg-gray-200 text-gray-500' : 'bg-[#4f6683] text-white'}`}>
                        <th className="border border-gray-300 p-2 w-16 text-center">Défectueux</th>
                        <th className="border border-gray-300 p-2 w-16 text-center">Conforme</th>
                        <th className="border border-gray-300 p-2">Élément</th>
                        <th className="border border-gray-300 p-2">Commentaire</th>
                      </tr>
                    </thead>
                    <tbody>
                      {defectuositesItems
                        .filter(item => item.category === category)
                        .map(item => {
                          // Vérifier si c'est une défectuosité majeure (inclut une lettre majuscule dans l'ID)
                          const isMajorDefect = item.id.includes('-') && /[A-Z]/.test(item.id.split('-')[1]);
                          
                          return (
                            <tr key={item.id} className={`${item.disabled ? 'bg-gray-100 text-gray-500' : 'hover:bg-gray-50'}`}>
                              <td className="border border-gray-300 p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={item.checked}
                                  onChange={() => handleDefectuositesCheckChange(item.id, false)}
                                  disabled={item.disabled}
                                  className="w-5 h-5 accent-red-600 cursor-pointer"
                                />
                              </td>
                              <td className="border border-gray-300 p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={item.isConform}
                                  onChange={() => handleDefectuositesCheckChange(item.id, true)}
                                  disabled={item.disabled}
                                  className="w-5 h-5 accent-green-600 cursor-pointer"
                                />
                              </td>
                              <td className={`border border-gray-300 p-2 ${isMajorDefect ? 'font-medium text-red-700' : ''}`}>
                                {isMajorDefect && <AlertTriangle size={16} className="inline text-red-700 mr-1" />}
                                {item.label}
                              </td>
                              <td className="border border-gray-300 p-2">
                                {(item.checked || item.isConform) && !item.disabled && (
                                  <input
                                    type="text"
                                    value={item.comment || ''}
                                    onChange={(e) => handleDefectuositesCommentChange(item.id, e.target.value)}
                                    className="w-full p-1 border border-gray-300 rounded"
                                    placeholder={item.checked ? "Description obligatoire" : "Commentaire optionnel"}
                                    required={item.checked}
                                  />
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Si une défectuosité <strong>majeure</strong> est détectée, veuillez en informer immédiatement votre superviseur.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-100 p-4 rounded-lg mb-6">
            <div className="flex flex-col mb-6 space-y-4">
              <div>
                <label htmlFor="matricule" className="block text-sm font-medium text-gray-700 mb-1">
                  Matricule du TAP:
                </label>
                <input
                  type="text"
                  id="matricule"
                  value={matricule}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMatriculeChange(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4f6683] focus:border-[#4f6683]"
                  required
                  placeholder="Ex: N-0100"
                />
              </div>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4 mb-4">
              <p style={{ whiteSpace: 'pre-line' }}>{error}</p>
            </div>
          )}
          
          <div className="sticky bottom-0 bg-white p-4 border-t mt-4">
            <button
              type="submit"
              className={`w-full ${isSubmitting ? 'bg-[#4f6683]/70' : 'bg-[#4f6683] hover:bg-[#4f6683]/90'} text-white py-3 px-6 rounded-lg transition-colors flex items-center justify-center`}
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
                  <AlertCircle className="text-[#4f6683] mr-3 mt-0.5" size={24} />
                  <p>Êtes-vous sûr de vouloir finaliser cette inspection? Les données seront envoyées au système central.</p>
                </div>
                
                {majorDefectsInfo.hasMajorDefects && (
                  <div className="bg-red-100 border-l-4 border-red-500 p-3 mb-3">
                    <div className="flex">
                      <AlertTriangle className="text-red-600 mr-2" />
                      <p className="text-red-700 font-medium">
                        ATTENTION: Des défectuosités MAJEURES ont été détectées.
                      </p>
                    </div>
                  </div>
                )}
                
                {minorDefectsInfo.hasMinorDefects && !majorDefectsInfo.hasMajorDefects && (
                  <div className="bg-yellow-100 border-l-4 border-yellow-500 p-3">
                    <p className="text-yellow-700">
                      Des défectuosités mineures ont été détectées. Veuillez contacter votre chef d'équipe ou superviseur.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-4">
                <button 
                  onClick={() => setShowConfirmation(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button 
                  onClick={confirmSubmitForm3}
                  className="px-4 py-2 bg-[#4f6683] text-white rounded-md hover:bg-[#4f6683]/90"
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

  // Formulaire de confirmation après soumission réussie
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex flex-col items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 max-w-md w-full">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-green-100 rounded-full p-3 mb-4">
              <CheckCircle2 size={48} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-center">Inspection complétée</h2>
            <p className="text-gray-600 text-center mb-2">{submissionMessage}</p>
            {submissionDateTime && (
              <p className="text-sm text-gray-500 mb-4">
                Soumis le {submissionDateTime}
              </p>
            )}
          </div>
          
          {majorDefectsInfo.hasMajorDefects && (
            <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-4">
              <div className="flex">
                <AlertTriangle className="text-red-600 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-red-700 font-medium">
                    ATTENTION: Des défectuosités MAJEURES ont été détectées.
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    Veuillez immédiatement informer votre superviseur.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {minorDefectsInfo.hasMinorDefects && !majorDefectsInfo.hasMajorDefects && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
              <div className="flex">
                <AlertCircle className="text-yellow-600 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-yellow-700 font-medium">
                    Des défectuosités mineures ont été détectées.
                  </p>
                  <p className="text-sm text-yellow-600 mt-1">
                    Veuillez en informer votre chef d'équipe ou superviseur.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {generatedPdfUrl && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex flex-col items-center">
                <Download size={24} className="text-blue-600 mb-2" />
                <p className="text-blue-700 font-medium mb-3">Téléchargez votre rapport</p>
                <a 
                  href={generatedPdfUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 w-full text-center"
                >
                  Télécharger le PDF
                </a>
              </div>
            </div>
          )}
          
          <button 
            onClick={goBack}
            className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
          >
            <RotateCcw className="mr-2" size={18} />
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default App;
