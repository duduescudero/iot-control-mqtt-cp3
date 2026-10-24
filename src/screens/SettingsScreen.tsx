import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useIoT } from '../context/IoTContext';
import { Button } from '../components/Button';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { Icon } from '../components/Icon';
import { TOPIC_PREFIX } from '../config/mqtt';
export function SettingsScreen() {
  const { colors, preferences, connection, connect, disconnect, saveBroker, setTheme } = useIoT();
  const [url, setUrl] = useState(preferences.brokerUrl); const [saving, setSaving] = useState(false);
  useEffect(() => { setUrl(preferences.brokerUrl); }, [preferences.brokerUrl]);
  const active = connection.phase === 'connected'; const connecting = connection.phase === 'connecting';
  async function save() { setSaving(true); await saveBroker(url); setSaving(false); }
  return <View style={styles.screen}>
    <View><Text style={[styles.eyebrow, { color: colors.accent }]}>DO SEU JEITO</Text><Text style={[styles.title, { color: colors.text }]}>Configurações</Text><Text style={[styles.subtitle, { color: colors.muted }]}>Conexão e aparência, salvas neste dispositivo.</Text></View>
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.rowBetween}><View style={styles.row}><Icon name="wifi" color={colors.accent} size={21}/><Text style={[styles.section, { color: colors.text }]}>Broker MQTT</Text></View><ConnectionStatus/></View>
      <Text style={[styles.label, { color: colors.muted }]}>Endereço WebSocket</Text><TextInput testID="broker-url" accessibilityLabel="Endereço WebSocket do broker" value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="wss://servidor:porta/mqtt" placeholderTextColor={colors.faint} style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}/>
      <Text style={[styles.hint, { color: colors.muted }]}>Use ws:// ou wss:// e a porta WebSocket. O simulador deve usar o mesmo endereço.</Text>
      <Button title="Salvar endereço" icon="check" variant="secondary" loading={saving} disabled={saving} onPress={() => void save()}/>
      <Button title={active ? 'Desconectar' : connecting ? 'Cancelar conexão' : connection.phase === 'error' ? 'Reconectar' : 'Conectar'} icon="power" variant={active || connecting ? 'secondary' : 'primary'} onPress={() => active || connecting ? disconnect() : void connect(url)}/>
      <Text style={[styles.hint, { color: connection.phase === 'error' ? colors.danger : colors.faint }]}>{connection.detail}</Text>
    </View>
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.row}><Icon name="sun" color={colors.orange} size={21}/><Text style={[styles.section, { color: colors.text }]}>Aparência</Text></View><Text style={[styles.hint, { color: colors.muted }]}>Escolha o tema que combina com você.</Text>
      <View style={styles.themes}>{(['light', 'dark'] as const).map(theme => <Pressable key={theme} accessibilityRole="button" accessibilityLabel={theme === 'light' ? 'Tema claro' : 'Tema escuro'} accessibilityState={{ selected: preferences.theme === theme }} aria-pressed={preferences.theme === theme} onPress={() => setTheme(theme)} style={[styles.themeOption, { borderColor: preferences.theme === theme ? colors.accent : colors.border, backgroundColor: preferences.theme === theme ? colors.accentSoft : colors.raised }]}><Icon name={theme === 'light' ? 'sun' : 'moon'} color={preferences.theme === theme ? colors.accent : colors.muted} size={22}/><Text style={{ color: preferences.theme === theme ? colors.accent : colors.text, fontSize: 14, fontWeight: '700' }}>{theme === 'light' ? 'Claro' : 'Escuro'}</Text>{preferences.theme === theme && <Icon name="check" size={16} color={colors.accent}/>}</Pressable>)}</View>
    </View>
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.section, { color: colors.text }]}>Ambiente do grupo</Text><Text style={[styles.hint, { color: colors.muted }]}>Identificador exclusivo usado nos tópicos do aplicativo e do simulador.</Text><Text selectable style={[styles.prefix, { backgroundColor: colors.input, color: colors.accent }]}>{TOPIC_PREFIX}</Text><View style={styles.row}><Icon name="info" color={colors.muted} size={16}/><Text style={[styles.footerHint, { color: colors.muted }]}>O broker público é destinado a demonstrações.</Text></View></View>
  </View>;
}
const styles = StyleSheet.create({screen: { gap: 18 }, eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.6, marginBottom: 8 }, title: { fontSize: 30, fontWeight: '800', letterSpacing: -1 }, subtitle: { fontSize: 13, lineHeight: 21, marginTop: 7 }, card: { borderWidth: 1, borderRadius: 22, padding: 20, gap: 13 }, row: { flexDirection: 'row', alignItems: 'center', gap: 9 }, rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 9, flexWrap: 'wrap' }, section: { fontSize: 16, fontWeight: '700' }, label: { fontSize: 12, marginTop: 4, fontWeight: '600' }, input: { paddingHorizontal: 13, paddingVertical: 14, borderWidth: 1, borderRadius: 12, fontSize: 13, minHeight: 48 }, hint: { fontSize: 11.5, lineHeight: 19 }, themes: { flexDirection: 'row', gap: 12 }, themeOption: { borderWidth: 1.5, borderRadius: 14, flex: 1, minHeight: 68, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 9 }, prefix: { padding: 13, borderRadius: 10, fontSize: 11.5, lineHeight: 19 }, footerHint: { flex: 1, fontSize: 10.5, lineHeight: 17 }});
