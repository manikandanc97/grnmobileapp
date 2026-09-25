import React, { useRef, useState } from 'react';
import { StyleSheet, TextInput, View, TouchableWithoutFeedback } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

interface OtpInputProps {
  value: string;
  onChangeText: (text: string) => void;
  length?: number;
}

export function OtpInput({ value, onChangeText, length = 6 }: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  const theme = useTheme();
  const backgroundColor = theme.backgroundElement;
  const borderColor = theme.border;
  const primaryColor = theme.primary;
  const textColor = theme.text;

  const handlePress = () => {
    inputRef.current?.focus();
  };

  const renderBoxes = () => {
    const boxes = [];
    for (let i = 0; i < length; i++) {
      const char = value[i] || '';
      const isCurrentDigit = i === value.length;
      const isActive = isFocused && isCurrentDigit;

      boxes.push(
        <View
          key={i}
          style={[
            styles.box,
            { backgroundColor, borderColor },
            isActive && { borderColor: primaryColor, borderWidth: 2 },
          ]}
        >
          <ThemedText style={[styles.boxText, { color: textColor }]}>
            {char}
          </ThemedText>
        </View>
      );
    }
    return boxes;
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={styles.container}>
        <View style={styles.boxContainer}>
          {renderBoxes()}
        </View>
        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={value}
          onChangeText={(text) => {
            const clean = text.replace(/[^0-9]/g, '');
            if (clean.length <= length) {
              onChangeText(clean);
            }
          }}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          maxLength={length}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          caretHidden
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  boxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: Spacing.one,
  },
  box: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxText: {
    fontSize: 24,
    fontWeight: '600',
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});
