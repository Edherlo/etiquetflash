'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Download } from 'lucide-react';

// ✅ CONFIGURACIÓN DE API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Exhibicion() {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const [etiqueta, setEtiqueta] = useState({
    titulo: 'Honoy',
    especificaciones: ['X9B', '200 lite', '12 Se', '200', '90 lite']
  });

  const [cantidad, setCantidad] = useState(1);
  const [nuevaEspec, setNuevaEspec] = useState('');
  const [loading, setLoading] = useState(false);

  const agregarEspecificacion = () => {
    if (nuevaEspec.trim()) {
      setEtiqueta({
        ...etiqueta,
        especificaciones: [...etiqueta.especificaciones, nuevaEspec.trim()]
      });
      setNuevaEspec('');
    }
  };

  const eliminarEspecificacion = (index: number) => {
    setEtiqueta({
      ...etiqueta,
      especificaciones: etiqueta.especificaciones.filter((_, i) => i !== index)
    });
  };

  const generarPDF = async () => {
    setLoading(true);
    
    try {
      console.log('🔧 Conectando a:', `${API_URL}/api/etiquetas/exhibicion`);
      
      const response = await fetch(`${API_URL}/api/etiquetas/exhibicion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          titulo: etiqueta.titulo,
          especificaciones: etiqueta.especificaciones,
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
      a.download = `etiquetas-exhibicion-${Date.now()}.pdf`;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.push('/tipo-etiqueta')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Volver</span>
        </button>

        <h1 className="text-4xl font-black text-white mb-8">
          Etiquetas de <span className="text-red-500">Exhibición</span>
        </h1>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Editar Etiqueta</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Título del Producto
              </label>
              <input
                type="text"
                value={etiqueta.titulo}
                onChange={(e) => setEtiqueta({ ...etiqueta, titulo: e.target.value })}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                placeholder="Ej: Honoy"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Especificaciones
              </label>
              
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={nuevaEspec}
                  onChange={(e) => setNuevaEspec(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && agregarEspecificacion()}
                  className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Agregar especificación"
                />
                <button
                  onClick={agregarEspecificacion}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {etiqueta.especificaciones.map((espec, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-slate-900 px-4 py-2 rounded-lg"
                  >
                    <span className="text-white">• {espec}</span>
                    <button
                      onClick={() => eliminarEspecificacion(index)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
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
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p className="text-slate-400 text-xs mt-2">
                Se acomodarán automáticamente en hojas tamaño carta
              </p>
            </div>

            <button
              onClick={generarPDF}
              disabled={loading}
              className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-blue-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-red-500/50 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Vista Previa</h2>
            
            <div className="flex items-center justify-center">
              <div ref={printRef} className="bg-white rounded-lg p-6 shadow-2xl" style={{ width: '250px' }}>
                <h3 className="text-3xl font-bold text-red-600 mb-4 text-center">
                  {etiqueta.titulo}
                </h3>
                
                <div className="space-y-2">
                  {etiqueta.especificaciones.map((espec, index) => (
                    <div key={index} className="text-blue-600 font-semibold text-lg">
                      • {espec}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 bg-slate-900 rounded-lg p-4 border border-slate-700">
              <h3 className="text-sm font-bold text-white mb-2">📋 Instrucciones:</h3>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>1. Genera el PDF con el botón de arriba</li>
                <li>2. Abre el PDF descargado</li>
                <li>3. Presiona Ctrl+P para imprimir</li>
                <li>4. Selecciona tu Epson L220</li>
                <li>5. Elige papel normal o adhesivo</li>
                <li>6. ¡Listo! Recorta las etiquetas</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

