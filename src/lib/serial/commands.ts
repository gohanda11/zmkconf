export enum HEBallCmd {
  GET_VERSION         = 0x01,
  GET_NUM_KEYS        = 0x02,
  GET_THRESHOLDS      = 0x03,
  SET_THRESHOLD       = 0x04,
  SET_THRESHOLDS_BULK = 0x05,
  GET_ADC_VALUES      = 0x06,
  SAVE_SETTINGS       = 0x07,
  RESET_DEFAULTS      = 0x08,
  GET_CALIBRATION     = 0x09,
  RECALIBRATE         = 0x0A,
  STREAM_ADC_START    = 0x10,
  STREAM_ADC_STOP     = 0x11,
  STREAM_ADC_DATA     = 0x12,
}

export const STATUS_OK    = 0x00;
export const STATUS_ERROR = 0xFF;

export interface CommandResponse {
  cmdId: number;
  status: number;
  payload: Uint8Array;
}

export interface StreamADCData {
  keys: Array<{ index: number; adc: number; distance: number }>;
}
