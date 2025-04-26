import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, RotateCcw } from 'lucide-react';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement | null>(null);

  // Liste des numéros de MDSA préenregistrés
  const presetMdsaNumbers = [
    'AR18J035601',
    'AR18J035318',
    'AR18J035139'
  ];

  // Initialiser le scanner au montage
  useEffect(() => {
    // Cleanup fonction pour assurer la libération des ressources
    const cleanup = () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop()
          .catch(err => console.error("Erreur lors de l'arrêt du scanner:", err))
          .finally(() => {
            console.log("Scanner arrêté et nettoyé");
          });
      }
    };

    // S'assurer que l'élément DOM existe
    if (!scannerContainerRef.current) {
      console.error("Container de scanner introuvable");
      return cleanup;
    }

    const scannerId = "html5-qrcode-scanner";
    let scannerElement = document.getElementById(scannerId);

    // Supprimer l'ancien scanner s'il existe
    if (scannerElement) {
      console.log("Suppression de l'ancien scanner");
      scannerElement.remove();
    }

    // Créer un nouvel élément scanner
    scannerElement = document.createElement('div');
    scannerElement.id = scannerId;
    scannerContainerRef.current.appendChild(scannerElement);

    try {
      // Créer une nouvelle instance du scanner
      console.log("Création d'une nouvelle instance de Html5Qrcode");
      scannerRef.current = new Html5Qrcode(scannerId);
      
      // Démarrer le scanner avec un délai
      setTimeout(() => {
        startScanner();
      }, 700);
    } catch (err) {
      console.error("Erreur lors de l'initialisation du scanner:", err);
      setError(`Erreur d'initialisation: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Nettoyer lors du démontage
    return cleanup;
  }, []);

  const startScanner = async () => {
    if (!scannerRef.current) {
      console.error("Scanner non initialisé");
      setError("Scanner non initialisé. Veuillez recharger la page.");
      return;
    }

    // Arrêter le scan précédent si nécessaire
    if (scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        console.log("Scanner arrêté avant redémarrage");
      } catch (err) {
        console.error("Erreur lors de l'arrêt du scanner:", err);
      }
    }

    try {
      setError(null);
      setLastResult(null);
      console.log("Démarrage du scanner...");

      // Configuration simple compatible avec tous les appareils
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.CODABAR
        ]
      };

      // Callback en cas de succès
      const successCallback = (decodedText: string) => {
        console.log("Code détecté:", decodedText);
        setLastResult(decodedText.trim());
      };

      // Utiliser environment pour la caméra arrière (compatible avec la plupart des appareils)
      await scannerRef.current.start(
        { facingMode: "environment" },
        config,
        successCallback,
        (errorMessage) => {
          // Ignorer les erreurs transitoires
          if (errorMessage.includes("No MultiFormat Readers") ||
              errorMessage.includes("Frame") ||
              errorMessage.includes("ongoing scan")) {
            return;
          }
          console.log("Erreur de scan (non bloquante):", errorMessage);
        }
      );

      console.log("Scanner démarré avec succès");
      setScanning(true);

      // Ajouter le cadre de scan après un court délai
      setTimeout(() => {
        addScanOverlay();
      }, 1000);
    } catch (err) {
      console.error("Erreur lors du démarrage du scanner:", err);
      setError(`Erreur d'accès à la caméra: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const stopScanner = () => {
    if (!scannerRef.current) return;

    if (scannerRef.current.isScanning) {
      scannerRef.current.stop()
        .catch(err => console.error("Erreur lors de l'arrêt du scanner:", err))
        .finally(() => {
          setScanning(false);
        });
    }

    // Supprimer l'overlay
    const overlay = document.querySelector('.scanner-overlay');
    if (overlay) overlay.remove();
  };

  const addScanOverlay = () => {
    try {
      const scannerElement = document.getElementById('html5-qrcode-scanner');
      if (!scannerElement) return;

      // Supprimer l'ancien overlay s'il existe
      const existingOverlay = document.querySelector('.scanner-overlay');
      if (existingOverlay) existingOverlay.remove();

      // Créer un nouvel overlay
      const overlay = document.createElement('div');
      overlay.className = 'scanner-overlay';
      overlay.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        width: 250px;
        height: 250px;
        transform: translate(-50%, -50%);
        border: 2px solid #b22a2e;
        border-radius: 8px;
        box-shadow: 0 0 0 3000px rgba(0, 0, 0, 0.3);
        z-index: 10;
        pointer-events: none;
      `;

      // Ajouter du texte guide
      const guide = document.createElement('div');
      guide.textContent = 'Alignez le code QR ou code-barre ici';
      guide.style.cssText = `
        position: absolute;
        top: -30px;
        left: 50%;
        transform: translateX(-50%);
        color: white;
        font-weight: bold;
        text-shadow: 0px 0px 3px black;
        font-size: 14px;
      `;

      overlay.appendChild(guide);

      // Ajouter l'overlay au parent du scanner
      const scannerParent = scannerElement.parentElement;
      if (scannerParent) {
        scannerParent.style.position = 'relative';
        scannerParent.appendChild(overlay);
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'overlay:", error);
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

  const handleManualSubmit = () => {
    if (inputValue.trim()) {
      onScanSuccess(inputValue.trim());
    }
  };

  const handlePresetClick = (mdsaNumber: string) => {
    setInputValue(mdsaNumber);
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
              <p className="mb-4">Initialisation de la caméra...</p>
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
            ref={scannerContainerRef} 
            className="scanner-container rounded overflow-hidden" 
            style={{ minHeight: "300px", position: "relative" }}
          ></div>
          
          {/* Option de saisie manuelle */}
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Ou saisie manuelle:
              </label>
              {inputValue && (
                <button 
                  onClick={() => setInputValue('')}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Effacer
                </button>
              )}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Entrez le code manuellement"
                className="flex-1 p-2 border border-gray-300 rounded-md"
              />
              <button
                onClick={handleManualSubmit}
                className="px-4 py-2 bg-[#b22a2e] text-white rounded-md hover:bg-[#b22a2e]/90"
                disabled={!inputValue.trim()}
              >
                Utiliser
              </button>
            </div>
            
            {/* Numéros MDSA préenregistrés */}
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Numéros MDSA rapides :</p>
              <div className="flex flex-wrap gap-2">
                {presetMdsaNumbers.map((number) => (
                  <button
                    key={number}
                    onClick={() => handlePresetClick(number)}
                    className="text-xs py-1 px-2 bg-blue-100 text-blue-800 rounded border border-blue-300 hover:bg-blue-200"
                  >
                    {number}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-center text-xs text-gray-600">
              Conseils: Alignez le code-barre dans le cadre rouge, assurez-vous qu'il est bien éclairé et stable.
            </p>
          </div>
          
          <div className="mt-3 flex justify-center">
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