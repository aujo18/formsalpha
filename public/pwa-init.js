// Script d'initialisation PWA pour assurer que les icônes fonctionnent correctement sur iOS
(function() {
  // Vérifie si l'application est exécutée en tant que PWA sur iOS
  const isInStandaloneMode = () => 
    ('standalone' in window.navigator) && (window.navigator.standalone);
  
  // Affiche un message dans la console lors de l'exécution en mode standalone
  if (isInStandaloneMode()) {
    console.log('Application lancée en mode PWA standalone');
    
    // Force le rechargement des icônes si nécessaire
    if (navigator.userAgent.match(/iPhone|iPad|iPod/)) {
      const appleIconLink = document.querySelector('link[rel="apple-touch-icon"]');
      if (appleIconLink) {
        const newLink = document.createElement('link');
        newLink.rel = 'apple-touch-icon';
        newLink.href = appleIconLink.href + '?v=' + new Date().getTime();
        document.head.appendChild(newLink);
        setTimeout(() => {
          document.head.removeChild(appleIconLink);
        }, 100);
      }
    }
  }
  
  // Enregistre le service worker (si nécessaire)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        console.log('Service Worker enregistré avec succès:', registration.scope);
      }).catch(error => {
        console.log('Échec de l\'enregistrement du Service Worker:', error);
      });
    });
  }
})(); 