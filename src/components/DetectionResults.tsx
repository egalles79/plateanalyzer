// ✅ CREAR src/components/DetectionResults.tsx:

import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Clock, Car, Palette, Camera, RefreshCw } from 'lucide-react';

interface Detection {
  id: number;
  timestamp: string;
  precise_timestamp: string;
  track_id: string;
  vehicle_type: string;
  vehicle_subtype: string;
  color: string;
  color_rgb: string;
  frame_number: number;
  center_x: number;
  center_y: number;
  confidence: number;
  size_category: string;
  crossed_line: boolean;
  image_saved: string;
}

interface DetectionResultsProps {
  isVisible: boolean;
}

const DetectionResults: React.FC<DetectionResultsProps> = ({ isVisible }) => {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [filteredDetections, setFilteredDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDetections = async () => {
    if (!isVisible) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/vehicle-detections');
      const data = await response.json();
      
      if (response.ok && data.detections) {
        setDetections(data.detections);
        setFilteredDetections(data.detections);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      fetchDetections();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
      {/* ✅ AFEGIR INFORMACIÓ DE DEBUG */}
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-bold text-yellow-800 mb-2">🔍 Informació de Debug:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <strong>Total deteccions:</strong> {detections.length}
          </div>
          <div>
            <strong>Vehicles únics:</strong> {new Set(detections.map(d => d.track_id)).size}
          </div>
          <div>
            <strong>Última detecció:</strong> {detections[0]?.timestamp || 'Cap'}
          </div>
        </div>
        {detections.length > 0 && (
          <div className="mt-2 text-xs text-gray-600">
            <strong>Rangs de colors RGB detectats:</strong> 
            {detections.slice(0, 3).map((d, i) => (
              <span key={i} className="ml-2">
                {d.color}: {d.color_rgb}
              </span>
            ))}
          </div>
        )}
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        🚗 Deteccions de Vehicles ({filteredDetections.length})
      </h2>
      
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Carregant deteccions...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipus
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Color
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDetections.map((detection, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {detection.timestamp}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {detection.vehicle_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {detection.color}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DetectionResults;