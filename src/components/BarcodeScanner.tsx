import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, RotateCcw } from 'lucide-react';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const cameraRef = useRef<HTMLDivElement | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Effet d'initialisation 
  useEffect(() => {
    // Initialiser seulement une fois au montage
    const initScanner = async () => {
      try {
        // Assurons-nous d'avoir un élément DOM
        if (!cameraRef.current) {
          console.error("Container de caméra non trouvé");
          return;
        }

        // ID unique pour le scanner
        const scannerId = "html5-qrcode-scanner";
        
        // Nettoyer l'ancien scanner s'il existe
        const oldScanner = document.getElementById(scannerId);
        if (oldScanner) {
          oldScanner.remove();
        }
        
        // Créer un nouvel élément pour le scanner
        const newScannerElement = document.createElement('div');
        newScannerElement.id = scannerId;
        cameraRef.current.appendChild(newScannerElement);
        
        // Initialiser le scanner
        scannerRef.current = new Html5Qrcode(scannerId);
        console.log("Scanner initialisé avec succès");
        
        // Démarrer directement le scanner avec la caméra arrière
        await startScanner();
      } catch (err) {
        console.error("Erreur d'initialisation:", err);
        setError("Impossible d'initialiser le scanner: " + (err instanceof Error ? err.message : String(err)));
      }
    };

    initScanner();
    
    // Nettoyage à la fermeture
    return () => {
      stopScanner();
      if (scannerRef.current) {
        scannerRef.current = null;
      }
    };
  }, []);
  
  const startScanner = async () => {
    if (!scannerRef.current) {
      setError("Scanner non initialisé");
      return;
    }
    
    // Arrêter le scanner s'il est déjà en cours
    if (scannerRef.current.isScanning) {
      await scannerRef.current.stop().catch(e => console.log("Erreur en arrêtant le scanner:", e));
    }
    
    try {
      setError(null);
      setLastResult(null);
      
      // Configuration ultra-simple
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 100 },
      };
      
      // Callback en cas de succès
      const successCallback = (decodedText: string) => {
        console.log("Code-barres détecté:", decodedText);
        setLastResult(decodedText.trim());
      };
      
      // Callback d'erreur non bloquante
      const errorCallback = (err: string) => {
        // Ignorer les erreurs transitoires
        if (err.includes("No MultiFormat Readers") || 
            err.includes("ongoing scan") ||
            err.includes("Frame")) {
          return;
        }
        console.log("Erreur de scan (non bloquante):", err);
      };
      
      console.log("Démarrage du scanner avec la caméra par défaut");
      
      // Utiliser { facingMode: "environment" } pour forcer la caméra arrière
      await scannerRef.current.start(
        { facingMode: "environment" }, 
        config, 
        successCallback, 
        errorCallback
      );
      
      console.log("Scanner démarré avec succès");
      setScanning(true);
      
      // Ajouter l'overlay après le démarrage
      setTimeout(() => {
        addScanFrame();
      }, 1000);
      
    } catch (err) {
      console.error("Erreur d'accès à la caméra:", err);
      setError("Erreur d'accès à la caméra. Vérifiez les permissions de votre navigateur et assurez-vous qu'aucune autre application n'utilise la caméra.");
    }
  };
  
  const stopScanner = () => {
    if (!scannerRef.current) return;
    
    if (scannerRef.current.isScanning) {
      scannerRef.current.stop()
        .catch(err => console.log("Erreur en arrêtant le scanner:", err))
        .finally(() => {
          setScanning(false);
        });
    }
    
    // Supprimer le cadre
    const overlay = document.querySelector('.scanner-frame');
    if (overlay) overlay.remove();
  };
  
  const addScanFrame = () => {
    try {
      const scannerElement = document.getElementById('html5-qrcode-scanner');
      if (!scannerElement) return;
      
      // Supprimer l'ancien cadre s'il existe
      const oldFrame = document.querySelector('.scanner-frame');
      if (oldFrame) oldFrame.remove();
      
      // Créer le cadre
      const frame = document.createElement('div');
      frame.className = 'scanner-frame';
      frame.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        width: 250px;
        height: 100px;
        transform: translate(-50%, -50%);
        border: 2px solid #b22a2e;
        border-radius: 10px;
        box-shadow: 0 0 0 3000px rgba(0, 0, 0, 0.3);
        z-index: 10;
        pointer-events: none;
      `;
      
      // Indication textuelle
      const label = document.createElement('div');
      label.textContent = 'Alignez le code-barre ici';
      label.style.cssText = `
        position: absolute;
        top: -30px;
        left: 50%;
        transform: translateX(-50%);
        color: white;
        font-weight: bold;
        text-shadow: 0px 0px 3px black;
        font-size: 14px;
      `;
      
      frame.appendChild(label);
      
      const scannerParent = scannerElement.parentElement;
      if (scannerParent) {
        scannerParent.style.position = 'relative';
        scannerParent.appendChild(frame);
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout du cadre:", error);
    }
  };
  
  const resetScanner = () => {
    setLastResult(null);
    startScanner();
  };
  
  const confirmResult = () => {
    if (lastResult) {
      stopScanner();
      onScanSuccess(lastResult);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md overflow-hidden">
        <div className="p-4 bg-[#b22a2e] text-white flex justify-between items-center">
          <div className="flex items-center">
            <Camera className="mr-2" size={20} />
            <h3 className="font-medium">Scanner de code-barres</h3>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          {error ? (
            <div className="text-red-500 mb-4 text-center">
              <p className="mb-2">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 bg-gray-600 text-white rounded-md block w-full"
              >
                Recharger la page
              </button>
              <button 
                onClick={startScanner}
                className="mt-2 px-4 py-2 bg-[#b22a2e] text-white rounded-md block w-full"
              >
                Réessayer
              </button>
            </div>
          ) : !scanning ? (
            <div className="text-center py-4">
              <p className="mb-4">Chargement de la caméra...</p>
              <div className="w-8 h-8 border-4 border-[#b22a2e] border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : (
            <>
              {lastResult && (
                <div className="bg-green-50 border border-green-200 p-2 rounded-md mb-4">
                  <p className="text-green-700 text-sm font-medium">Code détecté:</p>
                  <p className="text-gray-700 font-mono break-all">{lastResult}</p>
                  <div className="flex space-x-2 mt-2">
                    <button 
                      onClick={confirmResult}
                      className="bg-green-600 text-white text-sm py-1 px-3 rounded-md hover:bg-green-700 flex-1"
                    >
                      Utiliser ce code
                    </button>
                    <button
                      onClick={resetScanner}
                      className="bg-gray-200 text-gray-700 text-sm py-1 px-3 rounded-md hover:bg-gray-300"
                    >
                      Scanner à nouveau
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          
          <div 
            ref={cameraRef} 
            className="scanner-container rounded overflow-hidden"
            style={{ minHeight: "300px", position: "relative" }}
          ></div>
          
          <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-center text-xs text-gray-600">
              Conseils: Alignez le code-barre dans le cadre rouge, assurez-vous qu'il est bien éclairé et stable.
            </p>
          </div>
          
          <div className="mt-2 flex justify-center">
            <button
              onClick={resetScanner}
              className="flex items-center text-sm px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              <RotateCcw size={14} className="mr-1" /> Réinitialiser le scanner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner; 