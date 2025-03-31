import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, RotateCcw } from 'lucide-react';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onClose }) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      // Réinitialiser l'erreur
      setErrorMessage(null);
      
      // Vérifier si le navigateur supporte l'API MediaDevices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMessage("Votre navigateur ne supporte pas l'accès à la caméra");
        return;
      }
      
      console.log("Demande d'accès à la caméra...");
      
      // Demander l'accès à la caméra arrière si possible
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      
      console.log("Accès à la caméra accordé");
      
      // Stocker le flux pour pouvoir l'arrêter plus tard
      streamRef.current = stream;
      
      // Connecter le flux à l'élément vidéo
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      } else {
        console.error("Élément vidéo non trouvé");
        setErrorMessage("Erreur lors de l'initialisation de la caméra");
      }
    } catch (err) {
      console.error("Erreur d'accès à la caméra:", err);
      
      // Message d'erreur détaillé en fonction du type d'erreur
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setErrorMessage("Accès à la caméra refusé. Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur.");
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setErrorMessage("Aucune caméra détectée sur votre appareil.");
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setErrorMessage("La caméra est utilisée par une autre application. Veuillez fermer les autres applications qui pourraient utiliser la caméra.");
        } else {
          setErrorMessage(`Erreur d'accès à la caméra: ${err.message}`);
        }
      } else {
        setErrorMessage(`Erreur d'accès à la caméra: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      // Arrêter tous les tracks du stream
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Réinitialiser l'élément vidéo
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setCameraActive(false);
  };

  // Démarrer la caméra au montage du composant
  useEffect(() => {
    startCamera();
    
    // Nettoyer à la fermeture
    return () => {
      stopCamera();
    };
  }, []);

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onScanSuccess(inputValue.trim());
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
          {errorMessage ? (
            <div className="text-red-500 mb-4 text-center">
              <p className="mb-2">{errorMessage}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 bg-gray-600 text-white rounded-md block w-full"
              >
                Recharger la page
              </button>
              <button 
                onClick={startCamera}
                className="mt-2 px-4 py-2 bg-[#b22a2e] text-white rounded-md block w-full"
              >
                Réessayer
              </button>
            </div>
          ) : null}
          
          {/* Aperçu caméra */}
          <div className="relative rounded overflow-hidden" style={{ minHeight: "250px", background: "#000" }}>
            {cameraActive ? (
              <video 
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                autoPlay
                muted
              />
            ) : !errorMessage ? (
              <div className="flex items-center justify-center h-full py-8">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-[#b22a2e] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-400">Activation de la caméra...</p>
                </div>
              </div>
            ) : null}
            
            {/* Cadre guide pour positionner le code-barre */}
            {cameraActive && (
              <div 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-[#b22a2e] rounded-md pointer-events-none"
                style={{ width: "250px", height: "100px", boxShadow: "0 0 0 3000px rgba(0, 0, 0, 0.3)" }}
              >
                <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 text-white text-sm font-medium drop-shadow-lg">
                  Alignez le code-barre ici
                </div>
              </div>
            )}
          </div>
          
          {/* Saisie manuelle */}
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Saisie manuelle du code:
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
                onClick={handleSubmit}
                className="px-4 py-2 bg-[#b22a2e] text-white rounded-md hover:bg-[#b22a2e]/90"
                disabled={!inputValue.trim()}
              >
                Utiliser
              </button>
            </div>
          </div>
          
          <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-center text-xs text-gray-600">
              Note: Si la lecture du code-barre échoue, vous pouvez saisir le code manuellement dans le champ ci-dessus.
            </p>
          </div>
          
          <div className="mt-3 flex justify-center">
            <button
              onClick={startCamera}
              className="flex items-center text-sm px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              <RotateCcw size={14} className="mr-1" /> Redémarrer la caméra
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner; 