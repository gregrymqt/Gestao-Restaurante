import {
  TenantStreamEvent,
  SseConnectionState,
} from '../types/sse.types';
import { env } from '../config/env';

type EventCallback = (event: TenantStreamEvent) => void;
type StatusCallback = (status: SseConnectionState) => void;
type VoidCallback = () => void;

interface SseConnectOptions {
  url?: string;
  token: string;
  tenantId: string;
}

class SseClient {
  private abortController: AbortController | null = null;
  private connectionState: SseConnectionState = 'DISCONNECTED';
  private reconnectAttempt = 0;
  private reconnectTimeoutId: any = null;
  private heartbeatTimeoutId: any = null;
  private lastHeartbeatTimestamp = 0;

  private currentOptions: SseConnectOptions | null = null;
  private eventListeners: Set<EventCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();
  private unauthorizedListeners: Set<VoidCallback> = new Set();

  private isManualDisconnect = false;

  public getState(): SseConnectionState {
    return this.connectionState;
  }

  public onEvent(callback: EventCallback): () => void {
    this.eventListeners.add(callback);
    return () => this.eventListeners.delete(callback);
  }

  public onStatusChange(callback: StatusCallback): () => void {
    this.statusListeners.add(callback);
    callback(this.connectionState);
    return () => this.statusListeners.delete(callback);
  }

  public onUnauthorized(callback: VoidCallback): () => void {
    this.unauthorizedListeners.add(callback);
    return () => this.unauthorizedListeners.delete(callback);
  }

  private setStatus(newState: SseConnectionState): void {
    if (this.connectionState !== newState) {
      this.connectionState = newState;
      this.statusListeners.forEach((listener) => {
        try {
          listener(newState);
        } catch (e) {
          console.warn('[SSE] Erro no listener de status:', e);
        }
      });
    }
  }

  public connect(options: SseConnectOptions): void {
    this.isManualDisconnect = false;
    this.currentOptions = options;
    this.reconnectAttempt = 0;
    this.startStreaming();
  }

  public disconnect(): void {
    this.isManualDisconnect = true;
    this.clearTimers();
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.setStatus('DISCONNECTED');
  }

  private clearTimers(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    if (this.heartbeatTimeoutId) {
      clearTimeout(this.heartbeatTimeoutId);
      this.heartbeatTimeoutId = null;
    }
  }

  private resetHeartbeatWatchdog(): void {
    if (this.heartbeatTimeoutId) {
      clearTimeout(this.heartbeatTimeoutId);
    }
    this.lastHeartbeatTimestamp = Date.now();

    // Se nenhum heartbeat ou evento chegar em 45 segundos, aborta e reconecta
    this.heartbeatTimeoutId = setTimeout(() => {
      if (this.connectionState === 'CONNECTED') {
        console.warn('[SSE] Heartbeat timeout (45s sem resposta). Reiniciando conexão...');
        if (this.abortController) {
          this.abortController.abort();
        }
      }
    }, 45000);
  }

  private async startStreaming(): Promise<void> {
    if (!this.currentOptions || this.isManualDisconnect) return;
    if (this.currentOptions.token?.startsWith('mock-jwt-token')) {
      console.warn('[SSE] Token de simulação (mock) detectado. Abortando conexão de streaming.');
      this.setStatus('DISCONNECTED');
      return;
    }

    this.clearTimers();
    this.setStatus(this.reconnectAttempt === 0 ? 'CONNECTING' : 'RECONNECTING');

    this.abortController = new AbortController();
    const defaultBase = env.apiUrl;
    const streamUrl = this.currentOptions.url || `${defaultBase}/events/stream`;

    try {
      const response = await fetch(streamUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.currentOptions.token}`,
          'X-Tenant-Id': this.currentOptions.tenantId,
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
          'ngrok-skip-browser-warning': 'true',
        },
        signal: this.abortController.signal,
      });

      if (response.status === 401 || response.status === 403) {
        console.warn('[SSE] Acesso negado (401/403). Abortando reconexão...');
        this.setStatus('DISCONNECTED');
        this.unauthorizedListeners.forEach((l) => l());
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Conexão estabelecida com sucesso
      this.reconnectAttempt = 0;
      this.setStatus('CONNECTED');
      this.resetHeartbeatWatchdog();

      // Leitura contínua do ReadableStream
      if (response.body && typeof response.body.getReader === 'function') {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          this.resetHeartbeatWatchdog();
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const block of parts) {
            this.processSseBlock(block);
          }
        }
      } else {
        // Fallback para ambientes sem streaming body completo
        const text = await response.text();
        this.resetHeartbeatWatchdog();
        const parts = text.split('\n\n');
        for (const block of parts) {
          this.processSseBlock(block);
        }
      }

      // Se a resposta terminar naturalmente sem abort manual, agenda reconexão
      if (!this.isManualDisconnect) {
        this.scheduleReconnect();
      }
    } catch (error: any) {
      if (this.isManualDisconnect || error?.name === 'AbortError') {
        return;
      }

      console.warn('[SSE] Falha na conexão de streaming:', error.message || error);
      this.scheduleReconnect();
    }
  }

  private processSseBlock(block: string): void {
    const lines = block.split('\n');
    let eventType = '';
    let dataPayload = '';
    let correlationId = '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Comentários SSE (heartbeat keep-alive ou handshake)
      if (line.startsWith(':')) {
        this.resetHeartbeatWatchdog();
        continue;
      }

      if (line.startsWith('event:')) {
        eventType = line.substring(6).trim();
      } else if (line.startsWith('data:')) {
        const content = line.substring(5).trim();
        dataPayload = dataPayload ? `${dataPayload}\n${content}` : content;
      } else if (line.startsWith('id:')) {
        correlationId = line.substring(3).trim();
      }
    }

    if (eventType && dataPayload) {
      const streamEvent: TenantStreamEvent = {
        eventType,
        payloadJson: dataPayload,
        timestamp: new Date().toISOString(),
        correlationId: correlationId || `corr-${Date.now().toString(36)}`,
      };

      this.eventListeners.forEach((listener) => {
        try {
          listener(streamEvent);
        } catch (e) {
          console.warn('[SSE] Erro ao despachar evento para listener:', e);
        }
      });
    }
  }

  private scheduleReconnect(): void {
    if (this.isManualDisconnect) return;

    this.setStatus('RECONNECTING');
    this.reconnectAttempt++;

    // Backoff exponencial com jitter (1s, 2s, 4s, 8s... até teto de 30s)
    const baseDelay = Math.min(1000 * Math.pow(2, this.reconnectAttempt - 1), 30000);
    const jitter = Math.random() * 1000;
    const finalDelay = Math.round(baseDelay + jitter);

    this.clearTimers();
    this.reconnectTimeoutId = setTimeout(() => {
      this.startStreaming();
    }, finalDelay);
  }

  /**
   * Permite emitir eventos simulados para testes da UI em ambiente de desenvolvimento local
   */
  public simulateEvent(event: TenantStreamEvent): void {
    this.eventListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (e) {
        console.warn('[SSE Simulado] Erro ao despachar evento simulado:', e);
      }
    });
  }
}

export const sseClient = new SseClient();
