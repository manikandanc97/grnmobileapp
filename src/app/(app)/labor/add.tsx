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
import { ArrowLeft, User, Phone, MapPin, Calendar, ChevronDown } from 'lucide-react-native';
import { createWorker, WorkerRole } from '@/services/workers';
import { parseDateInput } from '@/services/sites';
import { useSites } from '@/hooks/useSites';
import { SiteRow } from '@/types/database';

const ROLES: WorkerRole[] = [
  'Mason',
  'Painter',
  'Electrician',
  'Plumber',
  'Carpenter',
  'Supervisor',
  'Laborer',
  'Other',
];

function isValidPhone(phone: string): boolean {
  // Allow empty (optional field), or 7-15 digits optionally prefixed with +
  if (!phone.trim()) return true;
  return /^\+?\d{7,15}$/.test(phone.replace(/[\s-]/g, ''));
}

export default function AddWorkerScreen() {
  const [name, setName] = useState('');
  const [role, setRole] = useState<WorkerRole>('Mason');
  const [phone, setPhone] = useState('');
  const [selectedSite, setSelectedSite] = useState<SiteRow | null>(null);
  const [sitePickerVisible, setSitePickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { rawSites, loading: sitesLoading } = useSites();

  const todayISO = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Full name is required.';
    if (!role) newErrors.role = 'Role is required.';
    if (!selectedSite) newErrors.site = 'Assigned site is required.';
    if (phone.trim() && !isValidPhone(phone)) {
      newErrors.phone = 'Enter a valid phone number (digits only, 7–15 chars).';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, role, selectedSite, phone]);

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    if (!selectedSite) return;

    setSaving(true);
    try {
      await createWorker({
        site_id: selectedSite.id,
        name: name.trim(),
        role,
        phone: phone.trim() || null,
        joining_date: parseDateInput(todayISO),
      });

      Alert.alert('Success', `${name.trim()} has been added as a worker.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add worker.';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  }, [validate, selectedSite, name, role, phone, todayISO]);

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
          <Text style={styles.headerTitle}>Add New Worker</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Full Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <View style={[styles.inputContainer, errors.name ? styles.inputError : null]}>
              <User size={20} color="#8A99A4" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter worker's full name"
                placeholderTextColor="#8A99A4"
                value={name}
                onChangeText={(v) => { setName(v); setErrors((e) => ({ ...e, name: '' })); }}
              />
            </View>
            {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
          </View>

          {/* Phone */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={[styles.inputContainer, errors.phone ? styles.inputError : null]}>
              <Phone size={20} color="#8A99A4" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                placeholderTextColor="#8A99A4"
                value={phone}
                onChangeText={(v) => { setPhone(v); setErrors((e) => ({ ...e, phone: '' })); }}
                keyboardType="phone-pad"
              />
            </View>
            {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
          </View>

          {/* Assigned Site Picker */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Assigned Site *</Text>
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

          {/* Role */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Role *</Text>
            {errors.role ? <Text style={styles.errorText}>{errors.role}</Text> : null}
            <View style={styles.roleGrid}>
              {ROLES.map((r) => (
                <Pressable
                  key={r}
                  style={[styles.roleChip, role === r && styles.roleChipActive]}
                  onPress={() => { setRole(r); setErrors((e) => ({ ...e, role: '' })); }}
                >
                  <Text style={[styles.roleChipText, role === r && styles.roleChipTextActive]}>
                    {r}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Joining Date (today, read-only) */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Joining Date</Text>
            <View style={styles.inputContainer}>
              <Calendar size={20} color="#8A99A4" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={new Date().toLocaleDateString('en-GB')}
                editable={false}
                placeholderTextColor="#8A99A4"
              />
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.saveButton, (saving || !name.trim() || !selectedSite) && styles.saveButtonDisabled]}
            onPress={() => { void handleSave(); }}
            disabled={saving || !name.trim() || !selectedSite}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Add Worker</Text>
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
    paddingBottom: 8,
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
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#0F354A',
  },
  placeholderText: {
    color: '#8A99A4',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
    marginTop: 4,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  roleChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  roleChipActive: {
    backgroundColor: '#0F354A',
    borderColor: '#0F354A',
  },
  roleChipText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  roleChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
  },
  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  saveButton: {
    flex: 2,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F2A619',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
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
