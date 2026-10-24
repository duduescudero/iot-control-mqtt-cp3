import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useIoT } from '../context/IoTContext';
const labels = { disconnected: 'Desconectado', connecting: 'Conectando', connected: 'Conectado', error: 'Erro de conexão' } as const;
export function ConnectionStatus() {
  const { colors, connection } = useIoT();
  const color = connection.phase === 'connected' ? colors.accent : connection.phase === 'error' ? colors.danger : colors.muted;
  return <View testID="connection-status" style={[styles.badge, { backgroundColor: connection.phase === 'connected' ? colors.accentSoft : colors.raised }]}>
    {connection.phase === 'connecting' ? <ActivityIndicator size={12} color={color}/> : <View style={[styles.dot, { backgroundColor: color }]}/>}
    <Text style={[styles.label, { color }]}>{labels[connection.phase]}</Text>
  </View>;
}
const styles = StyleSheet.create({ badge: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start' }, dot: { width: 6, height: 6, borderRadius: 3 }, label: { fontSize: 12, fontWeight: '700' } });
