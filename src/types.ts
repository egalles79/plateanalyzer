export interface VehicleCount {
  car: number;
  truck: number;
  bus: number;
  coach: number;
  motorcycle: number;
}

export interface ProcessingStatus {
  isProcessing: boolean;
  currentFrame: number;
  totalFrames: number;
  percentage?: number;
  vehicleCounts?: VehicleCount;
  totalVehicles?: number;
  fileName?: string;
  startTime?: string;
}

export interface VehicleResult {
  id: string;
  timestamp: string;
  cars: number;
  trucks: number;
  buses: number;
  coaches: number;
  motorcycles: number;
  totalVehicles: number;
}

export interface ProcessingConfig {
  fileName: string;
  startTime: string;
  direction: string;
  orientation: string;
  motionThreshold: number;
}