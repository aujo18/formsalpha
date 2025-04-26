import React, { useState, useRef, FormEvent, useEffect } from 'react';
import { ChevronLeft, Send, AlertCircle, AlertTriangle, X } from 'lucide-react';
import { CheckItem } from '../types';

interface MechanicalInspectionPageProps {
  goBack: () => void;
  matricule: string;
  handleMatriculeChange: (value: string) => void;
  numeroVehicule: string;
  handleVehiculeNumberChange: (value: string) => void;
  pointDeService: string;
  setPointDeService: (value: string) => void;
  getCurrentDateTime: () => string;
  sendInspectionToMakecom: (formType: string, data: any) => Promise<boolean>;
  onSubmissionComplete: (message: string) => void;
}

const MechanicalInspectionPage: React.FC<MechanicalInspectionPageProps> = ({
  goBack,
  matricule,
  handleMatriculeChange,
  numeroVehicule,
  handleVehiculeNumberChange,
  pointDeService,
  setPointDeService,
  getCurrentDateTime,
  sendInspectionToMakecom,
  onSubmissionComplete
}) => {
  // États spécifiques
  const [defectuositesItems, setDefectuositesItems] = useState<CheckItem[]>([
    // ... (Copier la liste initiale des items Défectuosités depuis App.tsx) ...
        { id: 'attelage1-1', label: 'Élément(s) de fixation du dispositif d\'attelage manquant(s), endommagé(s)', category: '1. ATTELAGE (Ne s\'applique pas)', subcategory: 'Défectuosités mineures', checked: false, disabled: true },
    { id: 'attelage1-2', label: 'Attache de sûreté ou raccord manquant, détérioré ou mal fixé', category: '1. ATTELAGE (Ne s\'applique pas)', subcategory: 'Défectuosités mineures', checked: false, disabled: true },
    { id: 'attelage1-A', label: 'Plaque d\'attelage ou pivot d\'attelage fissuré, mal fixé ou absence d\'attelage, fissure ou mal fixé', category: '1. ATTELAGE (Ne s\'applique pas)', subcategory: 'Défectuosités majeures', checked: false, disabled: true },
    { id: 'attelage1-B', label: 'Mouvement entre la sellette et le cadre', category: '1. ATTELAGE (Ne s\'applique pas)', subcategory: 'Défectuosités majeures', checked: false, disabled: true },
    { id: 'attelage1-C', label: 'Plus de 20% des éléments de fixation du mécanisme manquants ou desserrés', category: '1. ATTELAGE (Ne s\'applique pas)', subcategory: 'Défectuosités majeures', checked: false, disabled: true },
    { id: 'attelage1-D', label: '25% ou plus des poupées de blocage sont manquantes ou inopérantes', category: '1. ATTELAGE (Ne s\'applique pas)', subcategory: 'Défectuosités majeures', checked: false, disabled: true },
    { id: 'attelage1-E', label: 'Mécanisme d\'attelage mal fermé ou mal verrouillé', category: '1. ATTELAGE (Ne s\'applique pas)', subcategory: 'Défectuosités majeures', checked: false, disabled: true },
    { id: 'attelage1-F', label: 'Élément du mécanisme d\'attelage manquant, mal fixé, mal ajusté ou endommagé au point où il y a risque de rupture ou de séparation', category: '1. ATTELAGE (Ne s\'applique pas)', subcategory: 'Défectuosités majeures', checked: false, disabled: true },
    { id: 'chassis2-1', label: 'Longeron fissuré ou traverse fissurée ou cassée', category: '2. CHÂSSIS ET CARROSSERIE', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'chassis2-2', label: 'Élément fixe de la carrosserie absent ou mal fixé', category: '2. CHÂSSIS ET CARROSSERIE', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'chassis2-A', label: 'Longeron ou traverse de châssis fissuré, cassé, perforé par la rouille, affaissé ou déformé et affectant l\'intégrité du véhicule', category: '2. CHÂSSIS ET CARROSSERIE', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'chassis2-B', label: 'Élément de fixation manquant, cassé ou relâché à un point d\'attache de la carrosserie', category: '2. CHÂSSIS ET CARROSSERIE', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'chassis2-C', label: 'Plus de 25% des goupilles de glissière d\'un train roulant manquantes ou non fixées', category: '2. CHÂSSIS ET CARROSSERIE', subcategory: 'Défectuosités majeures', checked: false, disabled: true },
    { id: 'chauffage3-1', label: 'Soufflerie du pare-brise ne fonctionne pas', category: '3. CHAUFFAGE ET DÉGIVRAGE', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'commandes4-1', label: 'Accélérateur ou embrayage ne fonctionne pas correctement', category: '4. COMMANDES DU CONDUCTEUR', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'commandes4-2', label: 'Klaxon ne fonctionne pas correctement', category: '4. COMMANDES DU CONDUCTEUR', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'commandes4-A', label: 'Moteur ne revient pas au ralenti après le relâchement de l\'accélérateur', category: '4. COMMANDES DU CONDUCTEUR', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'direction5-1', label: 'Colonne de direction se déplace par rapport à sa position normale ou volant ajustable ne demeure pas à la position choisie par le fabricant', category: '5. DIRECTION', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'direction5-2', label: 'Niveau du liquide de la servodirection n\'est pas celui prescrit par le fabricant', category: '5. DIRECTION', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'direction5-3', label: 'Courroie de la pompe présente une coupure', category: '5. DIRECTION', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'direction5-A', label: 'Colonne de direction ou volant se déplace par rapport à leur position normale alors qu\'il y a un risque de séparation', category: '5. DIRECTION', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'direction5-B', label: 'Servodirection ne fonctionne pas', category: '5. DIRECTION', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'essuie6-1', label: 'Essuie-glace du côté passager manquant ou inadéquat', category: '6. ESSUIE-GLACES ET LAVE-GLACE', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'essuie6-2', label: 'Système de lave-glace inefficace', category: '6. ESSUIE-GLACES ET LAVE-GLACE', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'essuie6-A', label: 'Essuie-glace du côté conducteur manquant ou inadéquat', category: '6. ESSUIE-GLACES ET LAVE-GLACE', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'urgence7-1', label: 'Triangle de premiers soins requis par la loi mal fixé ou difficilement accessible', category: '7. MATÉRIEL D\'URGENCE', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'urgence7-2', label: 'Extincteur chimique requis par la loi mal fixé, inadéquat ou difficilement accessible', category: '7. MATÉRIEL D\'URGENCE', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'phares8-1', label: 'Phare de croisement, feu de position, feu de changement de direction, feu de freinage ou feu de la plaque d\'immatriculation ne s\'allume pas', category: '8. PHARES ET FEUX', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'phares8-A', label: 'Aucun phare de croisement ne s\'allume', category: '8. PHARES ET FEUX', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'phares8-B', label: 'À l\'arrière d\'un véhicule d\'une seule unité ou du dernier véhicule d\'un ensemble de véhicules: *Aucun feu de changement de direction droit ou gauche ne s\'allume *Aucun feu de freinage ne s\'allume *Aucun des feux de position ne s\'allume', category: '8. PHARES ET FEUX', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'pneus9-1', label: 'Indicateur d\'usure d\'un pneu touche la chaussé ou profondeur d\'une rainure est égale ou inférieure à l\'indicateur d\'usure', category: '9. PNEUS', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'pneus9-2', label: 'Un pneu, d\'un même assemblage de roues, présente une matière étrangère logée dans la bande de roulement ou dans le flanc et qui peut causer une crevaison', category: '9. PNEUS', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'pneus9-3', label: 'Un pneu, d\'un même assemblage de roues, endommagé au point de voir la toile de renforcement ou la ceinture d\'acier', category: '9. PNEUS', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'pneus9-4', label: 'Pneu déformé, bande de roulement ou flanc séparé de la carcasse du pneu', category: '9. PNEUS', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'pneus9-5', label: 'Valve usée, endommagée, écorchée ou coupée', category: '9. PNEUS', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'pneus9-A', label: 'Pour un pneu installé sur l\'essieu relié à la direction d\'un véhicule motorisé ayant un PNBV de 4 500 kg ou plus, la profondeur de 2 rainures adjacentes est égale ou inférieure à l\'indicateur d\'usure', category: '9. PNEUS', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'pneus9-B', label: 'Pneu simple ou les pneus jumelés du même assemblage de roues présentent une matière étrangère logée dans la bande de roulement ou le flanc et qui peut causer une crevaison', category: '9. PNEUS', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'pneus9-C', label: 'Pneu simple ou les pneus jumelés du même assemblage de roues endommagées au point de voir la toile de renforcement ou la ceinture d\'acier', category: '9. PNEUS', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'pneus9-D', label: 'Pneu en contact avec une partie fixe du véhicule, qui est à plat ou présente une fuite d\'air ou un renflement', category: '9. PNEUS', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'portieres10-1', label: 'Portière du conducteur s\'ouvre avec difficulté ou ne s\'ouvre pas', category: '10. PORTIÈRES ET AUTRES ISSUES', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'portieres10-A', label: 'Portière de l\'habitacle ne se ferme pas de façon sécuritaire', category: '10. PORTIÈRES ET AUTRES ISSUES', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'retroviseurs11-1', label: 'Pare-Brise ou vitre latérale située d\'un côté ou de l\'autre du poste de conduite n\'offrent pas la visibilité requise au conducteur parce qu\'endommagés', category: '11. RÉTROVISEURS ET VITRAGE', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'retroviseurs11-2', label: 'Rétroviseur extérieur requis par le Code manquant, endommagé ou ne peut être ajusté et demeurer à la position choisie', category: '11. RÉTROVISEURS ET VITRAGE', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'retroviseurs11-3', label: 'Rétroviseur extérieur mal fixé ou présente une arête vive', category: '11. RÉTROVISEURS ET VITRAGE', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'roues12-1', label: 'Écrou, boulon ou goujon de fixation manquant, cassé ou desserré', category: '12. ROUES, MOYEUX ET PIÈCES DE FIXATION', subcategory: 'Défectuosités mineures', checked: false, disabled: true },
    { id: 'roues12-2', label: 'Support ou le montage fixant la roue de secours est non solidement fixé pour la maintenir', category: '12. ROUES, MOYEUX ET PIÈCES DE FIXATION', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'roues12-A', label: 'Une roue qui présente une fissure ou un trou de boulon déformé ou agrandi', category: '12. ROUES, MOYEUX ET PIÈCES DE FIXATION', subcategory: 'Défectuosités majeures', checked: false, disabled: true },
    { id: 'roues12-B', label: 'Pièce de fixation manquante, fissurée, cassée ou mal fixée', category: '12. ROUES, MOYEUX ET PIÈCES DE FIXATION', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'roues12-C', label: 'Roue endommagée ou porte une marque de réparation par soudage', category: '12. ROUES, MOYEUX ET PIÈCES DE FIXATION', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'siege13-1', label: 'Siège du conducteur inadéquat ou ne demeure pas dans la position choisie', category: '13. SIÈGE', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'siege13-A', label: 'Ceinture de sécurité du siège du conducteur manquante, modifiée ou inadequate', category: '13. SIÈGE', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'suspension14-1', label: 'Lame de ressort autre qu\'une lame maîtresse ou ressort hélicoidal cassé', category: '14. SUSPENSION', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'suspension14-2', label: 'Fuite d\'air dans la suspension, ballon réparé ou endommagé au point d\'exposer la toile', category: '14. SUSPENSION', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'suspension14-A', label: 'Lame maîtresse, coussin de caoutchouc ou 25% et plus des lames d\'un ressort de l\'assemblage cassés ou manquants', category: '14. SUSPENSION', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'suspension14-B', label: 'Fuite d\'air dans le système non compensée par le compresseur ou ballon absent ou dégonflé', category: '14. SUSPENSION', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'suspension14-C', label: 'Élément de fixation de l\'essieu manquant, mal fixé, fissuré ou cassé', category: '14. SUSPENSION', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'suspension14-D', label: 'Lame en composite fissurée sur plus de 75% de sa longueur ou comporte une intersection de fissures', category: '14. SUSPENSION', subcategory: 'Défectuosités majeures', checked: false, disabled: true },
    { id: 'suspension14-E', label: 'Lame de ressort ou ressort hélicoidal déplacé vient en contact avec une pièce en mouvement', category: '14. SUSPENSION', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'suspension14-F', label: 'Ressort helicoidal cassé au point que le véhicule est affaissé complètement ou barre de torsion cassée', category: '14. SUSPENSION', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'suspension14-G', label: 'Essieu cassé ou élément de localisation de l\'essieu ou de la roue manquant, mal fixé, fissuré, cassé ou endommagé affectant le parallelisme ou causant le déplacement d\'un essieu ou d\'une roue par rapport à sa position', category: '14. SUSPENSION', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'carburant15-A', label: 'Réservoir mal fixé et il y a risque de séparation', category: '15. SYSTÈME D\'ALIMENTATION EN CARBURANT', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'carburant15-B', label: 'Bouchon absent', category: '15. SYSTÈME D\'ALIMENTATION EN CARBURANT', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'carburant15-C', label: 'Fuite de carburant autre qu\'un suintement', category: '15. SYSTÈME D\'ALIMENTATION EN CARBURANT', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'echappement16-1', label: 'Fuite de gaz d\'échappement ailleurs qu\'aux endroits prévus lors de la fabrication', category: '16. SYSTÈME D\'ÉCHAPPEMENT', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'echappement16-A', label: 'Fuite de gaz d\'échappement qui s\'infiltre dans l\'habitacle lorsque le plancher est perforé', category: '16. SYSTÈME D\'ÉCHAPPEMENT', subcategory: 'Défectuosités majeures', checked: false },
    { id: 'freinsElec17-1', label: 'Raccord ou câble électrique mat fixé à un point d\'attache ou de connexion', category: '17. SYSTÈME DE FREINS ÉLECTRIQUES', subcategory: 'Défectuosités mineures', checked: false, disabled: true },
    { id: 'freinsElec17-A', label: 'Réduction importante de la capacité de freinage du frein de service', category: '17. SYSTÈME DE FREINS ÉLECTRIQUES', subcategory: 'Défectuosités majeures', checked: false, disabled: true },
    { id: 'freinsHyd18-1', label: 'Niveau de liquide dans le réservoir du maître-cylindre est sous le niveau minimal requis', category: '18. SYSTÈME DE FREINS HYDRAULIQUES', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'freinsHyd18-2', label: 'Pédale de frein descend au plancher', category: '18. SYSTÈME DE FREINS HYDRAULIQUES', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'freinsHyd18-3', label: 'Témoin lumineux allumé pendant que le moteur est en marche ou ne s\'allume pas lorsque la clé de contact est à la position marche ou démarrage', category: '18. SYSTÈME DE FREINS HYDRAULIQUES', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'freinsHyd18-4', label: 'Témoin lumineux ne s\'allume pas lorsque le frein de stationnement est serré ou ne s\'éteint pas lorsqu\'il est desserré', category: '18. SYSTÈME DE FREINS HYDRAULIQUES', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'freinsHyd18-5', label: 'Frein de stationnement ne fonctionne pas correctement', category: '18. SYSTÈME DE FREINS HYDRAULIQUES', subcategory: 'Défectuosités mineures', checked: false },
    { id: 'freinsPneum19-1', label: 'Avertisseur sonore de basse pression ne fonctionne pas correctement', category: '19. SYSTÈME DE FREINS PNEUMATIQUES', subcategory: 'Défectuosités mineures', checked: false, disabled: true },
    { id: 'freinsPneum19-2', label: 'Les avertisseurs lumineux et visuels de basse pression ne fonctionnent pas correctement', category: '19. SYSTÈME DE FREINS PNEUMATIQUES', subcategory: 'Défectuosités mineures', checked: false, disabled: true },
    { id: 'freinsPneum19-3', label: 'Régulateur de pression ne fonctionne pas correctement', category: '19. SYSTÈME DE FREINS PNEUMATIQUES', subcategory: 'Défectuosités mineures', checked: false, disabled: true },
    { id: 'freinsPneum19-4', label: 'Fuite d\'air audible ou dont le taux en une minute dépasse 20 kPa (3 lb/po) unités pour un véhicule d\'une seule unité, 28 kPa (4 lb/po) pour un véhicule de deux unités et 35 kPa (5lb/po\') pour un véhicule de trois unités', category: '19. SYSTÈME DE FREINS PNEUMATIQUES', subcategory: 'Défectuosités mineures', checked: false, disabled: true },
    { id: 'freinsPneum19-5', label: 'Frein de stationnement ou d\'urgence ne fonctionne pas correctement', category: '19. SYSTÈME DE FREINS PNEUMATIQUES', subcategory: 'Défectuosités mineures', checked: false, disabled: true },
    { id: 'freinsPneum19-A', label: 'Aucun avertisseur sonore, lumineux et visuel de basse pression ne fonctionne', category: '19. SYSTÈME DE FREINS PNEUMATIQUES', subcategory: 'Défectuosités majeures', checked: false, disabled: true },
    { id: 'freinsPneum19-B', label: 'Compresseur d\'air ne fonctionne pas correctement', category: '19. SYSTÈME DE FREINS PNEUMATIQUES', subcategory: 'Défectuosités majeures', checked: false, disabled: true },
    { id: 'freinsPneum19-C', label: 'Fuite d\'air dont le taux en une minute dépasse 40 kPa (6 lb/po) pour un véhicule d\'une seule unité, 48 kPa (7 b/po\') pour un de deux unités et 62 kPa (8 lb/po\') pour un de trois unités', category: '19. SYSTÈME DE FREINS PNEUMATIQUES', subcategory: 'Défectuosités majeures', checked: false, disabled: true },
    { id: 'freinsPneum19-D', label: 'Reduction importante de la capacité de freinage du frein de service', category: '19. SYSTÈME DE FREINS PNEUMATIQUES', subcategory: 'Défectuosités majeures', checked: false, disabled: true },
    { id: 'cambi-V1-A', label: 'Le système de radiocommunication: Vérifier l\'équipement en fonction de la politique de l\'entreprise', category: 'VÉRIFICATIONS SPÉCIFIQUES EXIGÉES PAR LE GROUPE CAMBI', checked: false, isConform: false },
    { id: 'cambi-v2', label: 'Matériel d\'urgence: Fusées éclairantes (8)', category: 'VÉRIFICATIONS SPÉCIFIQUES EXIGÉES PAR LE GROUPE CAMBI', checked: false, isConform: false },
    { id: 'cambi-V3-B', label: 'Gyrophare', category: 'VÉRIFICATIONS SPÉCIFIQUES EXIGÉES PAR LE GROUPE CAMBI', checked: false, isConform: false },
    { id: 'cambi-v4', label: 'Les serrures', category: 'VÉRIFICATIONS SPÉCIFIQUES EXIGÉES PAR LE GROUPE CAMBI', checked: false, isConform: false },
    { id: 'cambi-v5', label: 'Les joints d\'étanchéité', category: 'VÉRIFICATIONS SPÉCIFIQUES EXIGÉES PAR LE GROUPE CAMBI', checked: false, isConform: false },
    { id: 'cambi-v6', label: 'Avertisseurs audibles', category: 'VÉRIFICATIONS SPÉCIFIQUES EXIGÉES PAR LE GROUPE CAMBI', checked: false, isConform: false },
    { id: 'cambi-v7', label: 'Autres portes et compartiments externes', category: 'VÉRIFICATIONS SPÉCIFIQUES EXIGÉES PAR LE GROUPE CAMBI', checked: false, isConform: false },
    { id: 'cambi-v8', label: 'Plafonnier', category: 'VÉRIFICATIONS SPÉCIFIQUES EXIGÉES PAR LE GROUPE CAMBI', checked: false, isConform: false },
    { id: 'cambi-V9-C', label: 'Air conditionné', category: 'VÉRIFICATIONS SPÉCIFIQUES EXIGÉES PAR LE GROUPE CAMBI', checked: false, isConform: false },
    { id: 'cambi-V10-D', label: 'Sirène bien fixée et fonctionnelle', category: 'VÉRIFICATIONS SPÉCIFIQUES EXIGÉES PAR LE GROUPE CAMBI', checked: false, isConform: false },
    { id: 'cambi-v11', label: 'Liquides: Refroidissement, Huile à transmission et moteur, Lave-glace', category: 'VÉRIFICATIONS SPÉCIFIQUES EXIGÉES PAR LE GROUPE CAMBI', checked: false, isConform: false },
    { id: 'cambi-v12', label: 'Clé(s) supplémentaire(s)', category: 'VÉRIFICATIONS SPÉCIFIQUES EXIGÉES PAR LE GROUPE CAMBI', checked: false, isConform: false },
    { id: 'cambi-v13', label: 'Outil de localisation routière', category: 'VÉRIFICATIONS SPÉCIFIQUES EXIGÉES PAR LE GROUPE CAMBI', checked: false, isConform: false },
    { id: 'cambi-v14', label: 'Extincteur de type ABC: 1 de 5 kg ou 2 de 2,5 kg', category: 'VÉRIFICATIONS SPÉCIFIQUES EXIGÉES PAR LE GROUPE CAMBI', checked: false, isConform: false },
    { id: 'cambi-v15', label: 'Documentation: Preuve d\'assurance, Immatriculation, Constat à l\'amiable, Enveloppe SST, Formulaires papier, Carte de crédit', category: 'VÉRIFICATIONS SPÉCIFIQUES EXIGÉES PAR LE GROUPE CAMBI', checked: false, isConform: false }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [majorDefectsInfo, setMajorDefectsInfo] = useState<{ hasMajorDefects: boolean; defectsList: string; hasMinorDefects?: boolean; }>({ hasMajorDefects: false, defectsList: '', hasMinorDefects: false });
  const formRef = useRef<HTMLFormElement>(null);

  // Fonctions spécifiques
  const handleDefectuositesCheckChange = (itemId: string, isConformCheck: boolean = false) => {
    setDefectuositesItems(prevItems =>
      prevItems.map(item => {
        if (item.disabled) return item;
        if (item.id === itemId) {
          if (isConformCheck) {
            return { ...item, isConform: !item.isConform, checked: false, comment: !item.isConform ? '' : item.comment };
          } else {
            return { ...item, checked: !item.checked, isConform: false };
          }
        }
        return item;
      })
    );
  };

  const handleDefectuositesCommentChange = (itemId: string, comment: string) => {
    setDefectuositesItems(prevItems =>
      prevItems.map(item => item.id === itemId ? { ...item, comment } : item)
    );
  };

  const handleSectionAllConform = (category: string) => {
    setDefectuositesItems(prevItems =>
      prevItems.map(item => {
        if (item.category === category && !item.disabled) {
          return { ...item, isConform: true, checked: false, comment: '' };
        }
        return item;
      })
    );
  };

  const isSectionDisabled = (category: string): boolean => {
    const itemsInCategory = defectuositesItems.filter(item => item.category === category);
    return itemsInCategory.length > 0 && itemsInCategory.every(item => item.disabled);
  };

  const getMajorDefects = (): CheckItem[] | null => {
    const major = defectuositesItems.filter(item => item.checked && item.id.includes('-') && /[A-Z]/.test(item.id.split('-')[1]));
    return major.length > 0 ? major : null;
  };

  const getMinorDefects = (): CheckItem[] | null => {
    const minor = defectuositesItems.filter(item => item.checked && item.id.includes('-') && !/[A-Z]/.test(item.id.split('-')[1]));
    return minor.length > 0 ? minor : null;
  };

  const validateDefectuositesForm = (): string | null => {
    if (!matricule) return "Matricule manquant";
    if (!numeroVehicule) return "Numéro véhicule manquant";
    if (!pointDeService) return "Point de service manquant";
    const unchecked = defectuositesItems.filter(item => !item.disabled && !item.checked && !item.isConform);
    if (unchecked.length > 0) {
      const list = unchecked.slice(0, 5).map(item => `- ${item.label}`).join('\n');
      return `${unchecked.length} élément(s) non vérifié(s)${unchecked.length <= 5 ? ' :\n' + list : ''}. Veuillez vérifier chaque élément.`;
    }
    return null;
  };

  const generateDefectuositesHTML = (): string => {
    const majorDefects = getMajorDefects();
    const minorDefects = getMinorDefects();
    let defectsWarning = '';
    if (majorDefects) {
      defectsWarning = `<div style="background-color:#ffebee;border:2px solid #c62828;padding:15px;margin:20px 0;border-radius:5px;"><h3 style="color:#c62828;margin-top:0;">⚠️ ATTENTION: DÉFECTUOSITÉS MAJEURES</h3><p>Contacter immédiatement le chef d'équipe.</p><ul style="margin-bottom:0;">${majorDefects.map(item => `<li><strong>${item.label}</strong>${item.comment ? ` - ${item.comment}` : ''}</li>`).join('')}</ul></div>`;
    } else if (minorDefects) {
      defectsWarning = `<div style="background-color:#fff8e1;border:2px solid #ffa000;padding:15px;margin:20px 0;border-radius:5px;"><h3 style="color:#ffa000;margin-top:0;">⚠️ DÉFECTUOSITÉS MINEURES</h3><p>Contacter le chef d'équipe.</p><ul style="margin-bottom:0;">${minorDefects.map(item => `<li><strong>${item.label}</strong>${item.comment ? ` - ${item.comment}` : ''}</li>`).join('')}</ul></div>`;
    }

    const categorized = defectuositesItems.reduce<Record<string, CheckItem[]>>((acc, item) => {
      const cat = item.category || 'Autres'; if (!acc[cat]) acc[cat] = []; acc[cat].push(item); return acc;
    }, {});

    const html = `
      <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Inspection Mécanique</title><style>
        body{font-family:Arial,sans-serif;margin:20px;} h1{color:#333;border-bottom:1px solid #ccc;padding-bottom:10px;} table{width:100%;border-collapse:collapse;margin-top:20px;} th,td{border:1px solid #ddd;padding:8px;} th{background-color:#f2f2f2;text-align:left;} .category{background-color:#e9ecef;font-weight:bold;} .conformed{background-color:#d4edda;} .defect-major{background-color:#f8d7da;} .defect-minor{background-color:#fff3cd;} .comment{font-style:italic;color:#721c24;} .header-info{margin-bottom:20px;} .header-info p{margin:5px 0;}
      </style></head><body>
      <h1>Inspection Mécanique</h1>
      <div class="header-info"><p><strong>Matricule:</strong> ${matricule}</p><p><strong>Numéro de véhicule:</strong> ${numeroVehicule}</p><p><strong>Point de service:</strong> ${pointDeService}</p><p><strong>Date et heure:</strong> ${getCurrentDateTime()}</p></div>
      ${defectsWarning}
      <table><thead><tr><th style="width:70%;">Élément</th><th style="width:15%;">État</th><th style="width:15%;">Commentaire</th></tr></thead><tbody>
        ${(Object.entries(categorized) as [string, CheckItem[]][]).map(([category, items]) => `
          <tr><td colspan="3" class="category">${category}</td></tr>
          ${items.map(item => {
            const status = item.isConform ? 'Conforme' : (item.checked ? 'Défectueux' : 'Non vérifié');
            const isMajor = item.checked && item.id.includes('-') && /[A-Z]/.test(item.id.split('-')[1]);
            const isMinor = item.checked && item.id.includes('-') && !/[A-Z]/.test(item.id.split('-')[1]);
            const rowClass = item.disabled ? 'disabled' : (item.isConform ? 'conformed' : (isMajor ? 'defect-major' : (isMinor ? 'defect-minor' : '')));
            const labelPrefix = isMajor || isMinor ? '⚠️ ' : '';
            return `<tr class="${rowClass}"><td>${labelPrefix}${item.label.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td><td>${status}</td><td>${item.comment?.replace(/</g, "&lt;").replace(/>/g, "&gt;") || ''}</td></tr>`;
          }).join('')}
        `).join('')}
      </tbody></table></body></html>`;
    return html;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const validationError = validateDefectuositesForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    const major = getMajorDefects();
    const minor = getMinorDefects();
    setMajorDefectsInfo({ 
      hasMajorDefects: !!major,
      defectsList: (major || minor)?.map(item => `- ${item.label}${item.comment ? ` (${item.comment})` : ''}`).join('\n') || '',
      hasMinorDefects: !!minor && !major 
    });
    setShowConfirmation(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmation(false);
    setIsSubmitting(true);
    setError(null);
    try {
      const htmlContent = generateDefectuositesHTML();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `inspection_mecanique_${numeroVehicule}_${timestamp}.html`;
      const webhookData = {
        type: 'Defectuosites', matricule, dateTime: getCurrentDateTime(), pointDeService,
        numeroIdentifiant: numeroVehicule, htmlContent, fileName, mimeType: "text/html"
      };
      const success = await sendInspectionToMakecom('Defectuosites', webhookData);
      const major = getMajorDefects();
      const minor = getMinorDefects();
      let message = "L'inspection Mécanique a été générée et envoyée avec succès.";
      if (major) {
        message += "\n\nATTENTION: Défectuosités MAJEURES détectées. Contacter immédiatement le superviseur ou le chef d'équipe.";
      } else if (minor) {
        message += "\n\nDéfectuosités mineures détectées. Contacter le superviseur ou le chef d'équipe.";
      }
      if (success) {
        onSubmissionComplete(message);
        setDefectuositesItems(prev => prev.map(item => ({ ...item, checked: false, isConform: false, comment: '' })));
      } else {
        throw new Error("L'envoi des données a échoué.");
      }
    } catch (err) {
      const error = err as Error;
      console.error('Erreur soumission Défectuosités:', error);
      setError(`Échec: ${error.message}`);
      onSubmissionComplete(`Échec Mécanique: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rendu JSX
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <header className="bg-[#4f6683] text-white p-4 rounded-lg shadow-md flex items-center justify-between mb-6">
        <div className="flex items-center">
          <img src="https://res.cloudinary.com/dxyvj8rka/image/upload/f_auto,q_auto/v1/cambi/iazjhbzvu6dv5fad398u" alt="Logo CAMBI" className="h-8 mr-2 filter brightness-0 invert" />
          <h1 className="text-xl font-bold">Inspection Mécanique</h1>
        </div>
        <button onClick={goBack} className="flex items-center text-white"><ChevronLeft size={20} /> Retour</button>
      </header>
      <form ref={formRef} onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-4 mb-20">
        <div className="flex flex-col mb-6 space-y-4 md:flex-row md:space-y-0 md:space-x-4">
           <div className="md:w-1/3">
              <label htmlFor="matriculeMecanique" className="block text-sm font-medium text-gray-700 mb-1">Matricule TAP:</label>
              <input type="text" id="matriculeMecanique" value={matricule} onChange={(e) => handleMatriculeChange(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4f6683]" required placeholder="Ex: N-0100" />
            </div>
           <div className="md:w-1/3">
              <label htmlFor="numeroVehiculeMecanique" className="block text-sm font-medium text-gray-700 mb-1">Véhicule # :</label>
              <input type="text" id="numeroVehiculeMecanique" value={numeroVehicule} onChange={(e) => handleVehiculeNumberChange(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4f6683]" required placeholder="Ex: 9198" />
            </div>
           <div className="md:w-1/3">
              <label htmlFor="pointDeServiceMecanique" className="block text-sm font-medium text-gray-700 mb-1">Point de service (PDS) :</label>
              <select id="pointDeServiceMecanique" value={pointDeService} onChange={(e) => setPointDeService(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4f6683]" required>
                <option value="">Sélectionner PDS</option><option value="Sainte-Adèle">Sainte-Adèle</option><option value="Grenville">Grenville</option><option value="Saint-Donat">Saint-Donat</option>
              </select>
            </div>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Date et heure :</label>
          <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-100">{getCurrentDateTime()}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead><tr><th className="border border-gray-300 p-2 bg-[#4f6683] text-white w-3/5">DÉFAUTS</th><th className="border border-gray-300 p-2 bg-[#4f6683] text-white w-1/5">Conforme</th><th className="border border-gray-300 p-2 bg-[#4f6683] text-white w-1/5">Défectuosité</th></tr></thead>
            <tbody>
              {Object.entries(defectuositesItems.reduce<Record<string, CheckItem[]>>((acc, item) => {
                const cat = item.category || 'Autres'; if (!acc[cat]) acc[cat] = []; acc[cat].push(item); return acc;
              }, {})).map(([category, items]) => (
                <React.Fragment key={category}>
                  <tr><td colSpan={3} className="border border-gray-300 p-2 bg-[#4f6683]/10 font-semibold flex justify-between items-center"><span>{category}</span>{!isSectionDisabled(category) && <div className="flex items-center"><span className="text-xs mr-2">Tout conforme</span><input type="checkbox" onChange={() => handleSectionAllConform(category)} className="w-5 h-5 accent-green-600 cursor-pointer" aria-label={`Tout conforme pour ${category}`}/></div>}</td></tr>
                  {items.map((item) => (
                    <React.Fragment key={item.id}>
                      <tr className={`${item.disabled ? 'bg-gray-200 text-gray-500' : (item.isConform ? 'bg-green-100' : (item.checked ? (item.id.includes('-') && /[A-Z]/.test(item.id.split('-')[1]) ? 'bg-red-100' : 'bg-amber-100') : ''))} ${!item.disabled ? 'transition-colors' : ''}`}>
                        <td className="border border-gray-300 p-2 text-sm">
                          <span className="font-mono text-xs text-gray-500 mr-2">{item.id.split('-')[1]}</span>
                          {item.label}
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          <input type="checkbox" checked={item.isConform || false} disabled={item.disabled} onChange={() => handleDefectuositesCheckChange(item.id, true)} className="w-5 h-5 accent-green-600 cursor-pointer" aria-labelledby={`lab-conf-${item.id}`}/>
                          <span id={`lab-conf-${item.id}`} className="sr-only">{`Conforme pour ${item.label}`}</span>
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          <input type="checkbox" checked={item.checked} disabled={item.disabled} onChange={() => handleDefectuositesCheckChange(item.id)} className="w-5 h-5 accent-red-600 cursor-pointer" aria-labelledby={`lab-def-${item.id}`}/>
                           <span id={`lab-def-${item.id}`} className="sr-only">{`Défectueux pour ${item.label}`}</span>
                        </td>
                      </tr>
                      {item.checked && !item.disabled && (
                        <tr className={item.id.includes('-') && /[A-Z]/.test(item.id.split('-')[1]) ? 'bg-red-50' : 'bg-amber-50'}>
                          <td colSpan={3} className="border border-gray-300 p-2">
                            <label htmlFor={`comment-${item.id}`} className="block text-sm font-medium mb-1 text-gray-700">Commentaire :</label>
                            <textarea id={`comment-${item.id}`} value={item.comment || ''} onChange={(e) => handleDefectuositesCommentChange(item.id, e.target.value)} className="w-full p-2 border rounded-md" rows={2} placeholder="Détails..." />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {error && <div role="alert" className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4 mb-4"><p>{error}</p></div>}
        <div className="sticky bottom-0 bg-white p-4 border-t mt-4">
          <button type="submit" className={`w-full ${isSubmitting ? 'bg-[#4f6683]/70 cursor-not-allowed' : 'bg-[#4f6683] hover:bg-[#4f6683]/90'} text-white py-3 px-6 rounded-lg transition-colors flex items-center justify-center`} disabled={isSubmitting}>
            {isSubmitting ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>Traitement...</> : <><Send className="mr-2" size={20} />Envoyer</>}
          </button>
        </div>
      </form>
      {showConfirmation && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4"><h3 id="confirm-title" className="text-lg font-semibold">Confirmation</h3><button onClick={() => setShowConfirmation(false)} className="text-gray-500 hover:text-gray-700" aria-label="Fermer"><X size={20} /></button></div>
              <div className="mb-6">
                {majorDefectsInfo.hasMajorDefects ? (
                  <div className="flex items-start mb-4"><AlertTriangle className="text-red-600 mr-3 mt-0.5 flex-shrink-0" size={24} aria-hidden="true" /><div><p className="font-bold text-red-600">ATTENTION: DÉFECTUOSITÉS MAJEURES</p><p className="text-red-600 mt-2">Contacter IMMÉDIATEMENT le superviseur ou le chef d'équipe.</p><div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md"><pre className="whitespace-pre-wrap text-sm">{majorDefectsInfo.defectsList}</pre></div><p className="mt-4">Pret à être envoyé?</p></div></div>
                ) : majorDefectsInfo.hasMinorDefects ? (
                   <div className="flex items-start mb-4"><AlertTriangle className="text-amber-500 mr-3 mt-0.5 flex-shrink-0" size={24} aria-hidden="true" /><div><p className="font-bold text-amber-600">Défectuosités mineures</p><p className="text-amber-600 mt-2">Contacter le superviseur ou le chef d'équipe.</p><div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md"><pre className="whitespace-pre-wrap text-sm">{majorDefectsInfo.defectsList}</pre></div><p className="mt-4">Pret à être envoyé?</p></div></div>
                ) : (
                  <div className="flex items-start mb-4"><AlertCircle className="text-[#4f6683] mr-3 mt-0.5 flex-shrink-0" size={24} aria-hidden="true" /><p>Prêt à être envoyé?</p></div>
                )}
              </div>
              <div className="flex justify-end space-x-4"><button onClick={() => setShowConfirmation(false)} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100">Annuler</button><button onClick={confirmSubmit} className="px-4 py-2 bg-[#4f6683] text-white rounded-md hover:bg-[#4f6683]/90">Confirmer</button></div>
            </div>
          </div>
      )}
    </div>
  );
};

export default MechanicalInspectionPage; 