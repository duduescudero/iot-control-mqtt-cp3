export type ConnectionPhase = 'disconnected' | 'connecting' | 'connected' | 'error';
export type LampState = 'ON' | 'OFF';
export type ThemeMode = 'light' | 'dark';
export type Tab = 'dashboard' | 'history' | 'settings';
export interface ConnectionState { phase: ConnectionPhase; detail: string }
export interface Reading<T> { value: T; updatedAt: number }
export interface Preferences { brokerUrl: string; theme: ThemeMode }
export interface MessageRecord {
  id: string;
  topic: string;
  payload: string;
  timestamp: number;
  direction: 'sent' | 'received';
  valid: boolean;
  error?: string;
}
export interface IncomingMessage { topic: string; payload: string; timestamp: number }
export type ParsedMessage =
  | { kind: 'temperature' | 'humidity'; value: number }
  | { kind: 'lamp'; value: LampState; requestId?: string };
export type ParseResult = { ok: true; data: ParsedMessage } | { ok: false; error: string };
export type MqttEvent = { type: 'status'; state: ConnectionState } | { type: 'message'; message: IncomingMessage };
export interface Notice { message: string; tone: 'success' | 'warning' | 'error' }
