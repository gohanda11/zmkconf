import { SvelteMap } from 'svelte/reactivity';
import { SerialTransport } from '$lib/serial/transport.svelte';
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
  leftNumKeys = $state(0);
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
    // Load right half (half=0x00)
    const rightNumResp = await this.transport.sendCommand(HEBallCmd.GET_NUM_KEYS, [0x00]);
    this.rightNumKeys = rightNumResp.payload[0] ?? 24;

    const rightThResp = await this.transport.sendCommand(HEBallCmd.GET_THRESHOLDS, [0x00]);
    const rightData = rightThResp.payload;
    for (let i = 0; i < this.rightNumKeys && i * 2 + 1 < rightData.length; i++) {
      const col = i + 28; // right half cols 28-51
      const id = this.keyId(col);
      if (id) {
        let press = rightData[i * 2];
        let release = rightData[i * 2 + 1];
        // Ensure firmware invariant: press > release for hysteresis
        if (press <= release || press === 0) { press = 60; release = 30; }
        this.thresholds.set(id, { press, release });
      }
    }

    // Load left half (half=0x01, forwarded via BLE)
    try {
      const leftNumResp = await this.transport.sendCommand(HEBallCmd.GET_NUM_KEYS, [0x01]);
      this.leftNumKeys = leftNumResp.payload[0] ?? 27;

      const leftThResp = await this.transport.sendCommand(HEBallCmd.GET_THRESHOLDS, [0x01]);
      const leftData = leftThResp.payload;
      for (let i = 0; i < this.leftNumKeys && i * 2 + 1 < leftData.length; i++) {
        const col = i; // left half cols 0-26
        const id = this.keyId(col);
        if (id) {
          let press = leftData[i * 2];
          let release = leftData[i * 2 + 1];
          if (press <= release || press === 0) { press = 60; release = 30; }
          this.thresholds.set(id, { press, release });
        }
      }
    } catch {
      // Left half unavailable (BLE not connected) — continue without it
      this.leftNumKeys = 27; // assume default
    }
  }

  async setThreshold(col: number, press: number, release: number) {
    const loc = globalColToLocalIndex(col);
    if (!loc) return;
    // Enforce firmware invariant: press > release
    if (press <= release) throw new Error(`Press (${press}) must be > release (${release})`);
    press = Math.min(255, Math.max(1, Math.round(press)));
    release = Math.min(254, Math.max(0, Math.round(release)));
    const half = loc.half === 'right' ? 0x00 : 0x01;
    const id = this.keyId(col)!;
    const prev = this.thresholds.get(id);
    // Optimistic update
    this.thresholds.set(id, { press, release });
    try {
      // Send to firmware (left half forwarded via BLE from right half)
      await this.transport.sendCommand(HEBallCmd.SET_THRESHOLD, [
        half, loc.index, press, release
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
    try { await this.transport.sendCommand(HEBallCmd.SAVE_SETTINGS, [0x01]); } catch { /* BLE may be unavailable */ }
  }

  async resetDefaults() {
    await this.transport.sendCommand(HEBallCmd.RESET_DEFAULTS, [0x00]);
    try { await this.transport.sendCommand(HEBallCmd.RESET_DEFAULTS, [0x01]); } catch { /* BLE may be unavailable */ }
    await this.loadAllThresholds();
  }

  async startStreaming() {
    const rightNumKeys = this.rightNumKeys;
    const leftNumKeys = this.leftNumKeys;
    this.transport.onStreamData((data) => {
      // Stream format: [key_idx, adc_lo, adc_hi, dist] × N  (little-endian ADC)
      const numEntries = Math.floor(data.length / 4);
      // Distinguish halves by key count (right=24, left=27 — different by design)
      const isLeft = numEntries === leftNumKeys && numEntries !== rightNumKeys;
      for (let i = 0; i + 3 < data.length; i += 4) {
        const keyIdx = data[i];
        const adc = data[i + 1] | (data[i + 2] << 8); // little-endian
        const distance = data[i + 3];
        const col = isLeft ? keyIdx : keyIdx + 28;
        const id = this.keyId(col);
        if (id) this.adcValues.set(id, { adc, distance });
      }
    });
    await this.transport.sendCommand(HEBallCmd.STREAM_ADC_START, [0x00]);
    try { await this.transport.sendCommand(HEBallCmd.STREAM_ADC_START, [0x01]); } catch { /* BLE may be unavailable */ }
    this.streaming = true;
  }

  async stopStreaming() {
    await this.transport.sendCommand(HEBallCmd.STREAM_ADC_STOP, [0x00]);
    try { await this.transport.sendCommand(HEBallCmd.STREAM_ADC_STOP, [0x01]); } catch { /* BLE may be unavailable */ }
    this.transport.onStreamData(null);
    this.streaming = false;
  }
}

export const keyboard = new HEBallStore();
