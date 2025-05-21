import React, { useState, useCallback, useMemo } from 'react';
import { ChevronLeft, Send, AlertCircle, X } from 'lucide-react';

// Interface Props
interface MonthlyCleaningInventoryPageProps {
  goBack: () => void;
  getCurrentDateTime: () => string;
  sendInspectionToMakecom: (formType: string, data: any) => Promise<boolean>;
  onSubmissionComplete: (message: string) => void;
  numeroVehicule: string;
  handleVehiculeNumberChange: (value: string) => void;
  matricule: string; // Global matricule
  handleMatriculeChange: (value: string) => void; // Global matricule handler
  pointDeService: string; // Added
  setPointDeService: (value: string) => void; // Added
}

// Structure pour une ligne d'item d'inventaire
interface InventoryItemRow {
  id: string; 
  zone: string; 
  material: string; 
  expectedQuantity: string;
}

// Structure de l'état pour les données de zone
interface ZoneDataEntry {
  matricule: string;
  cleanedChecked: boolean;
}
type ZoneData = Record<string, ZoneDataEntry>; 

// Structure de l'état pour le statut des items
type ItemCheckedStatus = Record<string, boolean>; 

// Structure des items initiaux
interface InitialInventoryItem {
  id: string;
  zone: string;
  material: string;
  expectedQuantity: string;
}

const INITIAL_INVENTORY_ITEMS: InitialInventoryItem[] = [
  // Armoire / zone #1 (sous le siège capitaine)
  { id: 'z1_courroie_reg', zone: 'Armoire / zone #1', material: 'Courroie régulière', expectedQuantity: '' },
  { id: 'z1_courroie_ancrage', zone: 'Armoire / zone #1', material: 'Courroie d\'ancrage', expectedQuantity: '' },
  { id: 'z1_courroie_planche', zone: 'Armoire / zone #1', material: 'Courroie de planche - fast clip', expectedQuantity: '4' },
  // Armoire / zone #2 (derrière le siège capitaine)
  { id: 'z2_jaquette', zone: 'Armoire / zone #2 (Filet)', material: 'Jaquette de protection lavable', expectedQuantity: '6' },
  { id: 'z2_pansement_20x45', zone: 'Armoire / zone #2 (Trousse Brûlure Water-Jel)', material: 'Pansement 20x45', expectedQuantity: '2' },
  { id: 'z2_pansement_10x10', zone: 'Armoire / zone #2 (Trousse Brûlure Water-Jel)', material: 'Pansement 10x10', expectedQuantity: '4' },
  { id: 'z2_pansement_91x76', zone: 'Armoire / zone #2 (Trousse Brûlure Water-Jel)', material: 'Pansement 91x76', expectedQuantity: '1' },
  { id: 'z2_pansement_facial', zone: 'Armoire / zone #2 (Trousse Brûlure Water-Jel)', material: 'Pansement facial', expectedQuantity: '1' },
  { id: 'z2_trousse_oxy', zone: 'Armoire / zone #2', material: 'Trousse à oxygène + cylindre supplémentaire', expectedQuantity: '1' },
  { id: 'z2_matelas_immob', zone: 'Armoire / zone #2 (Au plancher)', material: 'Matelas immobilisateur + pompe', expectedQuantity: '1' },
  { id: 'z2_vip', zone: 'Armoire / zone #2 (Au plancher)', material: 'VIP', expectedQuantity: '1' },
  // Armoire / zone #3
  { id: 'z3_valve_boussignac', zone: 'Armoire / zone #3 (Tablette Supérieure)', material: 'Valve de Boussignac', expectedQuantity: '2' },
  { id: 'z3_ballon_masque_adulte', zone: 'Armoire / zone #3 (Tablette Supérieure)', material: 'Ballon-masque adulte', expectedQuantity: '1' },
  { id: 'z3_ballon_masque_ped', zone: 'Armoire / zone #3 (Tablette Supérieure)', material: 'Ballon-masque pédiatrique', expectedQuantity: '1' },
  { id: 'z3_pad_defib_stat', zone: 'Armoire / zone #3 (Tablette Supérieure)', material: 'Pad de défibrillation adulte "CPR Stat-Padz"', expectedQuantity: '2' },
  { id: 'z3_pad_defib_uni', zone: 'Armoire / zone #3 (Tablette Supérieure)', material: 'Pad de défibrillation "Uni-Padz"', expectedQuantity: '1' },
  { id: 'z3_lgel_345', zone: 'Armoire / zone #3 (Tablette Supérieure)', material: 'I-gel #3 + I-gel #4 + I-gel #5', expectedQuantity: '1 de chaque' },
  { id: 'z3_brassard_adulte', zone: 'Armoire / zone #3 (Tablette Inférieure)', material: 'Brassard adulte #10 (petit) - #11 (régulier) - #12 (large)', expectedQuantity: '1 de chaque' },
  { id: 'z3_adapteur_brassard', zone: 'Armoire / zone #3 (Tablette Inférieure)', material: 'Adapteur 2 brins pour brassard + 1 brin (sphygmo manuel)', expectedQuantity: '1 de chaque' },
  { id: 'z3_canule_naso', zone: 'Armoire / zone #3 (Tablette Inférieure)', material: 'Canule nasopharyngée (12fr/14fr/16fr/18fr/20fr/22fr/24fr/26fr/28fr/30fr)', expectedQuantity: '1' },
  { id: 'z3_muco', zone: 'Armoire / zone #3 (Tablette Inférieure)', material: 'Muco', expectedQuantity: '4' },
  { id: 'z3_seringue_60cc', zone: 'Armoire / zone #3 (Tablette Inférieure)', material: 'Seringue 60 cc', expectedQuantity: '1' },
  { id: 'z3_filtre_hepa', zone: 'Armoire / zone #3 (Tablette Inférieure)', material: 'Filtre antibactérien HEPA', expectedQuantity: '2' },
  { id: 'z3_masque_vital5', zone: 'Armoire / zone #3 (Tablette Inférieure)', material: 'Masque de type "vital signs" #5', expectedQuantity: '1' },
  { id: 'z3_masque_vital6', zone: 'Armoire / zone #3 (Tablette Inférieure)', material: 'Masque de type "vital signs" #6', expectedQuantity: '1' },
  { id: 'z3_catheter_14', zone: 'Armoire / zone #3 (Tablette Inférieure)', material: 'Cathéter pour intraveineuse #14 de 2 pouces', expectedQuantity: '4' },
  { id: 'z3_tampons_alcool', zone: 'Armoire / zone #3 (Tablette Inférieure)', material: 'Tampons d\'alcool', expectedQuantity: '10' },
  { id: 'z3_tubulure_perfusion', zone: 'Armoire / zone #3 (Tablette Inférieure)', material: 'Tubulure à perfusion "macrodrop"', expectedQuantity: '2' },
  { id: 'z3s_garrot', zone: 'Armoire / zone #3 (Suite)', material: 'Garrot veineux', expectedQuantity: '1' },
  { id: 'z3s_seringue_1_3', zone: 'Armoire / zone #3 (Suite)', material: 'Seringue 1 ml et 3 ml', expectedQuantity: '4 de chaque' },
  { id: 'z3s_nacl_250', zone: 'Armoire / zone #3 (Suite)', material: 'NaCl 250 ml', expectedQuantity: '1' },
  { id: 'z3s_serum_1000', zone: 'Armoire / zone #3 (Suite)', material: 'Sac de sérum physiologique 1000 ml', expectedQuantity: '2' },
  { id: 'z3s_lavage_oculaire', zone: 'Armoire / zone #3 (Suite)', material: 'Bouteille pour lavage occulaire', expectedQuantity: '2' },
  { id: 'z4_reservoir_elec', zone: 'Armoire / zone #4 (Matériel)', material: 'Réservoir pour succion électrique', expectedQuantity: '1' },
  { id: 'z4_reservoir_murale', zone: 'Armoire / zone #4 (Matériel)', material: 'Réservoir pour succion murale + couvercle', expectedQuantity: '2' },
  { id: 'z4_tubulure_succion', zone: 'Armoire / zone #4', material: 'Tubulure à succion', expectedQuantity: '4' },
  { id: 'z4_tige_rigide', zone: 'Armoire / zone #4', material: 'Tige rigide à succion', expectedQuantity: '4' },
  { id: 'z4_catheter_14fr', zone: 'Armoire / zone #4', material: 'Cathéter à succion 14fr', expectedQuantity: '2' },
  { id: 'z4_taie', zone: 'Armoire / zone #4', material: 'Taie d\'oreiller', expectedQuantity: '5' },
  { id: 'z4_serviette', zone: 'Armoire / zone #4', material: 'Serviette', expectedQuantity: '3' },
  { id: 'z4_debarbouillette', zone: 'Armoire / zone #4', material: 'Débarbouillette', expectedQuantity: '3' },
  { id: 'z4_oreiller_plast', zone: 'Armoire / zone #4', material: 'Oreiller plastifié', expectedQuantity: '1' },
  { id: 'z5_cable_120_mdsa', zone: 'Armoire / zone #5 (Tablette Supérieure)', material: 'Cable d\'alimentation de 120 volts (MDSA)', expectedQuantity: '1' },
  { id: 'z5_cable_120_succion', zone: 'Armoire / zone #5 (Tablette Supérieure)', material: 'Cable d\'alimentation de 120 volts (Succion électrique)', expectedQuantity: '1' },
  { id: 'z5_toutou', zone: 'Armoire / zone #5 (Tablette Supérieure)', material: 'Toutou', expectedQuantity: '1' },
  { id: 'z5_bac_n95', zone: 'Armoire / zone #5 (Tablette Supérieure)', material: 'Bac de N95', expectedQuantity: '1' },
  { id: 'z5_boite_masque_adulte', zone: 'Armoire / zone #5 (Tablette Supérieure)', material: 'Boite de masque chirurgical adulte', expectedQuantity: '1' },
  { id: 'z5_boite_masque_ped', zone: 'Armoire / zone #5 (Tablette Supérieure)', material: 'Boite de masque chirurgical pédiatrique', expectedQuantity: '1' },
  { id: 'z5_chasse_moustique', zone: 'Armoire / zone #5 (Trousse "Intervention hors des voies carrossables")', material: 'Chasse-moustique', expectedQuantity: '1' },
  { id: 'z5_sac_jujube', zone: 'Armoire / zone #5 (Trousse "Intervention hors des voies carrossables")', material: 'Sac de jujube', expectedQuantity: '1' },
  { id: 'z5_barre_tendre', zone: 'Armoire / zone #5 (Trousse "Intervention hors des voies carrossables")', material: 'Barre tendre', expectedQuantity: '1' },
  { id: 'z5_light_stick', zone: 'Armoire / zone #5 (Trousse "Intervention hors des voies carrossables")', material: 'Light stick', expectedQuantity: '1' },
  { id: 'z5_bouteille_eau', zone: 'Armoire / zone #5 (Trousse "Intervention hors des voies carrossables")', material: 'Bouteille d\'eau', expectedQuantity: '2' },
  { id: 'z5_vomi_bag', zone: 'Armoire / zone #5 (Tablette Inférieure)', material: 'Vomi-bag', expectedQuantity: '6' },
  { id: 'z5_poudre_absorbante', zone: 'Armoire / zone #5 (Tablette Inférieure)', material: 'Poudre absorbante', expectedQuantity: '1' },
  { id: 'z5_electrodes_4u', zone: 'Armoire / zone #5 (Tablette Inférieure)', material: 'Électrodes de monitorage 4 unités', expectedQuantity: '10' },
  { id: 'z5_electrodes_6u', zone: 'Armoire / zone #5 (Tablette Inférieure)', material: 'Électrodes de monitorage 6 unités', expectedQuantity: '10' },
  { id: 'z5_electrodes_ped', zone: 'Armoire / zone #5 (Tablette Inférieure)', material: 'Électrodes de monitorage pédiatrique (paquet de 4)', expectedQuantity: '2' },
  { id: 'z5_rasoir', zone: 'Armoire / zone #5 (Tablette Inférieure)', material: 'Rasoir', expectedQuantity: '6' },
  { id: 'z5_papier_imprimante', zone: 'Armoire / zone #5 (Tablette Inférieure)', material: 'Papier imprimante Zoll', expectedQuantity: '1' },
  { id: 'z5_sachet_wipe', zone: 'Armoire / zone #5 (Tablette Inférieure)', material: 'Sachet de type "skin barrier wipe" ou "electrode prep pad"', expectedQuantity: '4' },
  { id: 'z5s_dissolvant', zone: 'Armoire / zone #5 (Suite - Tablette Inférieure)', material: 'Sachet de dissolvant à vernis', expectedQuantity: '4' },
  { id: 'z5s_bandelette_gluco', zone: 'Armoire / zone #5 (Suite - Tablette Inférieure)', material: 'Bandelette à glucomètre', expectedQuantity: '1 boite' },
  { id: 'z5s_auto_piqueur', zone: 'Armoire / zone #5 (Suite - Tablette Inférieure)', material: 'Auto-piqueur', expectedQuantity: '10' },
  { id: 'z5s_couvre_sonde', zone: 'Armoire / zone #5 (Suite - Tablette Inférieure)', material: 'Couvre-sonde pour thermomètre tympanique', expectedQuantity: '2 boites' },
  { id: 'z5s_lunette_protect', zone: 'Armoire / zone #5 (Suite - Tablette Inférieure)', material: 'Lunette de protection', expectedQuantity: '1' },
  { id: 'z5s_aide_memoire', zone: 'Armoire / zone #5 (Suite - Tablette Inférieure)', material: 'Aide-mémoire Cambi', expectedQuantity: '1' },
  { id: 'z5s_sac_bio', zone: 'Armoire / zone #5 (Suite - Tablette Inférieure)', material: 'Sac bio-risque', expectedQuantity: '2' },
  { id: 'z5s_sac_literie', zone: 'Armoire / zone #5 (Suite - Tablette Inférieure)', material: 'Sac pour literie utilisée', expectedQuantity: '2' },
  { id: 'z5s_mouchoir', zone: 'Armoire / zone #5 (Suite)', material: 'Mouchoir', expectedQuantity: '1 boite' },
  { id: 'z6_masque_oxy_adulte', zone: 'Armoire / zone #6 (Tablette Supérieure)', material: 'Masque à oxygène 100% adulte', expectedQuantity: '2' },
  { id: 'z6_lunette_nasale', zone: 'Armoire / zone #6 (Tablette Supérieure)', material: 'Lunette nasale', expectedQuantity: '2' },
  { id: 'z6_masque_nebu_adulte', zone: 'Armoire / zone #6 (Tablette Supérieure)', material: 'Masque à nébulisation adulte', expectedQuantity: '2' },
  { id: 'z6_masque_nebu_ped', zone: 'Armoire / zone #6 (Tablette Supérieure)', material: 'Masque à nébulisation pédiatrique', expectedQuantity: '1' },
  { id: 'z6_tube_t', zone: 'Armoire / zone #6', material: 'Tube en T', expectedQuantity: '1' },
  { id: 'z6_filtre_oxylator', zone: 'Armoire / zone #6', material: 'Filtre antibactérien à usage unique pour Oxylator', expectedQuantity: '1' },
  { id: 'z6_masque_tracheo', zone: 'Armoire / zone #6', material: 'Masque à trachéotomie', expectedQuantity: '1' },
  { id: 'z6_masque_oxy_nourrisson', zone: 'Armoire / zone #6', material: 'Masque à oxygène 100% nourrisson', expectedQuantity: '1' },
  { id: 'z6_masque_oxy_ped', zone: 'Armoire / zone #6', material: 'Masque à oxygène 100% pédiatrique', expectedQuantity: '1' },
  { id: 'z6_qmark', zone: 'Armoire / zone #6', material: '?', expectedQuantity: '' },
  { id: 'z6_tubulure_oxylator', zone: 'Armoire / zone #6', material: 'Tubulure d\'appoint crenelée souple à usage unique pour Oxylator', expectedQuantity: '2' },
  { id: 'z6_4x4', zone: 'Armoire / zone #6 (Tablette Inférieure)', material: '4 X 4', expectedQuantity: '30' },
  { id: 'z6_2x2', zone: 'Armoire / zone #6 (Tablette Inférieure)', material: '2 X 2', expectedQuantity: '1 boite' },
  { id: 'z6_pansement_autocollant', zone: 'Armoire / zone #6 (Tablette Inférieure)', material: 'Pansement autocollant enveloppé individuellement', expectedQuantity: '5' },
  { id: 'z6_pansement_coussinet', zone: 'Armoire / zone #6 (Tablette Inférieure)', material: 'Pansement "coussinet abdominal" de 20cm x 25cm', expectedQuantity: '4' },
  { id: 'z6s_valve_asherman', zone: 'Armoire / zone #6 (Suite - Tablette Inférieure)', material: 'Valve Asherman (seal chest)', expectedQuantity: '1' },
  { id: 'z6s_bandage_75', zone: 'Armoire / zone #6 (Suite - Tablette Inférieure)', material: 'Bandage omniforme de 7.5 cm (Kleen 3 pouces)', expectedQuantity: '6' },
  { id: 'z6s_bandage_15', zone: 'Armoire / zone #6 (Suite - Tablette Inférieure)', material: 'Bandage omniforme de 15 cm (Kleen 6 pouces)', expectedQuantity: '6' },
  { id: 'z6s_bandage_triangulaire', zone: 'Armoire / zone #6 (Suite - Tablette Inférieure)', material: 'Bandage triangulaire', expectedQuantity: '6' },
  { id: 'z6s_couverture_metal', zone: 'Armoire / zone #6 (Suite - Tablette Inférieure)', material: 'Couverture métallisée', expectedQuantity: '2' },
  { id: 'z6s_insta_glucose', zone: 'Armoire / zone #6 (Suite - Tablette Inférieure)', material: 'Insta-glucose / DEX.4', expectedQuantity: '2' },
  { id: 'z6s_ciseau', zone: 'Armoire / zone #6 (Suite - Tablette Inférieure)', material: 'Ciseau', expectedQuantity: '1' },
  { id: 'z6s_rouleau_hypo_1', zone: 'Armoire / zone #6 (Suite)', material: 'Rouleau de ruban adhésif hypoallergique 1 pouce', expectedQuantity: '2' },
  { id: 'z6s_rouleau_tissu_2', zone: 'Armoire / zone #6 (Suite)', material: 'Rouleau de ruban adhésif en tissu de 2 pouces', expectedQuantity: '2' },
  { id: 'z6s_pince_nez', zone: 'Armoire / zone #6 (Suite)', material: 'Pince-nez', expectedQuantity: '2' },
  { id: 'z6s_stanhexidine', zone: 'Armoire / zone #6 (Suite)', material: 'Stanhexidine', expectedQuantity: '2' },
  { id: 'z6s_nacl_250_2', zone: 'Armoire / zone #6 (Suite)', material: 'NaCl 250 ml', expectedQuantity: '2' },
  { id: 'z6s_compresse_froide', zone: 'Armoire / zone #6 (Suite)', material: 'Compresse instantanée froide de type "cold pack"', expectedQuantity: '' },
  { id: 'z6s_compresse_chaude', zone: 'Armoire / zone #6 (Suite)', material: 'Compresse instantanée froide de type "hot pack"', expectedQuantity: '' },
  { id: 'z7_guide', zone: 'Armoire / zone #7', material: 'Guide d\'inventaire', expectedQuantity: '1' },
  { id: 'z8_chasse_moustique', zone: 'Armoire / zone #8', material: 'Chasse-moustique', expectedQuantity: '1' },
  { id: 'z8_pen_light', zone: 'Armoire / zone #8', material: 'Pen light', expectedQuantity: '1' },
  { id: 'z9_trousse_ped', zone: 'Armoire / zone #9 (Tablette Supérieure)', material: 'Trousse pédiatrique', expectedQuantity: '1' },
  { id: 'z9_ceinture_clip', zone: 'Armoire / zone #9 (Sac à dos - 1)', material: 'Ceinture fast-clip', expectedQuantity: '5' },
  { id: 'z9_immob_tete_ferno', zone: 'Armoire / zone #9 (Sac à dos - 1)', material: 'Immobilisateur de tête (ferno)', expectedQuantity: '1' },
  { id: 'z9_collier_adulte', zone: 'Armoire / zone #9 (Sac à dos - 1)', material: 'Collier cervical adulte', expectedQuantity: '1' },
  { id: 'z9_collier_ped', zone: 'Armoire / zone #9 (Sac à dos - 1)', material: 'Collier cervical pédiatrique', expectedQuantity: '1' },
  { id: 'z9_cold_pack', zone: 'Armoire / zone #9 (Sac à dos - 2)', material: 'Cold pack', expectedQuantity: '1' },
  { id: 'z9_hot_pack', zone: 'Armoire / zone #9 (Sac à dos - 2)', material: 'Hot pack', expectedQuantity: '2' },
  { id: 'z9_bandage_triangulaire', zone: 'Armoire / zone #9 (Sac à dos - 3)', material: 'Bandage triangulaire', expectedQuantity: '2' },
  { id: 'z9_couverture_metal', zone: 'Armoire / zone #9 (Sac à dos - 3)', material: 'Couverture métallisée', expectedQuantity: '2' },
  { id: 'z9_ciseau', zone: 'Armoire / zone #9 (Sac à dos - 3)', material: 'Ciseau', expectedQuantity: '1' },
  { id: 'z9_nacl_110', zone: 'Armoire / zone #9 (Sac à dos - 3)', material: 'NaCl 110 ml', expectedQuantity: '1' },
  { id: 'z9_kling_3', zone: 'Armoire / zone #9 (Sac à dos - 3)', material: 'Kling 3 pouces', expectedQuantity: '2' },
  { id: 'z9_kling_6', zone: 'Armoire / zone #9 (Sac à dos - 3)', material: 'Kling 6 pouces', expectedQuantity: '2' },
  { id: 'z9_pad_abdo', zone: 'Armoire / zone #9 (Sac à dos - 3)', material: 'Pad abdominal', expectedQuantity: '2' },
  { id: 'z9_4x4', zone: 'Armoire / zone #9 (Sac à dos - 3)', material: '4x4', expectedQuantity: '5' },
  { id: 'z9_tape_hypo', zone: 'Armoire / zone #9 (Sac à dos - 3)', material: 'Tape hypoallergique 2 pouces', expectedQuantity: '1' },
  { id: 'z9_drap_laine', zone: 'Armoire / zone #9 (Tablette Médiane)', material: 'Drap de laine', expectedQuantity: '2' },
  { id: 'z9_drap_flanelle', zone: 'Armoire / zone #9 (Tablette Médiane)', material: 'Drap de flanelle', expectedQuantity: '5' },
  { id: 'z10_abrasif', zone: 'Armoire / zone #10', material: 'Abrasif sable-gravier', expectedQuantity: '1' },
  { id: 'z10_gallon_lave_vitre', zone: 'Armoire / zone #10', material: 'Gallon de lave-vitre', expectedQuantity: '1' },
  { id: 'z10_pelle', zone: 'Armoire / zone #10', material: 'Pelle', expectedQuantity: '1' },
  { id: 'z11_bassine', zone: 'Armoire / zone #11 (sous le banc)', material: 'Bassine', expectedQuantity: '2' },
  { id: 'z11_urinoire', zone: 'Armoire / zone #11 (sous le banc)', material: 'Urinoire', expectedQuantity: '2' },
  { id: 'z11_couverture_urgence', zone: 'Armoire / zone #11 (sous le banc)', material: 'Couverture d\'urgence jaune', expectedQuantity: '4' },
  { id: 'z11_qmark1', zone: 'Armoire / zone #11 (sous le banc)', material: '?', expectedQuantity: '' },
  { id: 'z11_qmark2', zone: 'Armoire / zone #11 (sous le banc)', material: '?', expectedQuantity: '' },
  { id: 'z12_balai_neige', zone: 'Armoire / zone #12 (compartiment du cylindre d\'O2)', material: 'Balai à neige', expectedQuantity: '1' },
  { id: 'z12_essuie_glace', zone: 'Armoire / zone #12 (compartiment du cylindre d\'O2)', material: 'Essuie-glace : 20 pouces + 30 pouces', expectedQuantity: '1 de chaque' },
  { id: 'z12_pied_biche', zone: 'Armoire / zone #12 (compartiment du cylindre d\'O2)', material: 'Pied de biche (36 pouces)', expectedQuantity: '1' },
  { id: 'z12_cle_anglaise', zone: 'Armoire / zone #12 (compartiment du cylindre d\'O2)', material: 'Clé anglaise', expectedQuantity: '1' },
  { id: 'fin_papier_absorbant', zone: 'Fin - Sans Zone', material: 'Papier absorbant', expectedQuantity: '1' },
  { id: 'fin_bouteille_desinfectant', zone: 'Fin - Sans Zone', material: 'Bouteille de désinfectant', expectedQuantity: '1' },
  { id: 'fin_bouteille_neutralisateur', zone: 'Fin - Sans Zone', material: 'Bouteille de neutralisateur d\'odeur', expectedQuantity: '1' },
  { id: 'fin_sac_decedee', zone: 'Fin - Sans Zone', material: 'Sac pour personne décédée', expectedQuantity: '2' },
  { id: 'fin_sac_bio_risque', zone: 'Fin - Sans Zone', material: 'Sac bio-risque', expectedQuantity: '8' },
  { id: 'fin_grand_sac_noir', zone: 'Fin - Sans Zone', material: 'Grand sac noir ou transparent', expectedQuantity: '4' },
  { id: 'fin_ensemble_attelle', zone: 'Fin - Sans Zone', material: 'Ensemble d\'attelle sous-vide incluant le sac de transport et la pompe', expectedQuantity: '1' },
  { id: 'fin_filtre_valve', zone: 'Fin - Sans Zone', material: 'Filtre + valve anti-retour pour masque de poche', expectedQuantity: '2' },
  { id: 'fin_raccord_oxy', zone: 'Fin - Sans Zone', material: 'Raccord d\'oxygène', expectedQuantity: '2' },
  { id: 'fin_tubulure_oxy', zone: 'Fin - Sans Zone', material: 'Tubulure d\'oxygène', expectedQuantity: '2' },
  { id: 'fin_colorimetre_q', zone: 'Fin - Sans Zone', material: 'Colorimètre quantitatif (filterline)', expectedQuantity: '2' },
  { id: 'fin_colorimetre_etco2', zone: 'Fin - Sans Zone', material: 'Colorimètre qualitatif (ETCO2)', expectedQuantity: '1' },
  { id: 'fin_fixateur_sonde', zone: 'Fin - Sans Zone', material: 'Fixateur de sonde "Thomas"', expectedQuantity: '1' },
  { id: 'fin_adapteur_male', zone: 'Fin - Sans Zone', material: 'Adapteur double mâle (raccord de la sonde du lgel avec une tubulure à succion)', expectedQuantity: '3' },
  { id: 'fin_pansement_hemo', zone: 'Fin - Sans Zone', material: 'Pansement hémostatique', expectedQuantity: '1' },
  { id: 'fin_nacl_ampoule', zone: 'Fin - Sans Zone', material: 'NaCl 0,9% en ampoule de 3 ml', expectedQuantity: '6' },
  { id: 'fin_tourniquet', zone: 'Fin - Sans Zone', material: 'Tourniquet militaire', expectedQuantity: '1' },
  { id: 'fin_pansement_olaes', zone: 'Fin - Sans Zone', material: 'Pansement compressif "Olaes"', expectedQuantity: '1' },
  { id: 'fin_pique_bleu', zone: 'Fin - Sans Zone', material: 'Piqué bleu', expectedQuantity: '5' },
  { id: 'fin_couvre_chaussure', zone: 'Fin - Sans Zone', material: 'Couvre-chaussure en plastique bleu', expectedQuantity: '8' },
  { id: 'fin_jaquette_jetable', zone: 'Fin - Sans Zone', material: 'Jaquette de protection jetable', expectedQuantity: '4' },
  { id: 'fin_combinaison_cagoule', zone: 'Fin - Sans Zone', material: 'Combinaison de protection avec cagoule (L, XL, 2XL, 3XL, 4XL, 5XL)', expectedQuantity: '6' },
  { id: 'fin_couvre_chaussure_anti', zone: 'Fin - Sans Zone', material: 'Couvre-chaussure antidérapant de grandeur universelle', expectedQuantity: '2 paires' },
  { id: 'fin_immob_tete_carton', zone: 'Fin - Sans Zone', material: 'Immobilisateur de tête en carton', expectedQuantity: '1' },
  { id: 'fin_scelles', zone: 'Fin - Sans Zone', material: 'Scellés / étiquettes', expectedQuantity: '10' },
  { id: 'fin_drap_sterile', zone: 'Fin - Sans Zone', material: 'Drap stérile de 150 cm x 240 cm à usage unique pour les brûlés', expectedQuantity: '2' },
];

// Structure pour les tâches de désinfection
interface DisinfectionTask {
  id: 'avant' | 'arriere';
  label: string;
  isChecked: boolean;
}

type DisinfectionState = {
  avant: DisinfectionTask;
  arriere: DisinfectionTask;
};

// Fonction pour formater le matricule de zone (Lettre-XXXX)
const formatZoneMatriculeInput = (value: string): string => {
  let sanitizedValue = value.replace(/[^a-zA-Z0-9-]/g, '');
  if (!sanitizedValue) return '';

  const firstChar = sanitizedValue.charAt(0).toUpperCase();
  if (sanitizedValue.length === 1 && /^[A-Z]$/.test(firstChar)) {
    return firstChar;
  }

  let numbersPart = sanitizedValue.substring(1);
  if (sanitizedValue.length > 1 && sanitizedValue.charAt(1) !== '-' && /^[A-Z]/.test(firstChar)) {
    numbersPart = '-' + sanitizedValue.substring(1);
  }
  
  numbersPart = numbersPart.replace(/[^0-9]/g, ''); 
  
  if (/^[A-Z]$/.test(firstChar)) {
    let result = firstChar;
    if (sanitizedValue.includes('-') || numbersPart.length > 0) {
        result += '-';
    }
    result += numbersPart.substring(0, 4);
    return result;
  }
  return sanitizedValue; 
};


const MonthlyCleaningInventoryPage: React.FC<MonthlyCleaningInventoryPageProps> = ({
  goBack,
  getCurrentDateTime,
  sendInspectionToMakecom,
  onSubmissionComplete,
  numeroVehicule,
  handleVehiculeNumberChange,
  matricule, 
  handleMatriculeChange,
  pointDeService, 
  setPointDeService, 
}) => {
  const [zoneData, setZoneData] = useState<ZoneData>({});
  const [itemCheckedStatus, setItemCheckedStatus] = useState<ItemCheckedStatus>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [disinfectionState, setDisinfectionState] = useState<DisinfectionState>({
    avant: { id: 'avant', label: "Désinfection de l'habitacle avant", isChecked: false },
    arriere: { id: 'arriere', label: "Désinfection de l'habitacle arrière", isChecked: false },
  });

  const handleDisinfectionChange = (taskId: 'avant' | 'arriere') => {
    setDisinfectionState(prev => ({
      ...prev,
      [taskId]: { ...prev[taskId], isChecked: !prev[taskId].isChecked },
    }));
  };
  
  const groupedInventoryItems = useMemo(() => {
    return INITIAL_INVENTORY_ITEMS.reduce<Record<string, InitialInventoryItem[]>>((acc, item) => {
      const zone = item.zone || 'Inconnue';
      if (!acc[zone]) {
        acc[zone] = [];
      }
      acc[zone].push(item);
      return acc;
    }, {});
  }, []); 


  const handleZoneInputChange = useCallback((zoneId: string, field: keyof ZoneDataEntry, value: string | boolean) => {
    setZoneData(prev => ({
      ...prev,
      [zoneId]: {
        ...prev[zoneId],
        matricule: field === 'matricule' ? formatZoneMatriculeInput(value as string) : (prev[zoneId]?.matricule || ''),
        cleanedChecked: field === 'cleanedChecked' ? (value as boolean) : (prev[zoneId]?.cleanedChecked || false),
      },
    }));
  }, []);

  const handleItemCheckChange = useCallback((itemId: string) => {
    setItemCheckedStatus(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  }, []);
  

  const validateForm = (): string | null => {
    if (!numeroVehicule) return "Le numéro de véhicule est requis.";
    if (!matricule) return "Le matricule global (employé) est requis.";
    if (!pointDeService) return "Le point de service est requis.";

    if (!disinfectionState.avant.isChecked) return `La tâche "${disinfectionState.avant.label}" doit être cochée.`;
    if (!disinfectionState.arriere.isChecked) return `La tâche "${disinfectionState.arriere.label}" doit être cochée.`;

    for (const item of INITIAL_INVENTORY_ITEMS) {
      if (!itemCheckedStatus[item.id]) {
        return `L'item "${item.material}" dans la zone "${item.zone}" doit être vérifié.`;
      }
    }
    
    for (const zoneId of Object.keys(groupedInventoryItems)) {
        const currentZoneData = zoneData[zoneId];
        if (currentZoneData?.cleanedChecked && !currentZoneData.matricule) {
            return `Le matricule est requis pour la zone "${zoneId}" lorsque "Nettoyé" est coché.`;
        }
        if (currentZoneData?.matricule && !/^[A-Z]-\d{4}$/.test(currentZoneData.matricule)) {
            return `Le format du matricule pour la zone "${zoneId}" est invalide. Attendu: une lettre, un tiret, et quatre chiffres (ex: A-1234).`;
        }
    }
    return null;
  };


  const generateCleaningInventoryHTML = (): string => {
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rapport de Nettoyage et Inventaire Mensuel</title>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; background-color: #f4f4f4; }
          .container { background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          h1, h2 { color: #102947; text-align: center; }
          h1 { margin-bottom: 10px; }
          h2 { margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #102947; padding-bottom: 5px; }
          .info { margin-bottom: 20px; padding: 10px; border: 1px solid #eee; border-radius: 5px; background-color: #f9f9f9; }
          .info p { margin: 8px 0; font-size: 14px; }
          .info strong { color: #102947; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #102947; color: white; }
          .zone-header td { background-color: #cfe2f3; font-weight: bold; font-size: 15px; } 
          .zone-details td { padding-left: 20px; font-style: italic; font-size: 12px; color: #555; }
          .item-row { transition: background-color 0.2s ease-in-out; }
          .item-row:nth-child(even) { background-color: #f9f9f9; }
          .item-row:nth-child(odd) { background-color: #fff; }
          .item-row.checked-row {
            background-color: #d1fecb !important; /* Ensure green overrides alternating color */
          }
          .item-row.checked-row:hover {
            background-color: #b7e6b3 !important; /* Darker green on hover for checked rows */
          }
          .item-row:not(.checked-row):hover {
            background-color: #e8f5e9; /* Light green for hover on unchecked */
          }
          .checked { color: green; font-weight: bold; }
          .not-checked { color: red; }
          .quantity { text-align: center; }
          .checkbox-cell { text-align: center; }
          footer { text-align: center; margin-top: 30px; font-size: 12px; color: #777; }
          .disinfection-section { margin-bottom: 20px; padding: 15px; border: 1px solid #cfe2f3; border-radius: 5px; background-color: #e7f3fe; }
          .disinfection-section h3 { color: #102947; margin-top: 0; margin-bottom: 10px; font-size: 16px; }
          .disinfection-item { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Nettoyage et Inventaire Mensuel</h1>
          <div class="info">
            <p><strong>Numéro du véhicule:</strong> ${numeroVehicule}</p>
            <p><strong>Matricule (global):</strong> ${matricule}</p>
            <p><strong>Point de service:</strong> ${pointDeService}</p>
            <p><strong>Date et heure de soumission:</strong> ${getCurrentDateTime()}</p>
          </div>

          <h2>Tâches de Désinfection</h2>
          <div class="disinfection-section">
            <div class="disinfection-item">
              <span>${disinfectionState.avant.label}</span>
              <span class="${disinfectionState.avant.isChecked ? 'checked' : 'not-checked'}">${disinfectionState.avant.isChecked ? 'Effectué ✓' : 'Non effectué ✗'}</span>
            </div>
            <div class="disinfection-item">
              <span>${disinfectionState.arriere.label}</span>
              <span class="${disinfectionState.arriere.isChecked ? 'checked' : 'not-checked'}">${disinfectionState.arriere.isChecked ? 'Effectué ✓' : 'Non effectué ✗'}</span>
            </div>
          </div>

          <h2>Inventaire par Zone</h2>
          <table>
            <thead>
              <tr>
                <th>Matériel</th>
                <th class="quantity">Qté Attendue</th>
                <th class="checkbox-cell">Vérifié</th>
              </tr>
            </thead>
            <tbody>
    `;

    Object.entries(groupedInventoryItems).forEach(([zone, items]) => {
      const currentZoneData = zoneData[zone.replace(/[^a-zA-Z0-9]/g, '-')] || { matricule: '', cleanedChecked: false };
      html += `
        <tr class="zone-header">
          <td colspan="3">
            ${zone} 
            <span class="${currentZoneData.cleanedChecked ? 'checked' : 'not-checked'}">(Nettoyé: ${currentZoneData.cleanedChecked ? 'Oui ✓' : 'Non ✗'})</span>
            ${currentZoneData.matricule ? `(Matricule: ${currentZoneData.matricule})` : ''}
          </td>
        </tr>
      `;
      items.forEach(item => {
        const isChecked = !!itemCheckedStatus[item.id];
        html += `
          <tr class="item-row ${isChecked ? 'checked-row' : ''}">
            <td>${item.material.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>
            <td class="quantity">${item.expectedQuantity}</td>
            <td class="checkbox-cell ${isChecked ? 'checked' : 'not-checked'}">${isChecked ? '✓' : '✗'}</td>
          </tr>
        `;
      });
    });

    html += `
            </tbody>
          </table>
          <footer>Rapport généré le ${getCurrentDateTime()}</footer>
        </div>
      </body>
      </html>
    `;
    return html;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setShowConfirmation(false); 
      return;
    }
    setShowConfirmation(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmation(false); 
    setIsSubmitting(true);
    setError(null);

    try {
      const htmlContent = generateCleaningInventoryHTML();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `nettoyage_inventaire_${numeroVehicule}_${timestamp}.html`;

      const webhookData = {
        type: 'NettoyageInventaire', 
        numeroVehicule,
        matricule, 
        pointDeService, 
        dateTime: getCurrentDateTime(),
        zoneCompletionData: zoneData, 
        itemCheckedStatuses: itemCheckedStatus, 
        disinfectionData: { 
            avantEffectue: disinfectionState.avant.isChecked,
            arriereEffectue: disinfectionState.arriere.isChecked,
        },
        htmlContent,
        fileName,
        mimeType: "text/html"
      };

      console.log("Envoi des données:", webhookData);
      const success = await sendInspectionToMakecom('NettoyageInventaire', webhookData);

      if (success) {
        onSubmissionComplete("Le rapport de nettoyage et inventaire a été envoyé avec succès.");
        setZoneData({});
        setItemCheckedStatus({});
        setDisinfectionState({
            avant: { id: 'avant', label: "Désinfection de l'habitacle avant", isChecked: false },
            arriere: { id: 'arriere', label: "Désinfection de l'habitacle arrière", isChecked: false },
        });
      } else {
        throw new Error("L'envoi des données vers Make.com a échoué.");
      }
    } catch (err) {
      const error = err as Error;
      console.error('Erreur lors de la soumission:', error);
      setError(`Échec de la soumission: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <header className="bg-[#102947] text-white p-4 rounded-lg shadow-md flex items-center justify-between mb-6">
        <div className="flex items-center">
          <img src="https://res.cloudinary.com/dxyvj8rka/image/upload/f_auto,q_auto/v1/cambi/iazjhbzvu6dv5fad398u" alt="Logo CAMBI" className="h-8 mr-2 filter brightness-0 invert" />
          <h1 className="text-xl font-bold">Nettoyage et inventaire</h1>
        </div>
        <button onClick={goBack} className="flex items-center text-white"><ChevronLeft size={20} /> Retour</button>
      </header>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-20">
        {/* Section Informations Générales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label htmlFor="numeroVehiculeNettoyage" className="block text-sm font-medium text-gray-700 mb-1">Numéro de Véhicule :</label>
            <input
              type="text"
              id="numeroVehiculeNettoyage"
              value={numeroVehicule}
              onChange={(e) => handleVehiculeNumberChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#102947]"
              required
              placeholder="Ex: 9198"
            />
          </div>
          <div>
            <label htmlFor="matriculeGlobalNettoyage" className="block text-sm font-medium text-gray-700 mb-1">Matricule (Employé):</label>
            <input
              type="text"
              id="matriculeGlobalNettoyage"
              value={matricule}
              onChange={(e) => handleMatriculeChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#102947]"
              required
              placeholder="Ex: N-0100"
            />
          </div>
          <div>
            <label htmlFor="pointDeServiceNettoyage" className="block text-sm font-medium text-gray-700 mb-1">Point de service (PDS) :</label>
            <select 
              id="pointDeServiceNettoyage" 
              value={pointDeService} 
              onChange={(e) => setPointDeService(e.target.value)} 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#102947]" 
              required
            >
              <option value="">Sélectionner PDS</option>
              <option value="Sainte-Adèle">Sainte-Adèle</option>
              <option value="Grenville">Grenville</option>
              <option value="Saint-Donat">Saint-Donat</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date et Heure Actuelle :</label>
            <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-100">
              {getCurrentDateTime()}
            </div>
          </div>
        </div>

        {/* Section Désinfection */}
        <div className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h2 className="text-lg font-semibold text-[#102947] mb-3 border-b pb-2">Tâches de Désinfection</h2>
            {(['avant', 'arriere'] as const).map((taskId) => (
                <div 
                  key={taskId} 
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleDisinfectionChange(taskId)}
                  role="checkbox"
                  aria-checked={disinfectionState[taskId].isChecked}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') handleDisinfectionChange(taskId); }}
                >
                    <label htmlFor={`disinfection-${taskId}`} className="text-sm text-gray-700 cursor-pointer select-none">
                        {disinfectionState[taskId].label} :
                    </label>
                    <input
                        type="checkbox"
                        id={`disinfection-${taskId}`}
                        checked={disinfectionState[taskId].isChecked}
                        readOnly // Input is controlled by row click, make it readOnly or visually hidden but accessible
                        className="w-5 h-5 accent-[#102947] pointer-events-none rounded border-gray-300 focus:ring-[#102947]"
                        tabIndex={-1} 
                    />
                </div>
            ))}
        </div>


        {/* Section Inventaire par Zone */}
        <h2 className="text-lg font-semibold text-[#102947] mb-4 border-b pb-2">Inventaire par Zone</h2>
        <div className="space-y-8">
          {Object.entries(groupedInventoryItems).map(([zone, items]) => {
            const zoneId = zone.replace(/[^a-zA-Z0-9]/g, '-'); 
            const currentZoneData = zoneData[zoneId] || { matricule: '', cleanedChecked: false };
            
            return (
              <div key={zoneId} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 pb-2 border-b border-gray-300">
                  <h3 className="text-md font-semibold text-[#102947] mb-2 sm:mb-0">{zone}</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`cleaned-${zoneId}`}
                        checked={currentZoneData.cleanedChecked}
                        onChange={(e) => handleZoneInputChange(zoneId, 'cleanedChecked', e.target.checked)}
                        className="w-4 h-4 accent-[#102947] text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2 cursor-pointer"
                      />
                      <label htmlFor={`cleaned-${zoneId}`} className="text-sm font-medium text-gray-700 cursor-pointer select-none">Nettoyé</label>
                    </div>
                     <input
                        type="text"
                        placeholder="Ex: A-1234"
                        value={currentZoneData.matricule}
                        onChange={(e) => handleZoneInputChange(zoneId, 'matricule', e.target.value)}
                        className="p-1.5 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-[#102947] focus:border-[#102947] w-32"
                        disabled={!currentZoneData.cleanedChecked} 
                        maxLength={6} 
                      />
                  </div>
                </div>

                <table className="min-w-full">
                  <thead className="sr-only">
                    <tr><th>Matériel</th><th>Qté Attendue</th><th>Vérifié</th></tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const isChecked = !!itemCheckedStatus[item.id];
                      return (
                        <tr 
                          key={item.id} 
                          className={`item-row border-b border-gray-100 ${isChecked ? 'checked-row' : (index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')} cursor-pointer`}
                          onClick={() => handleItemCheckChange(item.id)}
                          role="checkbox"
                          aria-checked={isChecked}
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') handleItemCheckChange(item.id); }}
                        >
                          <td className="py-2 px-3 text-sm text-gray-700 w-3/5 select-none">{item.material}</td>
                          <td className="py-2 px-3 text-sm text-gray-600 text-center w-1/5 select-none">{item.expectedQuantity}</td>
                          <td className="py-2 px-3 text-center w-1/5">
                            <input
                              type="checkbox"
                              id={`item-${item.id}`}
                              checked={isChecked}
                              readOnly // Controlled by row click
                              className="w-5 h-5 accent-[#102947] pointer-events-none rounded border-gray-300 focus:ring-[#102947]"
                              tabIndex={-1} 
                              aria-labelledby={`material-label-${item.id}`}
                            />
                            <span id={`material-label-${item.id}`} className="sr-only">{item.material}</span>
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

        {error && (
          <div role="alert" className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-6 mb-4">
            <p>{error}</p>
          </div>
        )}

        <div className="sticky bottom-0 bg-white p-4 border-t mt-6 -mx-4 md:-mx-6">
          <button 
            type="submit" 
            className={`w-full ${isSubmitting ? 'bg-[#102947]/70 cursor-not-allowed' : 'bg-[#102947] hover:bg-[#102947]/90'} text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center text-base`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>Traitement...</>
            ) : (
              <><Send className="mr-2" size={20} />Soumettre</>
            )}
          </button>
        </div>
      </form>

      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title-cleaning">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 id="confirm-title-cleaning" className="text-lg font-semibold text-gray-800">Confirmation</h3>
              <button onClick={() => setShowConfirmation(false)} className="text-gray-400 hover:text-gray-600" aria-label="Fermer">
                <X size={22} />
              </button>
            </div>
            <div className="mb-6">
              <div className="flex items-start">
                <AlertCircle className="text-[#102947] mr-3 mt-1 flex-shrink-0" size={24} aria-hidden="true" />
                <p className="text-gray-700">Êtes-vous sûr de vouloir finaliser et envoyer ce rapport de nettoyage et inventaire ?</p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowConfirmation(false)} 
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Annuler
              </button>
              <button 
                onClick={confirmSubmit} 
                className="px-4 py-2 bg-[#102947] text-white text-sm font-medium rounded-md hover:bg-[#102947]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#102947]"
              >
                Confirmer et Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyCleaningInventoryPage; 