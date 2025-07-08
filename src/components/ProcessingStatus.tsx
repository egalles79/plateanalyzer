import React from 'react';
import { Camera, Clock, CheckCircle, Loader } from 'lucide-react';
import { ProcessingStatus as ProcessingStatusType } from '../types';

interface ProcessingStatusProps {
  status: ProcessingStatusType;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ status }) => {
  const progress = status.totalFrames > 0 ? (status.currentFrame / status.totalFrames) * 100 : 0;

  if (!status.isProcessing) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 p-3 rounded-xl">
          <Camera className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Processant Vídeo</h3>
          <p className="text-gray-600">{status.fileName}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progrés del Processament</span>
          <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <Loader className="w-6 h-6 text-blue-600 mx-auto mb-2 animate-spin" />
          <p className="text-sm text-gray-600">Frame Actual</p>
          <p className="text-lg font-bold text-gray-900">{status.currentFrame}</p>
        </div>
        
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <Clock className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Total Frames</p>
          <p className="text-lg font-bold text-gray-900">{status.totalFrames}</p>
        </div>
        
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <CheckCircle className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Matrícules</p>
          <p className="text-lg font-bold text-gray-900">{status.detectedPlates}</p>
        </div>
        
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <Camera className="w-6 h-6 text-orange-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Taxa Detecció</p>
          <p className="text-lg font-bold text-gray-900">
            {status.currentFrame > 0 ? ((status.detectedPlates / status.currentFrame) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {/* Processing indicator */}
      <div className="mt-6 flex items-center justify-center gap-2 text-blue-600">
        <Loader className="w-5 h-5 animate-spin" />
        <span className="text-sm font-medium">Analitzant frames per detectar matrícules...</span>
      </div>
    </div>
  );
};