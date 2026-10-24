import { connect } from 'mqtt';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';

export const TOPIC_PREFIX = 'fiap/3espw/iot-control-g7c9e2';
export const DEFAULT_BROKER = 'wss://test.mosquitto.org:8081/mqtt';
export async function startSimulator({ url = DEFAULT_BROKER, intervalMs = 4000, confirmationDelayMs = 450, quiet = false } = {}) {
  if (!/^wss?:\/\//.test(url)) throw new Error('O simulador usa uma URL WebSocket ws:// ou wss://.');
  const client = connect(url, { clientId: `sim-${randomUUID().slice(0, 8)}`, protocolVersion: 4, clean: true, reconnectPeriod: 2000, connectTimeout: 10000 });
  let state = 'OFF'; let timer; let sequence = 0;
  const pending = new Set();
  const log = (...args) => { if (!quiet) console.log(...args); };
  const publish = (topic, payload, retain = true) => client.publish(`${TOPIC_PREFIX}/${topic}`, JSON.stringify(payload), { qos: 1, retain });
  const publishSensors = () => {
    const temperature = Number((24.5 + Math.sin(sequence / 4) * 1.6).toFixed(1));
    const humidity = Number((58 + Math.cos(sequence / 5) * 3).toFixed(1));
    publish('sensor/temperatura', { value: temperature }); publish('sensor/umidade', { value: humidity });
    log(`Telemetria: ${temperature} °C | ${humidity}%`); sequence += 1;
  };
  client.on('connect', () => {
    log(`Simulador conectado: ${url}`); log(`Tópicos: ${TOPIC_PREFIX}`);
    client.subscribe(`${TOPIC_PREFIX}/lampada/comando`, { qos: 1 }, error => {
      if (error) { console.error('Não foi possível inscrever o simulador:', error.message); return; }
      publish('lampada/estado', { state }); publishSensors();
      if (timer) clearInterval(timer);
      timer = setInterval(publishSensors, intervalMs);
    });
  });
  client.on('message', (topic, buffer) => {
    if (topic !== `${TOPIC_PREFIX}/lampada/comando` || buffer.length > 2048) return;
    let message;
    try { message = JSON.parse(buffer.toString()); } catch { log('Comando ignorado: JSON inválido.'); return; }
    if (!message || !['ON', 'OFF'].includes(message.action)) { log('Comando ignorado: action deve ser ON ou OFF.'); return; }
    const action = message.action;
    const requestId = typeof message.requestId === 'string' ? message.requestId : undefined;
    log(`Comando recebido: ${action}`);
    const confirmation = setTimeout(() => {
      pending.delete(confirmation); state = action;
      publish('lampada/estado', { state, ...(requestId ? { requestId } : {}) });
      log(`Estado confirmado: ${state}`);
    }, confirmationDelayMs);
    pending.add(confirmation);
  });
  client.on('error', error => { if (!quiet) console.error('Conexão MQTT:', error.message); });
  client.on('offline', () => { if (timer) clearInterval(timer); log('Simulador offline; aguardando reconexão.'); });
  return { client, close: async () => {
    if (timer) clearInterval(timer); for (const timeout of pending) clearTimeout(timeout);
    await client.endAsync(true);
  } };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const url = process.argv[2] ?? process.env.MQTT_BROKER_URL ?? DEFAULT_BROKER;
  const simulator = await startSimulator({ url });
  const shutdown = async () => { await simulator.close(); process.exit(0); };
  process.once('SIGINT', shutdown); process.once('SIGTERM', shutdown);
}
