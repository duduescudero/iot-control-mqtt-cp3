import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useIoT } from '../context/IoTContext';
import { Icon } from './Icon';
import type { IconName } from './Icon';
export function Button({ title, onPress, variant = 'primary', icon, disabled, loading, compact = false, testID }: {
  title: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'danger'; icon?: IconName; disabled?: boolean; loading?: boolean; compact?: boolean; testID?: string;
}) {
  const { colors } = useIoT();
  const foreground = variant === 'primary' ? colors.onAccent : variant === 'danger' ? colors.danger : colors.text;
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: !!disabled, busy: !!loading }} testID={testID} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.button, compact && styles.compact, { backgroundColor: variant === 'primary' ? colors.accent : variant === 'danger' ? colors.dangerSoft : colors.raised, borderColor: variant === 'primary' ? colors.accent : colors.border, opacity: disabled ? .55 : pressed ? .78 : 1 }]}>
    {loading ? <ActivityIndicator size="small" color={foreground}/> : icon ? <Icon name={icon} size={18} color={foreground}/> : null}
    <Text style={[styles.text, { color: foreground }]}>{title}</Text>
  </Pressable>;
}
const styles = StyleSheet.create({button: { minHeight: 49, paddingHorizontal: 20, paddingVertical: 13, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, compact: { minHeight: 40, paddingHorizontal: 15, paddingVertical: 9 }, text: { fontSize: 14, fontWeight: '700' }});
