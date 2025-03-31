import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, RotateCcw } from 'lucide-react';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{id: string, label: string}[]>([]);
  const [scanMode, setScanMode] = useState<'all' | 'linear'>('linear');
  const [scanWidth, setScanWidth] = useState(350);
  const [scanHeight, setScanHeight] = useState(100);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Initialiser le scanner lors du montage du composant
    if (scannerContainerRef.current) {
      const scannerId = "html5-qrcode-scanner";
      
      // Créer l'élément de scanner s'il n'existe pas
      if (!document.getElementById(scannerId)) {
        const scannerElement = document.createElement("div");
        scannerElement.id = scannerId;
        scannerContainerRef.current.appendChild(scannerElement);
      }

      // Initialiser le scanner
      scannerRef.current = new Html5Qrcode(scannerId);
      
      // Énumérer les caméras disponibles
      Html5Qrcode.getCameras()
        .then(devices => {
          if (devices && devices.length) {
            console.log("Caméras disponibles:", devices);
            setCameras(devices);
            // Sélectionner la caméra arrière par défaut si disponible
            const backCamera = devices.find(camera => 
              camera.label.toLowerCase().includes('back') || 
              camera.label.toLowerCase().includes('arrière') ||
              camera.label.toLowerCase().includes('rear')
            );
            if (backCamera) {
              setSelectedCamera(backCamera.id);
              startScanner(backCamera.id);
            } else {
              setSelectedCamera(devices[0].id);
              startScanner(devices[0].id);
            }
          } else {
            setError("Aucune caméra détectée. Veuillez vérifier les permissions de votre navigateur.");
          }
        })
        .catch(err => {
          console.error("Erreur lors de l'énumération des caméras:", err);
          setError("Impossible d'accéder aux caméras. Veuillez vérifier vos permissions.");
        });
    }

    // Nettoyer lors du démontage
    return () => {
      stopScanner();
    };
  }, []);

  // Version simplifiée de la fonction torch
  const toggleTorch = () => {
    // Nous utilisons simplement l'indicateur visuel, mais la fonctionnalité réelle
    // dépend de la compatibilité du navigateur et de l'appareil
    setTorchEnabled(!torchEnabled);
    console.log("Tentative d'activation de la lampe torche - fonctionnalité non garantie sur tous les appareils");
  };

  const startScanner = async (cameraId?: string) => {
    if (!scannerRef.current) return;
    
    // Si un scan est déjà en cours, l'arrêter d'abord
    if (scannerRef.current.isScanning) {
      await scannerRef.current.stop().catch(err => console.error("Erreur lors de l'arrêt du scanner:", err));
    }

    try {
      setError(null);
      setLastResult(null);
      
      const qrCodeSuccessCallback = (decodedText: string) => {
        console.log("Code détecté:", decodedText);
        setLastResult(decodedText);
        
        // Nettoyer le résultat (enlever espaces et caractères spéciaux)
        const cleanedText = decodedText.trim();
        onScanSuccess(cleanedText);
        
        // On ne ferme plus automatiquement pour permettre plusieurs tentatives
        // stopScanner();
      };

      // Définir les formats en fonction du mode
      let formats = [];
      if (scanMode === 'linear') {
        formats = [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.CODABAR
        ];
      } else {
        formats = [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.CODABAR
        ];
      }

      const config = {
        fps: 10, // Réduction du fps pour plus de stabilité
        qrbox: { width: scanWidth, height: scanHeight },
        aspectRatio: scanMode === 'linear' ? 2.5 : 1.0,
        disableFlip: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        },
        rememberLastUsedCamera: true,
        formatsToSupport: formats,
      };

      // Si une caméra spécifique est sélectionnée, l'utiliser
      const cameraToUse = cameraId || selectedCamera || { facingMode: "environment" };
      
      await scannerRef.current.start(
        cameraToUse,
        config,
        qrCodeSuccessCallback,
        (errorMessage) => {
          // Ne pas afficher les erreurs transitoires
          if (errorMessage.includes("No MultiFormat Readers")) {
            return;
          }
          console.log("Erreur de scan (non bloquante):", errorMessage);
        }
      );
      
      setPermissionGranted(true);
    } catch (err) {
      console.error("Scanner error:", err);
      setError("Impossible d'accéder à la caméra. Veuillez vérifier vos permissions.");
    }
  };

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop()
        .catch(err => console.error("Error stopping scanner:", err));
    }
  };

  const handleCameraChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newCameraId = event.target.value;
    setSelectedCamera(newCameraId);
    startScanner(newCameraId);
  };

  const handleModeChange = (mode: 'all' | 'linear') => {
    setScanMode(mode);
    // Réinitialiser les dimensions en fonction du mode
    if (mode === 'linear') {
      setScanWidth(350);
      setScanHeight(100);
    } else {
      setScanWidth(250);
      setScanHeight(250);
    }
    // Redémarrer le scanner avec le nouveau mode
    startScanner(selectedCamera || undefined);
  };

  const resetScanner = () => {
    stopScanner();
    setLastResult(null);
    setTimeout(() => {
      startScanner(selectedCamera || undefined);
    }, 100);
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const width = parseInt(e.target.value);
    setScanWidth(width);
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const height = parseInt(e.target.value);
    setScanHeight(height);
  };

  const applyDimensionChanges = () => {
    startScanner(selectedCamera || undefined);
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
              {error}
              <button 
                onClick={() => startScanner()}
                className="mt-2 px-4 py-2 bg-[#b22a2e] text-white rounded-md block w-full"
              >
                Réessayer
              </button>
            </div>
          ) : !permissionGranted ? (
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
                      onClick={() => onScanSuccess(lastResult)}
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

              {/* Contrôles de scan */}
              <div className="mb-4 flex flex-wrap gap-2">
                <button 
                  onClick={() => handleModeChange('linear')}
                  className={`px-3 py-1 text-sm rounded-md ${scanMode === 'linear' ? 'bg-[#b22a2e] text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Code-barres
                </button>
                <button 
                  onClick={() => handleModeChange('all')}
                  className={`px-3 py-1 text-sm rounded-md ${scanMode === 'all' ? 'bg-[#b22a2e] text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Tous les formats
                </button>
                <button 
                  onClick={toggleTorch}
                  className={`px-3 py-1 text-sm rounded-md ${torchEnabled ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Lampe torche
                </button>
                <button 
                  onClick={resetScanner}
                  className="px-3 py-1 text-sm rounded-md bg-gray-200 text-gray-700 flex items-center"
                >
                  <RotateCcw size={14} className="mr-1" /> Réinitialiser
                </button>
              </div>
            </>
          )}
          
          {cameras.length > 1 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Caméra:
              </label>
              <select
                value={selectedCamera || ''}
                onChange={handleCameraChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {cameras.map(camera => (
                  <option key={camera.id} value={camera.id}>
                    {camera.label || `Caméra ${camera.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {permissionGranted && (
            <div className="mb-4 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Largeur de scan:
                </label>
                <div className="flex items-center">
                  <input
                    type="range"
                    min="100"
                    max="500"
                    value={scanWidth}
                    onChange={handleWidthChange}
                    className="w-full"
                  />
                  <span className="text-xs ml-2 w-8">{scanWidth}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Hauteur de scan:
                </label>
                <div className="flex items-center">
                  <input
                    type="range"
                    min="50"
                    max="250"
                    value={scanHeight}
                    onChange={handleHeightChange}
                    className="w-full"
                  />
                  <span className="text-xs ml-2 w-8">{scanHeight}</span>
                </div>
              </div>
              <button
                onClick={applyDimensionChanges}
                className="col-span-2 mt-1 text-xs bg-gray-200 py-1 px-2 rounded hover:bg-gray-300"
              >
                Appliquer les dimensions
              </button>
            </div>
          )}
          
          <div 
            ref={scannerContainerRef} 
            className="scanner-container rounded overflow-hidden"
            style={{ minHeight: "300px" }}
          ></div>
          
          <p className="text-center text-sm text-gray-500 mt-4">
            Placez le code-barres du moniteur dans le cadre et maintenez-le stable.
          </p>
          <p className="text-center text-xs text-gray-400 mt-1">
            Conseils: Éclairez bien le code-barres, évitez les reflets, et tenez l'appareil à environ 10-20cm du code.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner; 