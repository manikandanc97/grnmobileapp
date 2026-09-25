import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { X, ChevronDown, Check } from 'lucide-react-native';
import { MaterialCategory, MaterialUnit, MaterialStatus } from '@/types/dashboard';
import { useSites } from '@/hooks/useSites';
import { createMaterial } from '@/services/materials';



export default function AddMaterialScreen() {
  const { sites, loading: sitesLoading } = useSites();
  
  const [name, setName] = useState('');
  const [category] = useState<MaterialCategory>('Cement');
  const [siteId, setSiteId] = useState<string>('');
  const [quantity, setQuantity] = useState('');
  const [unit] = useState<MaterialUnit>('Bags');
  const [status] = useState<MaterialStatus>('Available');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default site when sites load
  React.useEffect(() => {
    if (sites.length > 0 && !siteId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSiteId(sites[0].id);
    }
  }, [sites, siteId]);

  const handleSave = async () => {
    if (!name || !siteId || !quantity) {
      setError('Name, Site, and Quantity are required.');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      await createMaterial({
        name,
        category,
        site_id: siteId,
        quantity: Number(quantity),
        unit,
        status,
        received: Number(quantity), // Initially received equals quantity
        used: 0,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save material');
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add Material</Text>
          <Pressable
            style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
            onPress={() => router.back()}
          >
            <X size={24} color="#0F354A" />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          
          {/* Form Fields */}
          {error && (
            <View style={{ backgroundColor: '#FEF2F2', padding: 12, borderRadius: 8, marginBottom: 16 }}>
              <Text style={{ color: '#DC2626', fontSize: 14 }}>{error}</Text>
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Material Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Ramco Cement Grade 43"
              placeholderTextColor="#8A99A4"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.pickerContainer}>
                {/* Simulated picker for brevity */}
                <Text style={styles.pickerText}>{category}</Text>
                <ChevronDown size={20} color="#8A99A4" />
              </View>
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Unit</Text>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerText}>{unit}</Text>
                <ChevronDown size={20} color="#8A99A4" />
              </View>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Site</Text>
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerText}>
                {sitesLoading ? 'Loading sites...' : (sites.find(s => s.id === siteId)?.name || 'Select Site')}
              </Text>
              <ChevronDown size={20} color="#8A99A4" />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#8A99A4"
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Purchase Date</Text>
            <TextInput
              style={styles.input}
              placeholder="DD/MM/YYYY"
              placeholderTextColor="#8A99A4"
              value={purchaseDate}
              onChangeText={setPurchaseDate}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Supplier</Text>
            <TextInput
              style={styles.input}
              placeholder="Supplier Name"
              placeholderTextColor="#8A99A4"
              value={supplier}
              onChangeText={setSupplier}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any additional notes..."
              placeholderTextColor="#8A99A4"
              multiline
              numberOfLines={4}
              value={notes}
              onChangeText={setNotes}
            />
          </View>

        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [styles.cancelButton, pressed && styles.buttonPressed]}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.saveButton, 
              (pressed || isSaving) && styles.buttonPressed,
              isSaving && { opacity: 0.7 }
            ]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Check size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Material'}</Text>
          </Pressable>
        </View>
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
    paddingTop: Platform.OS === 'ios' ? 20 : 20, // Modal presentation usually doesn't need huge top padding
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F354A',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonPressed: {
    opacity: 0.5,
  },
  content: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F354A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF2F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 15,
    color: '#0F354A',
    ...(Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)),
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF2F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  pickerText: {
    fontSize: 15,
    color: '#0F354A',
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
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7A85',
  },
  saveButton: {
    flex: 2,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#F2A619',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
