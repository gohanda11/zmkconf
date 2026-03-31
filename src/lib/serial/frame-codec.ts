import { crc8 } from './crc8';

export const FRAME_START = 0xAB;
export const MAX_FRAME_LEN = 512;
export const FRAME_TIMEOUT_MS = 100;

export function encodeFrame(cmdId: number, payload: number[]): Uint8Array {
  // [0xAB][LEN][CMD_ID][PAYLOAD...][CRC8]
  // LEN = CMD_ID byte + payload bytes
  const bodyLen = 1 + payload.length;
  if (bodyLen > 255) throw new Error(`Frame body too large: ${bodyLen} bytes (max 255)`);
  const body = new Uint8Array([cmdId, ...payload]);
  const len = body.length;
  const crcInput = new Uint8Array([len, ...body]);
  const checksum = crc8(crcInput);
  return new Uint8Array([FRAME_START, len, ...body, checksum]);
}

export class FrameDecoder {
  private buf: number[] = [];
  private lastByteMs = 0;

  feed(byte: number): Uint8Array | null {
    const now = Date.now();
    // Timeout: discard partial frame
    if (this.buf.length > 0 && (now - this.lastByteMs) > FRAME_TIMEOUT_MS) {
      this.buf = [];
    }
    this.lastByteMs = now;

    if (this.buf.length === 0) {
      if (byte !== FRAME_START) return null; // wait for start
    }
    this.buf.push(byte);

    // Need at least [START, LEN, CMD, CRC] = 4 bytes
    if (this.buf.length < 2) return null;

    const len = this.buf[1];
    if (len + 3 > MAX_FRAME_LEN) {
      this.buf = []; // oversized, discard
      return null;
    }

    const expected = 3 + len; // START + LEN + body(len bytes) + CRC
    if (this.buf.length < expected) return null;

    // Full frame received
    const frame = new Uint8Array(this.buf.splice(0, expected));
    const bodyWithLen = frame.slice(1, frame.length - 1); // [LEN, CMD, ...payload]
    const receivedCrc = frame[frame.length - 1];
    const computedCrc = crc8(bodyWithLen);

    if (receivedCrc !== computedCrc) {
      return null; // CRC mismatch, discard
    }

    return frame.slice(2, frame.length - 1); // returns [CMD_ID, STATUS?, ...payload]
  }
}
