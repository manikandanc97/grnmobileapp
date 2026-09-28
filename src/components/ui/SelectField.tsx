import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, FlatList, Keyboard, Platform } from 'react-native';
import { ChevronDown, X, Plus, Trash2 } from 'lucide-react-native';
import { Spacing } from '@/constants/theme';

export interface SelectOption {
  label: string;
  value: string;
  sublabel?: string;
}

interface SelectFieldProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  leftIcon?: React.ReactNode;
  error?: boolean | string;
  onAddOption?: () => void;
  onDeleteOption?: (value: string) => void;
  manageLabel?: string;
}

export function SelectField({ 
  value, 
  options, 
  onChange, 
  placeholder = 'Select...',
  leftIcon,
  error,
  onAddOption,
  onDeleteOption,
  manageLabel
}: SelectFieldProps) {
  const [modalVisible, setModalVisible] = useState(false);
  
  const selectedOption = options.find(o => o.value === value);

  const handleOpen = () => {
    Keyboard.dismiss();
    setModalVisible(true);
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
        <View style={styles.leftGroup}>
          {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
          <Text style={[styles.text, !selectedOption && styles.placeholderText]}>
            {selectedOption ? selectedOption.label : placeholder}
          </Text>
        </View>
        <ChevronDown size={20} color="#8A99A4" />
      </Pressable>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.bottomSheetHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{placeholder}</Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={22} color="#0F354A" />
              </Pressable>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.optionRow,
                    value === item.value && styles.selectedOptionRow,
                  ]}
                  onPress={() => {
                    onChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <View style={styles.optionTextContainer}>
                    <Text style={[styles.optionText, value === item.value && styles.selectedOptionText]}>
                      {item.label}
                    </Text>
                    {item.sublabel ? (
                      <Text style={styles.optionSub}>{item.sublabel}</Text>
                    ) : null}
                  </View>
                  {onDeleteOption && (
                    <Pressable onPress={() => onDeleteOption(item.value)} style={styles.deleteBtn}>
                      <Trash2 size={18} color="#DC2626" />
                    </Pressable>
                  )}
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={styles.listContent}
            />

            {onAddOption && (
              <Pressable 
                style={styles.addOptionBtn}
                onPress={() => {
                  setModalVisible(false);
                  onAddOption();
                }}
              >
                <Plus size={20} color="#E79524" />
                <Text style={styles.addOptionText}>{manageLabel || 'Add New'}</Text>
              </Pressable>
            )}
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
    justifyContent: 'space-between',
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  leftIconContainer: {
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.md,
  },
  bottomSheetHandle: {
    width: 48,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F354A',
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  listContent: {
    paddingBottom: Spacing.lg,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
  },
  selectedOptionRow: {
    backgroundColor: '#FFF7ED',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: 15,
    color: '#0F354A',
    fontWeight: '500',
  },
  selectedOptionText: {
    fontWeight: '700',
    color: '#E79524',
  },
  optionSub: {
    fontSize: 12,
    color: '#8A99A4',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  deleteBtn: {
    padding: Spacing.sm,
  },
  addOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
    gap: Spacing.sm,
  },
  addOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E79524',
  },
});
