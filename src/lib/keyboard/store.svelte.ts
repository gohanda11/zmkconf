import { SvelteMap } from 'svelte/reactivity';
import { SerialTransport } from '$lib/serial/transport';
import { HEBallCmd } from '$lib/serial/commands';
import type { KeyThreshold, KeyADCData } from './types';
import { globalColToLocalIndex } from './layout';

export class HEBallStore {
  transport = new SerialTransport();
  thresholds = new SvelteMap<string, KeyThreshold>();
  adcValues = new SvelteMap<string, KeyADCData>();
  selectedCol = $state<number | null>(null);
  streaming = $state(false);
  rightNumKeys = $state(0);
  status = $state('Disconnected');

  keyId(col: number) {
    const loc = globalColToLocalIndex(col);
    return loc ? `${loc.half}:${loc.index}` : null;
  }

  async connect() {
    try {
      this.status = 'Connecting...';
      await this.transport.connect();
      this.status = 'Loading thresholds...';
      await this.loadAllThresholds();
      this.status = 'Connected';
    } catch (e) {
      this.status = `Error: ${(e as Error).message}`;
      throw e;
    }
  }

  async disconnect() {
    if (this.streaming) await this.stopStreaming();
    await this.transport.disconnect();
    this.status = 'Disconnected';
  }

  private async loadAllThresholds() {
    // Get right half key count
    const numResp = await this.transport.sendCommand(HEBallCmd.GET_NUM_KEYS, [0x00]);
    this.rightNumKeys = numResp.payload[0] ?? 24;

    // Load thresholds for each right half key
    const thResp = await this.transport.sendCommand(HEBallCmd.GET_THRESHOLDS, [0x00]);
    const data = thResp.payload;
    for (let i = 0; i < this.rightNumKeys && i * 2 + 1 < data.length; i++) {
      const col = i + 28; // right half cols are 28-51
      const id = this.keyId(col);
      if (id) {
        this.thresholds.set(id, { press: data[i * 2], release: data[i * 2 + 1] });
      }
    }
  }

  async setThreshold(col: number, press: number, release: number) {
    const loc = globalColToLocalIndex(col);
    if (!loc || loc.half !== 'right') return; // only right half in Phase 3
    const id = this.keyId(col)!;
    const prev = this.thresholds.get(id);
    // Optimistic update
    this.thresholds.set(id, { press, release });
    try {
      // Send to firmware
      await this.transport.sendCommand(HEBallCmd.SET_THRESHOLD, [
        0x00, loc.index, press, release
      ]);
    } catch (e) {
      // Rollback on failure
      if (prev) {
        this.thresholds.set(id, prev);
      } else {
        this.thresholds.delete(id);
      }
      throw e;
    }
  }

  async saveSettings() {
    await this.transport.sendCommand(HEBallCmd.SAVE_SETTINGS, [0x00]);
  }

  async resetDefaults() {
    await this.transport.sendCommand(HEBallCmd.RESET_DEFAULTS, [0x00]);
    await this.loadAllThresholds();
  }

  async startStreaming() {
    this.transport.onStreamData((data) => {
      // data: [key_idx(1), adc_hi(1), adc_lo(1), distance(1), ...]
      for (let i = 0; i + 3 < data.length; i += 4) {
        const keyIdx = data[i];
        const adc = (data[i + 1] << 8) | data[i + 2];
        const distance = data[i + 3];
        const col = keyIdx + 28;
        const id = this.keyId(col);
        if (id) this.adcValues.set(id, { adc, distance });
      }
    });
    await this.transport.sendCommand(HEBallCmd.STREAM_ADC_START, [0x00]);
    this.streaming = true;
  }

  async stopStreaming() {
    await this.transport.sendCommand(HEBallCmd.STREAM_ADC_STOP, [0x00]);
    this.transport.onStreamData(null);
    this.streaming = false;
  }
}

export const keyboard = new HEBallStore();
