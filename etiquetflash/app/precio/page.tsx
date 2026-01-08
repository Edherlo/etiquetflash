'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Upload, X, Plus, Trash2, ShoppingCart } from 'lucide-react';

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
  { id: 'ovalado', nombre: 'Ovalado Clásico' },
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

export default function PrecioRegular() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [logo, setLogo] = useState<string | null>(null);
  const [carrito, setCarrito] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [config, setConfig] = useState({
    precio: '99.00',
    diseño: 'ovalado',
    fuente: 'helvetica',
    colorPrecio: 'verde',
    cantidad: 1
  });

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

  const agregarAlCarrito = () => {
    if (!logo) {
      alert('Por favor sube el logo de tu empresa primero');
      return;
    }
    
    const nuevaEtiqueta = {
      id: Date.now(),
      ...config,
      logo
    };
    
    setCarrito([...carrito, nuevaEtiqueta]);
    alert(`✅ ${config.cantidad} etiqueta(s) agregada(s) al carrito`);
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
      const response = await fetch(`${API_URL}/api/etiquetas/precio-regular-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etiquetas: carrito })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `etiquetas-precio-regular-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert('¡PDF generado exitosamente!');
      setCarrito([]);
    } catch (error) {
      console.error('Error:', error);
      alert(`Error al generar el PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const fuenteSeleccionada = FUENTES.find(f => f.id === config.fuente);
  const colorPrecioSeleccionado = COLORES.find(c => c.id === config.colorPrecio);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.push('/tipo-etiqueta')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Volver</span>
        </button>

        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <h1 className="text-3xl md:text-4xl font-black text-white">
            Etiquetas de <span className="text-green-500">Precio Regular</span>
          </h1>
          
          <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
            <ShoppingCart className="w-5 h-5 text-green-400" />
            <span className="text-white font-bold">{carrito.length}</span>
            <span className="text-slate-400 text-sm">etiquetas</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Panel de Configuración */}
          <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-4 md:p-6">
            <h2 className="text-xl font-bold text-white mb-6">Configurar Etiqueta</h2>

            {/* Upload Logo */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Logo de tu Empresa
              </label>
              {!logo ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-green-500 transition-all group"
                >
                  <Upload className="w-12 h-12 mx-auto text-slate-500 group-hover:text-green-500 mb-3" />
                  <p className="text-slate-400 text-sm">Click para subir logo</p>
                  <p className="text-slate-600 text-xs mt-1">PNG, JPG (máx. 5MB)</p>
                </div>
              ) : (
                <div className="relative bg-slate-900 rounded-lg p-4 border border-slate-700">
                  <button
                    onClick={eliminarLogo}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <img src={logo} alt="Logo" className="max-h-32 mx-auto object-contain" />
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

            {/* Selector de Diseño */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Diseño de Etiqueta
              </label>
              <select
                value={config.diseño}
                onChange={(e) => setConfig({...config, diseño: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {DISENOS.map(d => (
                  <option key={d.id} value={d.id}>{d.nombre}</option>
                ))}
              </select>
            </div>

            {/* Precio */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Precio
              </label>
              <input
                type="text"
                value={config.precio}
                onChange={(e) => setConfig({...config, precio: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900 border-2 border-green-500 rounded-lg text-green-500 font-bold text-xl focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="99.00"
              />
            </div>

            {/* Selector de Fuente */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Fuente del Precio
              </label>
              <select
                value={config.fuente}
                onChange={(e) => setConfig({...config, fuente: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {FUENTES.map(f => (
                  <option key={f.id} value={f.id}>{f.nombre}</option>
                ))}
              </select>
            </div>

            {/* Color Precio */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Color del Precio
              </label>
              <select
                value={config.colorPrecio}
                onChange={(e) => setConfig({...config, colorPrecio: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {COLORES.map(c => (
                  <option key={c.id} value={c.id}>🎨 {c.nombre}</option>
                ))}
              </select>
            </div>

            {/* Cantidad */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Cantidad de esta Etiqueta
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={config.cantidad}
                onChange={(e) => setConfig({...config, cantidad: parseInt(e.target.value) || 1})}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-slate-400 text-xs mt-2">
                Tamaño fijo: 5.5cm × 3.5cm
              </p>
            </div>

            <button
              onClick={agregarAlCarrito}
              disabled={!logo}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              Agregar al Carrito
            </button>
          </div>

          {/* Panel Vista Previa y Carrito */}
          <div className="space-y-6">
            {/* Vista Previa */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-4 md:p-6">
              <h2 className="text-lg font-bold text-white mb-4">Vista Previa</h2>
              
              <div className="flex justify-center mb-4">
                {config.diseño === 'ovalado' ? (
                  <div className="bg-white rounded-full border-4 border-black p-4 shadow-2xl" style={{ width: '200px', height: '130px' }}>
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                      <div className="w-14 h-14 flex items-center justify-center">
                        {logo ? (
                          <img src={logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                        ) : (
                          <div className="w-full h-full bg-slate-200 rounded-full flex items-center justify-center">
                            <span className="text-slate-400 text-xs">Logo</span>
                          </div>
                        )}
                      </div>

                      <div 
                        className="border-3 rounded-lg px-6 py-3"
                        style={{ borderColor: colorPrecioSeleccionado?.valor, borderWidth: '4px' }}
                      >
                        <p 
                          className="text-3xl font-black"
                          style={{ 
                            color: colorPrecioSeleccionado?.valor,
                            fontFamily: fuenteSeleccionada?.familia 
                          }}
                        >
                          ${config.precio}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative" style={{ width: '200px', height: '140px' }}>
                    {/* Orejas de Panda */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-16">
                      <div className="w-6 h-3 bg-black rounded-t-full overflow-hidden"></div>
                      <div className="w-6 h-3 bg-black rounded-t-full overflow-hidden"></div>
                    </div>
                    
                    <div className="bg-white border-4 border-black rounded-2xl p-4 shadow-2xl" style={{ width: '200px', height: '130px' }}>
                      <div className="flex flex-col items-center justify-center h-full gap-3">
                        <div className="w-14 h-14 flex items-center justify-center">
                          {logo ? (
                            <img src={logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                          ) : (
                            <div className="w-full h-full bg-slate-200 rounded-full flex items-center justify-center">
                              <span className="text-slate-400 text-xs">Logo</span>
                            </div>
                          )}
                        </div>

                        <div 
                          className="border-3 rounded-lg px-6 py-3"
                          style={{ borderColor: colorPrecioSeleccionado?.valor, borderWidth: '4px' }}
                        >
                          <p 
                            className="text-3xl font-black"
                            style={{ 
                              color: colorPrecioSeleccionado?.valor,
                              fontFamily: fuenteSeleccionada?.familia 
                            }}
                          >
                            ${config.precio}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-slate-400 text-xs text-center">
                Tamaño: 5.5cm × 3.5cm
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
                            ${item.precio} ({item.cantidad}x)
                          </p>
                          <p className="text-slate-500 text-xs">
                            {DISENOS.find(d => d.id === item.diseño)?.nombre}
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
                    className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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