import React, { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { IoTProvider, useIoT } from './src/context/IoTContext';
import { Icon } from './src/components/Icon';
import type { IconName } from './src/components/Icon';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import type { Tab } from './src/types/mqtt';

const tabs: { id: Tab; label: string; icon: IconName }[] = [{ id: 'dashboard', label: 'Painel', icon: 'dashboard' }, { id: 'history', label: 'Histórico', icon: 'history' }, { id: 'settings', label: 'Configurações', icon: 'settings' }];
function Application() {
  const { colors, preferences, ready, setTheme, notice, dismissNotice } = useIoT();
  const [tab, setTab] = useState<Tab>('dashboard');
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const navigate = (value: Tab) => { setTab(value); scroll.current?.scrollTo({ y: 0, animated: false }); };
  return <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
    <StatusBar style={preferences.theme === 'dark' ? 'light' : 'dark'}/>
    <View style={[styles.header, { borderBottomColor: colors.border }]}><View style={styles.headerContent}><View style={styles.brand}><View style={[styles.brandMark, { backgroundColor: colors.accentSoft }]}><Icon name="logo" size={26} color={colors.accent}/></View><Text style={[styles.brandName, { color: colors.text }]}>iot<Text style={{ color: colors.accent }}>control</Text></Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel={preferences.theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'} onPress={() => setTheme(preferences.theme === 'dark' ? 'light' : 'dark')} style={[styles.themeToggle, { backgroundColor: colors.raised }]}><Icon name={preferences.theme === 'dark' ? 'sun' : 'moon'} color={colors.muted} size={20}/></Pressable></View></View>
    {notice && <View accessibilityRole="alert" testID="notice" style={[styles.notice, { backgroundColor: notice.tone === 'success' ? colors.accentSoft : notice.tone === 'error' ? colors.dangerSoft : colors.orangeSoft }]}><Icon name={notice.tone === 'success' ? 'check' : 'info'} size={18} color={notice.tone === 'success' ? colors.accent : notice.tone === 'error' ? colors.danger : colors.orange}/><Text style={[styles.noticeText, { color: colors.text }]}>{notice.message}</Text><Pressable accessibilityRole="button" accessibilityLabel="Fechar aviso" onPress={dismissNotice} hitSlop={12}><Icon name="close" size={18} color={colors.muted}/></Pressable></View>}
    {!ready ? <View style={styles.loading}><ActivityIndicator color={colors.accent} size="large"/><Text style={{ color: colors.muted }}>Carregando suas preferências…</Text></View> : <ScrollView ref={scroll} style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled"><View style={styles.main}>{tab === 'dashboard' ? <DashboardScreen openHistory={() => navigate('history')}/> : tab === 'history' ? <HistoryScreen/> : <SettingsScreen/>}</View></ScrollView>}
    <SafeAreaView edges={['bottom']} style={[styles.navigation, { backgroundColor: colors.nav, borderTopColor: colors.border }]}><View style={styles.navigationInner}>{tabs.map(item => <Pressable key={item.id} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected: tab === item.id }} aria-selected={tab === item.id} onPress={() => navigate(item.id)} style={[styles.tab, { backgroundColor: tab === item.id ? colors.accentSoft : 'transparent' }]}><Icon name={item.icon} size={22} color={tab === item.id ? colors.accent : colors.faint}/><Text style={[styles.tabText, { color: tab === item.id ? colors.accent : colors.faint }]}>{item.label}</Text></Pressable>)}</View></SafeAreaView>
  </SafeAreaView>;
}
export default function App() { return <SafeAreaProvider><IoTProvider><Application/></IoTProvider></SafeAreaProvider>; }
const styles = StyleSheet.create({safe: { flex: 1 }, header: { borderBottomWidth: 1 }, headerContent: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 22, paddingVertical: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, brand: { flexDirection: 'row', alignItems: 'center', gap: 10 }, brandMark: { width: 39, height: 39, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, brandName: { fontSize: 24, fontWeight: '800', letterSpacing: -.8 }, themeToggle: { width: 39, height: 39, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, scroll: { flex: 1 }, scrollContent: { paddingHorizontal: 20, paddingTop: 25, paddingBottom: 30 }, main: { width: '100%', maxWidth: 720, alignSelf: 'center' }, navigation: { borderTopWidth: 1 }, navigationInner: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 10, width: '100%', maxWidth: 720, alignSelf: 'center' }, tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 14 }, tabText: { fontSize: 11, fontWeight: '600' }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 }, notice: { paddingVertical: 13, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 10 }, noticeText: { flex: 1, fontSize: 12, lineHeight: 19 }});
