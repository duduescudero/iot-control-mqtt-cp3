import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CONFIRMATION_TIMEOUT, HISTORY_LIMIT } from '../config/mqtt';
import { MqttService } from '../services/mqttService';
import { DEFAULT_PREFERENCES, loadPreferences, savePreferences } from '../services/storageService';
import { getColors } from '../themes/colors';
import type { Colors } from '../themes/colors';
import type { ConnectionState, LampState, MessageRecord, Notice, Preferences, Reading, ThemeMode } from '../types/mqtt';
import { parseMessage, validateBroker } from '../utils/validation';

interface PendingCommand { id: string; action: LampState }
interface IoTState {
  ready: boolean; preferences: Preferences; colors: Colors; connection: ConnectionState;
  temperature: Reading<number> | null; humidity: Reading<number> | null; lamp: Reading<LampState> | null;
  history: MessageRecord[]; notice: Notice | null; pending: PendingCommand | null;
  connect: (url?: string) => Promise<void>; disconnect: () => void;
  sendCommand: (action: LampState) => void; setTheme: (mode: ThemeMode) => void;
  saveBroker: (url: string) => Promise<boolean>; dismissNotice: () => void;
}
const Context = createContext<IoTState | undefined>(undefined);

export function IoTProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const prefs = useRef(preferences);
  const [connection, setConnection] = useState<ConnectionState>({ phase: 'disconnected', detail: 'Pronto para conectar' });
  const [temperature, setTemperature] = useState<Reading<number> | null>(null);
  const [humidity, setHumidity] = useState<Reading<number> | null>(null);
  const [lamp, setLamp] = useState<Reading<LampState> | null>(null);
  const [history, setHistory] = useState<MessageRecord[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pending, setPending] = useState<PendingCommand | null>(null);
  const pendingRef = useRef<PendingCommand | null>(null);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const service = useRef<MqttService | null>(null);
  if (!service.current) service.current = new MqttService();
  const activeBroker = useRef<string | null>(null);
  const serial = useRef(0);

  const notify = useCallback((value: Notice) => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice(value);
    noticeTimer.current = setTimeout(() => setNotice(null), 7_000);
  }, []);
  const clearPending = useCallback(() => {
    if (pendingTimer.current) clearTimeout(pendingTimer.current);
    pendingTimer.current = null; pendingRef.current = null; setPending(null);
  }, []);
  const addMessage = useCallback((message: Omit<MessageRecord, 'id'>) => {
    setHistory(current => [{ ...message, payload: message.payload.slice(0, 2_049), id: `${message.timestamp}-${++serial.current}` }, ...current].slice(0, HISTORY_LIMIT));
  }, []);

  useEffect(() => {
    let mounted = true;
    const mqtt = service.current!;
    const remove = mqtt.subscribe(event => {
      if (!mounted) return;
      if (event.type === 'status') {
        setConnection(event.state);
        if (event.state.phase !== 'connected' && event.state.phase !== 'connecting') clearPending();
        return;
      }
      const { topic, payload, timestamp } = event.message;
      const result = parseMessage(topic, payload);
      addMessage({ topic, payload, timestamp, direction: 'received', valid: result.ok,
        error: result.ok ? undefined : result.error });
      if (!result.ok) { notify({ tone: 'warning', message: `Mensagem ignorada: ${result.error}` }); return; }
      const data = result.data;
      if (data.kind === 'temperature') setTemperature({ value: data.value, updatedAt: timestamp });
      if (data.kind === 'humidity') setHumidity({ value: data.value, updatedAt: timestamp });
      if (data.kind === 'lamp') {
        setLamp({ value: data.value, updatedAt: timestamp });
        const command = pendingRef.current;
        if (command && command.action === data.value && (!data.requestId || command.id === data.requestId)) {
          clearPending();
          notify({ tone: 'success', message: `Dispositivo confirmou: lâmpada ${data.value === 'ON' ? 'ligada' : 'desligada'}.` });
        }
      }
    });
    loadPreferences().then(value => {
      if (mounted) { prefs.current = value; setPreferences(value); }
    }).catch(() => {
      if (mounted) notify({ tone: 'warning', message: 'Não foi possível recuperar as preferências. Usando a configuração padrão.' });
    }).finally(() => { if (mounted) setReady(true); });
    return () => {
      mounted = false; remove(); mqtt.dispose();
      if (pendingTimer.current) clearTimeout(pendingTimer.current);
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, [addMessage, clearPending, notify]);

  async function saveBroker(input: string): Promise<boolean> {
    try {
      const brokerUrl = validateBroker(input);
      const next = { ...prefs.current, brokerUrl };
      if (brokerUrl !== prefs.current.brokerUrl) {
        clearPending(); service.current!.disconnect();
        setTemperature(null); setHumidity(null); setLamp(null);
      }
      prefs.current = next; setPreferences(next);
      await savePreferences(next);
      notify({ tone: 'success', message: 'Endereço salvo neste dispositivo.' });
      return true;
    } catch (error: unknown) {
      notify({ tone: 'error', message: error instanceof Error ? error.message : 'Não foi possível salvar o endereço.' });
      return false;
    }
  }
  async function connect(input = prefs.current.brokerUrl): Promise<void> {
    let url: string;
    try { url = validateBroker(input); }
    catch (error: unknown) { notify({ tone: 'error', message: error instanceof Error ? error.message : 'Endereço inválido.' }); return; }
    if (url !== prefs.current.brokerUrl && !(await saveBroker(url))) return;
    clearPending();
    if (activeBroker.current !== url) { setTemperature(null); setHumidity(null); setLamp(null); }
    activeBroker.current = url;
    service.current!.connect(url);
  }
  function disconnect(): void { clearPending(); service.current!.disconnect(); }
  function sendCommand(action: LampState): void {
    if (pendingRef.current) return;
    try {
      const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const sent = service.current!.publish(action, id);
      addMessage({ ...sent, direction: 'sent', valid: true });
      const command = { id, action };
      pendingRef.current = command; setPending(command);
      pendingTimer.current = setTimeout(() => {
        clearPending();
        notify({ tone: 'warning', message: 'Comando enviado, mas sem confirmação em 6 segundos. Confira se o simulador está ativo.' });
      }, CONFIRMATION_TIMEOUT);
    } catch (error: unknown) {
      notify({ tone: 'error', message: error instanceof Error ? error.message : 'Não foi possível publicar o comando.' });
    }
  }
  function setTheme(theme: ThemeMode): void {
    const next = { ...prefs.current, theme };
    prefs.current = next; setPreferences(next);
    void savePreferences(next).catch(() => notify({ tone: 'warning', message: 'O tema foi aplicado, mas não pôde ser salvo neste dispositivo.' }));
  }
  return <Context.Provider value={{ ready, preferences, colors: getColors(preferences.theme), connection,
    temperature, humidity, lamp, history, notice, pending, connect, disconnect, sendCommand,
    setTheme, saveBroker, dismissNotice: () => setNotice(null) }}>{children}</Context.Provider>;
}

export function useIoT(): IoTState {
  const context = useContext(Context);
  if (!context) throw new Error('useIoT deve ser usado dentro de IoTProvider.');
  return context;
}
