import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Keyboard,
} from 'react-native';
import { router } from 'expo-router';
import { MapPin, Check } from 'lucide-react-native';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { SiteType } from '@/types/dashboard';
import { createSite } from '@/services/sites';
import { Spacing } from '@/constants/theme';

// Shared UI Architecture
import { FormScreen } from '@/components/ui/FormScreen';
import { FormField } from '@/components/ui/FormField';
import { TextField } from '@/components/ui/TextField';
import { DateField } from '@/components/ui/DateField';
import { BottomActionBar } from '@/components/ui/BottomActionBar';
import { Button } from '@/components/ui/Button';
import { SuccessDialog } from '@/components/ui/SuccessDialog';

dayjs.extend(customParseFormat);

const PROJECT_TYPES: SiteType[] = ['Residential', 'Commercial', 'Renovation'];

export default function AddSiteScreen() {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [projectType, setProjectType] = useState<SiteType>('Residential');
  const [startDate, setStartDate] = useState('');
  const [expectedCompletion, setExpectedCompletion] = useState('');
  const [budget, setBudget] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdSiteName, setCreatedSiteName] = useState('');

  // Field refs for focus chaining
  const locationInputRef = useRef<TextInput>(null);
  const budgetInputRef = useRef<TextInput>(null);

  const parsedStartDate = useMemo(
    () => (startDate ? dayjs(startDate, 'DD/MM/YYYY').toDate() : undefined),
    [startDate]
  );
  const parsedExpectedCompletion = useMemo(
    () => (expectedCompletion ? dayjs(expectedCompletion, 'DD/MM/YYYY').toDate() : undefined),
    [expectedCompletion]
  );

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Site Name is required';
    if (!location.trim()) newErrors.location = 'Location is required';
    if (budget.trim() && isNaN(Number(budget))) {
      newErrors.budget = 'Please enter a valid numeric budget';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    const siteName = name.trim();

    try {
      await createSite({
        name: siteName,
        location: location.trim(),
        type: projectType,
        startDate: startDate.trim() || undefined,
        expectedCompletion: expectedCompletion.trim() || undefined,
        budget: budget.trim() || undefined,
      });

      Keyboard.dismiss();
      setIsSubmitting(false);
      setCreatedSiteName(siteName);
      setShowSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create site.';
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    router.back();
  };

  const isFormValid = name.trim().length > 0 && location.trim().length > 0;

  return (
    <FormScreen
      title="Create Site"
      subtitle="Set up the basic information for your construction site."
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
            title="Create Site"
            variant="primary"
            icon={<Check size={18} color="#FFFFFF" />}
            onPress={handleCreate}
            loading={isSubmitting}
            disabled={!isFormValid || isSubmitting}
            style={styles.createBtn}
          />
        </BottomActionBar>
      }
    >
      {errorMessage && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{errorMessage}</Text>
        </View>
      )}

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
                  style={[styles.typeOption, isActive && styles.typeOptionActive]}
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

        <FormField id="location" label="Location" required error={errors.location}>
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
                    dayjs(formatted, 'DD/MM/YYYY').isAfter(dayjs(parsedExpectedCompletion), 'day')
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

        <FormField id="budget" label="Budget (₹)" error={errors.budget}>
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
            onSubmitEditing={handleCreate}
            editable={!isSubmitting}
            error={errors.budget}
          />
        </FormField>
      </View>

      <SuccessDialog
        visible={showSuccess}
        title="Site Created"
        message={`"${createdSiteName || 'Site'}" has been successfully created.`}
        buttonText="Done"
        onClose={handleSuccessClose}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 12,
    marginBottom: Spacing.md,
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
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
  createBtn: {
    flex: 2,
  },
});
