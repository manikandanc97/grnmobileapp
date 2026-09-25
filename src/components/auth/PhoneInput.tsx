import React from 'react';
import { StyleSheet, TextInput, View, TextInputProps } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

interface PhoneInputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function PhoneInput({ value, onChangeText, ...props }: PhoneInputProps) {
  const theme = useTheme();
  const backgroundColor = theme.backgroundElement;
  const borderColor = theme.border;
  const textColor = theme.text;
  const placeholderColor = theme.textSecondary;

  return (
    <View style={[styles.container, { backgroundColor, borderColor }]}>
      <View style={[styles.prefixContainer, { borderRightColor: borderColor }]}>
        <ThemedText style={styles.prefixText}>+91</ThemedText>
      </View>
      <TextInput
        style={[styles.input, { color: textColor }]}
        value={value}
        onChangeText={onChangeText}
        keyboardType="phone-pad"
        placeholder="Enter mobile number"
        placeholderTextColor={placeholderColor}
        maxLength={10}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  prefixContainer: {
    paddingHorizontal: Spacing.three,
    height: '100%',
    justifyContent: 'center',
    borderRightWidth: 1,
  },
  prefixText: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
});
