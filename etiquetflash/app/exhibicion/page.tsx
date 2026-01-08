'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Download, ShoppingCart } from 'lucide-react';

const FUENTES = [
  { id: 'helvetica', nombre: 'Helvetica', familia: 'Helvetica, Arial, sans-serif' },
  { id: 'times', nombre: 'Times New Roman', familia: '"Times New Roman", serif' },
  { id: 'courier', nombre: 'Courier', familia: '"Courier New", monospace' },
  { id: 'arial', nombre: 'Arial Black', familia: '"Arial Black", sans-serif' },
  { id: 'impact', nombre: 'Impact', familia: 'Impact, sans-serif' },
  { id: 'verdana', nombre: 'Verdana', familia: 'Verdana, sans-serif' }
];

const COLORES = [
  { id: 'rojo', nombre: 'Rojo', valor: '#EF4444' },
  { id: 'verde', nombre: 'Verde', valor: '#22C55E' },
  { id: 'azul', nombre: 'Azul', valor: '#3B82F6' },
  { id: 'naranja', nombre: 'Naranja', valor: '#F97316' },
  { id: 'morado', nombre: 'Morado', valor: '#A855F7' },
  { id: 'negro', nombre: 'Negro', valor: '#000000' }
];

const DISENOS = [
  { id: 'clasico', nombre: 'Rectángulo Clásico' },
  { id: 'coolpanda', nombre: 'Cool Panda Frame' }
];

const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }
  }
  return 'https://etiquetflash.onrender.com';
};

const API_URL = getApiUrl();

export default function Exhibicion() {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const [carrito, setCarrito] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [nuevaEspec, setNuevaEspec] = useState('');

  const [etiqueta, setEtiqueta] = useState({
    titulo: 'Honoy',
    especificaciones: ['X9B', '200 lite', '12 Se', '200', '90 lite'],
    cantidad: 1,
    fuente: 'helvetica',
    color: 'rojo',
    diseño: 'clasico',
    colorBorde: 'negro'
  });

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

  const agregarAlCarrito = () => {
    const nuevaEtiqueta = {
      id: Date.now(),
      ...etiqueta
    };
    
    setCarrito([...carrito, nuevaEtiqueta]);
    alert(`✅ ${etiqueta.cantidad} etiqueta(s) agregada(s) al carrito`);
  };

  const eliminarDelCarrito = (id: number) => {
    setCarrito(carrito.filter(item => item.id !== id));
  };

  const generarPDFFinal = async () => {
    if (carrito.length === 0) {
      alert('El carrito está vacío. Agrega etiquetas primero.');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/etiquetas/exhibicion-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etiquetas: carrito })
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

      alert('¡PDF generado exitosamente!');
      setCarrito([]);
      
    } catch (error) {
      console.error('❌ Error completo:', error);
      alert(`Error al generar el PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const fuenteSeleccionada = FUENTES.find(f => f.id === etiqueta.fuente);
  const colorSeleccionado = COLORES.find(c => c.id === etiqueta.color);
  const colorBordeSeleccionado = COLORES.find(c => c.id === etiqueta.colorBorde);

  // ✅ CAMBIO: Ancho fijo 5cm, Alto dinámico según especificaciones
  const calcularDimensiones = () => {
    const numEspecs = etiqueta.especificaciones.length;
    // Ancho fijo: 5cm = 140px aprox
    const width = 140;
    // Alto base: 80px (3cm) + 18px por cada especificación
    const height = Math.max(80, 80 + (numEspecs * 18));
    return { width, height };
  };

  const dims = calcularDimensiones();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.push('/tipo-etiqueta')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 md:mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Volver</span>
        </button>

        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <h1 className="text-3xl md:text-4xl font-black text-white">
            Etiquetas de <span className="text-red-500">Exhibición</span>
          </h1>

          <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
            <ShoppingCart className="w-5 h-5 text-red-400" />
            <span className="text-white font-bold">{carrito.length}</span>
            <span className="text-slate-400 text-sm">etiquetas</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Panel de Configuración */}
          <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Editar Etiqueta</h2>

            {/* Selector de Diseño */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Diseño de Etiqueta
              </label>
              <select
                value={etiqueta.diseño}
                onChange={(e) => setEtiqueta({...etiqueta, diseño: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {DISENOS.map(d => (
                  <option key={d.id} value={d.id}>{d.nombre}</option>
                ))}
              </select>
            </div>

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

            {/* Selector de Fuente */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Fuente del Título
              </label>
              <select
                value={etiqueta.fuente}
                onChange={(e) => setEtiqueta({...etiqueta, fuente: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {FUENTES.map(f => (
                  <option key={f.id} value={f.id}>{f.nombre}</option>
                ))}
              </select>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* Selector de Color del Título */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Color del Título
                </label>
                <select
                  value={etiqueta.color}
                  onChange={(e) => setEtiqueta({...etiqueta, color: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {COLORES.map(c => (
                    <option key={c.id} value={c.id}>🎨 {c.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Selector de Color del Borde */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Color del Borde
                </label>
                <select
                  value={etiqueta.colorBorde}
                  onChange={(e) => setEtiqueta({...etiqueta, colorBorde: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {COLORES.map(c => (
                    <option key={c.id} value={c.id}>🖌️ {c.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Cantidad de esta Etiqueta
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={etiqueta.cantidad}
                onChange={(e) => setEtiqueta({...etiqueta, cantidad: parseInt(e.target.value) || 1})}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p className="text-slate-400 text-xs mt-2">
                Ancho fijo 5cm • Alto crece según especificaciones
              </p>
            </div>

            <button
              onClick={agregarAlCarrito}
              className="w-full px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r from-red-500 to-blue-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-red-500/50 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-sm md:text-base"
            >
              <Plus className="w-5 h-5" />
              Agregar al Carrito
            </button>
          </div>

          {/* Panel Vista Previa y Carrito */}
          <div className="space-y-6">
            {/* Vista Previa */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Vista Previa</h2>
              
              <div className="flex items-center justify-center">
                {etiqueta.diseño === 'coolpanda' ? (
                  <div className="relative" style={{ width: `${dims.width}px`, height: `${dims.height + 20}px` }}>
                    {/* Orejas de Panda - Medio círculo superior */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-8">
                      <div 
                        className="w-5 h-2.5 rounded-t-full overflow-hidden"
                        style={{ backgroundColor: colorBordeSeleccionado?.valor }}
                      ></div>
                      <div 
                        className="w-5 h-2.5 rounded-t-full overflow-hidden"
                        style={{ backgroundColor: colorBordeSeleccionado?.valor }}
                      ></div>
                    </div>
                    
                    {/* Cuerpo de la etiqueta */}
                    <div 
                      className="bg-white rounded-2xl p-3 shadow-2xl h-full"
                      style={{ 
                        border: `3px solid ${colorBordeSeleccionado?.valor}`,
                        width: `${dims.width}px`,
                        height: `${dims.height}px`
                      }}
                    >
                      <h3 
                        className="text-sm font-bold mb-2 text-center break-words"
                        style={{ 
                          color: colorSeleccionado?.valor,
                          fontFamily: fuenteSeleccionada?.familia 
                        }}
                      >
                        {etiqueta.titulo}
                      </h3>
                      
                      <div className="space-y-1">
                        {etiqueta.especificaciones.map((espec, index) => (
                          <div key={index} className="text-blue-600 font-semibold text-xs break-words">
                            • {espec}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div 
                    ref={printRef} 
                    className="bg-white rounded-2xl p-3 shadow-2xl"
                    style={{ 
                      border: `3px solid ${colorBordeSeleccionado?.valor}`,
                      width: `${dims.width}px`,
                      height: `${dims.height}px`
                    }}
                  >
                    <h3 
                      className="text-sm font-bold mb-2 text-center break-words"
                      style={{ 
                        color: colorSeleccionado?.valor,
                        fontFamily: fuenteSeleccionada?.familia 
                      }}
                    >
                      {etiqueta.titulo}
                    </h3>
                    
                    <div className="space-y-1">
                      {etiqueta.especificaciones.map((espec, index) => (
                        <div key={index} className="text-blue-600 font-semibold text-xs break-words">
                          • {espec}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <p className="text-slate-400 text-xs text-center mt-3">
                Tamaño: 5cm × {Math.round(dims.height * 0.264 / 10)}cm
              </p>
            </div>

            {/* Carrito */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-4 md:p-6">
              <h2 className="text-lg font-bold text-white mb-4">Carrito</h2>
              
              {carrito.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">
                  El carrito está vacío
                </p>
              ) : (
                <>
                  <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                    {carrito.map((item, index) => (
                      <div key={item.id} className="bg-slate-900 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm">Etiqueta #{index + 1}</p>
                          <p className="text-slate-400 text-xs truncate">
                            {item.titulo} ({item.cantidad}x)
                          </p>
                          <p className="text-slate-500 text-xs">
                            {DISENOS.find(d => d.id === item.diseño)?.nombre || 'Clásico'} • {item.especificaciones.length} especificaciones
                          </p>
                        </div>
                        <button
                          onClick={() => eliminarDelCarrito(item.id)}
                          className="text-red-400 hover:text-red-300 p-2 flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={generarPDFFinal}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Generando...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        Generar PDF ({carrito.reduce((sum, item) => sum + item.cantidad, 0)})
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
