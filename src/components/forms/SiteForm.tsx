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
import { SiteType, SiteStatus } from '@/types/dashboard';
import { SiteRow } from '@/types/database';
import {
  createSite,
  updateSite,
  getSiteById,
  CreateSiteParams,
} from '@/services/sites';
import { Spacing } from '@/constants/theme';

// Shared UI Architecture
import { FormScreen } from '@/components/ui/FormScreen';
import { FormField } from '@/components/ui/FormField';
import { TextField } from '@/components/ui/TextField';
import { DateField } from '@/components/ui/DateField';
import { BottomActionBar } from '@/components/ui/BottomActionBar';
import { Button } from '@/components/ui/Button';
import { SuccessDialog } from '@/components/ui/SuccessDialog';
import { ErrorDialog } from '@/components/ui/ErrorDialog';

dayjs.extend(customParseFormat);

const PROJECT_TYPES: SiteType[] = ['Residential', 'Commercial', 'Renovation'];
const SITE_STATUSES: SiteStatus[] = [
  'In Progress',
  'On Track',
  'Finishing',
  'Delayed',
];

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
    progress?: number;
    status?: SiteStatus;
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
  const [budget, setBudget] = useState(initialData?.budget ?? '');
  const [progress, setProgress] = useState(
    initialData?.progress !== undefined ? String(initialData.progress) : '0'
  );
  const [status, setStatus] = useState<SiteStatus>(
    initialData?.status ?? 'In Progress'
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
  const progressInputRef = useRef<TextInput>(null);

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
            setBudget(data.budget !== null ? String(data.budget) : '');
            setProgress(String(data.progress ?? 0));
            setStatus((data.status as SiteStatus) || 'In Progress');
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
    } else if (isNaN(Number(budget)) || Number(budget) <= 0) {
      newErrors.budget = 'Please enter a valid positive budget';
    }
    if (isEdit) {
      const progNum = Number(progress);
      if (isNaN(progNum) || progNum < 0 || progNum > 100) {
        newErrors.progress = 'Progress must be a number between 0 and 100';
      }
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
          progress: Number(progress) || 0,
          status,
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
          <ActivityIndicator size="large" color="#0B5364" />
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
          ? 'Update the project specifications and site status.'
          : 'Set up the basic information for your construction site.'
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
            icon={<Check size={18} color="#FFFFFF" />}
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!isFormValid || isSubmitting}
            style={styles.actionBtn}
          />
        </BottomActionBar>
      }
    >
      {/* PROJECT DETAILS */}
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
        <Text style={styles.sectionTitle}>LOCATION</Text>

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
            leftIcon={<MapPin size={18} color="#71808A" />}
            editable={!isSubmitting}
            error={errors.location}
          />
        </FormField>
      </View>

      {/* STATUS & PROGRESS (Edit Mode) */}
      {isEdit && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROGRESS & STATUS</Text>

          <FormField
            id="progress"
            label="Progress (%)"
            error={errors.progress}
          >
            <TextField
              ref={progressInputRef}
              id="progress"
              placeholder="e.g. 45"
              value={progress}
              onChangeText={(v) => {
                setProgress(v);
                if (errors.progress) setErrors((e) => ({ ...e, progress: '' }));
              }}
              keyboardType="numeric"
              editable={!isSubmitting}
              error={errors.progress}
            />
          </FormField>

          <FormField label="Site Status">
            <View style={styles.statusChipsContainer}>
              {SITE_STATUSES.map((st) => {
                const isActive = st === status;
                return (
                  <Pressable
                    key={st}
                    style={[
                      styles.statusChip,
                      isActive && styles.statusChipActive,
                    ]}
                    onPress={() => setStatus(st)}
                    disabled={isSubmitting}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        isActive && styles.statusChipTextActive,
                      ]}
                    >
                      {st}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </FormField>
        </View>
      )}

      {/* TIMELINE & BUDGET */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PROJECT INFORMATION</Text>

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
        title={isEdit ? 'Changes Saved' : 'Site Created'}
        message={
          isEdit
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
    color: '#6B7A85',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#71808A',
    letterSpacing: 0.8,
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
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EEF2F6',
    backgroundColor: '#FFFFFF',
  },
  typeOptionActive: {
    borderColor: '#E79524',
    backgroundColor: '#FFF8F0',
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#71808A',
  },
  typeOptionTextActive: {
    color: '#E79524',
    fontWeight: '700',
  },
  statusChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EEF2F6',
  },
  statusChipActive: {
    backgroundColor: '#0F354A',
    borderColor: '#0F354A',
  },
  statusChipText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  statusChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  actionBtn: {
    flex: 2,
  },
});
