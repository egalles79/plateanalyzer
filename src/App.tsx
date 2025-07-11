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

  // Funció per obtenir metadades del vídeo
  const getVideoMetadata = (file: File): Promise<{ duration: number; fps: number; totalFrames: number }> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        const duration = video.duration; // duració en segons
        // FPS és difícil d'obtenir directament del DOM, assumim 25 fps per defecte
        const fps = 25; // Valor per defecte, el Python script calcularà el real
        const totalFrames = Math.floor(duration * fps);

        resolve({
          duration,
          fps,
          totalFrames
        });

        // Neteja
        URL.revokeObjectURL(video.src);
      };

      video.onerror = () => {
        reject(new Error('Error carregant el vídeo'));
        URL.revokeObjectURL(video.src);
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const handleStartProcessing = async (config: ProcessingConfig) => {
    setCurrentFileName(config.fileName);
    setPlateReadings([]);
    
    try {
      // Obtenir metadades del vídeo
      console.log('Obtenint metadades del vídeo...');
      const videoMetadata = await getVideoMetadata(config.videoFile);
      
      console.log('Metadades del vídeo:', videoMetadata);
      console.log(`Duració: ${videoMetadata.duration.toFixed(2)} segons`);
      console.log(`FPS estimat: ${videoMetadata.fps}`);
      console.log(`Total frames estimat: ${videoMetadata.totalFrames}`);

      setProcessingStatus({
        isProcessing: true,
        currentFrame: 0,
        totalFrames: videoMetadata.totalFrames,
        detectedPlates: 0,
        fileName: config.fileName,
        startTime: config.startTime
      });

      // Processar el vídeo amb Python
      await processVideoWithPython(config, videoMetadata);
      
    } catch (error) {
      console.error('Error processant el vídeo:', error);
      alert('Error processant el vídeo. Comprova que el fitxer sigui vàlid i que el backend estigui funcionant.');
      setProcessingStatus(prev => ({
        ...prev,
        isProcessing: false
      }));
    }
  };

  const processVideoWithPython = async (config: ProcessingConfig, videoMetadata: { duration: number; fps: number; totalFrames: number }) => {
    try {
      // Crear FormData per enviar el fitxer
      const formData = new FormData();
      formData.append('video', config.videoFile);
      formData.append('fileName', config.fileName);
      formData.append('startTime', config.startTime);
      formData.append('direction', config.direction);
      formData.append('orientation', config.orientation);
      formData.append('motionThreshold', config.motionThreshold.toString());
      formData.append('confidenceThreshold', config.confidenceThreshold.toString());

      console.log('Iniciant processament del vídeo...');
      console.log(`Equivalent a: python main3.py "${config.fileName}" "${config.videoFile.name}" "${config.startTime}" --motion-threshold ${config.motionThreshold} --confidence-threshold ${config.confidenceThreshold}`);

      // Crida al backend Flask (port 5000)
      const response = await fetch('http://localhost:5000/api/process-video', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Resposta del servidor:', result);

      // Començar polling per obtenir l'estat
      if (result.status === 'started') {
        await pollProcessingStatus();
      } else {
        throw new Error(result.error || 'Error desconegut');
      }

    } catch (error) {
      console.error('Error en processVideoWithPython:', error);
      setProcessingStatus(prev => ({
        ...prev,
        isProcessing: false
      }));
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        alert('Error de connexió. Assegura\'t que el backend estigui executant-se a http://localhost:5000\n\nPer iniciar el backend:\n1. Obre un terminal\n2. cd "carpeta del projecte"\n3. python post.py');
      } else {
        alert(`Error processant el vídeo: ${error.message}`);
      }
      
      throw error;
    }
  };

  const pollProcessingStatus = async () => {
    const poll = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/status');
        
        if (!response.ok) {
          throw new Error(`Error obtenint estat: ${response.status}`);
        }
        
        const status = await response.json();
        
        setProcessingStatus(prev => ({
          ...prev,
          isProcessing: status.isProcessing,
          currentFrame: status.currentFrame,
          totalFrames: status.totalFrames || prev.totalFrames,
          detectedPlates: status.detectedPlates
        }));

        // Actualitzar resultats si n'hi ha
        if (status.results && status.results.length > 0) {
          const readings: PlateReading[] = status.results.map((result: any, index: number) => ({
            id: `${Date.now()}-${index}`,
            plate: result.license_plate_text,
            confidence: result.license_plate_text_score,
            videoTimestamp: result.video_timestamp,
            cameraTimestamp: result.camera_timestamp,
            realTimestamp: result.real_timestamp,
            direction: result.direction,
            orientation: result.orientation
          }));
          
          setPlateReadings(readings);
        }

        // Continuar polling si encara s'està processant
        if (status.isProcessing) {
          setTimeout(poll, 1000); // Poll cada segon
        } else {
          // Processament completat, obtenir resultats finals
          await fetchFinalResults();
        }
        
      } catch (error) {
        console.error('Error en polling:', error);
        setProcessingStatus(prev => ({
          ...prev,
          isProcessing: false
        }));
        alert('Error obtenint l\'estat del processament. El backend pot haver-se desconnectat.');
      }
    };
    
    // Començar el polling
    poll();
  };

  const fetchFinalResults = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/results');
      
      if (!response.ok) {
        throw new Error(`Error obtenint resultats: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('Resultats finals:', data);
      
      if (data.detections && Array.isArray(data.detections)) {
        const readings: PlateReading[] = data.detections.map((result: any, index: number) => ({
          id: `${Date.now()}-${index}`,
          plate: result.license_plate_text,
          confidence: result.license_plate_text_score,
          videoTimestamp: result.video_timestamp,
          cameraTimestamp: result.camera_timestamp,
          realTimestamp: result.real_timestamp,
          direction: result.direction,
          orientation: result.orientation
        }));
        
        setPlateReadings(readings);
      }
      
      setProcessingStatus(prev => ({
        ...prev,
        isProcessing: false,
        totalFrames: data.totalFrames || prev.totalFrames,
        detectedPlates: data.totalDetections || prev.detectedPlates
      }));
      
      // Mostrar missatge de finalització
      const message = `Processament completat!\n` +
                     `Frames processats: ${data.totalFrames || 'N/A'}\n` +
                     `Matrícules detectades: ${data.totalDetections || plateReadings.length}\n` +
                     `Fitxer CSV: ${currentFileName}`;
      
      alert(message);
      
    } catch (error) {
      console.error('Error obtenint resultats finals:', error);
      alert('Error obtenint els resultats finals del processament.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Status de connexió */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${processingStatus.isProcessing ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {processingStatus.isProcessing ? 'Processant...' : 'Sistema llest'}
                </span>
              </div>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('http://localhost:5000/health');
                    if (response.ok) {
                      const data = await response.json();
                      alert(`Backend connectat: ${data.message}`);
                    }
                  } catch (error) {
                    alert('Backend no disponible. Assegura\'t d\'executar: python post.py');
                  }
                }}
                className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors"
              >
                Comprovar Backend
              </button>
            </div>
          </div>

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
            Sistema de Reconeixement de Matrícules - Integració amb Python backend
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Backend: http://localhost:5000 | Frontend: http://localhost:5173
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;