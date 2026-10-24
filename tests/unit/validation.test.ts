import { describe, expect, it } from 'vitest';
import { parseMessage, validateBroker } from '../../src/utils/validation';
import { TOPICS } from '../../src/config/mqtt';
describe('Validação de mensagens MQTT', () => {
  it('aceita temperatura e limites físicos documentados', () => {
    expect(parseMessage(TOPICS.temperature, '{"value":24.5}')).toEqual({ ok: true, data: { kind: 'temperature', value: 24.5 } });
    expect(parseMessage(TOPICS.temperature, '{"value":-50}').ok).toBe(true);
    expect(parseMessage(TOPICS.temperature, '{"value":101}').ok).toBe(false);
  });
  it.each(['{', 'null', '[]', '{"value":"24"}', '{"value":null}', '{"value":1e999}'])('rejeita payload inválido %s', payload => {
    expect(parseMessage(TOPICS.temperature, payload).ok).toBe(false);
  });
  it('valida a faixa da umidade', () => {
    for (const value of [0, 58, 100]) expect(parseMessage(TOPICS.humidity, JSON.stringify({ value })).ok).toBe(true);
    for (const value of [-1, 101]) expect(parseMessage(TOPICS.humidity, JSON.stringify({ value })).ok).toBe(false);
  });
  it('aceita estado confirmado e correlação opcional', () => {
    expect(parseMessage(TOPICS.lamp, '{"state":"ON","requestId":"abc"}')).toEqual({ ok: true, data: { kind: 'lamp', value: 'ON', requestId: 'abc' } });
    expect(parseMessage(TOPICS.lamp, '{"state":"OFF"}').ok).toBe(true);
    expect(parseMessage(TOPICS.lamp, '{"state":"ligada"}').ok).toBe(false);
  });
  it('rejeita tópico desconhecido e payload excessivo', () => {
    expect(parseMessage('outro/grupo', '{"value":10}').ok).toBe(false);
    expect(parseMessage(TOPICS.temperature, 'x'.repeat(2049)).ok).toBe(false);
  });
});
describe('URL do broker', () => {
  it('aceita apenas WebSocket com host válido', () => {
    expect(validateBroker(' ws://localhost:9001/mqtt ')).toBe('ws://localhost:9001/mqtt');
    expect(validateBroker('wss://test.mosquitto.org:8081/mqtt')).toContain('wss://');
  });
  it.each(['mqtt://localhost:1883', 'https://example.com', 'ws://localhost:1883', 'wss://localhost:8883', 'wss://user:secret@example.com/mqtt', 'invalido'])('rejeita %s', value => {
    expect(() => validateBroker(value)).toThrow();
  });
});
