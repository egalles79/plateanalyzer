export interface ProcessingConfig {
  fileName: string;
  videoFile: File;
  startTime: string;
  direction: 'entrada' | 'sortida';
  orientation: 'nord' | 'sud' | 'est' | 'oest';
  confidenceThreshold: number;
  motionThreshold: number;
}

export interface PlateReading {
  id: string;
  plate: string;
  confidence: number;
  videoTimestamp: string; // Format: "MM:SS" or "HH:MM:SS"
  cameraTimestamp?: string; // Optional camera timestamp if available
  realTimestamp?: string; // Real world timestamp
  direction: string;
  orientation: string;
  ocrEngine?: 'EasyOCR' | 'Tesseract' | 'PaddleOCR' | 'API'; // Quin motor OCR s'ha utilitzat
}

export interface ProcessingStatus {
  isProcessing: boolean;
  currentFrame: number;
  totalFrames: number;
  detectedPlates: number;
  fileName?: string;
  startTime?: string;
  cascadeStats?: CascadeStats; // Estadístiques del sistema cascada
}

export interface CascadeStats {
  easyOcrCount: number;
  tesseractCount: number;
  paddleOcrCount: number;
  apiCount: number;
  savedImagesCount: number;
  cacheHits: number;
}