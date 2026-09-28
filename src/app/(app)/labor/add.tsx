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
import { User, Phone, Check, Building2, Calendar } from 'lucide-react-native';
import { createWorker, WorkerRole } from '@/services/workers';
import { parseDateInput } from '@/services/sites';
import { useSites } from '@/hooks/useSites';
import { Spacing } from '@/constants/theme';

// Shared UI Architecture
import { FormScreen } from '@/components/ui/FormScreen';
import { FormField } from '@/components/ui/FormField';
import { TextField } from '@/components/ui/TextField';
import { SelectField, SelectOption } from '@/components/ui/SelectField';
import { BottomActionBar } from '@/components/ui/BottomActionBar';
import { Button } from '@/components/ui/Button';
import { SuccessDialog } from '@/components/ui/SuccessDialog';

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
  if (!phone.trim()) return true;
  return /^\+?\d{7,15}$/.test(phone.replace(/[\s-]/g, ''));
}

export default function AddWorkerScreen() {
  const [name, setName] = useState('');
  const [role, setRole] = useState<WorkerRole>('Mason');
  const [phone, setPhone] = useState('');
  const [siteId, setSiteId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdWorkerName, setCreatedWorkerName] = useState('');

  const { rawSites, loading: sitesLoading } = useSites();

  // Input refs for focus chaining
  const phoneInputRef = useRef<TextInput>(null);

  const todayISO = new Date().toISOString().split('T')[0];

  const siteOptions: SelectOption[] = useMemo(
    () => rawSites.map((s) => ({ label: s.name, value: s.id, sublabel: s.location })),
    [rawSites]
  );

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Full name is required.';
    if (!role) newErrors.role = 'Role is required.';
    if (!siteId) newErrors.site = 'Assigned site is required.';
    if (phone.trim() && !isValidPhone(phone)) {
      newErrors.phone = 'Enter a valid phone number (digits only, 7–15 chars).';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, role, siteId, phone]);

  const handleSave = useCallback(async () => {
    if (!validate() || saving) return;

    setSaving(true);
    const workerName = name.trim();
    try {
      await createWorker({
        site_id: siteId,
        name: workerName,
        role,
        phone: phone.trim() || null,
        joining_date: parseDateInput(todayISO),
      });

      Keyboard.dismiss();
      setSaving(false);
      setCreatedWorkerName(workerName);
      setShowSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add worker.';
      Alert.alert('Error', message);
      setSaving(false);
    }
  }, [validate, saving, siteId, name, role, phone, todayISO]);

  const handleSuccessClose = useCallback(() => {
    setShowSuccess(false);
    router.back();
  }, []);

  return (
    <FormScreen
      title="Add New Worker"
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
            title="Add Worker"
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
      {/* WORKER DETAILS */}
      <View style={styles.section}>
        <FormField id="name" label="Full Name" required error={errors.name}>
          <TextField
            id="name"
            placeholder="Enter worker's full name"
            value={name}
            onChangeText={(v) => {
              setName(v);
              if (errors.name) setErrors((e) => ({ ...e, name: '' }));
            }}
            leftIcon={<User size={18} color="#71808A" />}
            returnKeyType="next"
            nextFieldRef={phoneInputRef}
            error={errors.name}
          />
        </FormField>

        <FormField id="phone" label="Phone Number" error={errors.phone}>
          <TextField
            ref={phoneInputRef}
            id="phone"
            placeholder="Enter phone number"
            value={phone}
            onChangeText={(v) => {
              setPhone(v);
              if (errors.phone) setErrors((e) => ({ ...e, phone: '' }));
            }}
            leftIcon={<Phone size={18} color="#71808A" />}
            keyboardType="phone-pad"
            returnKeyType="done"
            error={errors.phone}
          />
        </FormField>
      </View>

      {/* ASSIGNED SITE */}
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
      </View>

      {/* ROLE */}
      <View style={styles.section}>
        <FormField label="Role" required error={errors.role}>
          <View style={styles.roleGrid}>
            {ROLES.map((r) => (
              <Pressable
                key={r}
                style={[styles.roleChip, role === r && styles.roleChipActive]}
                onPress={() => {
                  setRole(r);
                  if (errors.role) setErrors((e) => ({ ...e, role: '' }));
                }}
              >
                <Text style={[styles.roleChipText, role === r && styles.roleChipTextActive]}>
                  {r}
                </Text>
              </Pressable>
            ))}
          </View>
        </FormField>
      </View>

      {/* JOINING DATE */}
      <View style={styles.section}>
        <FormField label="Joining Date">
          <TextField
            value={new Date().toLocaleDateString('en-GB')}
            editable={false}
            leftIcon={<Calendar size={18} color="#71808A" />}
          />
        </FormField>
      </View>

      <SuccessDialog
        visible={showSuccess}
        title="Worker Added"
        message={`${createdWorkerName || 'Worker'} has been successfully added to the project.`}
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
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  roleChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
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
  saveBtn: {
    flex: 2,
  },
});
