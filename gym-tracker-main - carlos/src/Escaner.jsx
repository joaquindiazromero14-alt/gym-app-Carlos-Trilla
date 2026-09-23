import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function Escaner({ onScan }) {
  const scannerInicializado = useRef(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!scannerInicializado.current) {
      scannerInicializado.current = true;

      scannerRef.current = new Html5QrcodeScanner(
        "reader", 
        { 
          fps: 10, 
          qrbox: { width: 250, height: 150 }, 
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true 
        }, 
        false
      );

      scannerRef.current.render(
        (codigoDecodificado) => {
          if (scannerRef.current) {
            scannerRef.current.clear();
            scannerRef.current = null;
          }
          onScan(codigoDecodificado);
        },
        (error) => { /* ignorar fotogramas vacíos */ }
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [onScan]);

  return (
    <div 
      id="reader" 
      style={{ 
        width: '100%', maxWidth: '400px', margin: '0 auto', 
        background: '#fff', color: '#000', borderRadius: '16px', overflow: 'hidden'
      }}
    ></div>
  );
}