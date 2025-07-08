import React, { useState } from 'react';
import { FileText, Download, Search, Clock, MapPin } from 'lucide-react';
import { PlateReading } from '../types';

interface ResultsTableProps {
  readings: PlateReading[];
  fileName: string;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ readings, fileName }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'videoTimestamp' | 'plate' | 'confidence'>('videoTimestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCameraTime, setShowCameraTime] = useState(false);

  const filteredAndSortedReadings = readings
    .filter(reading => 
      reading.plate.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortBy === 'videoTimestamp') {
        // Convertir MM:SS a segons per ordenar
        const timeToSeconds = (timeStr: string) => {
          const parts = timeStr.split(':').map(Number);
          return parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0] * 3600 + parts[1] * 60 + parts[2];
        };
        const aTime = timeToSeconds(aValue);
        const bTime = timeToSeconds(bValue);
        return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
      }
      
      if (sortBy === 'confidence') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    });

  const handleDownload = () => {
    const csvContent = [
      'Matrícula,Confiança,Temps_Video,Timestamp_Camara,Sentit,Orientació',
      ...readings.map(r => 
        `${r.plate},${r.confidence.toFixed(1)}%,${r.videoTimestamp},${r.cameraTimestamp || 'N/A'},${r.direction},${r.orientation}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (readings.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 p-3 rounded-xl">
            <FileText className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Resultats de la Detecció</h3>
            <p className="text-gray-600">{readings.length} matrícules detectades</p>
          </div>
        </div>
        
        <button
          onClick={handleDownload}
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Download className="w-5 h-5" />
          Descarregar CSV
        </button>
      </div>

      {/* Search and Sort Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar matrícula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="videoTimestamp">Ordenar per Temps Video</option>
            <option value="plate">Ordenar per Matrícula</option>
            <option value="confidence">Ordenar per Confiança</option>
          </select>
          
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="desc">Descendent</option>
            <option value="asc">Ascendent</option>
          </select>
        </div>
        
        <button
          onClick={() => setShowCameraTime(!showCameraTime)}
          className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
            showCameraTime 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {showCameraTime ? 'Temps Vídeo' : 'Temps Càmera'}
        </button>
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Matrícula</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Confiança</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">{showCameraTime ? 'Temps Càmera' : 'Temps Vídeo'}</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Sentit</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Orientació</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAndSortedReadings.map((reading) => (
              <tr key={reading.id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4">
                  <div className="font-mono text-lg font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg inline-block">
                    {reading.plate}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      reading.confidence >= 95 ? 'bg-green-500' : 
                      reading.confidence >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="font-semibold">{reading.confidence.toFixed(1)}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="w-4 h-4" />
                    <span className="font-mono text-lg">
                      {showCameraTime && reading.cameraTimestamp 
                        ? reading.cameraTimestamp 
                        : reading.videoTimestamp
                      }
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    reading.direction === 'entrada' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {reading.direction}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-4 h-4" />
                    <span className="capitalize">{reading.orientation}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAndSortedReadings.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No s'han trobat matrícules que coincideixin amb "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};