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
      
      // Demander la permission d'accès à la caméra
      startScanner();
    }

    // Nettoyer lors du démontage
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    if (!scannerRef.current) return;

    try {
      setError(null);
      
      const qrCodeSuccessCallback = (decodedText: string) => {
        // Arrêter le scanner après un scan réussi
        stopScanner();
        // Appeler le callback avec le texte décodé
        onScanSuccess(decodedText);
      };

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 100 },
        aspectRatio: 1.0,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.EAN_8,
        ],
      };

      await scannerRef.current.start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback,
        undefined
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
                onClick={startScanner}
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
          
          <div 
            ref={scannerContainerRef} 
            className="scanner-container"
            style={{ minHeight: "300px" }}
          ></div>
          
          <p className="text-center text-sm text-gray-500 mt-4">
            Placez le code-barres du moniteur dans le cadre pour le scanner automatiquement.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner; 