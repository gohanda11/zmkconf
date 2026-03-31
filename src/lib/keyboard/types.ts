export interface KeyThreshold {
  press: number;   // 0-255
  release: number; // 0-255
}

export interface KeyADCData {
  adc: number;      // 0-4095
  distance: number; // 0-255
}

export interface KeyCalibration {
  rest: number;   // ADC at rest
  bottom: number; // ADC at bottom-out
}

export interface LayoutKey {
  col: number;
  x: number;
  y: number;
  r?: number;
  rx?: number;
  ry?: number;
  label?: string;
}
