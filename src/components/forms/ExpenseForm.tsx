import { Radius, Spacing, Colors } from '@/constants/theme';
import { UiStyles } from '@/constants/uiStyles';

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
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import {
  createExpense,
  updateExpense,
  getExpenseById,
  ExpenseWithSite,
  ExpenseInsert,
  ExpenseUpdate,
} from '@/services/expenses';


// Shared UI Architecture
import { FormScreen } from '@/components/ui/FormScreen';
import { OptionalDetails } from '@/components/ui/OptionalDetails';
import { FormField } from '@/components/ui/FormField';
import { TextField } from '@/components/ui/TextField';
import { SelectField, SelectOption } from '@/components/ui/SelectField';
import { DateField } from '@/components/ui/DateField';
import { BottomActionBar } from '@/components/ui/BottomActionBar';
import { Button } from '@/components/ui/Button';
import { SuccessDialog } from '@/components/ui/SuccessDialog';
import { ErrorDialog } from '@/components/ui/ErrorDialog';
import { toast } from '@/lib/toast';

import {
  ExpenseCategory,
  PaymentStatus,
  EXPENSE_CATEGORIES,
  PAYMENT_STATUSES,
  normalizeExpenseCategory,
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
  const { isOffline } = useNetworkStatus();

  const [title, setTitle] = useState(initialData?.title ?? '');
  const [amount, setAmount] = useState(
    initialData?.amount !== undefined ? String(initialData.amount) : ''
  );
  const [category, setCategory] = useState<ExpenseCategory>(() =>
    normalizeExpenseCategory(initialData?.category)
  );
  const [siteId, setSiteId] = useState<string>(initialData?.site_id ?? '');
  const [vendor, setVendor] = useState(initialData?.vendor ?? '');
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

  useEffect(() => {
    if (initialData?.site_id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSiteId(initialData.site_id);
    }
  }, [initialData?.site_id]);

  // New entries stay assigned to the site they were opened from.
  const effectiveSiteId = isEdit ? siteId : (initialData?.site_id || '');

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
    if (!amount.trim() || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
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
          payment_method: 'Cash',
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
      toast.success(
        isEdit ? 'Expense Updated' : 'Expense Added',
        `₹${Number(amount).toLocaleString('en-IN')} • ${expenseTitle}`
      );
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

  const isFormValid = title.trim().length > 0 && amount.trim().length > 0 && Boolean(effectiveSiteId) && Number.isFinite(Number(amount)) && Number(amount) > 0;

  if (isLoadingInitial) {
    return (
      <FormScreen
        title="Edit Expense"
        subtitle="Loading expense details..."
        showBack
      >
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.light.brand} />
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
          ? 'Update the expense details.'
          : 'Choose a site and record what you spent.'
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
            icon={<Check size={18} color={Colors.light.surface} />}
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
            leftIcon={<IndianRupee size={18} color={Colors.light.textMuted} />}
            error={errors.amount}
            editable={!saving}
          />
        </FormField>

        <FormField label="Category" required>
          <SelectField value={category} options={EXPENSE_CATEGORIES.map(c => ({ label: c, value: c }))} onChange={value => setCategory(value as ExpenseCategory)} placeholder="Select category" />
        </FormField>
      </View>

      {/* SITE SELECTION */}
      <View style={styles.section}>
        <FormField id="site" label="Assigned Site" required error={errors.site}>
          {!isEdit ? <TextField
            value={siteOptions.find(option => option.value === effectiveSiteId)?.label || (sitesLoading ? 'Loading site...' : 'Selected site')}
            editable={false}
            leftIcon={<Building2 size={18} color={Colors.light.textMuted} />}
          /> : <SelectField
            value={effectiveSiteId}
            options={siteOptions}
            onChange={(v) => {
              setSiteId(v);
              if (errors.site) setErrors((e) => ({ ...e, site: '' }));
            }}
            placeholder={sitesLoading ? 'Loading sites...' : 'Select a site'}
            leftIcon={<Building2 size={18} color={Colors.light.textMuted} />}
            error={errors.site}
          />}
        </FormField>


      </View>

      {/* STATUS AND DATE */}
      <View style={styles.section}>
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

      <OptionalDetails initiallyOpen={isEdit || Boolean(vendor || reference || notes)}>
        <FormField id="vendor" label="Vendor (Optional)">
          <TextField
            ref={vendorInputRef}
            id="vendor"
            placeholder="Who was paid?"
            value={vendor}
            onChangeText={setVendor}
            leftIcon={<User size={18} color={Colors.light.textMuted} />}
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


      </OptionalDetails>

      {/* Success Dialog */}
      <SuccessDialog
        visible={showSuccess}
        title={isOffline ? 'Saved Locally' : isEdit ? 'Changes Saved' : 'Expense Added'}
        message={
          isOffline
            ? `"${savedExpenseTitle || 'Expense'}" has been saved to this device and will sync automatically once an internet connection is available.`
            : isEdit
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
    color: Colors.light.textSecondary,
  },
  section: {
    ...UiStyles.card,
    marginBottom: Spacing.md,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statusChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.xl,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.surfaceMuted,
    flex: 1,
    alignItems: 'center',
  },
  statusChipPaid: {
    backgroundColor: Colors.light.successBg,
    borderColor: Colors.light.success,
  },
  statusChipPending: {
    backgroundColor: Colors.light.errorBg,
    borderColor: Colors.light.error,
  },
  statusChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  statusChipTextPaid: {
    color: Colors.light.success,
  },
  statusChipTextPending: {
    color: Colors.light.error,
  },
  saveBtn: {
    flex: 2,
  },
});
