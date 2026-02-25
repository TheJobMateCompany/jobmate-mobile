/**
 * SSEClient — Connexion Server-Sent Events via fetch streaming
 *
 * ⚠️ React Native ne fournit PAS l'API EventSource du navigateur.
 *    Implémentation via fetch + ReadableStream (disponible dans Hermes/Expo SDK 50+).
 *
 * Usage :
 *   const client = new SSEClient('https://api.meelkyway.com/events', token);
 *   client.subscribe('job_discovered', (data) => { ... });
 *   client.subscribe('job_scored', (data) => { ... });
 *   client.connect();
 *   // Cleanup :
 *   client.disconnect();
 */

import { getToken } from './storage';

// ─── Types ────────────────────────────────────────────────────────────────────

type SSEHandler = (data: unknown) => void;

interface SSEClientOptions {
  baseUrl: string;
  /** Délai initial de reconnexion en ms (défaut : 1000) */
  initialRetryMs?: number;
  /** Délai max de reconnexion en ms (défaut : 30 000) */
  maxRetryMs?: number;
}

// ─── SSEClient ────────────────────────────────────────────────────────────────

export class SSEClient {
  private readonly options: Required<SSEClientOptions>;
  private handlers: Map<string, Set<SSEHandler>> = new Map();
  private abortController: AbortController | null = null;
  private retryMs: number;
  private isConnected = false;
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(options: SSEClientOptions) {
    this.options = {
      baseUrl: options.baseUrl,
      initialRetryMs: options.initialRetryMs ?? 1000,
      maxRetryMs: options.maxRetryMs ?? 30_000,
    };
    this.retryMs = this.options.initialRetryMs;
  }

  // ─── API publique ───────────────────────────────────────────────────────────

  subscribe(eventType: string, handler: SSEHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    // Retourne une fonction unsubscribe
    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  connect(): void {
    if (this.isConnected) return;
    void this._connect();
  }

  disconnect(): void {
    this.isConnected = false;
    this.abortController?.abort();
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }

  // ─── Implémentation interne ─────────────────────────────────────────────────

  private async _connect(): Promise<void> {
    this.isConnected = true;
    this.abortController = new AbortController();

    try {
      const token = await getToken();
      if (!token) {
        console.error('[SSEClient] Aucun token disponible — connexion annulée');
        return;
      }

      const url = `${this.options.baseUrl}?token=${encodeURIComponent(token)}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream non disponible');
      }

      // Réinitialiser le backoff après une connexion réussie
      this.retryMs = this.options.initialRetryMs;

      await this._readStream(response.body);
    } catch (err) {
      if (!this.isConnected) return; // Déconnexion intentionnelle

      const error = err as Error;
      if (error.name === 'AbortError') return;

      console.warn(`[SSEClient] Erreur de connexion, retry dans ${this.retryMs}ms :`, error.message);
      this._scheduleRetry();
    }
  }

  private async _readStream(body: ReadableStream<Uint8Array>): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (this.isConnected) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Découper les messages SSE (séparés par \n\n)
        const messages = buffer.split('\n\n');
        buffer = messages.pop() ?? '';

        for (const message of messages) {
          this._parseAndDispatch(message);
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Fin du stream sans erreur = reconnexion si toujours actif
    if (this.isConnected) {
      this._scheduleRetry();
    }
  }

  private _parseAndDispatch(message: string): void {
    let eventType = 'message';
    let dataStr = '';

    for (const line of message.split('\n')) {
      if (line.startsWith('event:')) {
        eventType = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataStr += line.slice(5).trim();
      }
    }

    if (!dataStr) return;

    try {
      const data: unknown = JSON.parse(dataStr);
      const handlers = this.handlers.get(eventType);
      if (handlers) {
        handlers.forEach((handler) => handler(data));
      }
    } catch {
      console.warn('[SSEClient] Impossible de parser le message SSE :', dataStr);
    }
  }

  private _scheduleRetry(): void {
    if (!this.isConnected) return;

    this.retryTimeout = setTimeout(() => {
      void this._connect();
    }, this.retryMs);

    // Backoff exponentiel plafonné à maxRetryMs
    this.retryMs = Math.min(this.retryMs * 2, this.options.maxRetryMs);
  }
}

// ─── Instance singleton ────────────────────────────────────────────────────────

export const sseClient = new SSEClient({
  baseUrl: 'https://api.meelkyway.com/events',
});
