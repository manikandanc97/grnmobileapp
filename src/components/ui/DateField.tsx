import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Modal, Keyboard } from 'react-native';
import DateTimePicker from 'react-native-ui-datepicker';
import dayjs from 'dayjs';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { Colors, Typography, Spacing, Radius, TouchTargets, IconSizes } from '@/constants/theme';
import { datePickerStyles } from '@/constants/datePickerTheme';

export interface DateFieldProps {
  value?: Date | string | null;
  onChange: (date: Date, formattedDate: string) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  error?: boolean | string;
  format?: string;
}

export function DateField({
  value,
  onChange,
  placeholder = 'DD/MM/YYYY',
  minDate,
  maxDate,
  error,
  format = 'DD/MM/YYYY',
}: DateFieldProps) {
  const [show, setShow] = useState(false);

  const parsedDate = useMemo(() => {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
      const d = dayjs(value, ['DD/MM/YYYY', 'YYYY-MM-DD', 'DD MMM YYYY']);
      return d.isValid() ? d.toDate() : undefined;
    }
    return undefined;
  }, [value]);

  const displayText = useMemo(() => {
    if (!value) return null;
    if (value instanceof Date) return dayjs(value).format(format);
    if (typeof value === 'string') return value;
    return null;
  }, [value, format]);

  const handleOpen = () => {
    Keyboard.dismiss();
    setShow(true);
  };

  const hasError = Boolean(error);

  return (
    <>
      <Pressable
        style={[
          styles.input,
          hasError && styles.inputError,
        ]}
        onPress={handleOpen}
      >
        <Calendar size={IconSizes.md - 2} color={Colors.light.textSecondary} style={styles.calendarIcon} />
        <Text style={[styles.text, !displayText && styles.placeholderText]}>
          {displayText || placeholder}
        </Text>
      </Pressable>

      <Modal
        transparent
        animationType="slide"
        visible={show}
        onRequestClose={() => setShow(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShow(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.bottomSheetHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.spacer} />
              <Text style={styles.modalTitle}>Select Date</Text>
              <Pressable style={styles.closeBtn} onPress={() => setShow(false)}>
                <X size={IconSizes.lg} color={Colors.light.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.pickerContainer}>
              <DateTimePicker
                mode="single"
                date={parsedDate || new Date()}
                minDate={minDate}
                maxDate={maxDate}
                styles={datePickerStyles}
                components={{
                  IconNext: <ChevronRight size={IconSizes.lg} color={Colors.light.text} />,
                  IconPrev: <ChevronLeft size={IconSizes.lg} color={Colors.light.text} />,
                }}
                onChange={(params: any) => {
                  if (params.date) {
                    const selected = dayjs(params.date).toDate();
                    const formatted = dayjs(params.date).format(format);
                    onChange(selected, formatted);
                    setShow(false);
                  }
                }}
              />
            </View>

            <Pressable style={styles.doneButton} onPress={() => setShow(false)}>
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputError: {
    borderColor: Colors.light.error,
    backgroundColor: Colors.light.errorBg,
  },
  calendarIcon: {
    marginRight: Spacing.sm,
  },
  text: {
    ...Typography.body,
    color: Colors.light.text,
  },
  placeholderText: {
    color: Colors.light.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 440 : '100%',
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 36 : Spacing.lg,
    maxHeight: '85%',
  },
  bottomSheetHandle: {
    width: 48,
    height: 5,
    backgroundColor: Colors.light.borderStrong,
    borderRadius: Radius.full,
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  spacer: {
    width: TouchTargets.min,
  },
  modalTitle: {
    ...Typography.sectionTitle,
    color: Colors.light.text,
  },
  closeBtn: {
    minHeight: TouchTargets.min,
    minWidth: TouchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerContainer: {
    paddingVertical: Spacing.sm,
  },
  doneButton: {
    minHeight: 48,
    backgroundColor: Colors.light.brand,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  doneButtonText: {
    ...Typography.button,
    color: Colors.light.surface,
  },
});
