import React from 'react';
import { Camera, Shield, Zap } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
              <Camera className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold">Sistema de Reconeixement de Matrícules</h1>
          </div>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
            Processa vídeos de càmeres de seguretat per detectar i registrar matrícules de vehicles 
            utilitzant tecnologia OpenALPR amb alta precisió
          </p>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              <span>Detecció d'alta precisió (&gt;90%)</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span>Processament optimitzat</span>
            </div>
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-400" />
              <span>Suport per múltiples formats</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};