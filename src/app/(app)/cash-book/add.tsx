import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { TrendingUp, TrendingDown, IndianRupee, FileText, Calendar } from 'lucide-react-native';

import { createCashTransaction, getTodayLocalDate, TransactionType } from '@/services/cashBook';

import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { DateField } from '@/components/ui/DateField';
import { ErrorDialog } from '@/components/ui/ErrorDialog';

import { Colors, Spacing, Typography, Radius, Shadows, IconSizes } from '@/constants/theme';

export default function AddCashTransactionScreen() {
  const { siteId, siteName } = useLocalSearchParams<{ siteId: string; siteName?: string }>();

  const [transactionType, setTransactionType] = useState<TransactionType>('INWARD');
  const [date, setDate] = useState(getTodayLocalDate());
  const [particulars, setParticulars] = useState('');
  const [amountStr, setAmountStr] = useState('');

  // DateField returns a Date object; we convert to YYYY-MM-DD to avoid UTC drift
  const handleDateChange = useCallback((d: Date, _formatted: string) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setDate(`${y}-${m}-${day}`);
  }, []);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const particularsRef = useRef<TextInput>(null);
  const amountRef = useRef<TextInput>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!date || date.trim().length < 10) {
      newErrors.date = 'Please enter a valid date.';
    }
    if (!particulars.trim()) {
      newErrors.particulars = 'Particulars are required.';
    }
    const amt = parseFloat(amountStr.replace(/[₹,\s]/g, ''));
    if (isNaN(amt) || amt <= 0) {
      newErrors.amount = 'Enter a valid amount greater than zero.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!siteId) return;

    const amt = parseFloat(amountStr.replace(/[₹,\s]/g, ''));

    setSaving(true);
    setSaveError(null);

    try {
      await createCashTransaction({
        site_id: siteId,
        transaction_type: transactionType,
        transaction_date: date,
        particulars: particulars.trim(),
        amount: amt,
      });
      router.back();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save transaction.');
    } finally {
      setSaving(false);
    }
  };

  const isInward = transactionType === 'INWARD';

  return (
    <ScreenWrapper>
      <ScreenHeader
        title="Add Transaction"
        subtitle={siteName || 'Cash Book'}
        showBack
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Transaction Type Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Transaction Type</Text>
            <View style={styles.typeRow}>
              <Pressable
                style={[
                  styles.typeBtn,
                  isInward && styles.typeBtnInwardActive,
                ]}
                onPress={() => setTransactionType('INWARD')}
                accessibilityRole="radio"
                accessibilityState={{ checked: isInward }}
              >
                <TrendingUp
                  size={IconSizes.md}
                  color={isInward ? Colors.light.success : Colors.light.textSecondary}
                  strokeWidth={2.2}
                />
                <View>
                  <Text style={[styles.typeBtnLabel, isInward && styles.typeLabelInward]}>
                    INWARD
                  </Text>
                  <Text style={styles.typeBtnSubLabel}>Money received</Text>
                </View>
              </Pressable>

              <Pressable
                style={[
                  styles.typeBtn,
                  !isInward && styles.typeBtnOutwardActive,
                ]}
                onPress={() => setTransactionType('OUTWARD')}
                accessibilityRole="radio"
                accessibilityState={{ checked: !isInward }}
              >
                <TrendingDown
                  size={IconSizes.md}
                  color={!isInward ? Colors.light.error : Colors.light.textSecondary}
                  strokeWidth={2.2}
                />
                <View>
                  <Text style={[styles.typeBtnLabel, !isInward && styles.typeLabelOutward]}>
                    OUTWARD
                  </Text>
                  <Text style={styles.typeBtnSubLabel}>Money spent</Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Date */}
          <FormField label="Date" error={errors.date} required>
            <DateField
              value={date}
              onChange={handleDateChange}
              placeholder="DD/MM/YYYY"
              error={Boolean(errors.date)}
            />
          </FormField>

          {/* Particulars */}
          <FormField
            label="Particulars"
            error={errors.particulars}
            required
            helperText="Enter a description, e.g. 'Advance', 'Cement - 30 bags', 'JCB earth work'"
          >
            <View style={[styles.textAreaContainer, errors.particulars ? styles.fieldError : null]}>
              <FileText
                size={IconSizes.sm}
                color={Colors.light.textSecondary}
                style={styles.textAreaIcon}
              />
              <TextInput
                ref={particularsRef}
                style={styles.textArea}
                value={particulars}
                onChangeText={(t) => {
                  setParticulars(t);
                  setErrors((e) => ({ ...e, particulars: '' }));
                }}
                placeholder="e.g. Advance, Cement - 30 bags, JCB earth work"
                placeholderTextColor={Colors.light.textMuted}
                multiline
                numberOfLines={2}
                returnKeyType="next"
                onSubmitEditing={() => amountRef.current?.focus()}
                blurOnSubmit={false}
                accessibilityLabel="Particulars"
              />
            </View>
          </FormField>

          {/* Amount */}
          <FormField label="Amount (₹)" error={errors.amount} required>
            <View style={[styles.amountContainer, errors.amount ? styles.fieldError : null]}>
              <View style={styles.amountPrefix}>
                <IndianRupee
                  size={IconSizes.sm}
                  color={isInward ? Colors.light.success : Colors.light.error}
                  strokeWidth={2.5}
                />
              </View>
              <TextInput
                ref={amountRef}
                style={styles.amountInput}
                value={amountStr}
                onChangeText={(t) => {
                  setAmountStr(t);
                  setErrors((e) => ({ ...e, amount: '' }));
                }}
                placeholder="0"
                placeholderTextColor={Colors.light.textMuted}
                keyboardType="numeric"
                returnKeyType="done"
                accessibilityLabel="Amount"
              />
            </View>
          </FormField>

          {/* Preview box */}
          {particulars.trim() && amountStr && parseFloat(amountStr.replace(/[₹,\s]/g, '')) > 0 && (
            <View style={[styles.preview, isInward ? styles.previewInward : styles.previewOutward]}>
              <Text style={styles.previewLabel}>Transaction Preview</Text>
              <Text style={styles.previewParticulars}>{particulars.trim()}</Text>
              <Text style={[styles.previewAmount, isInward ? styles.previewAmountInward : styles.previewAmountOutward]}>
                {isInward ? '+ ₹' : '− ₹'}
                {parseFloat(amountStr.replace(/[₹,\s]/g, '')).toLocaleString('en-IN')}
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsRow}>
            <View style={styles.cancelBtn}>
              <Button
                title="Cancel"
                onPress={() => router.back()}
                variant="secondary"
              />
            </View>
            <View style={styles.saveBtn}>
              <Button
                title="Save Transaction"
                onPress={handleSave}
                variant="primary"
                loading={saving}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ErrorDialog
        visible={Boolean(saveError)}
        message={saveError || 'Failed to save transaction.'}
        onClose={() => setSaveError(null)}
        onRetry={handleSave}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing['2xl'] * 2,
    gap: Spacing.lg,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    ...Typography.label,
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surfaceMuted,
    ...Shadows.sm,
  },
  typeBtnInwardActive: {
    borderColor: Colors.light.success,
    backgroundColor: Colors.light.successBg,
  },
  typeBtnOutwardActive: {
    borderColor: Colors.light.error,
    backgroundColor: Colors.light.errorBg,
  },
  typeBtnLabel: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    letterSpacing: 0.3,
  },
  typeLabelInward: {
    color: Colors.light.success,
  },
  typeLabelOutward: {
    color: Colors.light.error,
  },
  typeBtnSubLabel: {
    ...Typography.caption,
    color: Colors.light.textMuted,
    marginTop: 1,
  },
  textAreaContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    minHeight: 72,
  },
  textAreaIcon: {
    marginTop: 3,
    marginRight: Spacing.sm,
  },
  textArea: {
    flex: 1,
    ...Typography.body,
    color: Colors.light.text,
    textAlignVertical: 'top',
    paddingTop: 0,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface,
    overflow: 'hidden',
  },
  amountPrefix: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.surfaceMuted,
    borderRightWidth: 1,
    borderRightColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountInput: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.sectionTitle,
    color: Colors.light.text,
  },
  fieldError: {
    borderColor: Colors.light.error,
  },
  preview: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  previewInward: {
    backgroundColor: Colors.light.successBg,
    borderColor: Colors.light.success,
  },
  previewOutward: {
    backgroundColor: Colors.light.errorBg,
    borderColor: Colors.light.error,
  },
  previewLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  previewParticulars: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.light.text,
  },
  previewAmount: {
    fontSize: 20,
    fontWeight: '800',
  },
  previewAmountInward: {
    color: Colors.light.success,
  },
  previewAmountOutward: {
    color: Colors.light.error,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
  },
  saveBtn: {
    flex: 2,
  },
});
