import React, { useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { Colors, Spacing } from '@/constants/theme';

/** Keeps secondary fields available without making every entry a long form. */
export function OptionalDetails({ children, initiallyOpen = false, title = 'More details (optional)' }: { children: React.ReactNode; initiallyOpen?: boolean; title?: string }) {
  const [open, setOpen] = useState(initiallyOpen);
  const Icon = open ? ChevronUp : ChevronDown;
  return (
    <View style={styles.container}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(value => !value)} style={styles.toggle}>
        <Text style={styles.title}>{title}</Text>
        <Icon size={20} color={Colors.light.brand} />
      </Pressable>
      {open && <View style={styles.content}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.light.border },
  toggle: { minHeight: 48, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.light.brand },
  content: { paddingTop: Spacing.sm },
});
