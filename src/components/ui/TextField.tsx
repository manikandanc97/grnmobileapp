import React, { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import {
  TextInput,
  TextInputProps,
  StyleSheet,
  Platform,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useFormContext } from '@/components/ui/KeyboardAwareForm';

export interface TextFieldProps extends TextInputProps {
  id?: string;
  error?: boolean | string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  nextFieldRef?: React.RefObject<any>;
  containerStyle?: StyleProp<ViewStyle>;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  {
    id,
    error,
    leftIcon,
    rightIcon,
    nextFieldRef,
    containerStyle,
    style,
    multiline,
    onFocus,
    onBlur,
    onSubmitEditing,
    returnKeyType,
    ...props
  },
  ref
) {
  const inputRef = useRef<TextInput>(null);
  useImperativeHandle(ref, () => inputRef.current as TextInput);

  const [isFocused, setIsFocused] = useState(false);
  const formContext = useFormContext();

  const handleFocus: TextInputProps['onFocus'] = (e) => {
    setIsFocused(true);
    if (id && formContext) {
      formContext.onFieldFocus(id);
    }
    onFocus?.(e);
  };

  const handleBlur: TextInputProps['onBlur'] = (e) => {
    setIsFocused(false);
    if (id && formContext) {
      formContext.onFieldBlur(id);
    }
    onBlur?.(e);
  };

  const handleSubmitEditing = (e: any) => {
    if (nextFieldRef?.current) {
      nextFieldRef.current.focus();
    }
    onSubmitEditing?.(e);
  };

  const hasError = Boolean(error);
  const borderColor = hasError
    ? Colors.light.error
    : isFocused
    ? Colors.light.primary
    : Colors.light.border;

  return (
    <View
      style={[
        styles.container,
        { borderColor },
        isFocused && styles.containerFocused,
        hasError && styles.containerError,
        multiline && styles.containerMultiline,
        containerStyle,
      ]}
    >
      {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}

      <TextInput
        ref={inputRef}
        placeholderTextColor={Colors.light.textMuted}
        multiline={multiline}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSubmitEditing={handleSubmitEditing}
        returnKeyType={returnKeyType ?? (nextFieldRef ? 'next' : multiline ? undefined : 'done')}
        blurOnSubmit={!multiline && !nextFieldRef}
        {...props}
        style={[
          styles.input,
          multiline && styles.textArea,
          leftIcon ? styles.inputWithLeftIcon : null,
          rightIcon ? styles.inputWithRightIcon : null,
          style,
        ]}
      />

      {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  containerFocused: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.primary,
  },
  containerError: {
    backgroundColor: Colors.light.errorBg,
    borderColor: Colors.light.error,
  },
  containerMultiline: {
    alignItems: 'flex-start',
    minHeight: 104,
  },
  leftIconContainer: {
    paddingLeft: Spacing.md,
    paddingRight: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconContainer: {
    paddingRight: Spacing.md,
    paddingLeft: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
    ...Typography.body,
    color: Colors.light.text,
    ...(Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)),
  },
  inputWithLeftIcon: {
    paddingLeft: Spacing.xs,
  },
  inputWithRightIcon: {
    paddingRight: Spacing.xs,
  },
  textArea: {
    height: 100,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    textAlignVertical: 'top',
  },
});
