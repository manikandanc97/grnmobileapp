import React from 'react';
import { Pressable, Text, StyleSheet, View, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';

interface Props {
  title: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  icon?: React.ReactNode; loading?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>; accessibilityLabel?: string;
}
export function Button({ title, onPress, variant = 'primary', icon, loading = false, disabled = false, style, accessibilityLabel }: Props) {
  const lightText = variant === 'primary' || variant === 'danger';
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? title} accessibilityState={{ disabled: disabled || loading, busy: loading }} onPress={onPress} disabled={disabled || loading} style={({ pressed }) => [styles.button, styles[variant], style, { minHeight: 48, height: undefined }, pressed && styles.pressed, (disabled || loading) && styles.disabled]}>
      {loading ? <ActivityIndicator color={lightText ? Colors.light.onPrimary : Colors.light.brand} /> : icon && <View>{icon}</View>}
      <Text style={[styles.text, { color: lightText ? Colors.light.onPrimary : Colors.light.brand }]}>{loading ? 'Saving…' : title}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: Spacing.md, paddingVertical: 12, borderRadius: Radius.md },
  primary: { backgroundColor: Colors.light.brand },
  secondary: { backgroundColor: Colors.light.surfaceMuted, borderWidth: 1, borderColor: Colors.light.border },
  danger: { backgroundColor: Colors.light.error },
  outline: { backgroundColor: Colors.light.surface, borderWidth: 1, borderColor: Colors.light.borderStrong },
  ghost: { backgroundColor: 'transparent' },
  text: { ...Typography.button, flexShrink: 1, textAlign: 'center' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.45 },
});
