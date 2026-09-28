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
    ? '#DC2626'
    : isFocused
    ? '#E79524'
    : '#EEF2F6';

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
        placeholderTextColor="#8A99A4"
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
  },
  containerFocused: {
    backgroundColor: '#FFFFFF',
  },
  containerError: {
    backgroundColor: '#FEF2F2',
  },
  containerMultiline: {
    alignItems: 'flex-start',
    minHeight: 104,
  },
  leftIconContainer: {
    paddingLeft: 14,
    paddingRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconContainer: {
    paddingRight: 14,
    paddingLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 15,
    color: '#0F354A',
    ...(Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)),
  },
  inputWithLeftIcon: {
    paddingLeft: 4,
  },
  inputWithRightIcon: {
    paddingRight: 4,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
});
