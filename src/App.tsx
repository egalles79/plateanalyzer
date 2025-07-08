import React, { useState } from 'react';
import { Header } from './components/Header';
import { ConfigurationForm } from './components/ConfigurationForm';
import { ProcessingStatus } from './components/ProcessingStatus';
import { ResultsTable } from './components/ResultsTable';
import { ProcessingConfig, PlateReading, ProcessingStatus as ProcessingStatusType } from './types';

function App() {
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatusType>({
    isProcessing: false,
    currentFrame: 0,
    totalFrames: 0,
    detectedPlates: 0
  });

  const [plateReadings, setPlateReadings] = useState<PlateReading[]>([]);
  const [currentFileName, setCurrentFileName] = useState<string>('');

  const handleStartProcessing = (config: ProcessingConfig) => {
    setCurrentFileName(config.fileName);
    setPlateReadings([]);
    setProcessingStatus({
      isProcessing: true,
      currentFrame: 0,
      totalFrames: 1000, // Simulated total frames
      detectedPlates: 0,
      fileName: config.fileName
    });

    // Simulate processing with realistic data
    simulateProcessing(config);
  };

  const simulateProcessing = (config: ProcessingConfig) => {
    const totalFrames = 1000;
    let currentFrame = 0;
    let detectedPlates = 0;
    const newReadings: PlateReading[] = [];
    const fps = 25; // Assumim 25 fps per al càlcul del temps

    const samplePlates = [
      'ABC1234', 'DEF5678', 'GHI9012', 'JKL3456', 'MNO7890',
      'PQR2468', 'STU1357', 'VWX9753', 'YZA4682', 'BCD8642'
    ];

    const processFrame = () => {
      currentFrame++;
      
      // Simulate plate detection (roughly 1 in 50 frames)
      if (Math.random() < 0.02) {
        const plate = samplePlates[Math.floor(Math.random() * samplePlates.length)];
        const confidence = 90 + Math.random() * 10; // 90-100% confidence
        
        // Calcular el temps del vídeo basant-se en el frame actual
        const videoTimeInSeconds = Math.floor(currentFrame / fps);
        const minutes = Math.floor(videoTimeInSeconds / 60);
        const seconds = videoTimeInSeconds % 60;
        const videoTimestamp = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Simular timestamp de càmera (opcional)
        const cameraDate = new Date();
        cameraDate.setHours(cameraDate.getHours() - Math.floor(Math.random() * 24)); // Simular data de càmera
        const cameraTimestamp = cameraDate.toLocaleString('ca-ES');
        
        // Check if plate already exists (avoid duplicates)
        if (!newReadings.some(r => r.plate === plate)) {
          detectedPlates++;
          newReadings.push({
            id: `${Date.now()}-${plate}`,
            plate,
            confidence,
            videoTimestamp,
            cameraTimestamp,
            direction: config.direction,
            orientation: config.orientation
          });
        }
      }

      setProcessingStatus({
        isProcessing: true,
        currentFrame,
        totalFrames,
        detectedPlates,
        fileName: config.fileName
      });

      setPlateReadings([...newReadings]);

      if (currentFrame < totalFrames) {
        setTimeout(processFrame, 50); // Simulate processing time
      } else {
        // Processing complete
        setProcessingStatus({
          isProcessing: false,
          currentFrame: totalFrames,
          totalFrames,
          detectedPlates,
          fileName: config.fileName
        });
      }
    };

    processFrame();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <ConfigurationForm
            onStartProcessing={handleStartProcessing}
            isProcessing={processingStatus.isProcessing}
          />
          
          <ProcessingStatus status={processingStatus} />
          
          <ResultsTable
            readings={plateReadings}
            fileName={currentFileName}
          />
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            Sistema de Reconeixement de Matrícules - Utilitzant OpenALPR per a detecció precisa
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;