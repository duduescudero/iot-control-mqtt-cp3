import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useIoT } from '../context/IoTContext';
import { MessageItem } from '../components/MessageItem';
import { Icon } from '../components/Icon';
export function HistoryScreen() {
  const { colors, history } = useIoT();
  return <View style={styles.screen}><View><Text style={[styles.eyebrow, { color: colors.accent }]}>COMUNICAÇÃO DO AMBIENTE</Text><Text style={[styles.title, { color: colors.text }]}>Histórico</Text><Text style={[styles.subtitle, { color: colors.muted }]}>As últimas 10 mensagens, da mais recente à mais antiga.</Text></View>
    <View style={styles.counter}><Text style={[styles.label, { color: colors.muted }]}>Todas as mensagens</Text><View style={[styles.pill, { backgroundColor: colors.accentSoft }]}><Text testID="history-count" style={{ color: colors.accent, fontSize: 12, fontWeight: '700' }}>{history.length}/10</Text></View></View>
    {history.length ? history.map(message => <MessageItem key={message.id} message={message}/>) : <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.icon, { backgroundColor: colors.raised }]}><Icon name="history" size={30} color={colors.muted}/></View><Text style={[styles.emptyTitle, { color: colors.text }]}>Tudo começa com uma conexão</Text><Text style={[styles.emptyText, { color: colors.muted }]}>Conecte ao broker e inicie o simulador. As mensagens recebidas e enviadas aparecerão aqui automaticamente.</Text></View>}
    <Text style={[styles.note, { color: colors.faint }]}>Histórico desta sessão. Broker e tema ficam salvos no dispositivo.</Text>
  </View>;
}
const styles = StyleSheet.create({screen: { gap: 14 }, eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.6, marginBottom: 8 }, title: { fontSize: 30, fontWeight: '800', letterSpacing: -1 }, subtitle: { fontSize: 13, lineHeight: 21, marginTop: 7 }, counter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }, label: { fontSize: 13, fontWeight: '600' }, pill: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 }, empty: { borderRadius: 22, borderWidth: 1, padding: 30, alignItems: 'center', marginTop: 8 }, icon: { borderRadius: 20, width: 66, height: 66, alignItems: 'center', justifyContent: 'center', marginBottom: 22 }, emptyTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' }, emptyText: { fontSize: 13, lineHeight: 21, textAlign: 'center', marginTop: 10 }, note: { fontSize: 11, lineHeight: 18, textAlign: 'center', marginTop: 8 }});
