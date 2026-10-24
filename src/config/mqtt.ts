export const DEFAULT_BROKER = 'wss://test.mosquitto.org:8081/mqtt';
export const TOPIC_PREFIX = 'fiap/3espw/iot-control-g7c9e2';
export const TOPICS = {
  temperature: `${TOPIC_PREFIX}/sensor/temperatura`,
  humidity: `${TOPIC_PREFIX}/sensor/umidade`,
  command: `${TOPIC_PREFIX}/lampada/comando`,
  lamp: `${TOPIC_PREFIX}/lampada/estado`,
} as const;
export const SUBSCRIPTIONS = [TOPICS.temperature, TOPICS.humidity, TOPICS.lamp];
export const HISTORY_LIMIT = 10;
export const CONFIRMATION_TIMEOUT = 6_000;
