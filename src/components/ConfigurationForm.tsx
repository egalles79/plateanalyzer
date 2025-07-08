import React, { useState } from 'react';
import { Camera, Settings, Upload, Play } from 'lucide-react';
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
    direction: 'entrada',
    orientation: 'nord',
    confidenceThreshold: 90,
    frameComparisonThreshold: 15
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (config.fileName && selectedFile) {
      onStartProcessing(config);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!config.fileName) {
        const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, '');
        setConfig(prev => ({ ...prev, fileName: nameWithoutExtension }));
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
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
            Seleccionar Vídeo
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
            Nom del Fitxer de Resultats
          </label>
          <input
            type="text"
            value={config.fileName}
            onChange={(e) => setConfig(prev => ({ ...prev, fileName: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="Introdueix el nom del fitxer"
            required
            disabled={isProcessing}
          />
        </div>

        {/* Direction and Orientation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Sentit del Trànsit
            </label>
            <select
              value={config.direction}
              onChange={(e) => setConfig(prev => ({ ...prev, direction: e.target.value as 'entrada' | 'sortida' }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              disabled={isProcessing}
            >
              <option value="entrada">Entrada</option>
              <option value="sortida">Sortida</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Orientació de la Càmera
            </label>
            <select
              value={config.orientation}
              onChange={(e) => setConfig(prev => ({ ...prev, orientation: e.target.value as any }))}
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
                Llindar de Confiança (%)
              </label>
              <input
                type="range"
                min="70"
                max="100"
                value={config.confidenceThreshold}
                onChange={(e) => setConfig(prev => ({ ...prev, confidenceThreshold: parseInt(e.target.value) }))}
                className="w-full"
                disabled={isProcessing}
              />
              <div className="text-center text-sm text-gray-600 mt-1">
                {config.confidenceThreshold}%
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sensibilitat de Detecció (%)
              </label>
              <input
                type="range"
                min="5"
                max="30"
                value={config.frameComparisonThreshold}
                onChange={(e) => setConfig(prev => ({ ...prev, frameComparisonThreshold: parseInt(e.target.value) }))}
                className="w-full"
                disabled={isProcessing}
              />
              <div className="text-center text-sm text-gray-600 mt-1">
                {config.frameComparisonThreshold}%
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!config.fileName || !selectedFile || isProcessing}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-3 ${
            !config.fileName || !selectedFile || isProcessing
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105'
          }`}
        >
          <Play className="w-5 h-5" />
          {isProcessing ? 'Processant...' : 'Iniciar Processament'}
        </button>
      </form>
    </div>
  );
};