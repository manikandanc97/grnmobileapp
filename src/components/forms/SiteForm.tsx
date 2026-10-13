import { Radius, Spacing, Colors } from '@/constants/theme';

import { UiStyles } from '@/constants/uiStyles';
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { MapPin, Check } from 'lucide-react-native';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { SiteType } from '@/types/dashboard';
import { SiteRow } from '@/types/database';
import {
  createSite,
  updateSite,
  getSiteById,
  CreateSiteParams,
} from '@/services/sites';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';


// Shared UI Architecture
import { FormScreen } from '@/components/ui/FormScreen';
import { FormField } from '@/components/ui/FormField';
import { TextField } from '@/components/ui/TextField';
import { DateField } from '@/components/ui/DateField';
import { BottomActionBar } from '@/components/ui/BottomActionBar';
import { Button } from '@/components/ui/Button';
import { SuccessDialog } from '@/components/ui/SuccessDialog';
import { ErrorDialog } from '@/components/ui/ErrorDialog';
import { toast } from '@/lib/toast';

dayjs.extend(customParseFormat);

const PROJECT_TYPES: SiteType[] = ['Residential', 'Commercial', 'Renovation'];

function formatIsoToDisplay(iso?: string | null): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return iso;
}

export interface SiteFormProps {
  mode: 'create' | 'edit';
  siteId?: string;
  initialData?: {
    name?: string;
    location?: string;
    type?: SiteType;
    startDate?: string;
    expectedCompletion?: string;
    budget?: string;
  };
  onSuccess?: (site: SiteRow) => void;
}

export function SiteForm({
  mode,
  siteId,
  initialData,
  onSuccess,
}: SiteFormProps) {
  const isEdit = mode === 'edit';
  const { isOffline } = useNetworkStatus();

  const [name, setName] = useState(initialData?.name ?? '');
  const [location, setLocation] = useState(initialData?.location ?? '');
  const [projectType, setProjectType] = useState<SiteType>(
    initialData?.type ?? 'Residential'
  );
  const [startDate, setStartDate] = useState(
    initialData?.startDate ? formatIsoToDisplay(initialData.startDate) : ''
  );
  const [expectedCompletion, setExpectedCompletion] = useState(
    initialData?.expectedCompletion
      ? formatIsoToDisplay(initialData.expectedCompletion)
      : ''
  );
  const [budget, setBudget] = useState(
    initialData?.budget != null ? String(initialData.budget) : ''
  );

  const [isLoadingInitial, setIsLoadingInitial] = useState(isEdit && !initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorDialogMessage, setErrorDialogMessage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedSiteName, setSavedSiteName] = useState('');

  // Field refs for focus chaining
  const locationInputRef = useRef<TextInput>(null);
  const budgetInputRef = useRef<TextInput>(null);

  // Fetch initial site data if editing and not provided
  useEffect(() => {
    if (isEdit && siteId && !initialData) {
      let isMounted = true;
      (async () => {
        try {
          setIsLoadingInitial(true);
          const data = await getSiteById(siteId);
          if (isMounted && data) {
            setName(data.name);
            setLocation(data.location);
            setProjectType(data.type as SiteType);
            setStartDate(formatIsoToDisplay(data.start_date));
            setExpectedCompletion(formatIsoToDisplay(data.expected_completion));
            setBudget(data.budget != null ? String(data.budget) : '');
          }
        } catch (err) {
          console.error('[SiteForm] Load error:', err);
          if (isMounted) {
            setErrorDialogMessage('Failed to load site information.');
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
  }, [isEdit, siteId, initialData]);

  const parsedStartDate = useMemo(
    () => (startDate ? dayjs(startDate, 'DD/MM/YYYY').toDate() : undefined),
    [startDate]
  );
  const parsedExpectedCompletion = useMemo(
    () =>
      expectedCompletion
        ? dayjs(expectedCompletion, 'DD/MM/YYYY').toDate()
        : undefined,
    [expectedCompletion]
  );

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Site Name is required';
    if (!location.trim()) newErrors.location = 'Location is required';
    if (!budget.trim()) {
      newErrors.budget = 'Project Budget is required';
    } else if (!Number.isFinite(Number(budget)) || Number(budget) <= 0) {
      newErrors.budget = 'Please enter a valid positive budget';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    const siteName = name.trim();

    try {
      let result: SiteRow;
      if (isEdit) {
        if (!siteId) {
          throw new Error('Site ID is missing for update operation.');
        }
        result = await updateSite(siteId, {
          name: siteName,
          location: location.trim(),
          type: projectType,
          startDate: startDate.trim() || undefined,
          expectedCompletion: expectedCompletion.trim() || undefined,
          budget: budget.trim() || undefined,
        });
      } else {
        const payload: CreateSiteParams = {
          name: siteName,
          location: location.trim(),
          type: projectType,
          startDate: startDate.trim() || undefined,
          expectedCompletion: expectedCompletion.trim() || undefined,
          budget: budget.trim() || undefined,
        };
        result = await createSite(payload);
      }

      Keyboard.dismiss();
      setIsSubmitting(false);
      setSavedSiteName(siteName);
      toast.success(
        isEdit ? 'Site Updated' : 'Site Created',
        `${siteName} • ${location.trim()}`
      );
      setShowSuccess(true);
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : isEdit
          ? 'Failed to update site.'
          : 'Failed to create site.';
      setErrorDialogMessage(msg);
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    router.back();
  };

  const isFormValid = name.trim().length > 0 && location.trim().length > 0 && budget.trim().length > 0;

  if (isLoadingInitial) {
    return (
      <FormScreen
        title="Edit Site"
        subtitle="Loading site information..."
        showBack
      >
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.light.brand} />
          <Text style={styles.loadingText}>Loading site details...</Text>
        </View>
      </FormScreen>
    );
  }

  return (
    <FormScreen
      title={isEdit ? 'Edit Site' : 'Create Site'}
      subtitle={
        isEdit
          ? 'Update your site details.'
          : 'Add your site name, location and budget.'
      }
      showBack
      bottomBar={
        <BottomActionBar>
          <Button
            title="Cancel"
            variant="secondary"
            onPress={() => router.back()}
            disabled={isSubmitting}
          />
          <Button
            title={isEdit ? 'Save Changes' : 'Create Site'}
            variant="primary"
            icon={<Check size={18} color={Colors.light.surface} />}
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!isFormValid || isSubmitting}
            style={styles.actionBtn}
          />
        </BottomActionBar>
      }
    >
      {/* Site details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PROJECT DETAILS</Text>

        <FormField id="name" label="Site Name" required error={errors.name}>
          <TextField
            id="name"
            placeholder="e.g. Green Villa Phase 2"
            value={name}
            onChangeText={(v) => {
              setName(v);
              if (errors.name) setErrors((e) => ({ ...e, name: '' }));
            }}
            editable={!isSubmitting}
            returnKeyType="next"
            nextFieldRef={locationInputRef}
            error={errors.name}
          />
        </FormField>

        <FormField label="Project Type">
          <View style={styles.typeSelector}>
            {PROJECT_TYPES.map((type) => {
              const isActive = type === projectType;
              return (
                <Pressable
                  key={type}
                  style={[
                    styles.typeOption,
                    isActive && styles.typeOptionActive,
                  ]}
                  onPress={() => setProjectType(type)}
                  disabled={isSubmitting}
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      isActive && styles.typeOptionTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </FormField>
      </View>

      {/* LOCATION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>

        <FormField
          id="location"
          label="Location"
          required
          error={errors.location}
        >
          <TextField
            ref={locationInputRef}
            id="location"
            placeholder="Enter site location / address"
            value={location}
            onChangeText={(v) => {
              setLocation(v);
              if (errors.location) setErrors((e) => ({ ...e, location: '' }));
            }}
            leftIcon={<MapPin size={18} color={Colors.light.textMuted} />}
            editable={!isSubmitting}
            error={errors.location}
          />
        </FormField>
      </View>

      {/* TIMELINE & BUDGET */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Budget and dates</Text>

        <View style={styles.row}>
          <View style={styles.col}>
            <FormField id="startDate" label="Start Date">
              <DateField
                value={startDate}
                placeholder="DD/MM/YYYY"
                onChange={(_date, formatted) => {
                  setStartDate(formatted);
                  if (
                    parsedExpectedCompletion &&
                    dayjs(formatted, 'DD/MM/YYYY').isAfter(
                      dayjs(parsedExpectedCompletion),
                      'day'
                    )
                  ) {
                    setExpectedCompletion('');
                  }
                }}
              />
            </FormField>
          </View>

          <View style={styles.col}>
            <FormField id="expectedCompletion" label="Expected End">
              <DateField
                value={expectedCompletion}
                minDate={parsedStartDate}
                placeholder="DD/MM/YYYY"
                onChange={(_date, formatted) => {
                  setExpectedCompletion(formatted);
                }}
              />
            </FormField>
          </View>
        </View>

        <FormField id="budget" label="Project Budget (₹)" required error={errors.budget}>
          <TextField
            ref={budgetInputRef}
            id="budget"
            placeholder="e.g. 5000000"
            value={budget}
            onChangeText={(v) => {
              setBudget(v);
              if (errors.budget) setErrors((e) => ({ ...e, budget: '' }));
            }}
            keyboardType="decimal-pad"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            editable={!isSubmitting}
            error={errors.budget}
          />
        </FormField>
      </View>

      {/* Success Dialog */}
      <SuccessDialog
        visible={showSuccess}
        title={isOffline ? 'Saved Locally' : isEdit ? 'Changes Saved' : 'Site Created'}
        message={
          isOffline
            ? `"${savedSiteName || 'Site'}" has been saved to this device and will sync automatically once an internet connection is available.`
            : isEdit
            ? `"${savedSiteName || 'Site'}" has been successfully updated.`
            : `"${savedSiteName || 'Site'}" has been successfully created.`
        }
        buttonText="Done"
        onClose={handleSuccessClose}
      />

      {/* Error Dialog */}
      <ErrorDialog
        visible={Boolean(errorDialogMessage)}
        message={errorDialogMessage || 'Something went wrong.'}
        onClose={() => setErrorDialogMessage(null)}
        onRetry={handleSubmit}
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
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...UiStyles.sectionTitle,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  col: {
    flex: 1,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  typeOption: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surfaceMuted,
    backgroundColor: Colors.light.surface,
  },
  typeOptionActive: {
    borderColor: Colors.light.brand,
    backgroundColor: Colors.light.brandBg,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textMuted,
  },
  typeOptionTextActive: {
    color: Colors.light.brand,
    fontWeight: '700',
  },
  actionBtn: {
    flex: 2,
  },
});
