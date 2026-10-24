import { TOPICS } from '../config/mqtt';
import type { ParseResult } from '../types/mqtt';

export function validateBroker(input: string): string {
  if (input.length > 512) throw new Error('O endereço do broker é muito longo.');
  let url: URL;
  try { url = new URL(input.trim()); }
  catch { throw new Error('Informe uma URL completa, como wss://test.mosquitto.org:8081/mqtt.'); }
  if (!['ws:', 'wss:'].includes(url.protocol) || !url.hostname) {
    throw new Error('Use ws:// ou wss:// com a porta WebSocket do broker.');
  }
  if (['1883', '8883'].includes(url.port)) {
    throw new Error('1883 e 8883 são portas MQTT TCP usuais. Informe a porta WebSocket do broker.');
  }
  if (url.username || url.password || url.hash) {
    throw new Error('Use uma URL sem credenciais ou fragmentos. Este projeto usa brokers sem autenticação.');
  }
  return url.toString();
}

export function parseMessage(topic: string, payload: string): ParseResult {
  const fail = (error: string): ParseResult => ({ ok: false, error });
  if (payload.length > 2_048) return fail('Mensagem maior que 2 KB.');
  let json: unknown;
  try { json = JSON.parse(payload) as unknown; }
  catch { return fail('O conteúdo não é um JSON válido.'); }
  if (!json || typeof json !== 'object' || Array.isArray(json)) return fail('Esperado um objeto JSON.');
  const object = json as Record<string, unknown>;
  if (topic === TOPICS.temperature || topic === TOPICS.humidity) {
    const value = object.value;
    if (typeof value !== 'number' || !Number.isFinite(value)) return fail('value deve ser um número finito.');
    if (topic === TOPICS.humidity && (value < 0 || value > 100)) return fail('Umidade deve estar entre 0 e 100%.');
    if (topic === TOPICS.temperature && (value < -50 || value > 100)) return fail('Temperatura fora da faixa de -50 a 100 °C.');
    return { ok: true, data: { kind: topic === TOPICS.temperature ? 'temperature' : 'humidity', value } };
  }
  if (topic === TOPICS.lamp) {
    if (object.state !== 'ON' && object.state !== 'OFF') return fail('state deve ser ON ou OFF.');
    const requestId = typeof object.requestId === 'string' ? object.requestId : undefined;
    return { ok: true, data: { kind: 'lamp', value: object.state, requestId } };
  }
  return fail('Tópico não reconhecido pelo aplicativo.');
}
