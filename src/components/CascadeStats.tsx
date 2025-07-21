import React from 'react';
import { CascadeStats } from '../types';

interface CascadeStatsProps {
  stats?: CascadeStats;
  isVisible: boolean;
}

export const CascadeStatsComponent: React.FC<CascadeStatsProps> = ({ stats, isVisible }) => {
  if (!isVisible || !stats) return null;

  const totalDetections = stats.easyOcrCount + stats.tesseractCount + stats.paddleOcrCount + stats.apiCount;
  const freeDetections = stats.easyOcrCount + stats.tesseractCount + stats.paddleOcrCount;
  const freePercentage = totalDetections > 0 ? (freeDetections / totalDetections * 100).toFixed(1) : '0';

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-2xl">🔄</span>
        Estadístiques del Sistema Cascada
      </h3>
      
      {/* Distribució per motor OCR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">EasyOCR</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{stats.easyOcrCount}</div>
          <div className="text-xs text-gray-500">Gratuït • Ràpid</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">Tesseract</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats.tesseractCount}</div>
          <div className="text-xs text-gray-500">Gratuït • Configurable</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">PaddleOCR</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">{stats.paddleOcrCount}</div>
          <div className="text-xs text-gray-500">Gratuït • Precís</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">API</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">{stats.apiCount}</div>
          <div className="text-xs text-gray-500">Pagament • Últim recurs</div>
        </div>
      </div>

      {/* Resum de costos i eficiència */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">💰</span>
            <span className="text-sm font-medium text-gray-700">Estalvi</span>
          </div>
          <div className="text-lg font-bold text-green-600">{freePercentage}% gratuït</div>
          <div className="text-xs text-gray-500">
            {freeDetections} de {totalDetections} deteccions sense cost
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">💾</span>
            <span className="text-sm font-medium text-gray-700">Imatges guardades</span>
          </div>
          <div className="text-lg font-bold text-blue-600">{stats.savedImagesCount}</div>
          <div className="text-xs text-gray-500">
            Alta confiança (&gt;80%)
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🚀</span>
            <span className="text-sm font-medium text-gray-700">Cache hits</span>
          </div>
          <div className="text-lg font-bold text-purple-600">{stats.cacheHits}</div>
          <div className="text-xs text-gray-500">
            Matrícules reutilitzades del cache
          </div>
        </div>
      </div>

      {/* Barra de progrés visual */}
      {totalDetections > 0 && (
        <div className="mt-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Distribució de deteccions:</div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div className="h-full flex">
              {stats.easyOcrCount > 0 && (
                <div 
                  className="bg-green-500"
                  style={{ width: `${(stats.easyOcrCount / totalDetections) * 100}%` }}
                  title={`EasyOCR: ${stats.easyOcrCount}`}
                />
              )}
              {stats.tesseractCount > 0 && (
                <div 
                  className="bg-blue-500"
                  style={{ width: `${(stats.tesseractCount / totalDetections) * 100}%` }}
                  title={`Tesseract: ${stats.tesseractCount}`}
                />
              )}
              {stats.paddleOcrCount > 0 && (
                <div 
                  className="bg-purple-500"
                  style={{ width: `${(stats.paddleOcrCount / totalDetections) * 100}%` }}
                  title={`PaddleOCR: ${stats.paddleOcrCount}`}
                />
              )}
              {stats.apiCount > 0 && (
                <div 
                  className="bg-orange-500"
                  style={{ width: `${(stats.apiCount / totalDetections) * 100}%` }}
                  title={`API: ${stats.apiCount}`}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
