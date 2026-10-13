import React, { useState } from 'react';
import { StyleSheet, TextInput, View, TextInputProps, Text } from 'react-native';
import { Spacing, Radius , Colors } from '@/constants/theme';

interface PhoneInputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function PhoneInput({ value, onChangeText, ...props }: PhoneInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[
      styles.container,
      isFocused && styles.containerFocused,
    ]}>
      <View style={styles.prefixContainer}>
        <Text style={styles.prefixText}>+91</Text>
      </View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel="Mobile number"
        autoComplete="tel-national"
        keyboardType="phone-pad"
        placeholder="10-digit number"
        placeholderTextColor={Colors.light.textMuted}
        maxLength={10}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 56,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  containerFocused: {
    borderColor: Colors.light.brand,
    backgroundColor: Colors.light.surface,
  },
  prefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: '100%',
    backgroundColor: Colors.light.background,
    borderRightWidth: 1,
    borderRightColor: Colors.light.border,
  },
  flagText: {
    fontSize: 18,
  },
  prefixText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    letterSpacing: 0.5,
  },
});
