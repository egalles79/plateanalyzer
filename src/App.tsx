import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, Play, FileText, Car, Truck, Bus, Bike, AlertCircle, CheckCircle, Mouse } from 'lucide-react';
import DetectionResults from './components/DetectionResults';

interface VehicleCounts {
  car: number;
  truck: number;
  bus: number;
  coach: number;
  motorcycle: number;
}

// ✅ ACTUALITZAR LA INTERFACE ProcessingStatus:
interface ProcessingStatus {
  isProcessing: boolean;
  currentFrame: number;
  totalFrames: number;
  progress?: number;  // ✅ AFEGIR AQUESTA PROPIETAT
  percentage?: number;
  vehicleCounts: VehicleCounts;
  totalVehicles: number;
  completed: boolean;
  error?: string;
  recent_detections?: Array<{  // ✅ AFEGIR AQUESTA PROPIETAT
    message: string;
    timestamp: string;
  }>;
}

interface Result {
  timestamp: string;
  cars: number;
  trucks: number;
  buses: number;
  coaches: number;
  motorcycles: number;
  total_vehicles: number;
}

interface CountingLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const App = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('output.csv');
  const [startTime, setStartTime] = useState('11:11:11');
  const [motionThreshold, setMotionThreshold] = useState(3.0);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [showLineSelector, setShowLineSelector] = useState(false);
  const [firstFrameImage, setFirstFrameImage] = useState<string | null>(null);
  const [countingLine, setCountingLine] = useState<CountingLine | null>(null);
  const [isDrawingLine, setIsDrawingLine] = useState(false);
  const [lineStart, setLineStart] = useState<{x: number, y: number} | null>(null);
  
  const [status, setStatus] = useState<ProcessingStatus>({
    isProcessing: false,
    currentFrame: 0,
    totalFrames: 0,
    vehicleCounts: { car: 0, truck: 0, bus: 0, coach: 0, motorcycle: 0 },
    totalVehicles: 0,
    completed: false
  });
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showDetections, setShowDetections] = useState(false);

  const [liveDetections, setLiveDetections] = useState([]);
  const [showLiveDetections, setShowLiveDetections] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const extractFirstFrame = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await fetch('http://localhost:5000/api/extract-first-frame', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setFirstFrameImage(imageUrl);
        setShowLineSelector(true);
        setError(null);
      } else {
        throw new Error('Error extraient el primer frame');
      }
    } catch (err: any) {
      setError(err.message || 'Error extraient el primer frame');
    }
  }, []);

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    if (!isDrawingLine) {
      setLineStart({ x, y });
      setIsDrawingLine(true);
    } else {
      if (lineStart) {
        const newLine: CountingLine = {
          x1: lineStart.x,
          y1: lineStart.y,
          x2: x,
          y2: y
        };
        setCountingLine(newLine);
        setIsDrawingLine(false);
        setLineStart(null);
        drawLine(newLine);
      }
    }
  }, [isDrawingLine, lineStart]);

  const drawLine = useCallback((line: CountingLine) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (imageRef.current) {
      ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
    }

    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 4;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(line.x1, line.y1);
    ctx.lineTo(line.x2, line.y2);
    ctx.stroke();

    ctx.fillStyle = '#ff0000';
    ctx.font = '20px Arial';
    ctx.fillText('LÍNIA DE COMPTATGE', line.x1 + 10, line.y1 - 10);
  }, []);

  const handleCanvasMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingLine || !lineStart || !canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(lineStart.x, lineStart.y);
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawingLine, lineStart]);

  const handleImageLoad = useCallback(() => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = imageRef.current.naturalWidth;
    canvas.height = imageRef.current.naturalHeight;
    ctx.drawImage(imageRef.current, 0, 0);
  }, []);

  // ✅ ACTUALITZAR LA FUNCIÓ fetchStatus:
  const fetchStatus = useCallback(async () => {
    if (!isProcessing) return;

    try {
      const response = await fetch('http://localhost:5000/api/status');
      if (response.ok) {
        const statusData: ProcessingStatus = await response.json();
        setStatus(statusData);
        
        // ✅ AFEGIR DEBUG
        console.log('Status actualitzat:', statusData);
        
        if (statusData.completed && !statusData.isProcessing) {
          setIsProcessing(false);
          
          const resultsResponse = await fetch('http://localhost:5000/api/results');
          if (resultsResponse.ok) {
            const resultsData = await resultsResponse.json();
            setResults(resultsData.results || []);
          }
        }
        
        if (statusData.error) {
          setError(statusData.error);
          setIsProcessing(false);
        }
      }
    } catch (err) {
      console.error('Error obtenint status:', err);
    }
  }, [isProcessing]);

  useEffect(() => {
    if (isProcessing) {
      intervalRef.current = setInterval(fetchStatus, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isProcessing, fetchStatus]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setShowLineSelector(false);
      setFirstFrameImage(null);
      setCountingLine(null);
      extractFirstFrame(file);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!selectedFile) {
      setError('Si us plau, selecciona un fitxer de vídeo');
      return;
    }

    if (!countingLine) {
      setError('Si us plau, defineix una línia de comptatge');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setShowLineSelector(false);
    setStatus({
      isProcessing: true,
      currentFrame: 0,
      totalFrames: 0,
      vehicleCounts: { car: 0, truck: 0, bus: 0, coach: 0, motorcycle: 0 },
      totalVehicles: 0,
      completed: false
    });
    setResults([]);

    const formData = new FormData();
    formData.append('video', selectedFile);
    formData.append('fileName', fileName);
    formData.append('startTime', startTime);
    formData.append('motionThreshold', motionThreshold.toString());
    formData.append('confidenceThreshold', confidenceThreshold.toString());
    formData.append('lineX1', countingLine.x1.toString());
    formData.append('lineY1', countingLine.y1.toString());
    formData.append('lineX2', countingLine.x2.toString());
    formData.append('lineY2', countingLine.y2.toString());

    try {
      const response = await fetch('http://localhost:5000/api/process-video', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en el servidor');
      }

      const data = await response.json();
      console.log('Processament iniciat:', data);
    } catch (err: any) {
      setError(err.message || 'Error processant el vídeo');
      setIsProcessing(false);
    }
  };

  const fetchLiveDetections = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/live-detections');
      const data = await response.json();
      
      if (response.ok && data.detections) {
        setLiveDetections(data.detections);
      }
    } catch (error) {
      console.error('Error fetching live detections:', error);
    }
  };

  // Actualitzar deteccions en temps real cada 2 segons durant el processament
  useEffect(() => {
    let interval;
    
    if (status.processing) {
      interval = setInterval(fetchLiveDetections, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status.processing]);

  const percentage = status.totalFrames > 0 
    ? Math.round((status.currentFrame / status.totalFrames) * 100) 
    : status.percentage || 0;

  const vehicleIcons = {
    car: { icon: Car, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Cotxes' },
    truck: { icon: Truck, color: 'text-green-600', bg: 'bg-green-100', label: 'Camions' },
    bus: { icon: Bus, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Autobusos' },
    coach: { icon: Bus, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Autocars' },
    motorcycle: { icon: Bike, color: 'text-red-600', bg: 'bg-red-100', label: 'Motos' }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🚗 Comptatge de Vehicles amb IA
          </h1>
          <p className="text-gray-600">
            Sistema intel·ligent de detecció i comptatge de vehicles en vídeos
          </p>
        </div>

        {/* Selector de línia de comptatge */}
        {showLineSelector && firstFrameImage && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              <Mouse className="inline mr-2" />
              Definir Línia de Comptatge
            </h2>
            <p className="text-gray-600 mb-4">
              Clica dos punts per definir la línia de comptatge. Els vehicles només es comptaran quan creuin aquesta línia.
            </p>
            
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="relative inline-block">
                <img
                  ref={imageRef}
                  src={firstFrameImage}
                  alt="Primer frame"
                  onLoad={handleImageLoad}
                  className="hidden"
                />
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  onMouseMove={handleCanvasMouseMove}
                  className="border cursor-crosshair max-w-full max-h-96"
                  style={{ width: 'auto', height: 'auto' }}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {!isDrawingLine && !countingLine && "Clica el primer punt de la línia"}
                {isDrawingLine && "Clica el segon punt per completar la línia"}
                {countingLine && "✅ Línia de comptatge definida"}
              </div>
              
              {countingLine && (
                <button
                  onClick={() => {
                    setCountingLine(null);
                    setIsDrawingLine(false);
                    setLineStart(null);
                    if (canvasRef.current && imageRef.current) {
                      const ctx = canvasRef.current.getContext('2d');
                      if (ctx) {
                        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                        ctx.drawImage(imageRef.current, 0, 0);
                      }
                    }
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Esborrar Línia
                </button>
              )}
            </div>
          </div>
        )}

        {/* Formulari de configuració */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fitxer de Vídeo
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="video-upload"
                    disabled={isProcessing}
                  />
                  <label htmlFor="video-upload" className="cursor-pointer">
                    {selectedFile ? (
                      <span className="text-blue-600 font-medium">{selectedFile.name}</span>
                    ) : (
                      <span className="text-gray-500">Clica per seleccionar un vídeo</span>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom del fitxer CSV
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isProcessing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temps d'inici (HH:MM:SS)
                </label>
                <input
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="11:11:11"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isProcessing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Llindar de moviment
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={motionThreshold}
                  onChange={(e) => setMotionThreshold(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isProcessing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confiança mínima
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isProcessing}
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={!selectedFile || !countingLine || isProcessing}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="mr-2 h-4 w-4" />
                {isProcessing ? 'Processant...' : countingLine ? 'Iniciar Processament' : 'Defineix una línia de comptatge primer'}
              </button>
            </div>
          </form>
        </div>

        {/* ✅ BARRA DE PROGRES I STATUS EN TEMPS REAL */}
        {isProcessing && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Estat del Processament</h2>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Progres: Frame {status.currentFrame.toLocaleString()} de {status.totalFrames.toLocaleString()}
                </span>
                <span className="text-sm font-medium text-blue-600">
                  {status.progress ? status.progress.toFixed(1) : percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ 
                    width: `${Math.min(status.progress || percentage, 100)}%` 
                  }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
              {(Object.entries(vehicleIcons) as Array<[keyof VehicleCounts, typeof vehicleIcons[keyof typeof vehicleIcons]]>).map(([key, config]) => {
                const count = status.vehicleCounts[key] || 0;
                const IconComponent = config.icon;
                
                return (
                  <div key={key} className={`${config.bg} rounded-lg p-4 text-center`}>
                    <IconComponent className={`h-8 w-8 ${config.color} mx-auto mb-2`} />
                    <div className="text-2xl font-bold text-gray-800">{count}</div>
                    <div className="text-sm text-gray-600">{config.label}</div>
                  </div>
                );
              })}

              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-gray-800 mb-1">
                  {status.totalVehicles}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>

            {/* ✅ DETECCIONS RECENTS */}
            {status.recent_detections && status.recent_detections.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">🚨 Deteccions Recents:</h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {status.recent_detections.slice(-5).reverse().map((detection, index) => (
                    <div key={index} className="text-xs p-2 bg-green-100 rounded border-l-4 border-green-500">
                      <span className="text-green-800 font-semibold">{detection.timestamp}</span>
                      <span className="text-green-700 ml-2">{detection.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Missatges d'error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-1 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Resultats finals */}
        {(status.completed || status.totalVehicles > 0) && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">
                {status.completed ? 'Processament Completat' : 'Resultats Parcials'}
              </h2>
            </div>
            
            {/* ✅ COMPTADORS FINALS/PARCIALS */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              {(Object.entries(vehicleIcons) as Array<[keyof VehicleCounts, typeof vehicleIcons[keyof typeof vehicleIcons]]>).map(([key, config]) => {
                const count = status.vehicleCounts[key] || 0;
                const IconComponent = config.icon;
                
                return (
                  <div key={key} className={`${config.bg} rounded-lg p-4 text-center`}>
                    <IconComponent className={`h-8 w-8 ${config.color} mx-auto mb-2`} />
                    <div className="text-2xl font-bold text-gray-800">{count}</div>
                    <div className="text-sm text-gray-600">{config.label}</div>
                  </div>
                );
              })}

              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-gray-800 mb-1">
                  {status.totalVehicles}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>

            {/* ✅ BOTÓ DE DESCÀRREGA SEMPRE DISPONIBLE */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  // Descarregar CSV
                  fetch('http://localhost:5000/api/download-csv')
                    .then(response => response.blob())
                    .then(blob => {
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'resultats_vehicles.csv';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    })
                    .catch(err => console.error('Error descarregant CSV:', err));
                }}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <FileText className="inline mr-2 h-4 w-4" />
                Descarregar CSV
              </button>
            </div>
            
            {/* Taula de resultats si existeix */}
            {results.length > 0 && (
              <div className="overflow-x-auto mt-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Temps
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cotxes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Camions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Autobusos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Autocars
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Motos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.map((result, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.timestamp}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.cars}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.trucks}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.buses}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.coaches}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.motorcycles}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {result.total_vehicles}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Resultats de detecció */}
        {status.completed && (
          <>
            {/* Botó per mostrar deteccions */}
            <div className="flex gap-4 justify-center mt-6">
              <button
                onClick={() => setShowDetections(!showDetections)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {showDetections ? '🔽 Amagar' : '🔼 Mostrar'} Deteccions Detallades
              </button>
            </div>
            
            {/* Component de deteccions */}
            <DetectionResults isVisible={showDetections} />
          </>
        )}

        {/* Resultats parcials durant el processament */}
        {status.isProcessing && (
          <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                📊 Resultats Parcials (Total Comptatge)
              </h3>
              <div className="text-sm text-gray-600">
                Actualització automàtica cada 2 segons
              </div>
            </div>
            
            {/* ✅ TAULA DE COMPTADORS TOTALS (IGUAL QUE ABANS) */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{status.vehicleCounts.car || 0}</div>
                <div className="text-sm text-gray-600">🚗 Cotxes</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{status.vehicleCounts.truck || 0}</div>
                <div className="text-sm text-gray-600">🚚 Camions</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{status.vehicleCounts.bus || 0}</div>
                <div className="text-sm text-gray-600">🚌 Autobusos</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{status.vehicleCounts.coach || 0}</div>
                <div className="text-sm text-gray-600">🚐 Autocars</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{status.vehicleCounts.motorcycle || 0}</div>
                <div className="text-sm text-gray-600">🏍️ Motos</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">
                  {status.totalVehicles || 0}
                </div>
                <div className="text-sm text-gray-600">📈 Total</div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ TAULA DE DETECCIONS DETALLADES EN TEMPS REAL */}
        {status.processing && (
          <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                🔍 Deteccions Detallades en Temps Real ({liveDetections.length})
              </h3>
              <button
                onClick={() => setShowLiveDetections(!showLiveDetections)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {showLiveDetections ? '🔽 Amagar' : '🔼 Mostrar'} Detalls
              </button>
            </div>
            
            {showLiveDetections && (
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipus</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Posició</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Frame</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {liveDetections.slice().reverse().map((detection, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-mono">
                          {detection.timestamp}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {detection.track_id}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          <span className="font-medium capitalize">{detection.vehicle_type}</span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          <div className="flex items-center">
                            <div 
                              className="w-4 h-4 rounded-full mr-2 border"
                              style={{ 
                                backgroundColor: detection.color_rgb ? 
                                  `rgb(${detection.color_rgb[0]}, ${detection.color_rgb[1]}, ${detection.color_rgb[2]})` : 
                                  '#gray'
                              }}
                            ></div>
                            {detection.color}
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-mono text-gray-500">
                          ({Math.round(detection.center_x)}, {Math.round(detection.center_y)})
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {detection.frame_number}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {liveDetections.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-lg font-medium">Esperant deteccions...</div>
                    <div className="text-sm">Les deteccions apareixeran aquí en temps real</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;