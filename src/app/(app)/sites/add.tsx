import React, { useState } from 'react';
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
} from 'react-native';
import { router } from 'expo-router';
import { X, Check } from 'lucide-react-native';
import { SiteType } from '@/types/dashboard';
import { createSite } from '@/services/sites';

const PROJECT_TYPES: SiteType[] = ['Residential', 'Commercial', 'Renovation'];

export default function AddSiteScreen() {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [projectType, setProjectType] = useState<SiteType>('Residential');
  const [startDate, setStartDate] = useState('');
  const [expectedCompletion, setExpectedCompletion] = useState('');
  const [budget, setBudget] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim() || !location.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await createSite({
        name: name.trim(),
        location: location.trim(),
        type: projectType,
        startDate: startDate.trim() || undefined,
        expectedCompletion: expectedCompletion.trim() || undefined,
        budget: budget.trim() || undefined,
      });

      router.back();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create site.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Add New Site</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.closeIcon,
            pressed && styles.closeIconPressed,
          ]}
          onPress={() => router.back()}
        >
          <X size={24} color="#8A99A4" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {errorMessage && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Site Name <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Green Villa Phase 2"
            placeholderTextColor="#A0AAB2"
            value={name}
            onChangeText={setName}
            editable={!isSubmitting}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Location <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Coimbatore"
            placeholderTextColor="#A0AAB2"
            value={location}
            onChangeText={setLocation}
            editable={!isSubmitting}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Project Type</Text>
          <View style={styles.typeSelector}>
            {PROJECT_TYPES.map((type) => {
              const isActive = type === projectType;
              return (
                <Pressable
                  key={type}
                  style={[
                    styles.typeOption,
                    isActive && styles.typeOptionActive
                  ]}
                  onPress={() => setProjectType(type)}
                  disabled={isSubmitting}
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      isActive && styles.typeOptionTextActive
                    ]}
                  >
                    {type}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Start Date</Text>
            <TextInput
              style={styles.input}
              placeholder="DD/MM/YYYY"
              placeholderTextColor="#A0AAB2"
              value={startDate}
              onChangeText={setStartDate}
              editable={!isSubmitting}
            />
          </View>

          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Expected End</Text>
            <TextInput
              style={styles.input}
              placeholder="DD/MM/YYYY"
              placeholderTextColor="#A0AAB2"
              value={expectedCompletion}
              onChangeText={setExpectedCompletion}
              editable={!isSubmitting}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Estimated Budget</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. ₹50L"
            placeholderTextColor="#A0AAB2"
            value={budget}
            onChangeText={setBudget}
            editable={!isSubmitting}
          />
        </View>

      </ScrollView>

      {/* Footer / Actions */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.cancelButton, pressed && styles.buttonPressed]}
          onPress={() => router.back()}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
        
        <Pressable
          style={({ pressed }) => [
            styles.createButton,
            pressed && styles.buttonPressed,
            (!name.trim() || !location.trim() || isSubmitting) && styles.createButtonDisabled
          ]}
          onPress={handleCreate}
          disabled={!name.trim() || !location.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" style={styles.createIcon} />
          ) : (
            <Check size={18} color="#FFFFFF" strokeWidth={2.5} style={styles.createIcon} />
          )}
          <Text style={styles.createButtonText}>
            {isSubmitting ? 'Creating...' : 'Create Site'}
          </Text>
        </Pressable>
      </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F354A',
  },
  closeIcon: {
    padding: 4,
  },
  closeIconPressed: {
    opacity: 0.5,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5C68',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF2F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    color: '#0F354A',
    fontWeight: '500',
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F6',
    borderRadius: 10,
    padding: 4,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  typeOptionActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  typeOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7A85',
  },
  typeOptionTextActive: {
    color: '#0F354A',
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
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
    backgroundColor: '#F3F6F8',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4B5C68',
  },
  createButton: {
    flex: 2,
    flexDirection: 'row',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#F2A619',
    shadowColor: '#F2A619',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonDisabled: {
    backgroundColor: '#FCD893',
    shadowOpacity: 0,
    elevation: 0,
  },
  createIcon: {
    marginRight: 8,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
});
