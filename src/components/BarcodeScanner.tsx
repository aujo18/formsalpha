import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
// @ts-ignore - Quagga n'a pas de définitions de types officielles
import Quagga from 'quagga';

interface BarcodeScannerProps {
  onScanSuccess: (result: string) => void;
  onClose: () => void;
}

// Définitions de types pour les résultats de Quagga
interface QuaggaResult {
  codeResult: {
    code: string;
  };
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onClose }) => {
  const scannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scannerRef.current) {
      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            width: { min: 640 },
            height: { min: 480 },
            facingMode: "environment"
          },
        },
        locator: {
          patchSize: "medium",
          halfSample: true
        },
        numOfWorkers: 4,
        decoder: {
          readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader", "code_39_vin_reader", "codabar_reader", "upc_reader", "upc_e_reader", "i2of5_reader"]
        },
        locate: true
      }, function(err: unknown) {
        if (err) {
          console.error("Error initializing Quagga:", err);
          return;
        }
        Quagga.start();
      });

      Quagga.onDetected((result: QuaggaResult) => {
        if (result && result.codeResult && result.codeResult.code) {
          onScanSuccess(result.codeResult.code);
          Quagga.stop();
          onClose();
        }
      });

      return () => {
        Quagga.stop();
      };
    }
  }, [onScanSuccess, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="relative bg-white p-4 rounded-lg shadow-lg w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Scanner de code-barres</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <div className="border border-gray-300 rounded-lg overflow-hidden" style={{ minHeight: '320px' }}>
          <div id="interactive" className="viewport" ref={scannerRef}></div>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p>Positionnez le code-barres devant la caméra pour le scanner.</p>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner; 