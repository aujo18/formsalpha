# Configuration de l'application TAP avec Make.com

Ce document explique comment configurer l'intégration entre votre application TAP et Make.com (anciennement Integromat) pour:
1. Recevoir les données des formulaires d'inspection
2. Générer des PDF des rapports d'inspection
3. Envoyer les PDF par email
4. Stocker les PDF dans le cloud (Google Drive, Dropbox, etc.)

## Étape 1: Créer un compte Make.com

Si vous n'avez pas encore de compte Make.com:
1. Visitez [make.com](https://www.make.com/)
2. Inscrivez-vous pour un compte gratuit (vous pourrez passer à un abonnement payant si nécessaire plus tard)

## Étape 2: Créer un nouveau scénario pour les inspections MRSA

### Configuration du webhook

1. Dans Make.com, cliquez sur "Créer un nouveau scénario"
2. Commencez par ajouter un module "Webhook" (cliquez sur le bouton + et recherchez "Webhook")
3. Sélectionnez "Webhook personnalisé"
4. Configurez le webhook comme suit:
   - Méthode: POST
   - Type de données: JSON
   - Traiter toutes les données: Oui
5. Cliquez sur "Enregistrer" puis sur "Copier l'adresse" pour obtenir l'URL du webhook
6. Dans votre application TAP, remplacez la valeur de `WEBHOOK_URL_MRSA` dans le fichier `App.tsx` par cette URL

### Traitement des données pour le PDF

1. Ajoutez un module "Outils" > "Définir une variable" après le webhook
2. Configurez-le pour traiter et formater les données reçues:
   - Paramétrez les variables pour extraire et organiser les données du formulaire

### Génération du PDF

1. Ajoutez un module "PDF" > "Créer un PDF à partir d'un modèle"
2. Téléchargez un modèle PDF (ou créez-en un dans Word et enregistrez-le en PDF)
3. Utilisez des balises de modèle pour insérer les données dans le PDF
4. Mappez les données reçues aux balises de votre modèle
5. Configurez les options de génération du PDF

### Envoi du PDF par email

1. Ajoutez un module "Email" > "Envoyer un email"
2. Configurez l'email:
   - À: Adresse email du destinataire (peut être dynamique ou fixe)
   - Objet: Par exemple "Rapport d'inspection MRSA - {numeroMoniteur}"
   - Corps: Un message personnalisé incluant la date et l'heure de l'inspection
   - Pièce jointe: Utilisez le PDF généré à l'étape précédente

### Stockage du PDF dans le cloud

1. Ajoutez un module pour le service de stockage souhaité (Google Drive, Dropbox, OneDrive, etc.)
2. Par exemple, pour Google Drive: "Google Drive" > "Téléverser un fichier"
3. Configurez:
   - Dossier: ID du dossier où stocker les fichiers (peut être organisé par année/mois)
   - Nom du fichier: Par exemple "Inspection_MRSA_{numeroMoniteur}_{dateHeure}.pdf"
   - Contenu du fichier: Utilisez le PDF généré

## Étape 3: Créer un nouveau scénario pour les inspections Véhicule

Répétez les étapes ci-dessus en créant un second scénario pour les inspections de véhicule:

1. Créez un nouveau webhook et utilisez son URL pour la variable `WEBHOOK_URL_VEHICULE` dans l'application
2. Adaptez le traitement des données aux spécificités du formulaire de véhicule (incluant les valeurs PSI et glycémie)
3. Créez un modèle PDF adapté à l'inspection véhicule
4. Configurez l'envoi par email et le stockage cloud

## Exemple de template PDF pour Make.com

Pour créer un modèle PDF efficace:

1. Créez un document dans Word avec des tableaux et sections qui reflètent la structure de vos formulaires
2. Insérez des balises de modèle entre doubles accolades comme `{{numeroMoniteur}}`, `{{matricule}}`, etc.
3. Pour les éléments cochés, utilisez une condition comme `{{#if items.cable1.checked}}☑{{else}}☐{{/if}}`
4. Enregistrez le document au format PDF
5. Téléchargez ce PDF dans Make.com comme modèle

## Test et déploiement

1. Activez vos scénarios dans Make.com
2. Effectuez un test en soumettant un formulaire depuis l'application
3. Vérifiez que le PDF est correctement généré, envoyé par email et stocké
4. Surveillez les erreurs et ajustez si nécessaire

## Dépannage

Si vous rencontrez des problèmes:
- Vérifiez les journaux d'exécution dans Make.com
- Assurez-vous que les URLs des webhooks sont correctement configurées dans l'application
- Vérifiez que le format des données envoyées correspond à ce qui est attendu dans Make.com
- Testez les modules individuellement en utilisant l'option "Exécuter ce module uniquement"

## Ressources utiles

- [Documentation de Make.com](https://www.make.com/en/help)
- [Tutoriels vidéo sur Make.com](https://www.youtube.com/c/Makepresence)
- [Modèles de scénarios Make.com](https://www.make.com/en/templates)