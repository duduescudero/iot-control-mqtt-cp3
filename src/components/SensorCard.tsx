import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useIoT } from '../context/IoTContext';
import type { Reading } from '../types/mqtt';
import { formatTime } from '../utils/format';
import { Icon } from './Icon';
export function SensorCard({ kind, reading }: { kind: 'temperature' | 'humidity'; reading: Reading<number> | null }) {
  const { colors } = useIoT();
  const temperature = kind === 'temperature';
  const tint = temperature ? colors.orange : colors.blue;
  const value = reading ? reading.value.toLocaleString('pt-BR', { minimumFractionDigits: temperature ? 1 : 0, maximumFractionDigits: 1 }) : '—';
  return <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
    <View style={[styles.icon, { backgroundColor: temperature ? colors.orangeSoft : colors.blueSoft }]}><Icon name={temperature ? 'temperature' : 'humidity'} color={tint} size={22}/></View>
    <Text style={[styles.title, { color: colors.muted }]}>{temperature ? 'Temperatura' : 'Umidade'}</Text>
    <View style={styles.valueRow}><Text testID={`${kind}-value`} style={[styles.value, { color: colors.text }]}>{value}</Text><Text style={[styles.unit, { color: colors.faint }]}>{temperature ? '°C' : '%'}</Text></View>
    <View style={[styles.divider, { backgroundColor: colors.border }]}/><Text style={[styles.time, { color: colors.muted }]}>{reading ? `Atualizado ${formatTime(reading.updatedAt)}` : 'Aguardando leitura'}</Text>
  </View>;
}
const styles = StyleSheet.create({card: { flex: 1, minWidth: 135, padding: 19, borderWidth: 1, borderRadius: 22 }, icon: { width: 41, height: 41, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }, title: { fontSize: 13, fontWeight: '600', marginBottom: 5 }, valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5 }, value: { fontSize: 36, fontWeight: '700', letterSpacing: -1.5 }, unit: { fontSize: 18, fontWeight: '500' }, divider: { height: 1, marginTop: 16, marginBottom: 12 }, time: { fontSize: 10.5 }});
