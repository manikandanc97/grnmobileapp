import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, FlatList, Keyboard, Platform } from 'react-native';
import { ChevronDown, X, Plus, Trash2 } from 'lucide-react-native';
import { Colors, Typography, Spacing, Radius, TouchTargets, IconSizes } from '@/constants/theme';

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
        <ChevronDown size={IconSizes.md} color={Colors.light.textMuted} />
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
                <X size={IconSizes.lg} color={Colors.light.text} />
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
                      <Trash2 size={IconSizes.md} color={Colors.light.error} />
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
                <Plus size={IconSizes.md} color={Colors.light.primary} />
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
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputError: {
    borderColor: Colors.light.error,
    backgroundColor: Colors.light.errorBg,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  leftIconContainer: {
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : '100%',
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '75%',
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.md,
  },
  bottomSheetHandle: {
    width: 48,
    height: 5,
    backgroundColor: Colors.light.borderStrong,
    borderRadius: Radius.full,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  modalTitle: {
    ...Typography.sectionTitle,
    color: Colors.light.text,
  },
  closeBtn: {
    padding: Spacing.xs,
    minHeight: TouchTargets.min,
    minWidth: TouchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
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
    minHeight: TouchTargets.min,
  },
  selectedOptionRow: {
    backgroundColor: Colors.light.primaryBg,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    ...Typography.body,
    color: Colors.light.text,
  },
  selectedOptionText: {
    fontWeight: '700',
    color: Colors.light.primary,
  },
  optionSub: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.light.borderSubtle,
  },
  deleteBtn: {
    padding: Spacing.sm,
    minHeight: TouchTargets.min,
    minWidth: TouchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
    gap: Spacing.sm,
    minHeight: TouchTargets.min + 8,
  },
  addOptionText: {
    ...Typography.button,
    color: Colors.light.primary,
  },
});
