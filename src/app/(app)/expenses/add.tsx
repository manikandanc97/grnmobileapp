import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  TextInput,
  Keyboard,
} from 'react-native';
import { router } from 'expo-router';
import { IndianRupee, User, Check, Building2 } from 'lucide-react-native';
import { ExpenseCategory, PaymentMethod, PaymentStatus } from '@/types/dashboard';
import { useSites } from '@/hooks/useSites';
import { createExpense } from '@/services/expenses';
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

const CATEGORIES: ExpenseCategory[] = ['Materials', 'Labor', 'Transport', 'Equipment', 'Other'];
const METHODS: PaymentMethod[] = ['Cash', 'UPI', 'Bank Transfer', 'Card'];
const STATUSES: PaymentStatus[] = ['Paid', 'Pending'];

export default function AddExpenseScreen() {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Materials');
  const [siteId, setSiteId] = useState<string>('');
  const [vendor, setVendor] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Paid');
  const [expenseDate, setExpenseDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdExpenseTitle, setCreatedExpenseTitle] = useState('');

  const { rawSites, loading: sitesLoading } = useSites();

  // Input refs for focus chaining
  const amountInputRef = useRef<TextInput>(null);
  const vendorInputRef = useRef<TextInput>(null);
  const notesInputRef = useRef<TextInput>(null);

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
    if (!siteId) newErrors.site = 'Site selection is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, amount, siteId]);

  const handleSave = useCallback(async () => {
    if (!validate() || saving) return;

    setSaving(true);
    const expenseTitle = title.trim();
    try {
      await createExpense({
        site_id: siteId,
        title: expenseTitle,
        amount: Number(amount),
        category,
        vendor: vendor.trim() || null,
        payment_method: paymentMethod as any,
        payment_status: paymentStatus,
        notes: notes.trim() || null,
        date: expenseDate.toISOString().split('T')[0],
      });

      Keyboard.dismiss();
      setSaving(false);
      setCreatedExpenseTitle(expenseTitle);
      setShowSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add expense.';
      Alert.alert('Error', message);
      setSaving(false);
    }
  }, [validate, saving, siteId, title, amount, category, vendor, paymentMethod, paymentStatus, notes, expenseDate]);

  const handleSuccessClose = useCallback(() => {
    setShowSuccess(false);
    router.back();
  }, []);

  return (
    <FormScreen
      title="Add Expense"
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
            title="Save Expense"
            variant="primary"
            icon={<Check size={18} color="#FFFFFF" />}
            onPress={handleSave}
            loading={saving}
            disabled={saving}
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
          />
        </FormField>

        <FormField label="Category" required>
          <View style={styles.chipGrid}>
            {CATEGORIES.map((c) => (
              <Pressable
                key={c}
                style={[styles.chip, category === c && styles.chipActive]}
                onPress={() => setCategory(c)}
              >
                <Text style={[styles.chipText, category === c && styles.chipTextActive]}>
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
            value={siteId}
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
            nextFieldRef={notesInputRef}
          />
        </FormField>
      </View>

      {/* PAYMENT DETAILS */}
      <View style={styles.section}>
        <FormField label="Payment Method">
          <View style={styles.chipGrid}>
            {METHODS.map((m) => (
              <Pressable
                key={m}
                style={[styles.chip, paymentMethod === m && styles.chipActive]}
                onPress={() => setPaymentMethod(m)}
              >
                <Text style={[styles.chipText, paymentMethod === m && styles.chipTextActive]}>
                  {m}
                </Text>
              </Pressable>
            ))}
          </View>
        </FormField>

        <FormField label="Payment Status">
          <View style={styles.statusGrid}>
            {STATUSES.map((s) => (
              <Pressable
                key={s}
                style={[
                  styles.statusChip,
                  paymentStatus === s && (s === 'Paid' ? styles.statusChipPaid : styles.statusChipPending),
                ]}
                onPress={() => setPaymentStatus(s)}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    paymentStatus === s && (s === 'Paid' ? styles.statusChipTextPaid : styles.statusChipTextPending),
                  ]}
                >
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
        </FormField>

        <FormField id="date" label="Date">
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
          />
        </FormField>
      </View>

      <SuccessDialog
        visible={showSuccess}
        title="Expense Added"
        message={`"${createdExpenseTitle || 'Expense'}" has been successfully recorded.`}
        buttonText="Done"
        onClose={handleSuccessClose}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
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
