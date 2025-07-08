export interface ProcessingConfig {
  fileName: string;
  direction: 'entrada' | 'sortida';
  orientation: 'nord' | 'sud' | 'est' | 'oest';
  confidenceThreshold: number;
  frameComparisonThreshold: number;
}

export interface PlateReading {
  id: string;
  plate: string;
  confidence: number;
  videoTimestamp: string; // Format: "MM:SS" or "HH:MM:SS"
  cameraTimestamp?: string; // Optional camera timestamp if available
  direction: string;
  orientation: string;
}

export interface ProcessingStatus {
  isProcessing: boolean;
  currentFrame: number;
  totalFrames: number;
  detectedPlates: number;
  fileName?: string;
}