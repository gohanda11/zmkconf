import { encodeFrame, FrameDecoder } from './frame-codec';
import { HEBallCmd, STATUS_OK, type CommandResponse } from './commands';

const RESPONSE_TIMEOUT_MS = 2000;

export class SerialTransport {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private decoder = new FrameDecoder();
  private pendingCommands = new Map<number, {
    resolve: (r: CommandResponse) => void;
    reject: (e: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }>();
  private streamCallback: ((data: Uint8Array) => void) | null = null;
  private commandQueue: Array<() => Promise<void>> = [];
  private queueRunning = false;
  connected = $state(false);
  lastError = $state<string | null>(null);

  private readLoopPromise: Promise<void> | null = null;
  private disconnecting = false;

  async connect(): Promise<void> {
    if (!('serial' in navigator)) {
      throw new Error('WebSerial API not supported. Use Chrome or Edge.');
    }
    if (this.port) await this.disconnect();
    this.lastError = null;
    const port = await navigator.serial!.requestPort({
      filters: [{ usbVendorId: 0x1D50, usbProductId: 0x615E }]
    });
    await port.open({ baudRate: 115200 });
    this.port = port;
    this.writer = port.writable!.getWriter();
    this.reader = port.readable!.getReader();
    this.connected = true;
    this.readLoopPromise = this.startReadLoop();
  }

  async disconnect(): Promise<void> {
    if (this.disconnecting) return;
    this.disconnecting = true;
    this.connected = false;
    this.pendingCommands.forEach(p => {
      clearTimeout(p.timer);
      p.reject(new Error('Disconnected'));
    });
    this.pendingCommands.clear();

    // Capture refs and null them to prevent reuse
    const reader = this.reader;
    const writer = this.writer;
    const port = this.port;
    const readLoop = this.readLoopPromise;
    this.reader = null;
    this.writer = null;
    this.port = null;
    this.readLoopPromise = null;

    // Cancel the read stream, then wait for startReadLoop to exit
    try { await reader?.cancel(); } catch { /* ignore */ }
    try { await readLoop; } catch { /* ignore */ }
    // Safe to release lock after startReadLoop has exited
    try { reader?.releaseLock(); } catch { /* ignore */ }

    try { await writer?.close(); } catch { /* ignore */ }
    try { await port?.close(); } catch { /* ignore */ }

    this.disconnecting = false;
  }

  private async startReadLoop(): Promise<void> {
    const reader = this.reader;
    if (!reader) return;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          for (const byte of value) {
            const frame = this.decoder.feed(byte);
            if (frame) this.handleFrame(frame);
          }
        }
      }
    } catch (e) {
      if (this.connected) {
        const msg = e instanceof Error ? e.message : String(e);
        this.lastError = `Read error: ${msg}`;
      }
    }
    // Unexpected disconnect (e.g. USB unplugged) — fire-and-forget cleanup
    if (this.connected) void this.disconnect();
  }

  private handleFrame(frame: Uint8Array): void {
    if (frame.length < 2) return;
    const cmdId = frame[0];

    if (cmdId === HEBallCmd.STREAM_ADC_DATA) {
      this.streamCallback?.(frame.slice(1));
      return;
    }

    const pending = this.pendingCommands.get(cmdId);
    if (pending) {
      clearTimeout(pending.timer);
      this.pendingCommands.delete(cmdId);
      const status = frame[1] ?? STATUS_OK;
      if (status !== STATUS_OK) {
        pending.reject(new Error(`Command 0x${cmdId.toString(16)} failed with status 0x${status.toString(16)}`));
      } else {
        pending.resolve({
          cmdId,
          status,
          payload: frame.slice(2)
        });
      }
    }
  }

  async sendCommand(cmd: HEBallCmd, payload: number[] = []): Promise<CommandResponse> {
    if (!this.writer) throw new Error('Not connected');
    return new Promise<CommandResponse>((outerResolve, outerReject) => {
      this.commandQueue.push(async () => {
        try {
          const frame = encodeFrame(cmd, payload);
          await this.writer!.write(frame);
          const result = await new Promise<CommandResponse>((resolve, reject) => {
            const timer = setTimeout(() => {
              this.pendingCommands.delete(cmd);
              reject(new Error(`Command 0x${cmd.toString(16)} timed out`));
            }, RESPONSE_TIMEOUT_MS);
            this.pendingCommands.set(cmd, { resolve, reject, timer });
          });
          outerResolve(result);
        } catch (e) {
          outerReject(e instanceof Error ? e : new Error(String(e)));
        }
      });
      this.drainQueue();
    });
  }

  private async drainQueue(): Promise<void> {
    if (this.queueRunning) return;
    this.queueRunning = true;
    try {
      while (this.commandQueue.length > 0) {
        const task = this.commandQueue.shift()!;
        await task();
      }
    } finally {
      this.queueRunning = false;
    }
  }

  onStreamData(cb: ((data: Uint8Array) => void) | null): void {
    this.streamCallback = cb;
  }
}
