import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{id: string, label: string}[]>([]);
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

  const startScanner = async (cameraId?: string) => {
    if (!scannerRef.current) return;
    
    // Si un scan est déjà en cours, l'arrêter d'abord
    if (scannerRef.current.isScanning) {
      await scannerRef.current.stop().catch(err => console.error("Erreur lors de l'arrêt du scanner:", err));
    }

    try {
      setError(null);
      
      const qrCodeSuccessCallback = (decodedText: string) => {
        console.log("Code détecté:", decodedText);
        
        // Nettoyer le résultat (enlever espaces et caractères spéciaux)
        const cleanedText = decodedText.trim();
        
        // Arrêter le scanner après un scan réussi
        stopScanner();
        
        // Appeler le callback avec le texte décodé
        onScanSuccess(cleanedText);
      };

      // Définir les formats à prendre en charge - inclure tous les codes-barres courants
      const formats = [
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.ITF,
        Html5QrcodeSupportedFormats.CODABAR,
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.DATA_MATRIX
      ];

      // Configuration optimisée pour les codes-barres 1D
      const config = {
        fps: 8, // Fps réduit pour une meilleure stabilité et précision
        qrbox: { width: 400, height: 100 }, // Zone large mais peu haute pour les codes-barres
        aspectRatio: 2.5, // Format plus large que haut pour les codes-barres
        disableFlip: false, // Permettre toutes les orientations
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true // Utiliser l'API native si disponible
        },
        formatsToSupport: formats,
        // Priorité aux formats standards
        experimentalFeaturesConfig: {
          barcodeScanningPriority: [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.CODE_39
          ]
        }
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
          ) : null}
          
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