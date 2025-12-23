'use client';

import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Logo y Título */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="w-16 h-16 text-red-500 animate-pulse" />
            <h1 className="text-7xl font-black text-white tracking-tight">
              ETIQUETAS
            </h1>
          </div>
          <div className="flex items-center justify-center gap-3">
            <h2 className="text-7xl font-black bg-gradient-to-r from-red-500 to-blue-500 text-transparent bg-clip-text">
              FLASH
            </h2>
            <Zap className="w-16 h-16 text-blue-500 animate-pulse" />
          </div>
          <p className="text-slate-400 text-xl mt-6 font-light">
            Genera etiquetas profesionales en segundos
          </p>
        </div>

        {/* Botón Principal */}
        <div className="flex justify-center">
          <button
            onClick={() => router.push('/tipo-etiqueta')}
            className="group relative px-12 py-6 bg-gradient-to-r from-red-500 to-blue-500 rounded-2xl font-bold text-white text-2xl shadow-2xl hover:shadow-red-500/50 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <span className="relative z-10">ENTRAR</span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-red-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </div>

        {/* Características */}
        <div className="grid grid-cols-3 gap-4 mt-16 text-center">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
            <div className="text-3xl font-bold text-red-500 mb-1">⚡</div>
            <p className="text-slate-300 text-sm font-medium">Rápido</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
            <div className="text-3xl font-bold text-blue-500 mb-1">🎨</div>
            <p className="text-slate-300 text-sm font-medium">Profesional</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
            <div className="text-3xl font-bold text-green-500 mb-1">📄</div>
            <p className="text-slate-300 text-sm font-medium">PDF Listo</p>
          </div>
        </div>
      </div>
    </div>
  );
}

