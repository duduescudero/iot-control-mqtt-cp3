import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useIoT } from '../context/IoTContext';
import { Button } from '../components/Button';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { Icon } from '../components/Icon';
import { SensorCard } from '../components/SensorCard';
import { brokerHost, formatTime } from '../utils/format';
export function DashboardScreen({ openHistory }: { openHistory: () => void }) {
  const { colors, connection, preferences, temperature, humidity, lamp, pending, connect, disconnect, sendCommand, history } = useIoT();
  const active = connection.phase === 'connected'; const busy = connection.phase === 'connecting'; const on = lamp?.value === 'ON';
  return <View style={styles.screen}>
    <View><Text style={[styles.eyebrow, { color: colors.accent }]}>AMBIENTE INTELIGENTE</Text><Text style={[styles.title, { color: colors.text }]}>Visão geral</Text><Text style={[styles.subtitle, { color: colors.muted }]}>Seu ambiente, em tempo real.</Text></View>
    <View style={[styles.connectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.topRow}><View style={styles.row}><Icon name="wifi" color={colors.accent} size={20}/><Text style={[styles.label, { color: colors.text }]}>Conexão do ambiente</Text></View><ConnectionStatus/></View>
      <Text style={[styles.broker, { color: colors.muted }]}>{brokerHost(preferences.brokerUrl)}</Text><Text style={[styles.detail, { color: connection.phase === 'error' ? colors.danger : colors.faint }]}>{connection.detail}</Text>
      <Button compact title={active ? 'Desconectar' : busy ? 'Cancelar conexão' : connection.phase === 'error' ? 'Reconectar' : 'Conectar'} variant={active || busy ? 'secondary' : 'primary'} icon="power" onPress={() => active || busy ? disconnect() : void connect()}/>
    </View>
    <View style={styles.sectionTitle}><Text style={[styles.section, { color: colors.text }]}>Sensores</Text><Text style={[styles.sectionHint, { color: colors.faint }]}>{active ? 'Leituras recebidas' : 'Últimas leituras'}</Text></View>
    <View style={styles.sensors}><SensorCard kind="temperature" reading={temperature}/><SensorCard kind="humidity" reading={humidity}/></View>
    <View style={[styles.lampCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.topRow}><View><Text style={[styles.section, { color: colors.text }]}>Iluminação</Text><Text style={[styles.hint, { color: colors.muted }]}>Lâmpada virtual do ambiente</Text></View><View style={[styles.pill, { backgroundColor: lamp ? colors.accentSoft : colors.raised }]}><Text style={[styles.pillText, { color: lamp ? colors.accent : colors.muted }]}>{lamp ? 'Estado recebido' : 'Sem leitura'}</Text></View></View>
      <View style={styles.lampCenter}><View style={[styles.bulbCircle, { backgroundColor: on ? colors.orangeSoft : colors.raised }]}><Icon name="bulb" size={52} color={on ? colors.orange : colors.faint}/></View>
        <Text testID="lamp-state" style={[styles.lampState, { color: on ? colors.orange : colors.text }]}>{!lamp ? 'Aguardando estado' : on ? 'Ligada' : 'Desligada'}</Text><Text style={[styles.lampTime, { color: colors.muted }]}>{lamp ? `Confirmado às ${formatTime(lamp.updatedAt)}` : 'Inicie o simulador para receber o estado'}</Text>
      </View>
      {pending && <View testID="command-pending" style={styles.pending}><ActivityIndicator size="small" color={colors.accent}/><Text style={{ color: colors.accent, fontSize: 12 }}>Aguardando confirmação do dispositivo…</Text></View>}
      <View style={styles.controls}><View style={{ flex: 1 }}><Button title="Ligar" icon="bulb" disabled={!!pending} onPress={() => sendCommand('ON')}/></View><View style={{ flex: 1 }}><Button title="Desligar" icon="power" variant="secondary" disabled={!!pending} onPress={() => sendCommand('OFF')}/></View></View>
      <Text style={[styles.controlHint, { color: colors.faint }]}>{active ? 'O estado muda após a resposta do dispositivo.' : 'Conecte ao broker para enviar comandos.'}</Text>
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel="Ver histórico" onPress={openHistory} style={[styles.historyLink, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <View style={styles.row}><Icon name="history" size={22} color={colors.muted}/><View><Text style={[styles.label, { color: colors.text }]}>Atividade recente</Text><Text style={[styles.hint, { color: colors.muted }]}>{history.length ? `${history.length} mensagens no histórico` : 'Nenhuma mensagem recebida'}</Text></View></View><Icon name="chevron" size={18} color={colors.muted}/>
    </Pressable>
  </View>;
}
const styles = StyleSheet.create({screen: { gap: 18 }, eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.8, marginBottom: 8 }, title: { fontSize: 30, fontWeight: '800', letterSpacing: -1 }, subtitle: { fontSize: 14, marginTop: 5 }, connectionCard: { padding: 18, borderRadius: 20, borderWidth: 1, gap: 10 }, topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }, row: { flexDirection: 'row', alignItems: 'center', gap: 10 }, label: { fontSize: 13, fontWeight: '700' }, broker: { fontSize: 12 }, detail: { fontSize: 11, lineHeight: 17, marginBottom: 2 }, sectionTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }, section: { fontSize: 16, fontWeight: '700' }, sectionHint: { fontSize: 11 }, sensors: { flexDirection: 'row', gap: 12 }, lampCard: { borderRadius: 22, borderWidth: 1, padding: 20 }, hint: { fontSize: 11, marginTop: 5 }, pill: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 6 }, pillText: { fontSize: 10, fontWeight: '700' }, lampCenter: { alignItems: 'center', paddingVertical: 24 }, bulbCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 15 }, lampState: { fontSize: 24, fontWeight: '700', letterSpacing: -.5 }, lampTime: { fontSize: 11, marginTop: 7 }, controls: { flexDirection: 'row', gap: 12 }, controlHint: { fontSize: 10.5, textAlign: 'center', lineHeight: 17, marginTop: 12 }, pending: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', paddingBottom: 16 }, historyLink: { borderRadius: 18, borderWidth: 1, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }});
