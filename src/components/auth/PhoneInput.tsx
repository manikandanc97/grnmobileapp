import React, { useState } from 'react';
import { StyleSheet, TextInput, View, TextInputProps, Text } from 'react-native';
import { Spacing, Radius } from '@/constants/theme';

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
        <Text style={styles.flagText}>🇮🇳</Text>
        <Text style={styles.prefixText}>+91</Text>
      </View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType="phone-pad"
        placeholder="Enter 10-digit mobile number"
        placeholderTextColor="#94A3B8"
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(15, 23, 42, 0.1)',
    overflow: 'hidden',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  containerFocused: {
    borderColor: '#E79524',
    backgroundColor: '#FFFFFF',
  },
  prefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: '100%',
    backgroundColor: '#F8FAFC',
    borderRightWidth: 1,
    borderRightColor: 'rgba(15, 23, 42, 0.08)',
  },
  flagText: {
    fontSize: 18,
  },
  prefixText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
});
