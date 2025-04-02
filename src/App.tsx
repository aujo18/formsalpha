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
  
  // Référence aux formulaires
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
    { id: 'chassis2-C', label: 'Plus de 25% des goupilles de glissière d\'un train roulant manquantes ou non fixées', category: '2. CHÂSSIS ET CARROSSERIE', subcategory: 'Défectuosités majeures', checked: false, disabled: true },
    
    // 3. CHAUFFAGE ET DÉGIVRAGE
    { id: 'chauffage3-1', label: 'Soufflerie du pare-brise ne fonctionne pas', category: '3. CHAUFFAGE ET DÉGIVRAGE', subcategory: 'Défectuosités mineures', checked: false },
    
    // 4. COMMANDES DU CONDUCTEUR
    { id: 'commandes4-1', label: 'Accélérateur ou embrayage ne fonctionne pas correctement', category: '4. COMMANDES DU CONDUCTEUR', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'commandes4-2', label: 'Klaxon ne fonctionne pas correctement', category: '4. COMMANDES DU CONDUCTEUR', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'commandes4-A', label: 'Moteur ne revient pas au ralenti après le relâchement de l\'accélérateur', category: '4. COMMANDES DU CONDUCTEUR', subcategory: 'Défectuosités majeures', checked: false },
    
    // 5. DIRECTION
    { id: 'direction5-1', label: 'Colonne de direction se déplace par rapport à sa position normale ou volant ajustable ne demeure pas à la position choisie par le fabricant', category: '5. DIRECTION', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'direction5-2', label: 'Niveau du liquide de la servodirection n\'est pas celui prescrit par le fabricant', category: '5. DIRECTION', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'direction5-3', label: 'Courroie de la pompe présente une coupure', category: '5. DIRECTION', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'direction5-A', label: 'Colonne de direction ou volant se déplace par rapport à leur position normale alors qu\'il y a un risque de séparation', category: '5. DIRECTION', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'direction5-B', label: 'Servodirection ne fonctionne pas', category: '5. DIRECTION', subcategory: 'Défectuosités majeures', checked: false },
    
    // 6. ESSUIE-GLACES ET LAVE-GLACE
    { id: 'essuie6-1', label: 'Essuie-glace du côté passager manquant ou inadéquat', category: '6. ESSUIE-GLACES ET LAVE-GLACE', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'essuie6-2', label: 'Système de lave-glace inefficace', category: '6. ESSUIE-GLACES ET LAVE-GLACE', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'essuie6-A', label: 'Essuie-glace du côté conducteur manquant ou inadéquat', category: '6. ESSUIE-GLACES ET LAVE-GLACE', subcategory: 'Défectuosités majeures', checked: false },
    
    // 7. MATÉRIEL D'URGENCE
    { id: 'urgence7-1', label: 'Triangle de premiers soins requis par la loi mal fixé ou difficilement accessible', category: '7. MATÉRIEL D\'URGENCE', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'urgence7-2', label: 'Extincteur chimique requis par la loi mal fixé, inadéquat ou difficilement accessible', category: '7. MATÉRIEL D\'URGENCE', subcategory: 'Défectuosités mineures', checked: false },
    
    // 8. PHARES ET FEUX
    { id: 'phares8-1', label: 'Phare de croisement, feu de position, feu de changement de direction, feu de freinage ou feu de la plaque d\'immatriculation ne s\'allume pas', category: '8. PHARES ET FEUX', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'phares8-A', label: 'Aucun phare de croisement ne s\'allume', category: '8. PHARES ET FEUX', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'phares8-B', label: 'À l\'arrière d\'un véhicule d\'une seule unité ou du dernier véhicule d\'un ensemble de véhicules: *Aucun feu de changement de direction droit ou gauche ne s\'allume *Aucun feu de freinage ne s\'allume *Aucun des feux de position ne s\'allume', category: '8. PHARES ET FEUX', subcategory: 'Défectuosités majeures', checked: false },
    
    // 9. PNEUS
    { id: 'pneus9-1', label: 'Indicateur d\'usure d\'un pneu touche la chaussé ou profondeur d\'une rainure est égale ou inférieure à l\'indicateur d\'usure', category: '9. PNEUS', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'pneus9-2', label: 'Un pneu, d\'un même assemblage de roues, présente une matière étrangère logée dans la bande de roulement ou dans le flanc et qui peut causer une crevaison', category: '9. PNEUS', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'pneus9-3', label: 'Un pneu, d\'un même assemblage de roues, endommagé au point de voir la toile de renforcement ou la ceinture d\'acier', category: '9. PNEUS', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'pneus9-4', label: 'Pneu déformé, bande de roulement ou flanc séparé de la carcasse du pneu', category: '9. PNEUS', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'pneus9-5', label: 'Valve usée, endommagée, écorchée ou coupée', category: '9. PNEUS', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'pneus9-A', label: 'Pour un pneu installé sur l\'essieu relié à la direction d\'un véhicule motorisé ayant un PNBV de 4 500 kg ou plus, la profondeur de 2 rainures adjacentes est égale ou inférieure à l\'indicateur d\'usure', category: '9. PNEUS', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'pneus9-B', label: 'Pneu simple ou les pneus jumelés du même assemblage de roues présentent une matière étrangère logée dans la bande de roulement ou le flanc et qui peut causer une crevaison', category: '9. PNEUS', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'pneus9-C', label: 'Pneu simple ou les pneus jumelés du même assemblage de roues endommagées au point de voir la toile de renforcement ou la ceinture d\'acier', category: '9. PNEUS', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'pneus9-D', label: 'Pneu en contact avec une partie fixe du véhicule, qui est à plat ou présente une fuite d\'air ou un renflement', category: '9. PNEUS', subcategory: 'Défectuosités majeures', checked: false },
    
    // 10. PORTIÈRES ET AUTRES ISSUES
    { id: 'portieres10-1', label: 'Portière du conducteur s\'ouvre avec difficulté ou ne s\'ouvre pas', category: '10. PORTIÈRES ET AUTRES ISSUES', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'portieres10-A', label: 'Portière de l\'habitacle ne se ferme pas de façon sécuritaire', category: '10. PORTIÈRES ET AUTRES ISSUES', subcategory: 'Défectuosités majeures', checked: false },
    
    // 11. RÉTROVISEURS ET VITRAGE
    { id: 'retroviseurs11-1', label: 'Pare-Brise ou vitre latérale située d\'un côté ou de l\'autre du poste de conduite n\'offrent pas la visibilité requise au conducteur parce qu\'endommagés', category: '11. RÉTROVISEURS ET VITRAGE', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'retroviseurs11-2', label: 'Rétroviseur extérieur requis par le Code manquant, endommagé ou ne peut être ajusté et demeurer à la position choisie', category: '11. RÉTROVISEURS ET VITRAGE', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'retroviseurs11-3', label: 'Rétroviseur extérieur mal fixé ou présente une arête vive', category: '11. RÉTROVISEURS ET VITRAGE', subcategory: 'Défectuosités mineures', checked: false },
    
    // 12. ROUES, MOYEUX ET PIÈCES DE FIXATION
    { id: 'roues12-1', label: 'Écrou, boulon ou goujon de fixation manquant, cassé ou desserré', category: '12. ROUES, MOYEUX ET PIÈCES DE FIXATION', subcategory: 'Défectuosités mineures', checked: false, disabled: true },
    { id: 'roues12-2', label: 'Support ou le montage fixant la roue de secours est non solidement fixé pour la maintenir', category: '12. ROUES, MOYEUX ET PIÈCES DE FIXATION', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'roues12-A', label: 'Une roue qui présente une fissure ou un trou de boulon déformé ou agrandi', category: '12. ROUES, MOYEUX ET PIÈCES DE FIXATION', subcategory: 'Défectuosités majeures', checked: false, disabled: true },
    { id: 'roues12-B', label: 'Pièce de fixation manquante, fissurée, cassée ou mal fixée', category: '12. ROUES, MOYEUX ET PIÈCES DE FIXATION', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'roues12-C', label: 'Roue endommagée ou porte une marque de réparation par soudage', category: '12. ROUES, MOYEUX ET PIÈCES DE FIXATION', subcategory: 'Défectuosités majeures', checked: false },
    
    // 13. SIÈGE
    { id: 'siege13-1', label: 'Siège du conducteur inadéquat ou ne demeure pas dans la position choisie', category: '13. SIÈGE', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'siege13-A', label: 'Ceinture de sécurité du siège du conducteur manquante, modifiée ou inadequate', category: '13. SIÈGE', subcategory: 'Défectuosités majeures', checked: false },
    
    // 14. SUSPENSION
    { id: 'suspension14-1', label: 'Lame de ressort autre qu\'une lame maîtresse ou ressort hélicoidal cassé', category: '14. SUSPENSION', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'suspension14-2', label: 'Fuite d\'air dans la suspension, ballon réparé ou endommagé au point d\'exposer la toile', category: '14. SUSPENSION', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'suspension14-A', label: 'Lame maîtresse, coussin de caoutchouc ou 25% et plus des lames d\'un ressort de l\'assemblage cassés ou manquants', category: '14. SUSPENSION', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'suspension14-B', label: 'Fuite d\'air dans le système non compensée par le compresseur ou ballon absent ou dégonflé', category: '14. SUSPENSION', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'suspension14-C', label: 'Élément de fixation de l\'essieu manquant, mal fixé, fissuré ou cassé', category: '14. SUSPENSION', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'suspension14-D', label: 'Lame en composite fissurée sur plus de 75% de sa longueur ou comporte une intersection de fissures', category: '14. SUSPENSION', subcategory: 'Défectuosités majeures', checked: false, disabled: true },
    { id: 'suspension14-E', label: 'Lame de ressort ou ressort hélicoidal déplacé vient en contact avec une pièce en mouvement', category: '14. SUSPENSION', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'suspension14-F', label: 'Ressort helicoidal cassé au point que le véhicule est affaissé complètement ou barre de torsion cassée', category: '14. SUSPENSION', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'suspension14-G', label: 'Essieu cassé ou élément de localisation de l\'essieu ou de la roue manquant, mal fixé, fissuré, cassé ou endommagé affectant le parallelisme ou causant le déplacement d\'un essieu ou d\'une roue par rapport à sa position', category: '14. SUSPENSION', subcategory: 'Défectuosités majeures', checked: false },
    
    // 15. SYSTÈME D'ALIMENTATION EN CARBURANT
    { id: 'carburant15-A', label: 'Réservoir mal fixé et il y a risque de séparation', category: '15. SYSTÈME D\'ALIMENTATION EN CARBURANT', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'carburant15-B', label: 'Bouchon absent', category: '15. SYSTÈME D\'ALIMENTATION EN CARBURANT', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'carburant15-C', label: 'Fuite de carburant autre qu\'un suintement', category: '15. SYSTÈME D\'ALIMENTATION EN CARBURANT', subcategory: 'Défectuosités majeures', checked: false },
    
    // 16. SYSTÈME D'ÉCHAPPEMENT
    { id: 'echappement16-1', label: 'Fuite de gaz d\'échappement ailleurs qu\'aux endroits prévus lors de la fabrication', category: '16. SYSTÈME D\'ÉCHAPPEMENT', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'echappement16-A', label: 'Fuite de gaz d\'échappement qui s\'infiltre dans l\'habitacle lorsque le plancher est perforé', category: '16. SYSTÈME D\'ÉCHAPPEMENT', subcategory: 'Défectuosités majeures', checked: false },
    
    // 17. SYSTÈME DE FREINS ÉLECTRIQUES
    { id: 'freinsElec17-1', label: 'Raccord ou câble électrique mat fixé à un point d\'attache ou de connexion', category: '17. SYSTÈME DE FREINS ÉLECTRIQUES', subcategory: 'Défectuosités mineures', checked: false, disabled: true },
    { id: 'freinsElec17-A', label: 'Réduction importante de la capacité de freinage du frein de service', category: '17. SYSTÈME DE FREINS ÉLECTRIQUES', subcategory: 'Défectuosités majeures', checked: false, disabled: true },
    
    // 18. SYSTÈME DE FREINS HYDRAULIQUES
    { id: 'freinsHyd18-1', label: 'Niveau de liquide dans le réservoir du maître-cylindre est sous le niveau minimal requis', category: '18. SYSTÈME DE FREINS HYDRAULIQUES', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'freinsHyd18-2', label: 'Pédale de frein descend au plancher', category: '18. SYSTÈME DE FREINS HYDRAULIQUES', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'freinsHyd18-3', label: 'Témoin lumineux allumé pendant que le moteur est en marche ou ne s\'allume pas lorsque la clé de contact est à la position marche ou démarrage', category: '18. SYSTÈME DE FREINS HYDRAULIQUES', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'freinsHyd18-4', label: 'Témoin lumineux ne s\'allume pas lorsque le frein de stationnement est serré ou ne s\'éteint pas lorsqu\'il est desserré', category: '18. SYSTÈME DE FREINS HYDRAULIQUES', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'freinsHyd18-5', label: 'Frein de stationnement ne fonctionne pas correctement', category: '18. SYSTÈME DE FREINS HYDRAULIQUES', subcategory: 'Défectuosités mineures', checked: false },
    
    // 19. SYSTÈME DE FREINS PNEUMATIQUES
    { id: 'freinsPneum19-1', label: 'Avertisseur sonore de basse pression ne fonctionne pas correctement', category: '19. SYSTÈME DE FREINS PNEUMATIQUES', subcategory: 'Défectuosités mineures', checked: false, disabled: true },
    { id: 'freinsPneum19-2', label: 'Les avertisseurs lumineux et visuels de basse pression ne fonctionnent pas correctement', category: '19. SYSTÈME DE FREINS PNEUMATIQUES', subcategory: 'Défectuosités mineures', checked: false, disabled: true },
    { id: 'freinsPneum19-3', label: 'Régulateur de pression ne fonctionne pas correctement', category: '19. SYSTÈME DE FREINS PNEUMATIQUES', subcategory: 'Défectuosités mineures', checked: false, disabled: true },
    { id: 'freinsPneum19-4', label: 'Fuite d\'air audible ou dont le taux en une minute dépasse 20 kPa (3 lb/po) unités pour un véhicule d\'une seule unité, 28 kPa (4 lb/po) pour un véhicule de deux unités et 35 kPa (5lb/po\') pour un véhicule de trois unités', category: '19. SYSTÈME DE FREINS PNEUMATIQUES', subcategory: 'Défectuosités mineures', checked: false, disabled: true },
    { id: 'freinsPneum19-5', label: 'Frein de stationnement ou d\'urgence ne fonctionne pas correctement', category: '19. SYSTÈME DE FREINS PNEUMATIQUES', subcategory: 'Défectuosités mineures', checked: false, disabled: true },
    { id: 'freinsPneum19-A', label: 'Aucun avertisseur sonore, lumineux et visuel de basse pression ne fonctionne', category: '19. SYSTÈME DE FREINS PNEUMATIQUES', subcategory: 'Défectuosités majeures', checked: false, disabled: true },
    { id: 'freinsPneum19-B', label: 'Compresseur d\'air ne fonctionne pas correctement', category: '19. SYSTÈME DE FREINS PNEUMATIQUES', subcategory: 'Défectuosités majeures', checked: false, disabled: true },
    { id: 'freinsPneum19-C', label: 'Fuite d\'air dont le taux en une minute dépasse 40 kPa (6 lb/po) pour un véhicule d\'une seule unité, 48 kPa (7 b/po\') pour un de deux unités et 62 kPa (8 lb/po\') pour un de trois unités', category: '19. SYSTÈME DE FREINS PNEUMATIQUES', subcategory: 'Défectuosités majeures', checked: false, disabled: true },
    { id: 'freinsPneum19-D', label: 'Reduction importante de la capacité de freinage du frein de service', category: '19. SYSTÈME DE FREINS PNEUMATIQUES', subcategory: 'Défectuosités majeures', checked: false, disabled: true },
    
    // Nouvelle section: VÉRIFICATIONS SPÉCIFIQUES EXIGÉES PAR LE GROUPE CAMBI
    {
      id: 'cambi-V1-A', // Lettre majuscule pour indiquer défectuosité majeure
      label: 'Le système de radiocommunication: Vérifier l\'équipement en fonction de la politique de l\'entreprise',
      category: 'VÉRIFICATIONS SPÉCIFIQUES EXIGÉES PAR LE GROUPE CAMBI',
      checked: false,
      isConform: false
    },
    {
      id: 'cambi-v2',
      label: 'Matériel d\'urgence: Fusées éclairantes (8)',
      category: 'VÉRIFICATIONS SPÉCIFIQUES EXIGÉES PAR LE GROUPE CAMBI',
      checked: false,
      isConform: false
    },
    {
      id: 'cambi-V3-B', // Lettre majuscule pour indiquer défectuosité majeure
      label: 'Gyrophare',
      category: 'VÉRIFICATIONS SPÉCIFIQUES EXIGÉES PAR LE GROUPE CAMBI',
      checked: false,
      isConform: false
    },
    {
      id: 'cambi-v4',
      label: 'Les serrures',
      category: 'VÉRIFICATIONS SPÉCIFIQUES EXIGÉES PAR LE GROUPE CAMBI',
      checked: false,
      isConform: false
    },
    {
      id: 'cambi-v5',
      label: 'Les joints d\'étanchéité',
      category: 'VÉRIFICATIONS SPÉCIFIQUES EXIGÉES PAR LE GROUPE CAMBI',
      checked: false,
      isConform: false
    },
    {
      id: 'cambi-v6',
      label: 'Avertisseurs audibles',
      category: 'VÉRIFICATIONS SPÉCIFIQUES EXIGÉES PAR LE GROUPE CAMBI',
      checked: false,
      isConform: false
    },
    {
      id: 'cambi-v7',
      label: 'Autres portes et compartiments externes',
      category: 'VÉRIFICATIONS SPÉCIFIQUES EXIGÉES PAR LE GROUPE CAMBI',
      checked: false,
      isConform: false
    },
    {
      id: 'cambi-v8',
      label: 'Plafonnier',
      category: 'VÉRIFICATIONS SPÉCIFIQUES EXIGÉES PAR LE GROUPE CAMBI',
      checked: false,
      isConform: false
    },
    {
      id: 'cambi-V9-C', // Lettre majuscule pour indiquer défectuosité majeure
      label: 'Air conditionné',
      category: 'VÉRIFICATIONS SPÉCIFIQUES EXIGÉES PAR LE GROUPE CAMBI',
      checked: false,
      isConform: false
    },
    {
      id: 'cambi-V10-D', // Lettre majuscule pour indiquer défectuosité majeure
      label: 'Sirène bien fixée et fonctionnelle',
      category: 'VÉRIFICATIONS SPÉCIFIQUES EXIGÉES PAR LE GROUPE CAMBI',
      checked: false,
      isConform: false
    },
    {
      id: 'cambi-v11',
      label: 'Liquides: Refroidissement, Huile à transmission et moteur, Lave-glace',
      category: 'VÉRIFICATIONS SPÉCIFIQUES EXIGÉES PAR LE GROUPE CAMBI',
      checked: false,
      isConform: false
    },
    {
      id: 'cambi-v12',
      label: 'Clé(s) supplémentaire(s)',
      category: 'VÉRIFICATIONS SPÉCIFIQUES EXIGÉES PAR LE GROUPE CAMBI',
      checked: false,
      isConform: false
    },
    {
      id: 'cambi-v13',
      label: 'Outil de localisation routière',
      category: 'VÉRIFICATIONS SPÉCIFIQUES EXIGÉES PAR LE GROUPE CAMBI',
      checked: false,
      isConform: false
    },
    {
      id: 'cambi-v14',
      label: 'Extincteur de type ABC: 1 de 5 kg ou 2 de 2,5 kg',
      category: 'VÉRIFICATIONS SPÉCIFIQUES EXIGÉES PAR LE GROUPE CAMBI',
      checked: false,
      isConform: false
    },
    {
      id: 'cambi-v15',
      label: 'Documentation: Preuve d\'assurance, Immatriculation, Constat à l\'amiable, Enveloppe SST, Formulaires papier, Carte de crédit',
      category: 'VÉRIFICATIONS SPÉCIFIQUES EXIGÉES PAR LE GROUPE CAMBI',
      checked: false,
      isConform: false
    }
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

  // Fonction pour mettre à jour l'état d'une case à cocher du MDSA
  const handleMdsaCheckChange = (itemId: string) => {
    setMdsaItems(prevItems => 
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

  // Fonction pour mettre à jour la date d'expiration d'un item du MDSA
  const handleMdsaExpireDateChange = (itemId: string, date: string) => {
    setMdsaItems(prevItems => 
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
  const validateMdsaForm = () => {
    // Vérifier si tous les éléments à cocher sont cochés
    for (const item of mdsaItems) {
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

  // Fonction pour générer un PDF de l'inspection MDSA
  const generateMdsaPDF = () => {
    const doc = new jsPDF();
    
    // Titre du document
    doc.setFontSize(18);
    doc.text('Inspection MDSA', 105, 15, { align: 'center' });
    
    // Informations générales
    doc.setFontSize(12);
    doc.text(`Matricule: ${matricule}`, 14, 30);
    doc.text(`Numéro du moniteur: ${numeroMoniteur}`, 14, 38);
    doc.text(`Point de service: ${pointDeService}`, 14, 46);
    doc.text(`Date et heure: ${getCurrentDateTime()}`, 14, 54);
    
    // Créer un tableau manuellement (sans autoTable)
    let yPosition = 60;
    
    // En-tête du tableau
    doc.setFillColor(178, 42, 46); // Rouge CAMBI #b22a2e
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
    
    mdsaItems.forEach(item => {
      // Nouvelle catégorie
      if (item.category !== currentCategory) {
        currentCategory = item.category || 'Autre';
        
        // Dessiner la ligne de catégorie
        doc.setFillColor(230, 200, 200); // Rouge CAMBI clair pour les catégories
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
      if (item.subcategory && (mdsaItems.find(i => i.category === item.category && i.subcategory === item.subcategory) === item)) {
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
        doc.setFillColor(178, 42, 46); // Rouge CAMBI #b22a2e
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
      doc.text(`Inspection MDSA - Page ${i} de ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
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
    doc.setFillColor(16, 41, 71); // Bleu CAMBI #102947
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
        doc.setFillColor(200, 210, 230); // Bleu CAMBI clair pour les catégories
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
        doc.setFillColor(16, 41, 71); // Bleu CAMBI #102947
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
      const webhookUrl = formType === 'MDSA' ? API_URL_MDSA : API_URL_VEHICULE;
      
      console.log(`Utilisation du webhook pour ${formType}:`, webhookUrl);
      
      // Créer un nom de fichier unique et significatif
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `inspection_${formType.toLowerCase()}_${formType === 'MDSA' ? numeroMoniteur : numeroVehicule}_${timestamp}.pdf`;
      
      // Préparation des données pour le webhook Make.com
      const webhookData = {
        type: formType,
        matricule: matricule,
        dateTime: currentDateTime,
        pointDeService: pointDeService,
        numeroIdentifiant: formType === 'MDSA' ? numeroMoniteur : numeroVehicule,
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
          const doc = formType === 'MDSA' ? generateMdsaPDF() : generateVehiculePDF();
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
  
  // Fonction pour générer un HTML de l'inspection MDSA
  const generateMdsaHTML = () => {
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Inspection MDSA</title>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          h1 {
            color: #2563eb;
            text-align: center;
            margin-bottom: 20px;
          }
          .info {
            margin-bottom: 20px;
          }
          .info p {
            margin: 5px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background-color: #2563eb;
            color: white;
            text-align: left;
            padding: 8px;
          }
          td {
            border: 1px solid #ddd;
            padding: 8px;
          }
          .category {
            background-color: #dbeafe;
            font-weight: bold;
          }
          .subcategory {
            background-color: #f3f4f6;
            font-weight: bold;
          }
          .checked {
            color: green;
            font-weight: bold;
          }
          .not-checked {
            color: red;
          }
          footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <h1>Inspection MDSA</h1>
        
        <div class="info">
          <p><strong>Matricule:</strong> ${matricule}</p>
          <p><strong>Numéro du moniteur:</strong> ${numeroMoniteur}</p>
          <p><strong>Point de service:</strong> ${pointDeService}</p>
          <p><strong>Date et heure:</strong> ${getCurrentDateTime()}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Élément</th>
              <th>Vérifié</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    // Regrouper par catégorie et sous-catégorie
    const groupedItems = mdsaItems.reduce((acc, item) => {
      if (!acc[item.category || 'Autres']) acc[item.category || 'Autres'] = {};
      
      const subcategory = item.subcategory || 'default';
      if (!acc[item.category || 'Autres'][subcategory]) {
        acc[item.category || 'Autres'][subcategory] = [];
      }
      
      acc[item.category || 'Autres'][subcategory].push(item);
      return acc;
    }, {} as Record<string, Record<string, CheckItem[]>>);
    
    // Ajouter les lignes par catégorie
    Object.entries(groupedItems).forEach(([category, subcategories]) => {
      html += `
            <tr>
              <td colspan="2" class="category">${category}</td>
            </tr>
      `;
      
      Object.entries(subcategories).forEach(([subcategory, items]) => {
        if (subcategory !== 'default') {
          html += `
            <tr>
              <td colspan="2" class="subcategory">${subcategory}</td>
            </tr>
          `;
        }
        
        items.forEach(item => {
          let itemLabel = item.label;
          
          if (item.id === 'electrode1' && expireDateElectrode1) {
            itemLabel += ` (Expiration: ${expireDateElectrode1})`;
          } else if (item.id === 'electrode2' && expireDateElectrode2) {
            itemLabel += ` (Expiration: ${expireDateElectrode2})`;
          }
          
          html += `
            <tr>
              <td>${itemLabel}</td>
              <td class="${item.checked ? 'checked' : 'not-checked'}">${item.checked ? '✓' : '✗'}</td>
            </tr>
          `;
        });
      });
    });
    
    html += `
          </tbody>
        </table>
        
        <footer>
          Inspection MDSA - Généré le ${getCurrentDateTime()}
        </footer>
      </body>
      </html>
    `;
    
    return html;
  };

  // Fonction pour générer un HTML de l'inspection Véhicule
  const generateVehiculeHTML = () => {
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Inspection Véhicule</title>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          h1 {
            color: #16a34a;
            text-align: center;
            margin-bottom: 20px;
          }
          .info {
            margin-bottom: 20px;
          }
          .info p {
            margin: 5px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background-color: #16a34a;
            color: white;
            text-align: left;
            padding: 8px;
          }
          td {
            border: 1px solid #ddd;
            padding: 8px;
          }
          .category {
            background-color: #fef3c7;
            font-weight: bold;
          }
          .checked {
            color: green;
            font-weight: bold;
          }
          .not-checked {
            color: red;
          }
          footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <h1>Inspection Véhicule</h1>
        
        <div class="info">
          <p><strong>Matricule:</strong> ${matricule}</p>
          <p><strong>Numéro du véhicule:</strong> ${numeroVehicule}</p>
          <p><strong>Point de service:</strong> ${pointDeService}</p>
          <p><strong>Date et heure:</strong> ${getCurrentDateTime()}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Élément</th>
              <th>Vérifié</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    // Regrouper par catégorie
    const groupedItems = vehiculeItems.reduce((acc, item) => {
      if (!acc[item.category || 'Autres']) acc[item.category || 'Autres'] = [];
      acc[item.category || 'Autres'].push(item);
      return acc;
    }, {} as Record<string, CheckItem[]>);
    
    // Ajouter les lignes par catégorie
    Object.entries(groupedItems).forEach(([category, items]) => {
      html += `
            <tr>
              <td colspan="2" class="category">${category}</td>
            </tr>
      `;
      
      items.forEach(item => {
        let itemLabel = item.label;
        
        // Ajouter les informations supplémentaires
        if (item.id === 'trousse3' && cylindre1PSI) {
          itemLabel += ` (PSI: ${cylindre1PSI})`;
        } else if (item.id === 'trousse4' && cylindre2PSI) {
          itemLabel += ` (PSI: ${cylindre2PSI})`;
        } else if (item.id === 'armoire15' && grosCylindrePSI) {
          itemLabel += ` (PSI: ${grosCylindrePSI})`;
        } else if (item.id === 'trousse7' && (glycemieNormal || glycemieHigh || glycemieLow)) {
          itemLabel += ` (Normal: ${glycemieNormal || '-'}, High: ${glycemieHigh || '-'}, Low: ${glycemieLow || '-'})`;
        }
        
        html += `
          <tr>
            <td>${itemLabel}</td>
            <td class="${item.checked ? 'checked' : 'not-checked'}">${item.checked ? '✓' : '✗'}</td>
          </tr>
        `;
      });
    });
    
    html += `
          </tbody>
        </table>
        
        <footer>
          Inspection Véhicule - Généré le ${getCurrentDateTime()}
        </footer>
      </body>
      </html>
    `;
    
    return html;
  };

  // Fonction pour envoyer les données d'inspection à l'API
  const sendInspectionToMakecom = async (formType: string) => {
    try {
      console.log(`Début de la préparation de l'envoi pour ${formType}...`);
      
      // Générer le HTML selon le type de formulaire
      let htmlContent = '';
      if (formType === 'MDSA') {
        htmlContent = generateMdsaHTML();
      } else if (formType === 'Véhicule') {
        htmlContent = generateVehiculeHTML();
      } else if (formType === 'Defectuosites') {
        htmlContent = generateDefectuositesHTML();
      } else {
        throw new Error(`Type de formulaire inconnu: ${formType}`);
      }
      console.log(`HTML ${formType} généré, taille:`, htmlContent.length, "caractères");
      
      // Préparation des données pour l'envoi
      const currentDateTime = getCurrentDateTime();
      let webhookUrl = '';
      if (formType === 'MDSA') {
        webhookUrl = API_URL_MDSA;
      } else if (formType === 'Véhicule') {
        webhookUrl = API_URL_VEHICULE;
      } else if (formType === 'Defectuosites') {
        webhookUrl = API_URL_DEFECTUOSITES;
      } else {
        throw new Error(`Type de formulaire inconnu: ${formType}`);
      }
      
      console.log(`Utilisation du webhook pour ${formType}:`, webhookUrl);
      
      // Créer un nom de fichier unique et significatif
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      let numeroIdentifiant = "";
      
      if (formType === 'MDSA') {
        numeroIdentifiant = numeroMoniteur;
      } else {
        numeroIdentifiant = numeroVehicule;
      }
      
      const fileName = `inspection_${formType.toLowerCase()}_${numeroIdentifiant}_${timestamp}.html`;
      
      // Préparation des données pour l'API
      const webhookData = {
        type: formType,
        matricule: matricule,
        dateTime: currentDateTime,
        pointDeService: pointDeService,
        numeroIdentifiant: numeroIdentifiant,
        htmlContent: htmlContent,
        fileName: fileName,
        mimeType: "text/html" // Spécifier le type MIME comme HTML
      };
      
      console.log(`Préparation des données pour webhook ${formType} complète`);
      console.log(`Nom du fichier: ${fileName}`);
      console.log(`Type d'inspection: ${formType}`);
      console.log(`Envoi des données au webhook ${formType}...`);
      
      // Envoi au webhook Make.com
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      });
      
      console.log(`Réponse du webhook ${formType} - Status:`, response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erreur de réponse du webhook ${formType}:`, errorText);
        throw new Error(`Erreur du serveur: ${response.status} - ${errorText}`);
      }
      
      const responseText = await response.text();
      console.log(`Réponse complète du webhook ${formType}:`, responseText);
      
      console.log(`Données HTML envoyées avec succès au webhook ${formType}`);
      
      return true;
    } catch (error) {
      console.error(`Erreur détaillée lors de l'envoi pour ${formType}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error(`Problème lors de l'envoi de l'inspection ${formType}: ${errorMessage}`);
      throw error;
    }
  };
  
  const confirmSubmitForm1 = async () => {
    // Fermer la boîte de dialogue de confirmation
    setShowConfirmation(false);
    
    // Valider le formulaire
    const validationError = validateMdsaForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const currentDateTime = getCurrentDateTime();
      setSubmissionDateTime(currentDateTime);
      
      // Envoyer les données HTML à Make.com
      try {
        console.log("Tentative d'envoi des données MDSA via webhook...");
        const dataSent = await sendInspectionToMakecom('MDSA');
        if (dataSent) {
          console.log("Envoi des données MDSA réussi");
          setSubmissionMessage("L'inspection a été générée et envoyée avec succès.");
        } else {
          console.log("Échec de l'envoi des données MDSA");
          setSubmissionMessage("L'inspection a été générée mais l'envoi a échoué.");
        }
      } catch (sendError) {
        console.error('Erreur envoi webhook détaillée pour MDSA:', sendError);
        setSubmissionMessage(`L'inspection a été générée mais l'envoi a échoué: ${sendError instanceof Error ? sendError.message : 'Erreur inconnue'}.`);
      }
      
      setSubmitted(true);
      
      // Réinitialiser le formulaire
      setMatricule('');
      setNumeroMoniteur('');
      setPointDeService('');
      setExpireDateElectrode1('');
      setExpireDateElectrode2('');
      setMdsaItems(prevItems => 
        prevItems.map(item => ({
          ...item,
          checked: false,
          expireDate: ''
        }))
      );
    } catch (error) {
      console.error('Erreur lors de la génération ou envoi de l\'inspection MDSA:', error);
      setError(`Échec de la génération ou de l'envoi: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
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
      
      // Envoyer les données HTML à Make.com
      try {
        console.log("Tentative d'envoi des données Véhicule via webhook...");
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

  const goBack = () => {
    if (submitted) {
      setSubmitted(false);
    } else {
      setCurrentForm(null);
    }
  };

  // Fonction pour gérer le résultat du scan de code-barres
  const handleScanSuccess = (result: string) => {
    // Nettoyer le résultat si nécessaire (par exemple, enlever des préfixes)
    const cleanResult = result.trim();
    setNumeroMoniteur(cleanResult);
    setShowScanner(false);
  };

  // Fonction pour gérer les cases à cocher du formulaire Défectuosités
  const handleDefectuositesCheckChange = (itemId: string, isConformCheck: boolean = false) => {
    setDefectuositesItems(prevItems => 
      prevItems.map(item => {
        // Ne pas modifier les items désactivés
        if (item.disabled) return item;
        
        if (item.id === itemId) {
          if (isConformCheck) {
            // Si on coche "conforme", on décoche "défectuosité" et vice versa
            return {
              ...item,
              isConform: !item.isConform,
              checked: false, // Décoche la défectuosité si "conforme" est coché
              comment: !item.isConform ? '' : item.comment // Effacer le commentaire si on coche "conforme"
            };
          } else {
            // Si on coche "défectuosité", on décoche "conforme"
            return {
              ...item,
              checked: !item.checked,
              isConform: false, // Décoche "conforme" si "défectuosité" est cochée
            };
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

  // Modifier la fonction handleSectionAllConform pour vérifier si une section contient au moins un élément cliquable
  const handleSectionAllConform = (category: string) => {
    setDefectuositesItems(prevItems => 
      prevItems.map(item => {
        // Ne modifie que les items qui appartiennent à la catégorie sélectionnée et qui ne sont pas désactivés
        if (item.category === category && !item.disabled) {
          return {
            ...item,
            isConform: true, // Tous les items deviennent conformes
            checked: false,  // Décoche toutes les défectuosités
            comment: ''      // Efface tous les commentaires
          };
        }
        return item;
      })
    );
  };

  // Fonction utilitaire pour vérifier si une section est entièrement désactivée
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

  // Ajouter la fonction pour détecter les défectuosités mineures
  const hasMinorDefects = () => {
    const minorDefects = defectuositesItems.filter(item => 
      item.checked && item.id.includes('-') && !/[A-Z]/.test(item.id.split('-')[1])
    );
    return minorDefects.length > 0 ? minorDefects : null;
  };

  // Mettre à jour la fonction de validation pour vérifier que toutes les cases ont été cochées
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
    
    return null;
  };

  // Ajouter un état pour stocker les défectuosités majeures détectées
  const [majorDefectsInfo, setMajorDefectsInfo] = useState<{
    hasMajorDefects: boolean;
    defectsList: string;
    hasMinorDefects?: boolean;
  }>({
    hasMajorDefects: false,
    defectsList: '',
    hasMinorDefects: false
  });

  // Mettre à jour la fonction handleSubmitForm3 pour ne pas afficher d'alerte séparée
  const handleSubmitForm3 = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Vérifier si tous les éléments ont été vérifiés
    const validationError = validateDefectuositesForm();
    if (validationError) {
      setError(validationError);
      return; // Arrêter la soumission si validation échoue
    }
    
    // Vérifier s'il y a des défectuosités majeures
    const majorDefects = hasMajorDefects();
    const minorDefects = hasMinorDefects();
    
    if (majorDefects) {
      const defectsList = majorDefects.map((item: CheckItem) => 
        `- ${item.label}${item.comment ? ` (${item.comment})` : ''}`
      ).join('\n');
      
      // Stocker les informations sur les défectuosités majeures dans l'état
      setMajorDefectsInfo({
        hasMajorDefects: true,
        defectsList
      });
    } else if (minorDefects) {
      const defectsList = minorDefects.map((item: CheckItem) => 
        `- ${item.label}${item.comment ? ` (${item.comment})` : ''}`
      ).join('\n');
      
      // Stocker les informations sur les défectuosités mineures dans l'état
      setMajorDefectsInfo({
        hasMajorDefects: false,
        defectsList,
        hasMinorDefects: true
      });
    } else {
      setMajorDefectsInfo({
        hasMajorDefects: false,
        defectsList: '',
        hasMinorDefects: false
      });
    }
    
    // Afficher la boîte de dialogue de confirmation
    setShowConfirmation(true);
  };
  
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
      
      // Vérifier s'il y a des défectuosités majeures pour le message final
      const majorDefects = hasMajorDefects();
      const minorDefects = hasMinorDefects();
      let defectsMessage = '';
      
      if (majorDefects) {
        defectsMessage = 'ATTENTION: Des défectuosités majeures ont été détectées. Veuillez contacter votre chef d\'équipe ou superviseur immédiatement.';
      } else if (minorDefects) {
        defectsMessage = 'Des défectuosités mineures ont été détectées. Veuillez contacter votre chef d\'équipe ou superviseur.';
      }
      
      const currentDateTime = getCurrentDateTime();
      setSubmissionDateTime(currentDateTime);
      
      // Envoyer les données HTML à l'API
      try {
        console.log("Tentative d'envoi des données Défectuosités via webhook...");
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

  // Fonction pour générer le HTML du formulaire Défectuosités
  const generateDefectuositesHTML = () => {
    // Vérifier s'il y a des défectuosités majeures
    const majorDefects = hasMajorDefects();
    const minorDefects = hasMinorDefects();
    
    let defectsWarning = '';
    
    if (majorDefects) {
      defectsWarning = `<div style="background-color: #ffebee; border: 2px solid #c62828; padding: 15px; margin: 20px 0; border-radius: 5px;">
        <h3 style="color: #c62828; margin-top: 0;">⚠️ ATTENTION: DÉFECTUOSITÉS MAJEURES DÉTECTÉES</h3>
        <p>Les défectuosités majeures suivantes nécessitent une attention immédiate. Veuillez contacter votre chef d'équipe ou superviseur.</p>
        <ul style="margin-bottom: 0;">
          ${majorDefects.map((item: CheckItem) => 
            `<li><strong>${item.label}</strong>${item.comment ? ` - ${item.comment}` : ''}</li>`
          ).join('')}
        </ul>
      </div>`;
    } else if (minorDefects) {
      defectsWarning = `<div style="background-color: #fff8e1; border: 2px solid #ffa000; padding: 15px; margin: 20px 0; border-radius: 5px;">
        <h3 style="color: #ffa000; margin-top: 0;">⚠️ DÉFECTUOSITÉS MINEURES DÉTECTÉES</h3>
        <p>Les défectuosités mineures suivantes nécessitent une attention. Veuillez contacter votre chef d'équipe ou superviseur.</p>
        <ul style="margin-bottom: 0;">
          ${minorDefects.map((item: CheckItem) => 
            `<li><strong>${item.label}</strong>${item.comment ? ` - ${item.comment}` : ''}</li>`
          ).join('')}
        </ul>
      </div>`;
    }

    // Regrouper les éléments par catégorie
    const categorized = defectuositesItems.reduce<Record<string, CheckItem[]>>((acc, item) => {
      if (!acc[item.category || 'Autres']) acc[item.category || 'Autres'] = [];
      acc[item.category || 'Autres'].push(item);
      return acc;
    }, {});

    // Générer le HTML avec le style de base
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Liste de défectuosités</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          th { background-color: #f2f2f2; text-align: left; }
          .category { background-color: #e9ecef; font-weight: bold; }
          .conformed { background-color: #d4edda; }
          .defect-major { background-color: #f8d7da; }
          .defect-minor { background-color: #fff3cd; }
          .comment { font-style: italic; color: #721c24; }
          .header-info { margin-bottom: 20px; }
          .header-info p { margin: 5px 0; }
        </style>
      </head>
      <body>
        <h1>Liste de défectuosités</h1>
        
        <div class="header-info">
          <p><strong>Matricule:</strong> ${matricule}</p>
          <p><strong>Numéro de véhicule:</strong> ${numeroVehicule}</p>
          <p><strong>Point de service:</strong> ${pointDeService}</p>
          <p><strong>Date et heure:</strong> ${getCurrentDateTime()}</p>
        </div>
        
        ${defectsWarning}
        
        <table>
          <thead>
            <tr>
              <th style="width: 70%;">Élément</th>
              <th style="width: 15%;">État</th>
              <th style="width: 15%;">Commentaire</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(categorized).map(([category, items]) => `
              <tr>
                <td colspan="3" class="category">${category}</td>
              </tr>
              ${items.map(item => {
                const status = item.isConform ? 'Conforme' : (item.checked ? 'Défectueux' : 'Non vérifié');
                const isMajor = item.checked && item.id.includes('-') && /[A-Z]/.test(item.id.split('-')[1]);
                const isMinor = item.checked && item.id.includes('-') && !/[A-Z]/.test(item.id.split('-')[1]);
                const rowClass = item.isConform ? 'conformed' : (isMajor ? 'defect-major' : (isMinor ? 'defect-minor' : ''));
                
                return `
                  <tr class="${rowClass}">
                    <td>${isMajor ? '⚠️ ' : (isMinor ? '⚠️ ' : '')}${item.label}</td>
                    <td>${status}</td>
                    <td>${item.comment || ''}</td>
                  </tr>
                `;
              }).join('')}
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    return html;
  };

  // Page d'accueil avec les options de formulaire
  if (currentForm === null) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <header className="bg-[#b22a2e] text-white p-4 rounded-lg shadow-md flex items-center justify-between mb-8">
          <div className="flex items-center">
            <img src="https://res.cloudinary.com/dxyvj8rka/image/upload/f_auto,q_auto/v1/cambi/iazjhbzvu6dv5fad398u" alt="Logo CAMBI" className="h-10 mr-3 filter brightness-0 invert" />
            <h1 className="text-2xl font-bold">Inspection AMC (CAMBI)</h1>
          </div>
        </header>
        
        <div className="grid md:grid-cols-3 gap-6">
          <button 
            onClick={() => setCurrentForm('form1')}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col items-center"
          >
            <div className="bg-[#b22a2e]/10 p-4 rounded-full mb-4">
              <ClipboardCheck size={48} className="text-[#b22a2e]" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Inspection MDSA</h2>
            <p className="text-gray-600 text-center">Vérification du moniteur défibrillateur</p>
            <ChevronRight className="mt-4 text-[#b22a2e]" />
          </button>
          
          <button 
            onClick={() => setCurrentForm('form2')}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col items-center"
          >
            <div className="bg-[#102947]/10 p-4 rounded-full mb-4">
              <ClipboardCheck size={48} className="text-[#102947]" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Inspection Véhicule</h2>
            <p className="text-gray-600 text-center">Vérification du materiel de l'ambulance</p>
            <ChevronRight className="mt-4 text-[#102947]" />
          </button>
          
          <button 
            onClick={() => setCurrentForm('form3')}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col items-center"
          >
            <div className="bg-[#4f6683]/10 p-4 rounded-full mb-4">
              <ClipboardCheck size={48} className="text-[#4f6683]" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Liste des Défectuosités</h2>
            <p className="text-gray-600 text-center">Véhicules lourds ambulanciers</p>
            <ChevronRight className="mt-4 text-[#4f6683]" />
          </button>
        </div>
        
        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>© 2025 Inspection AMC (CAMBI) - Tous droits réservés</p>
        </footer>
      </div>
    );
  }

  // Page de confirmation après soumission du formulaire
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full text-center">
          <div className="bg-[#b22a2e]/10 p-4 rounded-full mx-auto w-20 h-20 flex items-center justify-center mb-4">
            <CheckCircle2 size={32} className="text-[#b22a2e]" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Inspection terminée avec succès!</h2>
          
          <p className="text-sm text-gray-500 mb-8">
            Terminé le {submissionDateTime}
          </p>
          
          <button 
            onClick={() => {
              setSubmitted(false);
              setCurrentForm(null);
              setGeneratedPdfUrl(null);
              setSubmissionMessage(null);
            }}
            className="bg-[#b22a2e] text-white py-3 px-6 rounded-lg hover:bg-[#b22a2e]/90 transition-colors w-full"
          >
            Retour à l'accueil
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
                        {category}
                      </td>
                    </tr>
                    
                    {Object.entries(subcategories).map(([subcategory, items]) => (
                      <React.Fragment key={subcategory}>
                        <tr>
                          <td colSpan={2} className="border border-gray-300 p-2 bg-gray-100 font-medium">
                            {subcategory}
                          </td>
                        </tr>
                        {items.map(item => {
                          let itemLabel = item.label;
                          
                          if (item.id === 'electrode1' && expireDateElectrode1) {
                            itemLabel += ` (Expiration: ${expireDateElectrode1})`;
                          } else if (item.id === 'electrode2' && expireDateElectrode2) {
                            itemLabel += ` (Expiration: ${expireDateElectrode2})`;
                          }
                          
                          return (
                            <tr key={item.id}>
                              <td className="border border-gray-300 p-2">{itemLabel}</td>
                              <td className={`border border-gray-300 p-2 text-center ${item.checked ? 'text-green-600 font-bold' : 'text-red-600'}`}>
                                {item.checked ? '✓' : '✗'}
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
                          onChange={(e) => handleMatriculeChange(e.target.value)}
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
                  onClick={confirmSubmitForm1}
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
            onScanSuccess={handleScanSuccess} 
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
                Véhicule # :
              </label>
              <input
                type="text"
                id="numeroVehicule"
                value={numeroVehicule}
                onChange={(e) => handleVehiculeNumberChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#102947] focus:border-[#102947]"
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
          
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-2 bg-[#102947] text-white w-4/5">INSPECTION (10-84) DU MATÉRIELS CLINIQUES</th>
                  <th className="border border-gray-300 p-2 bg-[#102947] text-white w-1/5">Vérifié</th>
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
                      <td colSpan={2} className="border border-gray-300 p-2 bg-[#102947]/10 font-semibold">
                        {category}
                      </td>
                    </tr>
                    
                    {category === 'TROUSSES' && (
                      <>
                        {items.map((item) => (
                          <tr 
                            key={item.id}
                            className={`${item.disabled ? 'bg-gray-200 text-gray-500' : (item.checked ? 'bg-green-100' : '')} ${!item.disabled ? 'cursor-pointer transition-colors' : ''}`}
                            onClick={() => !item.disabled && handleVehiculeCheckChange(item.id)}
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
                                className="w-5 h-5 accent-[#102947]"
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
                            className={`${item.disabled ? 'bg-gray-200 text-gray-500' : (item.checked ? 'bg-green-100' : '')} ${!item.disabled ? 'cursor-pointer transition-colors' : ''}`}
                            onClick={() => !item.disabled && handleVehiculeCheckChange(item.id)}
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
                                className="w-5 h-5 accent-[#102947]"
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
                  <AlertCircle className="text-[#b22a2e] mr-3 mt-0.5" size={24} />
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

  // Formulaire 3: Liste des Défectuosités
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
              <label htmlFor="matriculeVehicule" className="block text-sm font-medium text-gray-700 mb-1">
                Matricule du TAP:
              </label>
              <input
                type="text"
                id="matriculeVehicule"
                value={matricule}
                onChange={(e) => handleMatriculeChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4f6683] focus:border-[#4f6683]"
                required
                placeholder="Ex: N-0100"
              />
            </div>
            
            <div className="md:w-1/3">
              <label htmlFor="numeroVehicule" className="block text-sm font-medium text-gray-700 mb-1">
                Véhicule # :
              </label>
              <input
                type="text"
                id="numeroVehicule"
                value={numeroVehicule}
                onChange={(e) => handleVehiculeNumberChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4f6683] focus:border-[#4f6683]"
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
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4f6683] focus:border-[#4f6683]"
                required
              >
                <option value="">Sélectionner un PDS</option>
                <option value="Sainte-Adèle">Sainte-Adèle</option>
                <option value="Grenville">Grenville</option>
                <option value="Saint-Donat">Saint-Donat</option>
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-2 bg-[#4f6683] text-white w-3/5">DÉFAUTS</th>
                  <th className="border border-gray-300 p-2 bg-[#4f6683] text-white w-1/5">Conforme</th>
                  <th className="border border-gray-300 p-2 bg-[#4f6683] text-white w-1/5">Défectuosité</th>
                </tr>
              </thead>
              <tbody>
                {/* Grouper les items par catégorie */}
                {Object.entries(
                  defectuositesItems.reduce<Record<string, CheckItem[]>>((acc, item) => {
                    if (!acc[item.category || 'Autres']) acc[item.category || 'Autres'] = [];
                    acc[item.category || 'Autres'].push(item);
                    return acc;
                  }, {})
                ).map(([category, items]) => (
                  <React.Fragment key={category}>
                    <tr>
                      <td colSpan={3} className="border border-gray-300 p-2 bg-[#4f6683]/10 font-semibold flex justify-between items-center">
                        <span>{category}</span>
                        {!isSectionDisabled(category) && (
                          <div className="flex items-center">
                            <span className="text-xs mr-2">Tout est conforme</span>
                            <input 
                              type="checkbox" 
                              onChange={() => handleSectionAllConform(category)}
                              className="w-5 h-5 accent-green-600"
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                    
                    {items.map((item) => (
                      <React.Fragment key={item.id}>
                        <tr 
                          className={`${item.disabled ? 'bg-gray-200 text-gray-500' : 
                            (item.isConform ? 'bg-green-100' : 
                            (item.checked 
                              ? (item.id.includes('-') && /[A-Z]/.test(item.id.split('-')[1]) ? 'bg-red-100' : 'bg-amber-100') 
                              : ''))} 
                            ${!item.disabled ? 'transition-colors' : ''}`}
                        >
                          <td className="border border-gray-300 p-2 text-sm">
                            {/* Extraire l'identifiant du ID et l'ajouter au début du label */}
                            <span className="font-mono text-xs text-gray-500 mr-2">
                              {item.id.split('-')[1]}
                            </span>
                            {item.label}
                          </td>
                          <td className="border border-gray-300 p-2 text-center">
                            <input 
                              type="checkbox" 
                              checked={item.isConform || false}
                              disabled={item.disabled}
                              onChange={() => handleDefectuositesCheckChange(item.id, true)}
                              className="w-5 h-5 accent-green-600"
                            />
                          </td>
                          <td className="border border-gray-300 p-2 text-center">
                            <input 
                              type="checkbox" 
                              checked={item.checked}
                              disabled={item.disabled}
                              onChange={() => handleDefectuositesCheckChange(item.id)}
                              className="w-5 h-5 accent-red-600"
                            />
                          </td>
                        </tr>
                        {/* Zone de commentaire qui apparaît uniquement si la défectuosité est cochée */}
                        {item.checked && !item.disabled && (
                          <tr className={item.id.includes('-') && /[A-Z]/.test(item.id.split('-')[1]) ? 'bg-red-50' : 'bg-amber-50'}>
                            <td colSpan={3} className="border border-gray-300 p-2">
                              <label className="block text-sm font-medium mb-1 text-gray-700">Commentaire sur la défectuosité :</label>
                              <textarea 
                                value={item.comment || ''}
                                onChange={(e) => handleDefectuositesCommentChange(item.id, e.target.value)}
                                className="w-full p-2 border rounded-md"
                                rows={2}
                                placeholder="Détails sur la défectuosité..."
                              />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))}
                
                <tr>
                  <td colSpan={3} className="border border-gray-300 p-2 bg-gray-100">
                    <div className="text-xs text-center italic mb-2">
                      Veuillez cocher les défectuosités constatées sur le véhicule
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
                {majorDefectsInfo.hasMajorDefects ? (
                  <>
                    <div className="flex items-start mb-4">
                      <AlertTriangle className="text-red-600 mr-3 mt-0.5" size={24} />
                      <div>
                        <p className="font-bold text-red-600">ATTENTION : Des défectuosités majeures ont été détectées</p>
                        <p className="text-red-600 mt-2">Veuillez contacter immédiatement votre chef d'équipe ou superviseur.</p>
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                          <pre className="whitespace-pre-wrap text-sm">{majorDefectsInfo.defectsList}</pre>
                        </div>
                        <p className="mt-4">Voulez-vous quand même envoyer ce formulaire ?</p>
                      </div>
                    </div>
                  </>
                ) : majorDefectsInfo.hasMinorDefects ? (
                  <>
                    <div className="flex items-start mb-4">
                      <AlertTriangle className="text-amber-500 mr-3 mt-0.5" size={24} />
                      <div>
                        <p className="font-bold text-amber-600">Des défectuosités mineures ont été détectées</p>
                        <p className="text-amber-600 mt-2">Veuillez contacter votre chef d'équipe ou superviseur.</p>
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                          <pre className="whitespace-pre-wrap text-sm">{majorDefectsInfo.defectsList}</pre>
                        </div>
                        <p className="mt-4">Voulez-vous envoyer ce formulaire ?</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-start mb-4">
                    <AlertCircle className="text-[#b22a2e] mr-3 mt-0.5" size={24} />
                    <p>Êtes-vous sûr de vouloir finaliser cette inspection? Les données seront envoyées au système central.</p>
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

  return null;
}

export default App;