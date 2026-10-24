import { Client } from 'paho-mqtt';
import type { Client as PahoClient } from 'paho-mqtt';
import { SUBSCRIPTIONS, TOPICS } from '../config/mqtt';
import type { ConnectionState, LampState, MqttEvent } from '../types/mqtt';
import { validateBroker } from '../utils/validation';

export type MqttClientPort = Pick<PahoClient,
  'connect' | 'disconnect' | 'isConnected' | 'subscribe' | 'unsubscribe' | 'send' |
  'onConnectionLost' | 'onMessageArrived'>;
export type ClientFactory = (url: string, clientId: string) => MqttClientPort;

/** Uma única conexão por instância; callbacks antigos são invalidados por geração. */
export class MqttService {
  private client: MqttClientPort | null = null;
  private listeners = new Set<(event: MqttEvent) => void>();
  private generation = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private retries = 0;
  private manualStop = true;
  private url = '';
  private state: ConnectionState = { phase: 'disconnected', detail: 'Pronto para conectar' };

  constructor(private createClient: ClientFactory = (url, id) => new Client(url, id)) {}

  subscribe(listener: (event: MqttEvent) => void): () => void {
    this.listeners.add(listener);
    listener({ type: 'status', state: this.state });
    return () => { this.listeners.delete(listener); };
  }

  private emit(event: MqttEvent): void { this.listeners.forEach(listener => listener(event)); }
  private status(state: ConnectionState): void { this.state = state; this.emit({ type: 'status', state }); }
  private clearRetry(): void {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
  }

  private releaseClient(): void {
    const old = this.client;
    this.client = null;
    if (!old) return;
    old.onConnectionLost = () => {};
    old.onMessageArrived = () => {};
    if (old.isConnected()) {
      for (const topic of SUBSCRIPTIONS) {
        try { old.unsubscribe(topic); } catch { /* A conexão pode já ter caído. */ }
      }
      try { old.disconnect(); } catch { /* O estado pode mudar durante o encerramento. */ }
    }
  }

  connect(input: string): void {
    const url = validateBroker(input);
    this.manualStop = false;
    this.retries = 0;
    this.url = url;
    this.clearRetry();
    this.start();
  }

  private start(): void {
    const generation = ++this.generation;
    this.releaseClient();
    this.status({ phase: 'connecting', detail: this.retries ? `Reconectando: tentativa ${this.retries}/3` : 'Conectando ao broker…' });
    let client: MqttClientPort;
    try {
      const id = `iot-${Date.now().toString(36).slice(-6)}-${Math.random().toString(36).slice(2, 8)}`;
      client = this.createClient(this.url, id);
      this.client = client;
    } catch {
      this.failed(generation, 'Não foi possível iniciar a conexão WebSocket.');
      return;
    }
    client.onMessageArrived = message => {
      if (generation !== this.generation || this.manualStop) return;
      this.emit({ type: 'message', message: {
        topic: message.destinationName,
        payload: message.payloadString,
        timestamp: Date.now(),
      } });
    };
    client.onConnectionLost = error => {
      if (generation !== this.generation || this.manualStop) return;
      if (error.errorCode !== 0) this.failed(generation, 'A conexão foi interrompida. Verifique a rede ou o broker.');
    };
    try {
      client.connect({
        timeout: 8,
        keepAliveInterval: 30,
        cleanSession: true,
        mqttVersion: 4,
        useSSL: this.url.startsWith('wss:'),
        reconnect: false,
        onSuccess: () => {
          if (generation !== this.generation || this.manualStop) {
            if (client.isConnected()) client.disconnect();
            return;
          }
          let remaining = SUBSCRIPTIONS.length;
          for (const topic of SUBSCRIPTIONS) {
            client.subscribe(topic, {
              qos: 1,
              timeout: 8,
              onSuccess: () => {
                if (generation !== this.generation || this.manualStop) return;
                remaining -= 1;
                if (remaining === 0) {
                  this.retries = 0;
                  this.status({ phase: 'connected', detail: 'Conectado · 3 tópicos inscritos' });
                }
              },
              onFailure: () => this.failed(generation, 'O broker não confirmou a inscrição nos tópicos.'),
            });
          }
        },
        onFailure: () => this.failed(generation, 'Não foi possível conectar. Confira o endereço WebSocket e a rede.'),
      });
    } catch {
      this.failed(generation, 'Falha ao abrir a conexão com o broker.');
    }
  }

  private failed(generation: number, detail: string): void {
    if (generation !== this.generation || this.manualStop) return;
    // Invalida também os callbacks de SUBACK de uma conexão parcialmente inscrita.
    this.generation += 1;
    this.releaseClient();
    this.clearRetry();
    const retry = this.retries < 3;
    this.status({ phase: 'error', detail: `${detail}${retry ? ' Nova tentativa em 3 segundos.' : ' Toque em Reconectar para tentar novamente.'}` });
    if (retry) {
      this.retries += 1;
      this.retryTimer = setTimeout(() => {
        this.retryTimer = null;
        if (!this.manualStop) this.start();
      }, 3_000);
    }
  }

  publish(action: LampState, requestId: string): { topic: string; payload: string; timestamp: number } {
    if (this.state.phase !== 'connected' || !this.client?.isConnected()) {
      throw new Error('Conecte-se ao broker antes de enviar um comando.');
    }
    const payload = JSON.stringify({ action, requestId });
    this.client.send(TOPICS.command, payload, 1, false);
    return { topic: TOPICS.command, payload, timestamp: Date.now() };
  }

  disconnect(): void {
    this.manualStop = true;
    this.generation += 1;
    this.clearRetry();
    this.releaseClient();
    this.status({ phase: 'disconnected', detail: 'Conexão encerrada' });
  }

  dispose(): void { this.disconnect(); this.listeners.clear(); }
}
