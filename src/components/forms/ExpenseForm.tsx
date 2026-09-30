import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { IndianRupee, User, Check, Building2 } from 'lucide-react-native';
import { useSites } from '@/hooks/useSites';
import {
  createExpense,
  updateExpense,
  getExpenseById,
  ExpenseWithSite,
  ExpenseInsert,
  ExpenseUpdate,
} from '@/services/expenses';
import { Spacing } from '@/constants/theme';

// Shared UI Architecture
import { FormScreen } from '@/components/ui/FormScreen';
import { FormField } from '@/components/ui/FormField';
import { TextField } from '@/components/ui/TextField';
import { SelectField, SelectOption } from '@/components/ui/SelectField';
import { DateField } from '@/components/ui/DateField';
import { BottomActionBar } from '@/components/ui/BottomActionBar';
import { Button } from '@/components/ui/Button';
import { SuccessDialog } from '@/components/ui/SuccessDialog';
import { ErrorDialog } from '@/components/ui/ErrorDialog';

import {
  ExpenseCategory,
  PaymentMethod,
  PaymentStatus,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} from '@/lib/constants/expenses';
import { parseSafeDate } from '@/lib/dateUtils';

export interface ExpenseFormProps {
  mode: 'create' | 'edit';
  expenseId?: string;
  initialData?: Partial<ExpenseInsert>;
  onSuccess?: (expense: ExpenseWithSite) => void;
}

export function ExpenseForm({
  mode,
  expenseId,
  initialData,
  onSuccess,
}: ExpenseFormProps) {
  const isEdit = mode === 'edit';

  const [title, setTitle] = useState(initialData?.title ?? '');
  const [amount, setAmount] = useState(
    initialData?.amount !== undefined ? String(initialData.amount) : ''
  );
  const [category, setCategory] = useState<ExpenseCategory>(
    (initialData?.category as ExpenseCategory) ?? 'Materials'
  );
  const [siteId, setSiteId] = useState<string>(initialData?.site_id ?? '');
  const [vendor, setVendor] = useState(initialData?.vendor ?? '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    (initialData?.payment_method as PaymentMethod) ?? 'Cash'
  );
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    (initialData?.payment_status as PaymentStatus) ?? 'Paid'
  );
  const [reference, setReference] = useState(initialData?.reference ?? '');
  const [expenseDate, setExpenseDate] = useState<Date>(() => {
    if (initialData?.expense_date) {
      const parsed = parseSafeDate(initialData.expense_date);
      if (parsed) return parsed;
    }
    return new Date();
  });
  const [notes, setNotes] = useState(initialData?.notes ?? '');

  const [isLoadingInitial, setIsLoadingInitial] = useState(isEdit && !initialData);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorDialogMessage, setErrorDialogMessage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedExpenseTitle, setSavedExpenseTitle] = useState('');

  const { rawSites, loading: sitesLoading } = useSites();

  // Input refs for focus chaining
  const amountInputRef = useRef<TextInput>(null);
  const vendorInputRef = useRef<TextInput>(null);
  const referenceInputRef = useRef<TextInput>(null);
  const notesInputRef = useRef<TextInput>(null);

  // Derived effective site ID (default to first site if creating and none selected)
  const effectiveSiteId = siteId || (!isEdit && rawSites.length > 0 ? rawSites[0].id : '');

  // Fetch initial expense data if editing and not provided
  useEffect(() => {
    if (isEdit && expenseId && !initialData) {
      let isMounted = true;
      (async () => {
        try {
          setIsLoadingInitial(true);
          const data = await getExpenseById(expenseId);
          if (isMounted && data) {
            setTitle(data.title);
            setAmount(String(data.amount));
            setCategory(data.category as ExpenseCategory);
            setSiteId(data.site_id);
            setVendor(data.vendor ?? '');
            setPaymentMethod(data.payment_method as PaymentMethod);
            setPaymentStatus(data.payment_status as PaymentStatus);
            setReference(data.reference ?? '');
            if (data.expense_date) {
              const parsed = parseSafeDate(data.expense_date);
              if (parsed) setExpenseDate(parsed);
            }
            setNotes(data.notes ?? '');
          }
        } catch (err) {
          console.error('[ExpenseForm] Load error:', err);
          if (isMounted) {
            setErrorDialogMessage('Failed to load expense details.');
          }
        } finally {
          if (isMounted) {
            setIsLoadingInitial(false);
          }
        }
      })();

      return () => {
        isMounted = false;
      };
    }
  }, [isEdit, expenseId, initialData]);

  const siteOptions: SelectOption[] = useMemo(
    () => rawSites.map((s) => ({ label: s.name, value: s.id, sublabel: s.location })),
    [rawSites]
  );

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Expense Title is required';
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    if (!effectiveSiteId) newErrors.site = 'Site selection is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, amount, effectiveSiteId]);

  const handleSave = useCallback(async () => {
    if (!validate() || saving) return;

    setSaving(true);
    const expenseTitle = title.trim();
    // Use local Date formatting to avoid timezone shift
    const dateStr = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}-${String(expenseDate.getDate()).padStart(2, '0')}`;

    try {
      let result: ExpenseWithSite;
      if (isEdit) {
        if (!expenseId) {
          throw new Error('Expense ID is missing for update operation.');
        }
        const updatePayload: Partial<ExpenseUpdate> = {
          site_id: effectiveSiteId,
          title: expenseTitle,
          amount: Number(amount),
          category,
          vendor: vendor.trim() || null,
          payment_method: paymentMethod as any,
          payment_status: paymentStatus,
          reference: reference.trim() || null,
          notes: notes.trim() || null,
          expense_date: dateStr,
        };
        result = await updateExpense(expenseId, updatePayload);
      } else {
        const insertPayload: ExpenseInsert = {
          site_id: effectiveSiteId,
          title: expenseTitle,
          amount: Number(amount),
          category,
          vendor: vendor.trim() || null,
          payment_method: paymentMethod as any,
          payment_status: paymentStatus,
          reference: reference.trim() || null,
          notes: notes.trim() || null,
          expense_date: dateStr,
        };
        result = await createExpense(insertPayload);
      }

      Keyboard.dismiss();
      setSaving(false);
      setSavedExpenseTitle(expenseTitle);
      setShowSuccess(true);
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : isEdit
          ? 'Failed to update expense.'
          : 'Failed to add expense.';
      setErrorDialogMessage(message);
      setSaving(false);
    }
  }, [
    validate,
    saving,
    isEdit,
    expenseId,
    title,
    amount,
    effectiveSiteId,
    category,
    vendor,
    paymentMethod,
    paymentStatus,
    reference,
    notes,
    expenseDate,
    onSuccess,
  ]);

  const handleSuccessClose = useCallback(() => {
    setShowSuccess(false);
    router.back();
  }, []);

  const isFormValid = title.trim().length > 0 && amount.trim().length > 0 && siteId.length > 0;

  if (isLoadingInitial) {
    return (
      <FormScreen
        title="Edit Expense"
        subtitle="Loading expense details..."
        showBack
      >
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0B5364" />
          <Text style={styles.loadingText}>Loading expense information...</Text>
        </View>
      </FormScreen>
    );
  }

  return (
    <FormScreen
      title={isEdit ? 'Edit Expense' : 'Add Expense'}
      subtitle={
        isEdit
          ? 'Modify expense details, payment status, and categorization.'
          : 'Record a new project expenditure with receipts and payment status.'
      }
      showBack
      bottomBar={
        <BottomActionBar>
          <Button
            title="Cancel"
            variant="secondary"
            onPress={() => router.back()}
            disabled={saving}
          />
          <Button
            title={isEdit ? 'Save Changes' : 'Save Expense'}
            variant="primary"
            icon={<Check size={18} color="#FFFFFF" />}
            onPress={handleSave}
            loading={saving}
            disabled={!isFormValid || saving}
            style={styles.saveBtn}
          />
        </BottomActionBar>
      }
    >
      {/* EXPENSE DETAILS */}
      <View style={styles.section}>
        <FormField id="title" label="Expense Title" required error={errors.title}>
          <TextField
            id="title"
            placeholder="What is this expense for?"
            value={title}
            onChangeText={(v) => {
              setTitle(v);
              if (errors.title) setErrors((e) => ({ ...e, title: '' }));
            }}
            returnKeyType="next"
            nextFieldRef={amountInputRef}
            error={errors.title}
            editable={!saving}
          />
        </FormField>

        <FormField id="amount" label="Amount (₹)" required error={errors.amount}>
          <TextField
            ref={amountInputRef}
            id="amount"
            placeholder="0.00"
            keyboardType="numeric"
            value={amount}
            onChangeText={(v) => {
              setAmount(v);
              if (errors.amount) setErrors((e) => ({ ...e, amount: '' }));
            }}
            leftIcon={<IndianRupee size={18} color="#71808A" />}
            error={errors.amount}
            editable={!saving}
          />
        </FormField>

        <FormField label="Category" required>
          <View style={styles.chipGrid}>
            {EXPENSE_CATEGORIES.map((c) => (
              <Pressable
                key={c}
                style={[styles.chip, category === c && styles.chipActive]}
                onPress={() => setCategory(c)}
                disabled={saving}
              >
                <Text
                  style={[
                    styles.chipText,
                    category === c && styles.chipTextActive,
                  ]}
                >
                  {c}
                </Text>
              </Pressable>
            ))}
          </View>
        </FormField>
      </View>

      {/* SITE SELECTION */}
      <View style={styles.section}>
        <FormField id="site" label="Assigned Site" required error={errors.site}>
          <SelectField
            value={effectiveSiteId}
            options={siteOptions}
            onChange={(v) => {
              setSiteId(v);
              if (errors.site) setErrors((e) => ({ ...e, site: '' }));
            }}
            placeholder={sitesLoading ? 'Loading sites...' : 'Select a site'}
            leftIcon={<Building2 size={18} color="#71808A" />}
            error={errors.site}
          />
        </FormField>

        <FormField id="vendor" label="Vendor (Optional)">
          <TextField
            ref={vendorInputRef}
            id="vendor"
            placeholder="Who was paid?"
            value={vendor}
            onChangeText={setVendor}
            leftIcon={<User size={18} color="#71808A" />}
            returnKeyType="next"
            nextFieldRef={referenceInputRef}
            editable={!saving}
          />
        </FormField>
        
        <FormField id="reference" label="Reference / Bill Number">
          <TextField
            ref={referenceInputRef}
            id="reference"
            placeholder="Invoice or receipt number"
            value={reference}
            onChangeText={setReference}
            returnKeyType="next"
            nextFieldRef={notesInputRef}
            editable={!saving}
          />
        </FormField>
      </View>

      {/* PAYMENT DETAILS */}
      <View style={styles.section}>
        <FormField label="Payment Method">
          <View style={styles.chipGrid}>
            {PAYMENT_METHODS.map((m) => (
              <Pressable
                key={m}
                style={[styles.chip, paymentMethod === m && styles.chipActive]}
                onPress={() => setPaymentMethod(m)}
                disabled={saving}
              >
                <Text
                  style={[
                    styles.chipText,
                    paymentMethod === m && styles.chipTextActive,
                  ]}
                >
                  {m}
                </Text>
              </Pressable>
            ))}
          </View>
        </FormField>

        <FormField label="Payment Status">
          <View style={styles.statusGrid}>
            {PAYMENT_STATUSES.map((s) => (
              <Pressable
                key={s}
                style={[
                  styles.statusChip,
                  paymentStatus === s &&
                    (s === 'Paid'
                      ? styles.statusChipPaid
                      : styles.statusChipPending),
                ]}
                onPress={() => setPaymentStatus(s)}
                disabled={saving}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    paymentStatus === s &&
                      (s === 'Paid'
                        ? styles.statusChipTextPaid
                        : styles.statusChipTextPending),
                  ]}
                >
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
        </FormField>

        <FormField id="expense_date" label="Expense Date" required>
          <DateField
            value={expenseDate}
            onChange={(d) => setExpenseDate(d)}
          />
        </FormField>
      </View>

      {/* NOTES */}
      <View style={styles.section}>
        <FormField id="notes" label="Notes">
          <TextField
            ref={notesInputRef}
            id="notes"
            placeholder="Add any additional details or invoice info..."
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
            editable={!saving}
          />
        </FormField>
      </View>

      {/* Success Dialog */}
      <SuccessDialog
        visible={showSuccess}
        title={isEdit ? 'Changes Saved' : 'Expense Added'}
        message={
          isEdit
            ? `"${savedExpenseTitle || 'Expense'}" has been updated.`
            : `"${savedExpenseTitle || 'Expense'}" has been successfully recorded.`
        }
        buttonText="Done"
        onClose={handleSuccessClose}
      />

      {/* Error Dialog */}
      <ErrorDialog
        visible={Boolean(errorDialogMessage)}
        message={errorDialogMessage || 'Something went wrong.'}
        onClose={() => setErrorDialogMessage(null)}
        onRetry={handleSave}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7A85',
  },
  section: {
    marginBottom: Spacing.md,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EEF2F6',
  },
  chipActive: {
    backgroundColor: '#0F354A',
    borderColor: '#0F354A',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7A85',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statusChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EEF2F6',
    flex: 1,
    alignItems: 'center',
  },
  statusChipPaid: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  statusChipPending: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  statusChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7A85',
  },
  statusChipTextPaid: {
    color: '#10B981',
  },
  statusChipTextPending: {
    color: '#EF4444',
  },
  saveBtn: {
    flex: 2,
  },
});
