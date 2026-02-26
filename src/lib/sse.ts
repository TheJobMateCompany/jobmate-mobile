/**
 * SSEClient � Connexion Server-Sent Events via react-native-sse
 *
 * Utilise `react-native-sse` qui fournit un EventSource compatible
 * avec React Native / Hermes (contrairement � fetch + ReadableStream
 * qui n'est pas support� dans RN).
 */

import EventSource from 'react-native-sse';
import { getToken } from './storage';

// --- Types ---------------------------------------------------------------------

type SSEHandler = (data: unknown) => void;

interface SSEClientOptions {
  baseUrl: string;
  initialRetryMs?: number;
  maxRetryMs?: number;
}

// --- SSEClient -----------------------------------------------------------------

export class SSEClient {
  private readonly options: Required<SSEClientOptions>;
  private handlers: Map<string, Set<SSEHandler>> = new Map();
  private es: InstanceType<typeof EventSource> | null = null;
  private retryMs: number;
  private active = false;
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(options: SSEClientOptions) {
    this.options = {
      baseUrl: options.baseUrl,
      initialRetryMs: options.initialRetryMs ?? 1_000,
      maxRetryMs: options.maxRetryMs ?? 30_000,
    };
    this.retryMs = this.options.initialRetryMs;
  }

  subscribe(eventType: string, handler: SSEHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  connect(): void {
    if (this.active) return;
    void this._connect();
  }

  disconnect(): void {
    this.active = false;
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    this._closeES();
  }

  private _closeES(): void {
    if (this.es) {
      this.es.close();
      this.es = null;
    }
  }

  private async _connect(): Promise<void> {
    this.active = true;
    this._closeES();

    const token = await getToken();
    if (!token) {
      console.error('[SSEClient] Aucun token disponible � connexion annul�e');
      return;
    }

    const url = `${this.options.baseUrl}?token=${encodeURIComponent(token)}`;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    const es = new (EventSource as any)(url) as {
      addEventListener: (type: string, cb: (e: { data: string | null }) => void) => void;
      close: () => void;
      onerror: ((e: unknown) => void) | null;
      onopen: (() => void) | null;
    };
    this.es = es as unknown as InstanceType<typeof EventSource>;

    // Generic 'message' events
    es.addEventListener('message', (e) => {
      this._dispatch('message', e.data);
    });

    // Named event types already registered
    for (const eventType of this.handlers.keys()) {
      if (eventType === 'message') continue;
      es.addEventListener(eventType, (e) => {
        this._dispatch(eventType, e.data);
      });
    }

    es.onerror = () => {
      if (!this.active) return;
      console.warn(`[SSEClient] Erreur SSE, retry dans ${this.retryMs}ms`);
      this._closeES();
      this._scheduleRetry();
    };

    es.onopen = () => {
      this.retryMs = this.options.initialRetryMs;
    };
  }

  private _dispatch(eventType: string, rawData: string | null): void {
    if (!rawData) return;
    try {
      const data: unknown = JSON.parse(rawData);
      this.handlers.get(eventType)?.forEach((h) => h(data));
    } catch {
      console.warn('[SSEClient] Impossible de parser le message SSE :', rawData);
    }
  }

  private _scheduleRetry(): void {
    if (!this.active) return;
    this.retryTimeout = setTimeout(() => {
      void this._connect();
    }, this.retryMs);
    this.retryMs = Math.min(this.retryMs * 2, this.options.maxRetryMs);
  }
}

// --- Instance singleton ---------------------------------------------------------

export const sseClient = new SSEClient({
  baseUrl: 'https://api.meelkyway.com/events',
});
