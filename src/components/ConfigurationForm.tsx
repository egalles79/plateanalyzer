import React, { useState } from 'react';
import { Camera, Settings, Upload, Play, Clock } from 'lucide-react';
import { ProcessingConfig } from '../types';

interface ConfigurationFormProps {
  onStartProcessing: (config: ProcessingConfig) => void;
  isProcessing: boolean;
}

export const ConfigurationForm: React.FC<ConfigurationFormProps> = ({
  onStartProcessing,
  isProcessing
}) => {
  const [config, setConfig] = useState<ProcessingConfig>({
    fileName: '',
    videoFile: null as File | null,
    direction: 'entrada',
    orientation: 'nord',
    startTime: '',
    motionThreshold: 3.0,
    confidenceThreshold: 0.5
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (config.fileName && selectedFile && config.startTime) {
      // Crear la configuració final amb el fitxer
      const finalConfig: ProcessingConfig = {
        ...config,
        videoFile: selectedFile
      };
      onStartProcessing(finalConfig);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setConfig(prev => ({ ...prev, videoFile: file }));
      
      // Auto-generar nom del fitxer CSV
      if (!config.fileName) {
        updateFileName(file.name, config.direction, config.orientation);
      }
    }
  };

  const updateFileName = (videoName: string, direction: string, orientation: string) => {
    const baseName = videoName.replace(/\.[^/.]+$/, ''); // Eliminar extensió
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
    const generatedName = `${baseName}_${direction}_${orientation}_${timestamp}.csv`;
    setConfig(prev => ({ ...prev, fileName: generatedName }));
  };

  const handleDirectionChange = (newDirection: string) => {
    setConfig(prev => ({ ...prev, direction: newDirection }));
    if (selectedFile) {
      updateFileName(selectedFile.name, newDirection, config.orientation);
    }
  };

  const handleOrientationChange = (newOrientation: string) => {
    setConfig(prev => ({ ...prev, orientation: newOrientation }));
    if (selectedFile) {
      updateFileName(selectedFile.name, config.direction, newOrientation);
    }
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 8); // HH:MM:SS
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 p-3 rounded-xl">
          <Settings className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Configuració del Sistema</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Video Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Seleccionar Vídeo *
          </label>
          <div className="relative">
            <input
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
              id="video-upload"
              disabled={isProcessing}
            />
            <label
              htmlFor="video-upload"
              className={`flex items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                selectedFile
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="text-center">
                <Upload className={`w-8 h-8 mx-auto mb-2 ${selectedFile ? 'text-green-600' : 'text-gray-400'}`} />
                <p className={`text-sm font-medium ${selectedFile ? 'text-green-700' : 'text-gray-600'}`}>
                  {selectedFile ? selectedFile.name : 'Seleccionar fitxer de vídeo'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Formats suportats: MP4, AVI, MOV
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* File Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nom del Fitxer CSV de Sortida *
          </label>
          <input
            type="text"
            value={config.fileName}
            onChange={(e) => setConfig(prev => ({ ...prev, fileName: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="resultats.csv"
            required
            disabled={isProcessing}
          />
          <p className="text-xs text-gray-500 mt-1">
            S'auto-genera basant-se en el vídeo i configuració
          </p>
        </div>

        {/* Start Time */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Clock className="w-4 h-4 inline mr-1" />
            Hora d'Inici del Vídeo *
          </label>
          <div className="flex gap-3">
            <input
              type="time"
              value={config.startTime}
              onChange={(e) => setConfig(prev => ({ ...prev, startTime: e.target.value }))}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              step="1"
              required
              disabled={isProcessing}
            />
            <button
              type="button"
              onClick={() => setConfig(prev => ({ ...prev, startTime: getCurrentTime() }))}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
              disabled={isProcessing}
            >
              Ara
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Hora real quan comença el vídeo (format: HH:MM:SS)
          </p>
        </div>

        {/* Direction and Orientation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Sentit del Trànsit
            </label>
            <select
              value={config.direction}
              onChange={(e) => handleDirectionChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              disabled={isProcessing}
            >
              <option value="entrada">Entrada</option>
              <option value="sortida">Sortida</option>
              <option value="transit">Trànsit</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Orientació de la Càmera
            </label>
            <select
              value={config.orientation}
              onChange={(e) => handleOrientationChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              disabled={isProcessing}
            >
              <option value="nord">Nord</option>
              <option value="sud">Sud</option>
              <option value="est">Est</option>
              <option value="oest">Oest</option>
            </select>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuració Avançada</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Llindar de Moviment: {config.motionThreshold.toFixed(1)}%
              </label>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.1"
                value={config.motionThreshold}
                onChange={(e) => setConfig(prev => ({ ...prev, motionThreshold: parseFloat(e.target.value) }))}
                className="w-full"
                disabled={isProcessing}
              />
              <div className="text-xs text-gray-500 mt-1">
                Sensibilitat per detectar moviment entre frames
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confiança Mínima: {Math.round(config.confidenceThreshold * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={config.confidenceThreshold}
                onChange={(e) => setConfig(prev => ({ ...prev, confidenceThreshold: parseFloat(e.target.value) }))}
                className="w-full"
                disabled={isProcessing}
              />
              <div className="text-xs text-gray-500 mt-1">
                Confiança mínima per acceptar una detecció
              </div>
            </div>
          </div>
        </div>

        {/* Command Preview */}
        {config.fileName && selectedFile && config.startTime && (
          <div className="bg-gray-50 p-4 rounded-xl border">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Vista Prèvia de la Comanda:</h4>
            <code className="text-xs text-gray-600 break-all">
              python main3.py "{config.fileName}" "{selectedFile.name}" "{config.startTime}" --motion-threshold {config.motionThreshold} --confidence-threshold {config.confidenceThreshold}
            </code>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!config.fileName || !selectedFile || !config.startTime || isProcessing}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-3 ${
            !config.fileName || !selectedFile || !config.startTime || isProcessing
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105'
          }`}
        >
          <Play className="w-5 h-5" />
          {isProcessing ? 'Processant...' : 'Iniciar Processament'}
        </button>

        {/* Required fields notice */}
        <p className="text-xs text-gray-500 text-center">
          * Camps obligatoris
        </p>
      </form>
    </div>
  );
};