import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { TrendingUp, TrendingDown, IndianRupee, FileText } from 'lucide-react-native';

import {
  getCashTransactionById,
  updateCashTransaction,
  TransactionType,
} from '@/services/cashBook';

import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { DateField } from '@/components/ui/DateField';
import { ErrorDialog } from '@/components/ui/ErrorDialog';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';

import { Colors, Spacing, Typography, Radius, Shadows, IconSizes } from '@/constants/theme';

export default function EditCashTransactionScreen() {
  const { id, siteId } = useLocalSearchParams<{ id: string; siteId: string }>();

  const [transactionType, setTransactionType] = useState<TransactionType>('INWARD');
  const [date, setDate] = useState('');
  const [particulars, setParticulars] = useState('');
  const [amountStr, setAmountStr] = useState('');

  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const amountRef = useRef<TextInput>(null);

  // DateField returns Date object; convert to YYYY-MM-DD to avoid UTC drift
  const handleDateChange = useCallback((d: Date, _formatted: string) => {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setDate(`${y}-${mo}-${day}`);
  }, []);

  // Load existing transaction
  useEffect(() => {
    if (!id) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInitialLoading(true);
    getCashTransactionById(id)
      .then((txn) => {
        if (!txn) {
          setLoadError('Transaction not found.');
          return;
        }
        setTransactionType(txn.transaction_type);
        setDate(txn.transaction_date);
        setParticulars(txn.particulars);
        setAmountStr(String(txn.amount));
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : 'Failed to load transaction.');
      })
      .finally(() => setInitialLoading(false));
  }, [id]);

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
    if (!validate() || !id) return;
    const amt = parseFloat(amountStr.replace(/[₹,\s]/g, ''));
    setSaving(true);
    setSaveError(null);
    try {
      await updateCashTransaction(id, {
        transaction_type: transactionType,
        transaction_date: date,
        particulars: particulars.trim(),
        amount: amt,
      });
      router.back();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update transaction.');
    } finally {
      setSaving(false);
    }
  };

  const isInward = transactionType === 'INWARD';

  if (initialLoading) {
    return (
      <ScreenWrapper>
        <ScreenHeader title="Edit Transaction" showBack />
        <View style={styles.content}>
          <LoadingSkeleton type="card" height={100} />
          <LoadingSkeleton type="card" height={56} />
          <LoadingSkeleton type="card" height={80} />
          <LoadingSkeleton type="card" height={56} />
        </View>
      </ScreenWrapper>
    );
  }

  if (loadError) {
    return (
      <ScreenWrapper>
        <ScreenHeader title="Edit Transaction" showBack />
        <View style={styles.errorContainer}>
          <ErrorState title="Not found" message={loadError} onRetry={() => router.back()} retryLabel="Go Back" />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScreenHeader title="Edit Transaction" subtitle="Cash Book" showBack />

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
                style={[styles.typeBtn, isInward && styles.typeBtnInwardActive]}
                onPress={() => setTransactionType('INWARD')}
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
                style={[styles.typeBtn, !isInward && styles.typeBtnOutwardActive]}
                onPress={() => setTransactionType('OUTWARD')}
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
            helperText="e.g. Advance, Cement - 30 bags, JCB earth work"
          >
            <View style={[styles.textAreaContainer, errors.particulars ? styles.fieldError : null]}>
              <FileText
                size={IconSizes.sm}
                color={Colors.light.textSecondary}
                style={styles.textAreaIcon}
              />
              <TextInput
                style={styles.textArea}
                value={particulars}
                onChangeText={(t) => {
                  setParticulars(t);
                  setErrors((e) => ({ ...e, particulars: '' }));
                }}
                placeholder="e.g. Advance A/C, Cement - 30 bags"
                placeholderTextColor={Colors.light.textMuted}
                multiline
                numberOfLines={2}
                returnKeyType="next"
                onSubmitEditing={() => amountRef.current?.focus()}
                blurOnSubmit={false}
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
              />
            </View>
          </FormField>

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
                title="Update Transaction"
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
        message={saveError || 'Failed to update transaction.'}
        onClose={() => setSaveError(null)}
        onRetry={handleSave}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.lg,
  },
  errorContainer: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
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
