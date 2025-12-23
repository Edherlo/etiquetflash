'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Upload, X } from 'lucide-react';

// ✅ CONFIGURACIÓN DE API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Stock() {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [etiqueta, setEtiqueta] = useState({
    precioOriginal: '150.00',
    precioDescuento: '99.00'
  });

  const [logo, setLogo] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona una imagen válida (PNG, JPG, etc.)');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen es muy pesada. Máximo 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const eliminarLogo = () => {
    setLogo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generarPDF = async () => {
    if (!logo) {
      alert('Por favor sube el logo de tu empresa primero');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🔧 Conectando a:', `${API_URL}/api/etiquetas/stock`);
      
      const response = await fetch(`${API_URL}/api/etiquetas/stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          precioOriginal: etiqueta.precioOriginal,
          precioDescuento: etiqueta.precioDescuento,
          logo: logo,
          cantidad: cantidad
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `etiquetas-stock-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert('¡PDF generado! Ahora puedes imprimirlo desde tu visor de PDFs.');
      
    } catch (error) {
      console.error('❌ Error completo:', error);
      alert(`Error al generar el PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.push('/tipo-etiqueta')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 md:mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Volver</span>
        </button>

        <h1 className="text-3xl md:text-4xl font-black text-white mb-6 md:mb-8">
          Etiquetas de <span className="text-blue-500">Precio</span>
        </h1>

        <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Configurar Etiqueta</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Logo de tu Empresa
              </label>
              
              {!logo ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-all group"
                >
                  <Upload className="w-12 h-12 mx-auto text-slate-500 group-hover:text-blue-500 mb-3" />
                  <p className="text-slate-400 text-sm mb-1">Click para subir logo</p>
                  <p className="text-slate-600 text-xs">PNG, JPG (máx. 5MB)</p>
                </div>
              ) : (
                <div className="relative bg-slate-900 rounded-lg p-4 border border-slate-700">
                  <button
                    onClick={eliminarLogo}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex items-center justify-center">
                    <img src={logo} alt="Logo" className="max-h-32 object-contain" />
                  </div>
                  <p className="text-center text-slate-400 text-xs mt-2">Logo cargado ✓</p>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>

            <div className="mb-4 md:mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Precio Original (De:)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-white text-2xl font-bold">$</span>
                <input
                  type="text"
                  value={etiqueta.precioOriginal}
                  onChange={(e) => setEtiqueta({ ...etiqueta, precioOriginal: e.target.value })}
                  className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="150.00"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Precio en Descuento (A:)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-3xl font-black">$</span>
                <input
                  type="text"
                  value={etiqueta.precioDescuento}
                  onChange={(e) => setEtiqueta({ ...etiqueta, precioDescuento: e.target.value })}
                  className="flex-1 px-4 py-4 bg-slate-900 border-2 border-green-500 rounded-lg text-green-500 text-2xl font-black focus:outline-none focus:ring-2 focus:ring-green-400 transition-all"
                  placeholder="99.00"
                />
              </div>
              <p className="text-slate-400 text-xs mt-2">
                Este precio se mostrará grande y llamativo
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Cantidad de Etiquetas
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={cantidad}
                onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-slate-400 text-xs mt-2">
                Se acomodarán automáticamente en hojas tamaño carta
              </p>
            </div>

            <button
              onClick={generarPDF}
              disabled={loading || !logo}
              className="w-full px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r from-blue-500 to-red-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generando...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Generar PDF ({cantidad} etiquetas)
                </>
              )}
            </button>

            <p className="text-slate-400 text-xs text-center mt-3">
              💡 El PDF se descargará y podrás imprimirlo con Ctrl+P
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Vista Previa</h2>
            
            <div className="flex items-center justify-center">
              <div 
                ref={printRef} 
                className="bg-white rounded-full border-4 border-black p-6 md:p-8 shadow-2xl" 
                style={{ minWidth: '280px', minHeight: '180px', maxWidth: '100%' }}
              >
                <div className="flex flex-col items-center justify-center h-full gap-3 md:gap-4">
                  <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
                    {logo ? (
                      <img src={logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <div className="w-full h-full bg-slate-200 rounded-full flex items-center justify-center">
                        <span className="text-slate-400 text-xs">Logo</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm md:text-base font-bold text-slate-600">De:</p>
                    <p className="text-xl md:text-2xl font-bold text-red-600 line-through">
                      ${etiqueta.precioOriginal}
                    </p>
                  </div>

                  <div className="border-4 border-green-500 rounded-lg px-4 md:px-6 py-2 md:py-3 bg-green-50">
                    <p className="text-base md:text-lg font-black text-slate-800">A:</p>
                    <p className="text-4xl md:text-5xl font-black text-green-600">
                      ${etiqueta.precioDescuento}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-slate-900 rounded-lg p-3 md:p-4 border border-slate-700">
              <h3 className="text-xs md:text-sm font-bold text-white mb-2">📋 Instrucciones:</h3>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>1. Sube el logo de tu empresa</li>
                <li>2. Ingresa precio original y de descuento</li>
                <li>3. Genera el PDF</li>
                <li>4. Abre y presiona Ctrl+P</li>
                <li>5. Selecciona tu Epson L220</li>
                <li>6. Elige papel normal o adhesivo</li>
                <li>7. ¡Listo! Recorta las etiquetas</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

