# Guide détaillé d'intégration Make.com pour l'application TAP

Ce guide vous explique en détail comment configurer Make.com (anciennement Integromat) pour recevoir les données des formulaires d'inspection TAP, générer des PDF, envoyer des emails et stocker les rapports.

## Table des matières

1. [Création d'un compte Make.com](#1-création-dun-compte-makecom)
2. [Configuration du scénario pour l'inspection MRSA](#2-configuration-du-scénario-pour-linspection-mrsa)
3. [Configuration du scénario pour l'inspection Véhicule](#3-configuration-du-scénario-pour-linspection-véhicule)
4. [Configuration des modèles PDF](#4-configuration-des-modèles-pdf)
5. [Configuration de l'envoi d'emails](#5-configuration-de-lenvoi-demails)
6. [Configuration du stockage cloud](#6-configuration-du-stockage-cloud)
7. [Dépannage et conseils](#7-dépannage-et-conseils)

## 1. Création d'un compte Make.com

1. Rendez-vous sur [make.com](https://www.make.com/) et cliquez sur "S'inscrire gratuitement"
2. Créez un compte avec votre adresse email professionnelle
3. Confirmez votre email et connectez-vous à votre compte
4. Sur le tableau de bord, cliquez sur "Créer un nouveau scénario"

## 2. Configuration du scénario pour l'inspection MRSA

### Étape 2.1: Configuration du webhook

1. Dans Make.com, cliquez sur "Créer un nouveau scénario"
2. Donnez un nom explicite à votre scénario, par exemple "Traitement des inspections MRSA"
3. Dans la zone de conception, cliquez sur le bouton "+" pour ajouter un module
4. Recherchez "Webhook" et sélectionnez "Webhook personnalisé"
5. Configurez le webhook comme suit:
   - **Type**: Webhook personnalisé
   - **Méthode**: POST
   - **Type de données**: JSON
   - **URL**: Laissez ce champ vide, il sera généré automatiquement
   - **Traiter toutes les données**: Cochez cette option

6. Cliquez sur "Enregistrer"
7. Cliquez sur "Copier l'adresse" pour obtenir l'URL du webhook

   > ⚠️ **Important**: Cette URL est celle que vous avez déjà intégrée dans le code source de l'application:
   > `https://hook.us1.make.com/6npqjkskt1d71ir3aypy7h6434s98b8u`

8. Pour tester le webhook, cliquez sur le bouton "Exécuter une fois" en bas à droite
9. Soumettez un formulaire d'inspection MRSA depuis l'application pour voir les données reçues
10. Une fois les données reçues, copiez un exemple du format JSON pour référence future

### Étape 2.2: Traitement des données MRSA

1. Après le module Webhook, cliquez sur le bouton "+" pour ajouter un nouveau module
2. Choisissez "Outils" > "JSON" > "Analyser un JSON"
3. Dans le champ "Chaîne JSON", insérez `{{1.data}}` pour utiliser les données du webhook
4. Cliquez sur "OK" pour créer le module

### Étape 2.3: Préparation des données pour le PDF

1. Ajoutez un module "Outils" > "Définir plusieurs variables"
2. Configurez les variables suivantes:
   - `matricule`: `{{2.matricule}}`
   - `numeroMoniteur`: `{{2.numeroMoniteur}}`
   - `dateHeure`: `{{2.dateHeureFormat}}`
   - `itemsVerifies`: Utilisez une formule pour formater les éléments vérifiés

3. Pour la formule de formatage des items vérifiés, vous pouvez utiliser:
   ```
   map(filter(2.items, "item.checked == true"), "item.label")
   ```

4. Cliquez sur "OK" pour créer le module

### Étape 2.4: Génération du PDF MRSA

1. Ajoutez un module "PDF" > "Créer un PDF à partir d'un modèle HTML"
2. Téléchargez d'abord un modèle HTML:
   a. Créez un document HTML avec la mise en page souhaitée pour le rapport
   b. Utilisez des balises comme `{{numeroMoniteur}}`, `{{matricule}}`, `{{dateHeure}}` pour les données dynamiques
   c. Pour les items vérifiés, utilisez une boucle:
      ```html
      {{#each itemsVerifies}}
        <tr>
          <td>{{this}}</td>
          <td>✓</td>
        </tr>
      {{/each}}
      ```

3. Téléchargez ce modèle HTML dans Make.com
4. Configurez les options du PDF:
   - **Format du papier**: A4
   - **Orientation**: Portrait
   - **Marges**: 15mm
   - **Nom du fichier PDF**: `Inspection_MRSA_{{numeroMoniteur}}_{{formatDate(now; "YYYY-MM-DD")}}.pdf`

5. Cliquez sur "OK" pour créer le module

### Étape 2.5: Envoi du PDF MRSA par email

1. Ajoutez un module "Email" > "Envoyer un email"
2. Configurez l'email:
   - **De**: Votre adresse email professionnelle ou une adresse dédiée
   - **À**: L'adresse email du destinataire (peut être fixe ou dynamique)
   - **Objet**: `Rapport d'inspection MRSA - Moniteur #{{numeroMoniteur}} - {{formatDate(now; "DD/MM/YYYY")}}`
   - **Contenu**: Créez un message personnalisé, par exemple:
     ```
     Bonjour,

     Veuillez trouver ci-joint le rapport d'inspection MRSA pour le moniteur #{{numeroMoniteur}} effectuée le {{dateHeure}}.

     Cordialement,
     L'équipe TAP
     ```
   - **Pièces jointes**: Sélectionnez le PDF généré à l'étape précédente

3. Cliquez sur "OK" pour créer le module

### Étape 2.6: Stockage du PDF MRSA dans le cloud

1. Ajoutez un module pour le service de stockage cloud de votre choix:
   - **Google Drive**: "Google Drive" > "Créer un fichier"
   - **Dropbox**: "Dropbox" > "Téléverser un fichier"
   - **OneDrive**: "Microsoft OneDrive" > "Créer un fichier"

2. Configurez le stockage:
   - **Dossier**: ID ou chemin du dossier où stocker les rapports
   - **Nom du fichier**: `Inspection_MRSA_{{numeroMoniteur}}_{{formatDate(now; "YYYY-MM-DD")}}.pdf`
   - **Contenu du fichier**: Sélectionnez le PDF généré précédemment

3. Cliquez sur "OK" pour créer le module

### Étape 2.7: Activer le scénario MRSA

1. Cliquez sur "Activer le scénario" en bas à gauche
2. Choisissez la fréquence d'exécution (recommandé: "Immédiatement")
3. Votre scénario est maintenant actif!

## 3. Configuration du scénario pour l'inspection Véhicule

Suivez les mêmes étapes que pour l'inspection MRSA, avec les ajustements suivants:

### Étape 3.1: Configuration du webhook Véhicule

1. Créez un nouveau scénario nommé "Traitement des inspections Véhicule"
2. Configurez le webhook comme dans la section 2.1
3. L'URL du webhook est celle déjà intégrée dans l'application:
   `https://hook.us1.make.com/5unm52j98tg1nr5tz9esxk3jd2msj367`

### Étape 3.2: Traitement des données spécifiques au véhicule

1. Configurez le traitement JSON comme dans la section 2.2
2. Dans le module "Définir plusieurs variables", ajoutez les variables spécifiques:
   - `numeroVehicule`: `{{2.numeroVehicule}}`
   - `cylindre1PSI`: `{{2.cylindre1PSI}}`
   - `cylindre2PSI`: `{{2.cylindre2PSI}}`
   - `glycemieNormal`: `{{2.glycemie.normal}}`
   - `glycemieHigh`: `{{2.glycemie.high}}`
   - `glycemieLow`: `{{2.glycemie.low}}`

### Étape 3.3: Génération du PDF Véhicule

Créez un modèle HTML spécifique pour l'inspection véhicule incluant:
- Tableau des items vérifiés
- Section pour les niveaux PSI des cylindres
- Section pour les valeurs de glycémie

### Étape 3.4: Envoi et stockage du PDF Véhicule

Suivez les étapes 2.5 et 2.6 en adaptant les noms de fichiers:
- `Inspection_Vehicule_{{numeroVehicule}}_{{formatDate(now; "YYYY-MM-DD")}}.pdf`

## 4. Configuration des modèles PDF

### Création d'un modèle HTML pour MRSA

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Rapport d'inspection MRSA</title>
  <style>
    body { font-family: Arial, sans-serif; }
    h1 { color: #2563eb; text-align: center; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background-color: #dbeafe; padding: 8px; text-align: left; border: 1px solid #93c5fd; }
    td { padding: 8px; border: 1px solid #93c5fd; }
    .info { margin-bottom: 20px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .logo { text-align: center; font-size: 24px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Application TAP</div>
    <div>Date: {{dateHeure}}</div>
  </div>
  
  <h1>Rapport d'inspection MRSA</h1>
  
  <div class="info">
    <p><strong>Numéro du moniteur:</strong> {{numeroMoniteur}}</p>
    <p><strong>Matricule du TAP:</strong> {{matricule}}</p>
  </div>
  
  <h2>Éléments vérifiés</h2>
  <table>
    <tr>
      <th>Élément</th>
      <th>Statut</th>
    </tr>
    {{#each itemsVerifies}}
    <tr>
      <td>{{this}}</td>
      <td>✓</td>
    </tr>
    {{/each}}
  </table>
  
  {{#if electrode1Exp}}
  <h2>Dates d'expiration</h2>
  <table>
    <tr>
      <th>Électrode</th>
      <th>Date d'expiration</th>
    </tr>
    <tr>
      <td>Électrodes adulte</td>
      <td>{{electrode1Exp}}</td>
    </tr>
    <tr>
      <td>Électrodes Uni-Padz</td>
      <td>{{electrode2Exp}}</td>
    </tr>
  </table>
  {{/if}}
  
  <footer>
    <p>Document généré automatiquement par l'Application TAP</p>
  </footer>
</body>
</html>
```

### Création d'un modèle HTML pour Véhicule

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Rapport d'inspection Véhicule</title>
  <style>
    body { font-family: Arial, sans-serif; }
    h1 { color: #059669; text-align: center; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background-color: #d1fae5; padding: 8px; text-align: left; border: 1px solid #6ee7b7; }
    td { padding: 8px; border: 1px solid #6ee7b7; }
    .info { margin-bottom: 20px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .logo { text-align: center; font-size: 24px; font-weight: bold; }
    .section { margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Application TAP</div>
    <div>Date: {{dateHeure}}</div>
  </div>
  
  <h1>Rapport d'inspection Véhicule</h1>
  
  <div class="info">
    <p><strong>Numéro du véhicule:</strong> {{numeroVehicule}}</p>
    <p><strong>Matricule du TAP:</strong> {{matricule}}</p>
  </div>
  
  <div class="section">
    <h2>Niveaux PSI des cylindres</h2>
    <table>
      <tr>
        <th>Cylindre</th>
        <th>Niveau PSI</th>
      </tr>
      <tr>
        <td>Cylindre 1</td>
        <td>{{cylindre1PSI}}</td>
      </tr>
      <tr>
        <td>Cylindre 2</td>
        <td>{{cylindre2PSI}}</td>
      </tr>
    </table>
  </div>
  
  <div class="section">
    <h2>Valeurs de glycémie</h2>
    <table>
      <tr>
        <th>Type</th>
        <th>Valeur (mmol/L)</th>
        <th>Plage normale</th>
      </tr>
      <tr>
        <td>Normal</td>
        <td>{{glycemieNormal}}</td>
        <td>6,7 à 8,4 mmol/L</td>
      </tr>
      <tr>
        <td>High</td>
        <td>{{glycemieHigh}}</td>
        <td>19,4 à 24,3 mmol/L</td>
      </tr>
      <tr>
        <td>Low</td>
        <td>{{glycemieLow}}</td>
        <td>2,2 à 2,8 mmol/L</td>
      </tr>
    </table>
  </div>
  
  <h2>Éléments vérifiés</h2>
  <table>
    <tr>
      <th>Élément</th>
      <th>Statut</th>
    </tr>
    {{#each itemsVerifies}}
    <tr>
      <td>{{this}}</td>
      <td>✓</td>
    </tr>
    {{/each}}
  </table>
  
  <footer>
    <p>Document généré automatiquement par l'Application TAP</p>
  </footer>
</body>
</html>
```

## 5. Configuration de l'envoi d'emails

### Configuration d'un service SMTP dans Make.com

1. Dans Make.com, allez dans "Paramètres" > "Email"
2. Cliquez sur "Ajouter une connexion"
3. Choisissez votre fournisseur de messagerie (Gmail, Office 365, ou autre)
4. Entrez les informations SMTP:
   - **Serveur SMTP**: (ex: smtp.gmail.com)
   - **Port**: (ex: 587)
   - **Nom d'utilisateur**: Votre adresse email
   - **Mot de passe**: Votre mot de passe ou clé d'application
   - **Protocole de sécurité**: TLS

5. Cliquez sur "Tester la connexion" puis "Enregistrer"

### Création d'un modèle d'email personnalisé

Pour un email plus élaboré, vous pouvez créer un modèle HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f3f4f6; padding: 15px; text-align: center; }
    .content { padding: 20px; }
    .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; }
    .button { display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; 
              text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Rapport d'inspection TAP</h2>
    </div>
    <div class="content">
      <p>Bonjour,</p>
      <p>Veuillez trouver ci-joint le rapport d'inspection {{type}} effectuée le {{dateHeure}}.</p>
      <p>Numéro: {{numero}}</p>
      <p>Matricule du TAP: {{matricule}}</p>
      <p>Ce rapport a été généré automatiquement via l'Application TAP.</p>
    </div>
    <div class="footer">
      <p>© 2025 Application TAP - Tous droits réservés</p>
    </div>
  </div>
</body>
</html>
```

## 6. Configuration du stockage cloud

### Google Drive

1. Dans Make.com, ajoutez une connexion Google Drive
2. Autorisez Make.com à accéder à votre compte Google
3. Créez un dossier dans Google Drive pour stocker les rapports
4. Dans votre scénario, configurez le module Google Drive:
   - **Dossier**: Sélectionnez le dossier créé précédemment
   - **Structure de dossiers**: Vous pouvez organiser par année/mois: `Inspections/{{formatDate(now; "YYYY")}}/{{formatDate(now; "MM")}}/`
   - **Nom du fichier**: `Inspection_TYPE_NUMERO_{{formatDate(now; "YYYY-MM-DD")}}.pdf` (où TYPE est MRSA ou Vehicule)

### Dropbox

1. Dans Make.com, ajoutez une connexion Dropbox
2. Autorisez Make.com à accéder à votre compte Dropbox
3. Dans votre scénario, configurez le module Dropbox:
   - **Chemin**: `/Inspections/{{formatDate(now; "YYYY")}}/{{formatDate(now; "MM")}}/`
   - **Nom du fichier**: Comme pour Google Drive

### Microsoft OneDrive

1. Dans Make.com, ajoutez une connexion OneDrive
2. Autorisez Make.com à accéder à votre compte Microsoft
3. Dans votre scénario, configurez le module OneDrive:
   - **Dossier**: Sélectionnez le dossier approprié
   - **Nom du fichier**: Comme pour les autres services

## 7. Dépannage et conseils

### Déboguer les scénarios

1. Utilisez la fonction "Exécuter une fois" pour tester un scénario
2. Vérifiez les données entre chaque module en cliquant sur la bulle entre les modules
3. Activez les journaux de débogage dans "Paramètres du scénario" > "Avancé"

### Optimiser les scénarios

1. Utilisez des filtres pour éviter le traitement inutile:
   - Ajoutez un filtre après le webhook pour vérifier si toutes les données requises sont présentes
   - Exemple: `{{2.matricule}} != "" && {{2.numeroMoniteur}} != ""`

2. Gérez les erreurs avec des routes alternatives:
   - Ajoutez un "Routeur" après le webhook
   - Créez une route pour le traitement normal et une route pour les erreurs
   - Dans la route d'erreur, envoyez une notification d'erreur

### Limites et quotas

1. Vérifiez votre quota d'opérations dans Make.com:
   - Le plan gratuit offre 1 000 opérations par mois
   - Considérez passer à un plan payant si nécessaire (à partir de 9€/mois)

2. Optimisez le nombre d'opérations:
   - Regroupez plusieurs actions dans un seul module lorsque possible
   - Utilisez "Définir plusieurs variables" au lieu de plusieurs modules "Définir une variable"

### Sécurité des données

1. Ne stockez pas de données sensibles dans Make.com
2. Utilisez des connexions sécurisées (HTTPS, TLS)
3. Limitez les autorisations des connexions aux services tiers

### Surveillance des performances

1. Configurez des alertes pour les erreurs dans "Paramètres du scénario" > "Alertes"
2. Vérifiez régulièrement l'historique d'exécution des scénarios

## Ressources supplémentaires

- [Documentation officielle de Make.com](https://www.make.com/en/help)
- [Centre d'aide Make.com](https://www.make.com/en/help/help)
- [Communauté Make.com](https://community.make.com/)
- [Vidéos tutorielles Make.com](https://www.youtube.com/c/Makepresence)

---

N'hésitez pas à contacter l'équipe de support Make.com ou votre administrateur système pour toute assistance supplémentaire.