import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_BROKER } from '../config/mqtt';
import type { Preferences } from '../types/mqtt';
import { validateBroker } from '../utils/validation';

const KEY = '@iot-control/preferences-v1';
export const DEFAULT_PREFERENCES: Preferences = { brokerUrl: DEFAULT_BROKER, theme: 'dark' };
let writes: Promise<void> = Promise.resolve();

export async function loadPreferences(): Promise<Preferences> {
  const value = await AsyncStorage.getItem(KEY);
  if (!value) return DEFAULT_PREFERENCES;
  const parsed: unknown = JSON.parse(value) as unknown;
  if (!parsed || typeof parsed !== 'object') throw new Error('Preferências locais inválidas.');
  const object = parsed as Record<string, unknown>;
  if (typeof object.brokerUrl !== 'string' || !['light', 'dark'].includes(String(object.theme))) {
    throw new Error('Preferências locais inválidas.');
  }
  return { brokerUrl: validateBroker(object.brokerUrl), theme: object.theme as Preferences['theme'] };
}

export function savePreferences(preferences: Preferences): Promise<void> {
  const snapshot = JSON.stringify(preferences);
  const operation = writes.catch(() => {}).then(() => AsyncStorage.setItem(KEY, snapshot));
  writes = operation;
  return operation;
}
