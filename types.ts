export interface ReelData {
  address: string;
  mobile: string;
  addressScale: number;
  mobileScale: number;
}

export interface VideoDimensions {
  width: number;
  height: number;
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}