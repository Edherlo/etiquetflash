'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Tag, Package } from 'lucide-react';

export default function TipoEtiqueta() {
  const router = useRouter();

  const tipos = [
    {
      id: 'exhibicion',
      titulo: 'Precio de Exhibición',
      descripcion: 'Etiquetas con lista de especificaciones',
      icono: Tag,
      color: 'from-red-500 to-red-600',
      ruta: '/exhibicion'
    },
    {
      id: 'stock',
      titulo: 'Productos en Stock',
      descripcion: 'Etiquetas de precio formato ovalado',
      icono: Package,
      color: 'from-blue-500 to-blue-600',
      ruta: '/stock'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Volver</span>
        </button>

        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-white mb-3">
            Selecciona el Tipo de Etiqueta
          </h1>
          <p className="text-slate-400 text-lg">
            Elige el formato que necesitas generar
          </p>
        </div>

        {/* Grid de Opciones */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {tipos.map((tipo) => {
            const Icono = tipo.icono;
            return (
              <button
                key={tipo.id}
                onClick={() => router.push(tipo.ruta)}
                className="group relative bg-slate-800/50 backdrop-blur-sm border-2 border-slate-700 rounded-2xl p-8 hover:border-slate-600 transition-all duration-300 hover:scale-105 active:scale-95 text-left overflow-hidden"
              >
                {/* Gradiente de fondo al hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${tipo.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                {/* Contenido */}
                <div className="relative z-10">
                  <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${tipo.color} mb-4`}>
                    <Icono className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-red-400 group-hover:to-blue-400 transition-all">
                    {tipo.titulo}
                  </h3>
                  
                  <p className="text-slate-400 text-base leading-relaxed">
                    {tipo.descripcion}
                  </p>

                  {/* Flecha */}
                  <div className="mt-6 flex items-center gap-2 text-slate-500 group-hover:text-white transition-colors">
                    <span className="text-sm font-medium">Seleccionar</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

