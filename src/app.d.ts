// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	// WebSerial API type declarations
	interface Serial {
		requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
		getPorts(): Promise<SerialPort[]>;
	}

	interface SerialPortRequestOptions {
		filters?: SerialPortFilter[];
	}

	interface SerialPortFilter {
		usbVendorId?: number;
		usbProductId?: number;
	}

	interface SerialPort {
		readable: ReadableStream<Uint8Array> | null;
		writable: WritableStream<Uint8Array> | null;
		open(options: SerialOptions): Promise<void>;
		close(): Promise<void>;
	}

	interface SerialOptions {
		baudRate: number;
		dataBits?: number;
		stopBits?: number;
		parity?: 'none' | 'even' | 'odd';
		bufferSize?: number;
		flowControl?: 'none' | 'hardware';
	}

	interface Navigator {
		serial?: Serial;
	}
}

export {};
