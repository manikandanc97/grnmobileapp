import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Modal, Keyboard } from 'react-native';
import DateTimePicker from 'react-native-ui-datepicker';
import dayjs from 'dayjs';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { Spacing } from '@/constants/theme';

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
        <Calendar size={18} color="#71808A" style={styles.calendarIcon} />
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
                <X size={22} color="#71808A" />
              </Pressable>
            </View>

            <View style={styles.pickerContainer}>
              <DateTimePicker
                mode="single"
                date={parsedDate || new Date()}
                minDate={minDate}
                maxDate={maxDate}
                components={{
                  IconNext: <ChevronRight size={22} color="#123746" />,
                  IconPrev: <ChevronLeft size={22} color="#123746" />,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EEF2F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  calendarIcon: {
    marginRight: 10,
  },
  text: {
    fontSize: 15,
    color: '#0F354A',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#8A99A4',
    fontWeight: '400',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : Spacing.lg,
    maxHeight: '85%',
  },
  bottomSheetHandle: {
    width: 48,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  spacer: {
    width: 24,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F354A',
  },
  closeBtn: {
    padding: 4,
  },
  pickerContainer: {
    paddingVertical: 12,
  },
  doneButton: {
    height: 48,
    backgroundColor: '#123746',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
