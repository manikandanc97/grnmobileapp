import React from 'react';
import { View, TextInput, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { Typography, Spacing, Radius , Colors } from '@/constants/theme';

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
      <Search size={18} color={Colors.light.textSecondary} style={styles.icon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.light.textMuted}
        accessibilityLabel={placeholder}
        autoCapitalize="none"
        autoCorrect={false}
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
          <X size={14} color={Colors.light.textSecondary} />
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
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 46,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    ...Typography.body,
    fontSize: 14,
    color: Colors.light.text,
    paddingVertical: 0,
  },
  clearBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
});
