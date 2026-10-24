import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Client as PahoClient } from 'paho-mqtt';
import { MqttService } from '../../src/services/mqttService';
import type { MqttClientPort } from '../../src/services/mqttService';
import { SUBSCRIPTIONS, TOPICS } from '../../src/config/mqtt';
import type { MqttEvent } from '../../src/types/mqtt';

class FakeClient implements MqttClientPort {
  connected = false;
  options?: Parameters<PahoClient['connect']>[0];
  onConnectionLost: PahoClient['onConnectionLost'] = () => {};
  onMessageArrived: PahoClient['onMessageArrived'] = () => {};
  connect = vi.fn((options: Parameters<PahoClient['connect']>[0]) => { this.options = options; });
  disconnect = vi.fn(() => { this.connected = false; });
  isConnected = () => this.connected;
  subscribe = vi.fn((_topic: string, options?: Parameters<PahoClient['subscribe']>[1]) => { options?.onSuccess?.({ invocationContext: undefined, grantedQos: 1 }); });
  unsubscribe = vi.fn();
  send: PahoClient['send'] = vi.fn();
  accept() { this.connected = true; this.options?.onSuccess?.({ invocationContext: undefined }); }
  fail() { this.options?.onFailure?.({ errorCode: 1, errorMessage: 'network', invocationContext: undefined }); }
}
function setup() {
  const clients: FakeClient[] = [];
  const events: MqttEvent[] = [];
  const service = new MqttService(() => { const client = new FakeClient(); clients.push(client); return client; });
  const remove = service.subscribe(event => events.push(event));
  return { service, clients, events, remove };
}
afterEach(() => vi.useRealTimers());
describe('Ciclo de vida MQTT', () => {
  it('assina os três tópicos antes de declarar conectado e publica sem retain', () => {
    const { service, clients, events } = setup();
    service.connect('ws://localhost:9001/mqtt'); clients[0].accept();
    expect(clients[0].subscribe.mock.calls.map(call => call[0])).toEqual(SUBSCRIPTIONS);
    expect(events.at(-1)).toEqual({ type: 'status', state: { phase: 'connected', detail: 'Conectado · 3 tópicos inscritos' } });
    service.publish('ON', 'request-1');
    expect(clients[0].send).toHaveBeenCalledWith(TOPICS.command, '{"action":"ON","requestId":"request-1"}', 1, false);
    service.dispose();
  });
  it('bloqueia publicação desconectada', () => {
    const { service } = setup(); expect(() => service.publish('ON', 'id')).toThrow(/Conecte-se/); service.dispose();
  });
  it('desinscreve e ignora callbacks atrasados após trocar conexão', () => {
    const { service, clients, events } = setup();
    service.connect('ws://localhost:9001/mqtt'); clients[0].accept();
    const stale = clients[0].onMessageArrived;
    service.connect('ws://localhost:9002/mqtt'); clients[1].accept();
    expect(clients[0].unsubscribe).toHaveBeenCalledTimes(3);
    expect(clients[0].disconnect).toHaveBeenCalledTimes(1);
    const count = events.length;
    stale({ destinationName: TOPICS.lamp, payloadString: '{"state":"ON"}' } as Paho.MQTT.Message);
    expect(events).toHaveLength(count);
    service.dispose();
  });
  it('cancela a reconexão automática quando o usuário desconecta', () => {
    vi.useFakeTimers(); const { service, clients } = setup();
    service.connect('ws://localhost:9001/mqtt'); clients[0].fail(); service.disconnect();
    vi.advanceTimersByTime(30_000); expect(clients).toHaveLength(1); service.dispose();
  });
  it('limita falhas consecutivas e mantém a ação manual disponível', () => {
    vi.useFakeTimers(); const { service, clients, events } = setup();
    service.connect('ws://localhost:9001/mqtt');
    for (let i = 0; i < 4; i++) { clients[i].fail(); vi.advanceTimersByTime(3_000); }
    expect(clients).toHaveLength(4);
    expect(events.at(-1)).toMatchObject({ type: 'status', state: { phase: 'error', detail: expect.stringContaining('Reconectar') } });
    service.dispose();
  });
  it('remove a assinatura de eventos da interface', () => {
    const { service, events, remove } = setup(); remove(); const count = events.length;
    service.connect('ws://localhost:9001/mqtt'); expect(events).toHaveLength(count); service.dispose();
  });
});
