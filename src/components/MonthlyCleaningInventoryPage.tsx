import React, { useState, useCallback } from 'react';
import { ChevronLeft, Send, AlertCircle, X } from 'lucide-react';

// Interface Props (inchangée par cette demande)
interface MonthlyCleaningInventoryPageProps {
  goBack: () => void;
  getCurrentDateTime: () => string;
  sendInspectionToMakecom: (formType: string, data: any) => Promise<boolean>;
  onSubmissionComplete: (message: string) => void;
  numeroVehicule: string;
  handleVehiculeNumberChange: (value: string) => void;
}

// Nouvelle structure pour une ligne d'item d'inventaire
interface InventoryItemRow {
  id: string; // Unique ID
  zone: string; // Ex: "Armoire / zone #1", "Armoire / zone #3 (Tablette Supérieure)"
  material: string; // Description
  expectedQuantity: string; // Quantité attendue (texte pour flexibilité)
  date: string; // Date par ligne
  matricule: string; // Matricule par ligne
}

// Nouvelle liste d'items basée sur les images "Inventaire Médical Transit"
const INITIAL_INVENTORY_ITEMS: Array<{ id: string; zone: string; material: string; expectedQuantity: string; }> = [
  // ... (Toute la longue liste extraite des images - voir la tentative précédente) ...
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
  { id: 'z3_brassard_adulte', zone: 'Armoire / zone #3 (Tablette Inférieure - Bac bleu 4x8)', material: 'Brassard adulte #10 (petit) - #11 (régulier) - #12 (large)', expectedQuantity: '1 de chaque' },
  { id: 'z3_adapteur_brassard', zone: 'Armoire / zone #3 (Tablette Inférieure - Bac bleu 4x8)', material: 'Adapteur 2 brins pour brassard + 1 brin (sphygmo manuel)', expectedQuantity: '1 de chaque' },
  { id: 'z3_canule_naso', zone: 'Armoire / zone #3 (Tablette Inférieure - Bac bleu 4x8)', material: 'Canule nasopharyngée (12fr/14fr/16fr/18fr/20fr/22fr/24fr/26fr/28fr/30fr)', expectedQuantity: '1' },
  { id: 'z3_muco', zone: 'Armoire / zone #3 (Tablette Inférieure - Bac bleu 4x8)', material: 'Muco', expectedQuantity: '4' },
  { id: 'z3_seringue_60cc', zone: 'Armoire / zone #3 (Tablette Inférieure)', material: 'Seringue 60 cc', expectedQuantity: '1' },
  { id: 'z3_filtre_hepa', zone: 'Armoire / zone #3 (Tablette Inférieure - Bac bleu 4x8)', material: 'Filtre antibactérien HEPA', expectedQuantity: '2' },
  { id: 'z3_masque_vital5', zone: 'Armoire / zone #3 (Tablette Inférieure - Bac bleu 4x8)', material: 'Masque de type "vital signs" #5', expectedQuantity: '1' },
  { id: 'z3_masque_vital6', zone: 'Armoire / zone #3 (Tablette Inférieure - Bac bleu 4x8)', material: 'Masque de type "vital signs" #6', expectedQuantity: '1' },
  { id: 'z3_catheter_14', zone: 'Armoire / zone #3 (Tablette Inférieure - Bac bleu 4x8)', material: 'Cathéter pour intraveineuse #14 de 2 pouces', expectedQuantity: '4' },
  { id: 'z3_tampons_alcool', zone: 'Armoire / zone #3 (Tablette Inférieure)', material: 'Tampons d\'alcool', expectedQuantity: '10' },
  { id: 'z3_tubulure_perfusion', zone: 'Armoire / zone #3 (Tablette Inférieure)', material: 'Tubulure à perfusion "macrodrop"', expectedQuantity: '2' },
  { id: 'z3s_garrot', zone: 'Armoire / zone #3 (Suite - Bac bleu 4x8)', material: 'Garrot veineux', expectedQuantity: '1' },
  { id: 'z3s_seringue_1_3', zone: 'Armoire / zone #3 (Suite)', material: 'Seringue 1 ml et 3 ml', expectedQuantity: '4 de chaque' },
  { id: 'z3s_nacl_250', zone: 'Armoire / zone #3 (Suite)', material: 'NaCl 250 ml', expectedQuantity: '1' },
  { id: 'z3s_serum_1000', zone: 'Armoire / zone #3 (Suite)', material: 'Sac de sérum physiologique 1000 ml', expectedQuantity: '2' },
  { id: 'z3s_lavage_oculaire', zone: 'Armoire / zone #3 (Suite)', material: 'Bouteille pour lavage occulaire', expectedQuantity: '2' },
  { id: 'z4_reservoir_elec', zone: 'Armoire / zone #4 (Matériel)', material: 'Réservoir pour succion électrique', expectedQuantity: '1' },
  { id: 'z4_reservoir_murale', zone: 'Armoire / zone #4 (Matériel)', material: 'Réservoir pour succion murale + couvercle', expectedQuantity: '2' },
  { id: 'z4_tubulure_succion', zone: 'Armoire / zone #4 (Bac vert 6x11)', material: 'Tubulure à succion', expectedQuantity: '4' },
  { id: 'z4_tige_rigide', zone: 'Armoire / zone #4 (Bac vert 6x11)', material: 'Tige rigide à succion', expectedQuantity: '4' },
  { id: 'z4_catheter_14fr', zone: 'Armoire / zone #4 (Bac vert 6x11)', material: 'Cathéter à succion 14fr', expectedQuantity: '2' },
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
  { id: 'z5_electrodes_4u', zone: 'Armoire / zone #5 (Tablette Inférieure - Bac beige 4x8)', material: 'Électrodes de monitorage 4 unités', expectedQuantity: '10' },
  { id: 'z5_electrodes_6u', zone: 'Armoire / zone #5 (Tablette Inférieure - Bac beige 4x8)', material: 'Électrodes de monitorage 6 unités', expectedQuantity: '10' },
  { id: 'z5_electrodes_ped', zone: 'Armoire / zone #5 (Tablette Inférieure - Bac beige 4x8)', material: 'Électrodes de monitorage pédiatrique (paquet de 4)', expectedQuantity: '2' },
  { id: 'z5_rasoir', zone: 'Armoire / zone #5 (Tablette Inférieure)', material: 'Rasoir', expectedQuantity: '6' },
  { id: 'z5_papier_imprimante', zone: 'Armoire / zone #5 (Tablette Inférieure)', material: 'Papier imprimante Zoll', expectedQuantity: '1' },
  { id: 'z5_sachet_wipe', zone: 'Armoire / zone #5 (Tablette Inférieure)', material: 'Sachet de type "skin barrier wipe" ou "electrode prep pad"', expectedQuantity: '4' },
  { id: 'z5s_dissolvant', zone: 'Armoire / zone #5 (Suite - Tablette Inférieure - Bac beige 4x8)', material: 'Sachet de dissolvant à vernis', expectedQuantity: '4' },
  { id: 'z5s_bandelette_gluco', zone: 'Armoire / zone #5 (Suite - Tablette Inférieure)', material: 'Bandelette à glucomètre', expectedQuantity: '1 boite' },
  { id: 'z5s_auto_piqueur', zone: 'Armoire / zone #5 (Suite - Tablette Inférieure)', material: 'Auto-piqueur', expectedQuantity: '10' },
  { id: 'z5s_couvre_sonde', zone: 'Armoire / zone #5 (Suite - Tablette Inférieure)', material: 'Couvre-sonde pour thermomètre tympanique', expectedQuantity: '2 boites' },
  { id: 'z5s_lunette_protect', zone: 'Armoire / zone #5 (Suite - Tablette Inférieure - Bac beige 4x8)', material: 'Lunette de protection', expectedQuantity: '1' },
  { id: 'z5s_aide_memoire', zone: 'Armoire / zone #5 (Suite - Tablette Inférieure - Bac beige 4x8)', material: 'Aide-mémoire Cambi', expectedQuantity: '1' },
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
  { id: 'z6_qmark', zone: 'Armoire / zone #6 (Bac bleu 4x8)', material: '?', expectedQuantity: '' },
  { id: 'z6_tubulure_oxylator', zone: 'Armoire / zone #6', material: 'Tubulure d\'appoint crenelée souple à usage unique pour Oxylator', expectedQuantity: '2' },
  { id: 'z6_4x4', zone: 'Armoire / zone #6 (Tablette Inférieure)', material: '4 X 4', expectedQuantity: '30' },
  { id: 'z6_2x2', zone: 'Armoire / zone #6 (Tablette Inférieure)', material: '2 X 2', expectedQuantity: '1 boite' },
  { id: 'z6_pansement_autocollant', zone: 'Armoire / zone #6 (Tablette Inférieure)', material: 'Pansement autocollant enveloppé individuellement', expectedQuantity: '5' },
  { id: 'z6_pansement_coussinet', zone: 'Armoire / zone #6 (Tablette Inférieure)', material: 'Pansement "coussinet abdominal" de 20cm x 25cm', expectedQuantity: '4' },
  { id: 'z6s_valve_asherman', zone: 'Armoire / zone #6 (Suite - Tablette Inférieure)', material: 'Valve Asherman (seal chest)', expectedQuantity: '1' },
  { id: 'z6s_bandage_75', zone: 'Armoire / zone #6 (Suite - Tablette Inférieure - Bac rouge 4xs)', material: 'Bandage omniforme de 7.5 cm (Kleen 3 pouces)', expectedQuantity: '6' },
  { id: 'z6s_bandage_15', zone: 'Armoire / zone #6 (Suite - Tablette Inférieure - Bac rouge 4xs)', material: 'Bandage omniforme de 15 cm (Kleen 6 pouces)', expectedQuantity: '6' },
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

// Composant principal
const MonthlyCleaningInventoryPage: React.FC<MonthlyCleaningInventoryPageProps> = ({
  goBack,
  getCurrentDateTime,
  sendInspectionToMakecom,
  onSubmissionComplete,
  numeroVehicule,
  handleVehiculeNumberChange,
}) => {
  // État basé sur la nouvelle structure
  const [inventoryItems, setInventoryItems] = useState<InventoryItemRow[]>(() =>
    INITIAL_INVENTORY_ITEMS.map(item => ({
      ...item,
      date: '',
      matricule: '',
    }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handler générique pour mettre à jour un champ d'une ligne (adapté pour éviter any)
  const handleRowChange = useCallback((index: number, field: 'date' | 'matricule', value: string) => {
    setInventoryItems(currentRows => {
      const newRows = [...currentRows];
      const rowToUpdate = { ...newRows[index] }; // Copier la ligne pour l'immutabilité
      rowToUpdate[field] = value;
      newRows[index] = rowToUpdate;
      return newRows;
    });
  }, []);

  // Génération HTML mise à jour
  const generateCleaningInventoryHTML = (): string => {
    let html = `
      <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Inventaire Médical Transit</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 15px; color: #333; font-size: 10px; }
        h1 { color: #b22a2e; text-align: center; margin-bottom: 15px; }
        .info { margin-bottom: 15px; }
        .info p { margin: 4px 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; page-break-inside: auto; }
        tr { page-break-inside: avoid; page-break-after: auto; }
        th, td { border: 1px solid #ddd; padding: 4px; vertical-align: top; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .zone-header { background-color: #e9ecef; font-weight: bold; font-size: 11px; padding: 6px; }
        .material-col { min-width: 250px; }
        .qty-col { width: 80px; text-align: center; }
        .date-col, .matricule-col { width: 100px; }
        footer { text-align: center; margin-top: 15px; font-size: 10px; color: #666; }
      </style></head><body>
      <h1>Inventaire Médical Transit</h1>
      <div class="info">
        <p><strong>Véhicule #:</strong> ${numeroVehicule || 'Non spécifié'}</p>
        <p><strong>Rapport soumis le:</strong> ${getCurrentDateTime()}</p>
      </div>
      <table><thead><tr>
        <th class="material-col">Matériel</th>
        <th class="qty-col">Qté Attendue</th>
        <th class="date-col">Date Vérifié</th>
        <th class="matricule-col">Matricule Vérif.</th>
      </tr></thead><tbody>
    `;

    let currentZone = '';
    inventoryItems.forEach(item => {
      if (item.zone !== currentZone) {
        currentZone = item.zone;
        html += `<tr><td colspan="4" class="zone-header">${currentZone}</td></tr>`;
      }
      html += '<tr>';
      html += `<td class="material-col">${item.material}</td>`;
      html += `<td class="qty-col">${item.expectedQuantity}</td>`;
      html += `<td class="date-col">${item.date || '-'}</td>`;
      html += `<td class="matricule-col">${item.matricule || '-'}</td>`;
      html += '</tr>';
    });

    html += `</tbody></table><footer>Rapport généré le ${getCurrentDateTime()}</footer></body></html>`;
    return html;
  };

  // Soumission mise à jour
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!numeroVehicule) {
      setError("Le numéro de véhicule est obligatoire.");
      return;
    }
    const isValid = inventoryItems.some(item => item.date && item.matricule);
    if (!isValid) {
       setError("Veuillez remplir la date et le matricule pour au moins un item de l'inventaire.");
       return;
     }

    setIsSubmitting(true);
    try {
      const htmlContent = generateCleaningInventoryHTML();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `inventaire_medical_${numeroVehicule}_${timestamp}.html`;

      const webhookData = {
        type: 'InventaireMedical', // <- Nouveau type pour Make.com?
        numeroVehicule,
        dateTime: getCurrentDateTime(),
        inventoryData: inventoryItems,
        htmlContent,
        fileName,
        mimeType: "text/html"
      };

      console.log("Envoi des données:", webhookData);
      // *** IMPORTANT: Assurez-vous que Make.com est configuré pour recevoir 'InventaireMedical' ***
      // ou remettez 'NettoyageInventaire' si le webhook est le même
      const success = await sendInspectionToMakecom('InventaireMedical', webhookData);

      if (success) {
        onSubmissionComplete("L'inventaire médical a été envoyé avec succès.");
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

  // Rendu JSX mis à jour
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <header className="bg-[#b22a2e] text-white p-4 rounded-lg shadow-md mb-8 flex items-center justify-between">
        <div className="flex items-center">
          <img src="https://res.cloudinary.com/dxyvj8rka/image/upload/f_auto,q_auto/v1/cambi/iazjhbzvu6dv5fad398u" alt="Logo CAMBI" className="h-8 mr-3 filter brightness-0 invert" />
          <h1 className="text-xl font-bold">INVENTAIRE MÉDICAL TRANSIT</h1> {/* Titre mis à jour */}
        </div>
        <button onClick={goBack} className="flex items-center text-white hover:text-gray-200 ml-4">
          <ChevronLeft size={24} className="mr-1" />
          Retour
        </button>
      </header>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex justify-between items-center" role="alert">
            <div>
              <strong className="font-bold"><AlertCircle size={18} className="inline mr-2" /> Erreur: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
               <X size={20} />
            </button>
          </div>
        )}

        <div className="mb-4">
           <label htmlFor="numeroVehicule" className="block text-sm font-medium text-gray-700">Numéro de Véhicule</label>
           <input
             type="text"
             id="numeroVehicule"
             value={numeroVehicule}
             onChange={(e) => handleVehiculeNumberChange(e.target.value)}
             placeholder="Ex: 9123"
             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
             required
           />
         </div>

        <h2 className="text-lg font-semibold border-t pt-4">Inventaire</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Matériel</th>
                <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Qté Attendue</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Date Vérifié</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matricule Vérif.</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventoryItems.map((item, index) => {
                const showZoneHeader = index === 0 || inventoryItems[index - 1].zone !== item.zone;
                return (
                  <React.Fragment key={item.id}>
                    {showZoneHeader && (
                      <tr>
                        <td colSpan={4} className="bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700 border-b border-gray-300">
                          {item.zone}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td className="px-3 py-2 whitespace-normal text-sm font-medium text-gray-900 border-r">
                        {item.material}
                      </td>
                      <td className="px-3 py-2 text-center text-sm text-gray-700 border-r">
                        {item.expectedQuantity}
                      </td>
                      <td className="px-3 py-2 border-r">
                        <input
                          type="date"
                          value={item.date}
                          onChange={(e) => handleRowChange(index, 'date', e.target.value)}
                          className="block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.matricule}
                          onChange={(e) => handleRowChange(index, 'matricule', e.target.value)}
                          placeholder="A-1234"
                          className="block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="sticky bottom-0 bg-white p-4 border-t mt-4 -mx-6 -mb-6 rounded-b-lg"> 
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className={`w-full ${isSubmitting ? 'bg-[#b22a2e]/70 cursor-not-allowed' : 'bg-[#b22a2e] hover:bg-[#b22a2e]/90'} text-white py-3 px-6 rounded-lg transition-colors flex items-center justify-center text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b22a2e]`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send size={20} className="mr-2" />
                  Soumettre
                </>
              )}
            </button>
          </div>
      </form>
    </div>
  );
};

export default MonthlyCleaningInventoryPage; 