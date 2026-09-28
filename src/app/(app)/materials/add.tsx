import React, { useState, useRef } from 'react';
import { View, StyleSheet, Alert, TextInput, Keyboard } from 'react-native';
import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useSites } from '@/hooks/useSites';
import { createMaterial } from '@/services/materials';
import { useMasterData } from '@/hooks/useMasterData';
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

export default function AddMaterialScreen() {
  const { sites, loading: sitesLoading } = useSites();
  const {
    categories,
    units,
    addCategory,
    deleteCategory,
  } = useMasterData();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [siteId, setSiteId] = useState<string>('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [purchaseDate, setPurchaseDate] = useState<Date>(new Date());
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdMaterialName, setCreatedMaterialName] = useState('');

  // Input refs for focus chaining
  const quantityInputRef = useRef<TextInput>(null);
  const supplierInputRef = useRef<TextInput>(null);
  const notesInputRef = useRef<TextInput>(null);

  // Set default site when sites load
  React.useEffect(() => {
    if (sites.length > 0 && !siteId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSiteId(sites[0].id);
    }
  }, [sites, siteId]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Material Name is required';
    if (!category) newErrors.category = 'Category is required';
    if (!unit) newErrors.unit = 'Unit is required';
    if (!siteId) newErrors.siteId = 'Site is required';
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      newErrors.quantity = 'Enter a valid positive quantity';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || isSaving) return;

    setIsSaving(true);
    const materialName = name.trim();

    try {
      await createMaterial({
        name: materialName,
        category,
        site_id: siteId,
        quantity: Number(quantity),
        unit,
        status: 'Available',
        received: Number(quantity),
        used: 0,
      });

      Keyboard.dismiss();
      setIsSaving(false);
      setCreatedMaterialName(materialName);
      setShowSuccess(true);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save material');
      setIsSaving(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    router.back();
  };

  const handleAddCategory = () => {
    Alert.prompt(
      'New Category',
      'Enter category name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: (text?: string) => {
            if (text) {
              addCategory(text);
              setCategory(text);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleDeleteCategory = async (cat: string) => {
    const result = await deleteCategory(cat);
    if (!result.success) {
      Alert.alert('Cannot Delete', result.message);
    } else {
      if (category === cat) setCategory('');
    }
  };

  const siteOptions: SelectOption[] = sites.map((s) => ({ label: s.name, value: s.id }));
  const categoryOptions: SelectOption[] = categories.map((c) => ({ label: c, value: c }));
  const unitOptions: SelectOption[] = units.map((u) => ({ label: u, value: u }));

  return (
    <FormScreen
      title="Add Material"
      showBack
      bottomBar={
        <BottomActionBar>
          <Button
            title="Cancel"
            variant="secondary"
            onPress={() => router.back()}
            disabled={isSaving}
          />
          <Button
            title="Save Material"
            variant="primary"
            icon={<Check size={18} color="#FFFFFF" />}
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving}
            style={styles.saveBtn}
          />
        </BottomActionBar>
      }
    >
      {/* MATERIAL DETAILS */}
      <View style={styles.section}>
        <FormField id="name" label="Material Name" required error={errors.name}>
          <TextField
            id="name"
            placeholder="e.g. Ramco Cement Grade 43"
            value={name}
            onChangeText={(v) => {
              setName(v);
              if (errors.name) setErrors((e) => ({ ...e, name: '' }));
            }}
            error={errors.name}
            returnKeyType="next"
          />
        </FormField>

        <View style={styles.row}>
          <View style={styles.flex1}>
            <FormField id="category" label="Category" required error={errors.category}>
              <SelectField
                value={category}
                options={categoryOptions}
                onChange={(v) => {
                  setCategory(v);
                  if (errors.category) setErrors((e) => ({ ...e, category: '' }));
                }}
                placeholder="Select Category"
                onAddOption={handleAddCategory}
                onDeleteOption={handleDeleteCategory}
                manageLabel="Add Category"
                error={errors.category}
              />
            </FormField>
          </View>

          <View style={styles.flex1}>
            <FormField id="unit" label="Unit" required error={errors.unit}>
              <SelectField
                value={unit}
                options={unitOptions}
                onChange={(v) => {
                  setUnit(v);
                  if (errors.unit) setErrors((e) => ({ ...e, unit: '' }));
                }}
                placeholder="Select Unit"
                error={errors.unit}
              />
            </FormField>
          </View>
        </View>
      </View>

      {/* PROJECT */}
      <View style={styles.section}>
        <FormField id="siteId" label="Site" required error={errors.siteId}>
          <SelectField
            value={siteId}
            options={siteOptions}
            onChange={(v) => {
              setSiteId(v);
              if (errors.siteId) setErrors((e) => ({ ...e, siteId: '' }));
            }}
            placeholder={sitesLoading ? 'Loading sites...' : 'Select Site'}
            error={errors.siteId}
          />
        </FormField>
      </View>

      {/* QUANTITY & PROCUREMENT */}
      <View style={styles.section}>
        <FormField id="quantity" label="Quantity" required error={errors.quantity}>
          <TextField
            ref={quantityInputRef}
            id="quantity"
            placeholder="0.00"
            keyboardType="numeric"
            value={quantity}
            onChangeText={(v) => {
              setQuantity(v);
              if (errors.quantity) setErrors((e) => ({ ...e, quantity: '' }));
            }}
            returnKeyType="next"
            nextFieldRef={supplierInputRef}
            error={errors.quantity}
          />
        </FormField>

        <FormField id="purchaseDate" label="Purchase Date">
          <DateField
            value={purchaseDate}
            onChange={(d) => setPurchaseDate(d)}
          />
        </FormField>

        <FormField id="supplier" label="Supplier">
          <TextField
            ref={supplierInputRef}
            id="supplier"
            placeholder="Supplier Name"
            value={supplier}
            onChangeText={setSupplier}
            returnKeyType="next"
            nextFieldRef={notesInputRef}
          />
        </FormField>
      </View>

      {/* ADDITIONAL INFO */}
      <View style={styles.section}>
        <FormField id="notes" label="Notes">
          <TextField
            ref={notesInputRef}
            id="notes"
            placeholder="Any additional notes or specifications..."
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
          />
        </FormField>
      </View>

      <SuccessDialog
        visible={showSuccess}
        title="Material Added"
        message={`"${createdMaterialName || 'Material'}" has been successfully added.`}
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
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  flex1: {
    flex: 1,
  },
  saveBtn: {
    flex: 2,
  },
});
