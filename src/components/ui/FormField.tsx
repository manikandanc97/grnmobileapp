import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Spacing } from '@/constants/theme';
import { useFormContext } from '@/components/ui/KeyboardAwareForm';

export interface FormFieldProps {
  id?: string;
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function FormField({
  id,
  label,
  required = false,
  error,
  helperText,
  children,
  style,
}: FormFieldProps) {
  const containerRef = useRef<View>(null);
  const formContext = useFormContext();

  useEffect(() => {
    if (id && formContext) {
      formContext.registerField(id, containerRef);
      return () => {
        formContext.unregisterField(id);
      };
    }
  }, [id, formContext]);

  return (
    <View ref={containerRef} style={[styles.container, style]} collapsable={false}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      {children}
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F354A',
    marginBottom: Spacing.sm,
  },
  required: {
    color: '#E79524',
    fontWeight: '700',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: Spacing.xs,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: '#8A99A4',
    marginTop: Spacing.xs,
  },
});
