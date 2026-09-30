import React from 'react';
import { View, TextInput, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { Colors, Typography, Spacing, Radius, IconSizes, TouchTargets } from '@/constants/theme';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  style?: ViewStyle;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
  style,
}: SearchBarProps) {
  const showClear = Boolean(value.length > 0 && onClear);

  return (
    <View style={[styles.container, style]}>
      <Search size={IconSizes.md} color={Colors.light.textMuted} style={styles.icon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.light.textMuted}
        returnKeyType="search"
      />
      {showClear && (
        <Pressable 
          onPress={onClear} 
          style={styles.clearBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <X size={IconSizes.sm} color={Colors.light.textSecondary} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 44, // Using 44 for search bars typically, or 48. Let's stick to min touch target.
  },
  icon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    ...Typography.body,
    color: Colors.light.text,
    paddingVertical: Spacing.sm,
  },
  clearBtn: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
    minHeight: TouchTargets.min,
    minWidth: TouchTargets.min,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
