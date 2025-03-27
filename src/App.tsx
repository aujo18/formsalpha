import React, { useState } from 'react';
import { Ambulance, ClipboardCheck, Send, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';

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
  
  // Valeurs pour les dates d'expiration des électrodes
  const [expireDateElectrode1, setExpireDateElectrode1] = useState('');
  const [expireDateElectrode2, setExpireDateElectrode2] = useState('');

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
      
      if (item.id === 'armoire15' && !cylindre1PSI) {
        return "Veuillez indiquer le niveau PSI du gros cylindre d'oxygène";
      }
    }
    
    // Vérifier les champs obligatoires
    if (!matricule) return "Veuillez entrer votre matricule";
    if (!numeroVehicule) return "Veuillez entrer le numéro du véhicule";
    if (!pointDeService) return "Veuillez sélectionner le point de service";
    
    return null;
  };

  const handleSubmitForm1 = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      
      // Construction des données à envoyer à make.com
      const formData = {
        matricule,
        numeroMoniteur,
        pointDeService,
        dateHeure: new Date().toISOString(),
        dateHeureFormat: currentDateTime,
        type: 'inspection-mrsa',
        items: mrsaItems.map(item => ({
          ...item,
          // Inclure les dates d'expiration pour les électrodes
          expireDate: item.id === 'electrode1' ? expireDateElectrode1 : 
                      item.id === 'electrode2' ? expireDateElectrode2 : 
                      undefined
        }))
      };
      
      // Envoi des données au webhook Make.com
      const response = await fetch(WEBHOOK_URL_MRSA, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
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
      } else {
        throw new Error(`Erreur lors de l'envoi du formulaire: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du formulaire:', error);
      setError(`Échec de l'envoi: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForm2 = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Valider le formulaire
    const validationError = validateVehiculeForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const currentDateTime = getCurrentDateTime();
      setSubmissionDateTime(currentDateTime);
      
      // Construction des données à envoyer à make.com
      const formData = {
        matricule,
        numeroVehicule,
        pointDeService,
        dateHeure: new Date().toISOString(),
        dateHeureFormat: currentDateTime,
        cylindre1PSI,
        cylindre2PSI,
        glycemie: {
          normal: glycemieNormal,
          high: glycemieHigh,
          low: glycemieLow
        },
        type: 'inspection-vehicule',
        items: vehiculeItems
      };
      
      // Envoi des données au webhook Make.com
      const response = await fetch(WEBHOOK_URL_VEHICULE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        setSubmitted(true);
        // Réinitialiser le formulaire
        setMatricule('');
        setNumeroVehicule('');
        setPointDeService('');
        setCylindre1PSI('');
        setCylindre2PSI('');
        setGlycemieNormal('');
        setGlycemieHigh('');
        setGlycemieLow('');
        setVehiculeItems(prevItems => 
          prevItems.map(item => ({
            ...item,
            checked: false
          }))
        );
      } else {
        throw new Error(`Erreur lors de l'envoi du formulaire: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du formulaire:', error);
      setError(`Échec de l'envoi: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
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
        <header className="bg-blue-600 text-white p-4 rounded-lg shadow-md flex items-center mb-8">
          <Ambulance className="mr-2" size={32} />
          <h1 className="text-2xl font-bold">Application TAP</h1>
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
            <Send size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Inspection envoyée avec succès!</h2>
          <p className="text-gray-600 mb-6">
            Votre formulaire d'inspection a été envoyé pour traitement et génération du PDF. Une copie sera envoyée par email et stockée dans le cloud.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Soumis le {submissionDateTime}
          </p>
          <button 
            onClick={() => {
              setSubmitted(false);
              setCurrentForm(null);
            }}
            className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors w-full"
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
        
        <form onSubmit={handleSubmitForm1} className="bg-white rounded-xl shadow-md p-4 mb-20">
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
                                <div className="mt-2">
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
                                <div className="mt-2">
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
                          onChange={(e) => setMatricule(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                          placeholder="Entrez votre matricule"
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
                  Envoi en cours...
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
        
        <form onSubmit={handleSubmitForm2} className="bg-white rounded-xl shadow-md p-4 mb-20">
          <div className="flex flex-col mb-6 space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="md:w-1/3">
              <label htmlFor="numeroVehicule" className="block text-sm font-medium text-gray-700 mb-1">
                Véhicule # :
              </label>
              <input
                type="text"
                id="numeroVehicule"
                value={numeroVehicule}
                onChange={(e) => setNumeroVehicule(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
                placeholder="Entrez le numéro du véhicule"
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
                                <div className="mt-2">
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
                                <div className="mt-2">
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
                                <div className="mt-2 space-y-2">
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
                                <div className="mt-2">
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
                            </td>
                            <td className="border border-gray-300 p-2 text-center">
                              <input 
                                type="checkbox" 
                                checked={item.checked}
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
                          onChange={(e) => setMatricule(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          required
                          placeholder="Entrez votre matricule"
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
                  Envoi en cours...
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
      </div>
    );
  }

  return null;
}

export default App;