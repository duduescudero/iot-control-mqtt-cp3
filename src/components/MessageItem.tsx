import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useIoT } from '../context/IoTContext';
import type { MessageRecord } from '../types/mqtt';
import { formatTime } from '../utils/format';
import { Icon } from './Icon';
export function MessageItem({ message }: { message: MessageRecord }) {
  const { colors } = useIoT();
  const sent = message.direction === 'sent';
  return <View testID="message-item" style={[styles.card, { backgroundColor: colors.surface, borderColor: message.valid ? colors.border : colors.danger }]}>
    <View style={styles.header}><View style={styles.direction}><Icon name={sent ? 'arrowUp' : 'arrowDown'} size={16} color={sent ? colors.orange : colors.accent}/><Text style={[styles.label, { color: sent ? colors.orange : colors.accent }]}>{sent ? 'Enviada' : 'Recebida'}</Text></View><Text style={[styles.time, { color: colors.muted }]}>{formatTime(message.timestamp)}</Text></View>
    <Text style={[styles.topic, { color: colors.muted }]} selectable>{message.topic}</Text><View style={[styles.payloadBox, { backgroundColor: colors.input }]}><Text selectable style={[styles.payload, { color: colors.text }]}>{message.payload}</Text></View>
    {!message.valid && <Text style={[styles.invalid, { color: colors.danger }]}>Dados inválidos · {message.error}</Text>}
  </View>;
}
const styles = StyleSheet.create({card: { padding: 16, borderRadius: 18, borderWidth: 1, gap: 10 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, direction: { flexDirection: 'row', gap: 6, alignItems: 'center' }, label: { fontSize: 12, fontWeight: '700' }, time: { fontSize: 11 }, topic: { fontSize: 11, lineHeight: 17 }, payloadBox: { borderRadius: 10, padding: 12 }, payload: { fontSize: 12, lineHeight: 18, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }, invalid: { fontSize: 11, lineHeight: 17 }});
