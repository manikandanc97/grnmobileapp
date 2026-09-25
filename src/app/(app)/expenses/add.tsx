import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, FileText, IndianRupee, MapPin, User, Calendar, ChevronDown } from 'lucide-react-native';
import { ExpenseCategory, PaymentMethod, PaymentStatus } from '@/types/dashboard';
import { SiteRow } from '@/types/database';
import { useSites } from '@/hooks/useSites';
import { createExpense } from '@/services/expenses';

export default function AddExpenseScreen() {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Materials');
  const [selectedSite, setSelectedSite] = useState<SiteRow | null>(null);
  const [sitePickerVisible, setSitePickerVisible] = useState(false);
  const [vendor, setVendor] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Paid');
  const [notes, setNotes] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { rawSites, loading: sitesLoading } = useSites();

  const categories: ExpenseCategory[] = ['Materials', 'Labor', 'Transport', 'Equipment', 'Other'];
  const methods: PaymentMethod[] = ['Cash', 'UPI', 'Bank Transfer', 'Card'];
  const statuses: PaymentStatus[] = ['Paid', 'Pending'];

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    if (!selectedSite) newErrors.site = 'Site is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, amount, selectedSite]);

  const handleSave = useCallback(async () => {
    if (!validate() || !selectedSite) return;

    setSaving(true);
    try {
      await createExpense({
        site_id: selectedSite.id,
        title: title.trim(),
        amount: Number(amount),
        category,
        vendor: vendor.trim() || null,
        payment_method: paymentMethod as any, // Cast since 'Cheque' is in DB but not in types
        payment_status: paymentStatus,
        notes: notes.trim() || null,
        date: new Date().toISOString().split('T')[0],
      });

      Alert.alert('Success', 'Expense added successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add expense.';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  }, [validate, selectedSite, title, amount, category, vendor, paymentMethod, paymentStatus, notes]);

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backIcon, pressed && styles.backIconPressed]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#0F354A" />
          </Pressable>
          <Text style={styles.headerTitle}>Add Expense</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Expense Title *</Text>
            <View style={[styles.inputContainer, errors.title && styles.inputError]}>
              <FileText size={20} color="#8A99A4" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="What is this expense for?"
                placeholderTextColor="#8A99A4"
                value={title}
                onChangeText={(v) => { setTitle(v); setErrors((e) => ({ ...e, title: '' })); }}
              />
            </View>
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Amount (₹) *</Text>
            <View style={[styles.inputContainer, errors.amount && styles.inputError]}>
              <IndianRupee size={20} color="#8A99A4" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#8A99A4"
                value={amount}
                onChangeText={(v) => { setAmount(v); setErrors((e) => ({ ...e, amount: '' })); }}
                keyboardType="numeric"
              />
            </View>
            {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.chipGrid}>
              {categories.map((c) => (
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
          </View>

          {/* Assigned Site Picker */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Site *</Text>
            <Pressable
              style={[styles.inputContainer, styles.pickerButton, errors.site ? styles.inputError : null]}
              onPress={() => setSitePickerVisible(true)}
            >
              <MapPin size={20} color="#8A99A4" style={styles.inputIcon} />
              {sitesLoading ? (
                <ActivityIndicator size="small" color="#8A99A4" style={{ flex: 1 }} />
              ) : (
                <Text style={[styles.input, !selectedSite && styles.placeholderText]}>
                  {selectedSite ? selectedSite.name : 'Select a site'}
                </Text>
              )}
              <ChevronDown size={18} color="#8A99A4" />
            </Pressable>
            {errors.site ? <Text style={styles.errorText}>{errors.site}</Text> : null}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Vendor (Optional)</Text>
            <View style={styles.inputContainer}>
              <User size={20} color="#8A99A4" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Who was paid?"
                placeholderTextColor="#8A99A4"
                value={vendor}
                onChangeText={setVendor}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.chipGrid}>
              {methods.map((m) => (
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
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Payment Status</Text>
            <View style={styles.chipGrid}>
              {statuses.map((s) => (
                <Pressable
                  key={s}
                  style={[
                    styles.statusChip, 
                    paymentStatus === s && (s === 'Paid' ? styles.statusChipPaid : styles.statusChipPending)
                  ]}
                  onPress={() => setPaymentStatus(s)}
                >
                  <Text style={[
                    styles.statusChipText, 
                    paymentStatus === s && (s === 'Paid' ? styles.statusChipTextPaid : styles.statusChipTextPending)
                  ]}>
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Date</Text>
            <View style={styles.inputContainer}>
              <Calendar size={20} color="#8A99A4" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Today"
                placeholderTextColor="#8A99A4"
                value={new Date().toLocaleDateString('en-GB')}
                editable={false}
              />
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Notes</Text>
            <View style={[styles.inputContainer, { height: 100, alignItems: 'flex-start', paddingTop: 12 }]}>
              <TextInput
                style={[styles.input, { height: '100%', textAlignVertical: 'top' }]}
                placeholder="Add any additional details..."
                placeholderTextColor="#8A99A4"
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>
          </View>

        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          <Pressable 
            style={[styles.saveButton, (saving || !title.trim() || !selectedSite || !amount.trim()) && styles.saveButtonDisabled]} 
            onPress={() => { void handleSave(); }}
            disabled={saving || !title.trim() || !selectedSite || !amount.trim()}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Expense</Text>
            )}
          </Pressable>
        </View>
      </View>

      {/* Site Picker Modal */}
      <Modal
        visible={sitePickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSitePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Site</Text>
              <Pressable onPress={() => setSitePickerVisible(false)}>
                <Text style={styles.modalClose}>Done</Text>
              </Pressable>
            </View>
            {rawSites.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Text style={styles.modalEmptyText}>No active sites found.</Text>
              </View>
            ) : (
              <FlatList
                data={rawSites}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable
                    style={[
                      styles.siteOption,
                      selectedSite?.id === item.id && styles.siteOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedSite(item);
                      setErrors((e) => ({ ...e, site: '' }));
                      setSitePickerVisible(false);
                    }}
                  >
                    <Text style={[
                      styles.siteOptionText,
                      selectedSite?.id === item.id && styles.siteOptionTextSelected,
                    ]}>
                      {item.name}
                    </Text>
                    <Text style={styles.siteOptionSub}>{item.location}</Text>
                  </Pressable>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  backIcon: {
    marginRight: 16,
    padding: 4,
  },
  backIconPressed: {
    opacity: 0.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F354A',
  },
  content: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F354A',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF2F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  pickerButton: {
    justifyContent: 'space-between',
  },
  placeholderText: {
    color: '#8A99A4',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#0F354A',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
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
  },
  statusChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
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
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7A85',
  },
  saveButton: {
    flex: 2,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#F2A619',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F354A',
  },
  modalClose: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F2A619',
  },
  modalEmpty: {
    padding: 32,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 15,
    color: '#8A99A4',
    fontWeight: '500',
  },
  siteOption: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  siteOptionSelected: {
    backgroundColor: '#FFF7ED',
  },
  siteOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F354A',
    marginBottom: 2,
  },
  siteOptionTextSelected: {
    color: '#F2A619',
  },
  siteOptionSub: {
    fontSize: 13,
    color: '#8A99A4',
    fontWeight: '400',
  },
});
