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
import { User, Phone, Check, Building2 } from 'lucide-react-native';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import {
  createWorker,
  updateWorker,
  getWorkerById,
  WorkerRole,
  WorkerWithSite,
  CreateWorkerParams,
} from '@/services/workers';
import { parseDateInput } from '@/services/sites';
import { useSites } from '@/hooks/useSites';
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

dayjs.extend(customParseFormat);

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

function formatIsoToDisplay(iso?: string | null): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return iso;
}

export interface WorkerFormProps {
  mode: 'create' | 'edit';
  workerId?: string;
  initialData?: {
    name?: string;
    role?: WorkerRole;
    phone?: string | null;
    siteId?: string;
    joiningDate?: string | null;
    payFrequency?: 'Daily' | 'Weekly' | 'Monthly';
    salaryAmount?: number;
  };
  onSuccess?: (worker: WorkerWithSite) => void;
}

export function WorkerForm({
  mode,
  workerId,
  initialData,
  onSuccess,
}: WorkerFormProps) {
  const isEdit = mode === 'edit';

  const [name, setName] = useState(initialData?.name ?? '');
  const [role, setRole] = useState<WorkerRole>(initialData?.role ?? 'Mason');
  const [phone, setPhone] = useState(initialData?.phone ?? '');
  const [siteId, setSiteId] = useState<string>(initialData?.siteId ?? '');
  const [joiningDate, setJoiningDate] = useState<string>(
    initialData?.joiningDate
      ? formatIsoToDisplay(initialData.joiningDate)
      : dayjs().format('DD/MM/YYYY')
  );
  const [payFrequency, setPayFrequency] = useState<'Daily' | 'Weekly' | 'Monthly'>(
    initialData?.payFrequency ?? 'Daily'
  );
  const [salaryAmount, setSalaryAmount] = useState<string>(
    initialData?.salaryAmount !== undefined ? String(initialData.salaryAmount) : ''
  );

  const [isLoadingInitial, setIsLoadingInitial] = useState(isEdit && !initialData);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorDialogMessage, setErrorDialogMessage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedWorkerName, setSavedWorkerName] = useState('');

  const { rawSites, loading: sitesLoading } = useSites();

  // Input refs for focus chaining
  const phoneInputRef = useRef<TextInput>(null);

  // Fetch initial worker data if editing and not provided
  useEffect(() => {
    if (isEdit && workerId && !initialData) {
      let isMounted = true;
      (async () => {
        try {
          setIsLoadingInitial(true);
          const data = await getWorkerById(workerId);
          if (isMounted && data) {
            setName(data.name);
            setRole(data.role as WorkerRole);
            setPhone(data.phone ?? '');
            setSiteId(data.site_id);
            if (data.joining_date) {
              setJoiningDate(formatIsoToDisplay(data.joining_date));
            }
            if (data.pay_frequency) {
              setPayFrequency(data.pay_frequency as any);
            }
            if (data.salary_amount !== undefined) {
              setSalaryAmount(String(data.salary_amount));
            }
          }
        } catch (err) {
          console.error('[WorkerForm] Load error:', err);
          if (isMounted) {
            setErrorDialogMessage('Failed to load worker details.');
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
  }, [isEdit, workerId, initialData]);

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
    if (!salaryAmount || isNaN(Number(salaryAmount)) || Number(salaryAmount) <= 0) {
      newErrors.salaryAmount = 'Enter a valid positive salary amount.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, role, siteId, phone, salaryAmount]);

  const handleSave = useCallback(async () => {
    if (!validate() || saving) return;

    setSaving(true);
    const workerName = name.trim();

    try {
      let result: WorkerWithSite;
      if (isEdit) {
        if (!workerId) {
          throw new Error('Worker ID is missing for update operation.');
        }
        result = await updateWorker(workerId, {
          name: workerName,
          role,
          phone: phone.trim() || null,
          site_id: siteId,
          joining_date: joiningDate ? parseDateInput(joiningDate) : null,
          pay_frequency: payFrequency,
          salary_amount: Number(salaryAmount),
        });
      } else {
        const payload: CreateWorkerParams = {
          site_id: siteId,
          name: workerName,
          role,
          phone: phone.trim() || null,
          joining_date: joiningDate ? parseDateInput(joiningDate) : null,
          pay_frequency: payFrequency,
          salary_amount: Number(salaryAmount),
        };
        result = await createWorker(payload);
      }

      Keyboard.dismiss();
      setSaving(false);
      setSavedWorkerName(workerName);
      setShowSuccess(true);
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : isEdit
          ? 'Failed to update worker.'
          : 'Failed to add worker.';
      setErrorDialogMessage(message);
      setSaving(false);
    }
  }, [validate, saving, isEdit, workerId, name, role, phone, siteId, joiningDate, payFrequency, salaryAmount, onSuccess]);

  const handleSuccessClose = useCallback(() => {
    setShowSuccess(false);
    router.back();
  }, []);

  const isFormValid = name.trim().length > 0 && siteId.length > 0 && Number(salaryAmount) > 0;

  if (isLoadingInitial) {
    return (
      <FormScreen
        title="Edit Worker"
        subtitle="Loading worker details..."
        showBack
      >
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0B5364" />
          <Text style={styles.loadingText}>Loading worker information...</Text>
        </View>
      </FormScreen>
    );
  }

  return (
    <FormScreen
      title={isEdit ? 'Edit Worker' : 'Add New Worker'}
      subtitle={
        isEdit
          ? 'Update worker profile, assigned site, and contact details.'
          : 'Register a new worker into your project workforce.'
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
            title={isEdit ? 'Save Changes' : 'Add Worker'}
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
            editable={!saving}
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
            editable={!saving}
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
                disabled={saving}
              >
                <Text
                  style={[
                    styles.roleChipText,
                    role === r && styles.roleChipTextActive,
                  ]}
                >
                  {r}
                </Text>
              </Pressable>
            ))}
          </View>
        </FormField>
      </View>

      {/* SALARY */}
      <View style={styles.section}>
        <FormField label="Payment Type" required>
          <View style={styles.roleGrid}>
            {['Daily', 'Weekly', 'Monthly'].map((freq) => (
              <Pressable
                key={freq}
                style={[styles.roleChip, payFrequency === freq && styles.roleChipActive]}
                onPress={() => setPayFrequency(freq as any)}
                disabled={saving}
              >
                <Text style={[styles.roleChipText, payFrequency === freq && styles.roleChipTextActive]}>
                  {freq}
                </Text>
              </Pressable>
            ))}
          </View>
        </FormField>
        <FormField id="salaryAmount" label={`Salary Amount (per ${payFrequency === 'Daily' ? 'day' : payFrequency === 'Weekly' ? 'week' : 'month'})`} required error={errors.salaryAmount}>
          <TextField
            id="salaryAmount"
            placeholder="0.00"
            keyboardType="numeric"
            value={salaryAmount}
            onChangeText={(v) => {
              setSalaryAmount(v);
              if (errors.salaryAmount) setErrors((e) => ({ ...e, salaryAmount: '' }));
            }}
            returnKeyType="done"
            error={errors.salaryAmount}
            editable={!saving}
          />
        </FormField>
      </View>

      {/* JOINING DATE */}
      <View style={styles.section}>
        <FormField id="joiningDate" label="Joining Date">
          <DateField
            value={joiningDate}
            placeholder="DD/MM/YYYY"
            onChange={(_date, formatted) => {
              setJoiningDate(formatted);
            }}
          />
        </FormField>
      </View>

      {/* Success Dialog */}
      <SuccessDialog
        visible={showSuccess}
        title={isEdit ? 'Changes Saved' : 'Worker Added'}
        message={
          isEdit
            ? `"${savedWorkerName || 'Worker'}" profile has been updated.`
            : `"${savedWorkerName || 'Worker'}" has been successfully added to the workforce.`
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
