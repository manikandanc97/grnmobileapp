import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Keyboard,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Check, Building2 } from 'lucide-react-native';
import { useSites } from '@/hooks/useSites';
import {
  createMaterial,
  updateMaterial,
  getMaterialById,
  CreateMaterialParams,
} from '@/services/materials';
import { useMasterData } from '@/hooks/useMasterData';
import { MaterialItem, MaterialCategory, MaterialUnit, MaterialStatus } from '@/types/dashboard';
import { calculateMaterialCost } from '@/lib/finance';
import { Spacing } from '@/constants/theme';
import { Money } from '@/components/ui/Money';

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

const MATERIAL_STATUSES: MaterialStatus[] = [
  'Available',
  'Low Stock',
  'Pending',
  'Out of Stock',
];

export interface MaterialFormProps {
  mode: 'create' | 'edit';
  materialId?: string;
  initialData?: Partial<CreateMaterialParams & { purchaseDate?: Date; supplier?: string; notes?: string }>;
  onSuccess?: (material: MaterialItem) => void;
}

export function MaterialForm({
  mode,
  materialId,
  initialData,
  onSuccess,
}: MaterialFormProps) {
  const isEdit = mode === 'edit';

  const { sites, loading: sitesLoading } = useSites();
  const { categories, units, addCategory, deleteCategory } = useMasterData();

  const [name, setName] = useState(initialData?.name ?? '');
  const [category, setCategory] = useState<MaterialCategory>(
    (initialData?.category as MaterialCategory) ?? ''
  );
  const [siteId, setSiteId] = useState<string>(initialData?.site_id ?? '');
  const [quantity, setQuantity] = useState(
    initialData?.quantity !== undefined ? String(initialData.quantity) : ''
  );
  const [unit, setUnit] = useState<MaterialUnit>(
    (initialData?.unit as MaterialUnit) ?? ''
  );
  const [status, setStatus] = useState<MaterialStatus>(
    initialData?.status ?? 'Available'
  );
  const [used, setUsed] = useState(
    initialData?.used !== undefined ? String(initialData.used) : '0'
  );
  const [received, setReceived] = useState(
    initialData?.received !== undefined ? String(initialData.received) : ''
  );
  const [unitPrice, setUnitPrice] = useState(
    initialData?.unit_price !== undefined ? String(initialData.unit_price) : ''
  );
  
  const totalCost = useMemo(() => {
    return calculateMaterialCost(Number(quantity), Number(unitPrice));
  }, [quantity, unitPrice]);

  const [purchaseDate, setPurchaseDate] = useState<Date>(
    initialData?.purchaseDate ?? new Date()
  );
  const [supplier, setSupplier] = useState(initialData?.supplier ?? '');
  const [notes, setNotes] = useState(initialData?.notes ?? '');

  const [isLoadingInitial, setIsLoadingInitial] = useState(isEdit && !initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorDialogMessage, setErrorDialogMessage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedMaterialName, setSavedMaterialName] = useState('');

  // Input refs for focus chaining
  const quantityInputRef = useRef<TextInput>(null);
  const usedInputRef = useRef<TextInput>(null);
  const supplierInputRef = useRef<TextInput>(null);
  const notesInputRef = useRef<TextInput>(null);

  // Derived effective site ID (default to first site if creating and none selected)
  const effectiveSiteId = siteId || (!isEdit && sites.length > 0 ? sites[0].id : '');

  // Fetch initial material data if editing and not provided
  useEffect(() => {
    if (isEdit && materialId && !initialData) {
      let isMounted = true;
      (async () => {
        try {
          setIsLoadingInitial(true);
          const data = await getMaterialById(materialId);
          if (isMounted && data) {
            setName(data.name);
            setCategory(data.category);
            setSiteId(data.siteId);
            setQuantity(String(data.quantity));
            setUnit(data.unit);
            setStatus(data.status);
            setUsed(String(data.used ?? 0));
            setReceived(String(data.received ?? data.quantity));
            setUnitPrice(String(data.unitPrice ?? 0));
          }
        } catch (err) {
          console.error('[MaterialForm] Load error:', err);
          if (isMounted) {
            setErrorDialogMessage('Failed to load material details.');
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
  }, [isEdit, materialId, initialData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Material Name is required';
    if (!category) newErrors.category = 'Category is required';
    if (!unit) newErrors.unit = 'Unit is required';
    if (!effectiveSiteId) newErrors.siteId = 'Site is required';
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      newErrors.quantity = 'Enter a valid positive quantity';
    }
    if (isEdit) {
      if (used && (isNaN(Number(used)) || Number(used) < 0)) {
        newErrors.used = 'Used amount must be non-negative';
      }
    }
    if (unitPrice && (isNaN(Number(unitPrice)) || Number(unitPrice) < 0)) {
      newErrors.unitPrice = 'Enter a valid non-negative price';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || isSaving) return;

    setIsSaving(true);
    const materialName = name.trim();
    const qtyNum = Number(quantity);
    const usedNum = Number(used) || 0;
    const receivedNum = received ? Number(received) : qtyNum;
    const priceNum = Number(unitPrice) || 0;

    try {
      let result: MaterialItem;
      if (isEdit) {
        if (!materialId) {
          throw new Error('Material ID is required for editing.');
        }
        result = await updateMaterial(materialId, {
          name: materialName,
          category,
          site_id: effectiveSiteId,
          quantity: qtyNum,
          unit,
          status,
          used: usedNum,
          received: receivedNum,
          unit_price: priceNum,
          total_cost: calculateMaterialCost(qtyNum, priceNum),
        });
      } else {
        const payload: CreateMaterialParams = {
          name: materialName,
          category,
          site_id: effectiveSiteId,
          quantity: qtyNum,
          unit,
          status,
          received: qtyNum,
          used: 0,
          unit_price: priceNum,
          total_cost: calculateMaterialCost(qtyNum, priceNum),
        };
        result = await createMaterial(payload);
      }

      Keyboard.dismiss();
      setIsSaving(false);
      setSavedMaterialName(materialName);
      setShowSuccess(true);
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : isEdit
          ? 'Failed to update material.'
          : 'Failed to save material.';
      setErrorDialogMessage(msg);
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
              setCategory(text as MaterialCategory);
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
      if (category === cat) setCategory('' as MaterialCategory);
    }
  };

  const siteOptions: SelectOption[] = useMemo(
    () => sites.map((s) => ({ label: s.name, value: s.id, sublabel: s.location })),
    [sites]
  );
  const categoryOptions: SelectOption[] = useMemo(
    () => categories.map((c) => ({ label: c, value: c })),
    [categories]
  );
  const unitOptions: SelectOption[] = useMemo(
    () => units.map((u) => ({ label: u, value: u })),
    [units]
  );

  const isFormValid =
    name.trim().length > 0 &&
    Boolean(category) &&
    Boolean(unit) &&
    Boolean(siteId) &&
    Boolean(quantity);

  if (isLoadingInitial) {
    return (
      <FormScreen
        title="Edit Material"
        subtitle="Loading material details..."
        showBack
      >
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0B5364" />
          <Text style={styles.loadingText}>Loading material details...</Text>
        </View>
      </FormScreen>
    );
  }

  return (
    <FormScreen
      title={isEdit ? 'Edit Material' : 'Add Material'}
      subtitle={
        isEdit
          ? 'Modify stock records, categories, and inventory status.'
          : 'Track materials and inventory across your construction sites.'
      }
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
            title={isEdit ? 'Save Changes' : 'Save Material'}
            variant="primary"
            icon={<Check size={18} color="#FFFFFF" />}
            onPress={handleSave}
            loading={isSaving}
            disabled={!isFormValid || isSaving}
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
            editable={!isSaving}
          />
        </FormField>

        <View style={styles.row}>
          <View style={styles.flex1}>
            <FormField id="category" label="Category" required error={errors.category}>
              <SelectField
                value={category}
                options={categoryOptions}
                onChange={(v) => {
                  setCategory(v as MaterialCategory);
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
                  setUnit(v as MaterialUnit);
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
            value={effectiveSiteId}
            options={siteOptions}
            onChange={(v) => {
              setSiteId(v);
              if (errors.siteId) setErrors((e) => ({ ...e, siteId: '' }));
            }}
            placeholder={sitesLoading ? 'Loading sites...' : 'Select Site'}
            leftIcon={<Building2 size={18} color="#71808A" />}
            error={errors.siteId}
          />
        </FormField>
      </View>

      {/* STATUS CHIPS (Edit Mode) */}
      {isEdit && (
        <View style={styles.section}>
          <FormField label="Inventory Status">
            <View style={styles.statusChipsContainer}>
              {MATERIAL_STATUSES.map((st) => {
                const isActive = st === status;
                return (
                  <Pressable
                    key={st}
                    style={[
                      styles.statusChip,
                      isActive && styles.statusChipActive,
                    ]}
                    onPress={() => setStatus(st)}
                    disabled={isSaving}
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

      {/* QUANTITY & PROCUREMENT */}
      <View style={styles.section}>
        <FormField id="quantity" label="Total Stock / Quantity" required error={errors.quantity}>
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
            returnKeyType={isEdit ? 'next' : 'next'}
            nextFieldRef={isEdit ? usedInputRef : supplierInputRef}
            error={errors.quantity}
            editable={!isSaving}
          />
        </FormField>

        <FormField id="unitPrice" label="Unit Price" error={errors.unitPrice}>
          <TextField
            id="unitPrice"
            placeholder="0.00"
            keyboardType="numeric"
            value={unitPrice}
            onChangeText={(v) => {
              setUnitPrice(v);
              if (errors.unitPrice) setErrors((e) => ({ ...e, unitPrice: '' }));
            }}
            returnKeyType={isEdit ? 'next' : 'next'}
            nextFieldRef={isEdit ? usedInputRef : supplierInputRef}
            error={errors.unitPrice}
            editable={!isSaving}
          />
        </FormField>
        
        <View style={styles.totalCostContainer}>
          <Text style={styles.totalCostLabel}>Total Cost</Text>
          <Money amount={totalCost} style={styles.totalCostValue} />
        </View>

        {isEdit && (
          <FormField id="used" label="Used Quantity" error={errors.used}>
            <TextField
              ref={usedInputRef}
              id="used"
              placeholder="0.00"
              keyboardType="numeric"
              value={used}
              onChangeText={(v) => {
                setUsed(v);
                if (errors.used) setErrors((e) => ({ ...e, used: '' }));
              }}
              returnKeyType="next"
              nextFieldRef={supplierInputRef}
              error={errors.used}
              editable={!isSaving}
            />
          </FormField>
        )}

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
            editable={!isSaving}
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
            editable={!isSaving}
          />
        </FormField>
      </View>

      {/* Success Dialog */}
      <SuccessDialog
        visible={showSuccess}
        title={isEdit ? 'Changes Saved' : 'Material Added'}
        message={
          isEdit
            ? `"${savedMaterialName || 'Material'}" has been updated.`
            : `"${savedMaterialName || 'Material'}" has been successfully added.`
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
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  flex1: {
    flex: 1,
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
  saveBtn: {
    flex: 2,
  },
  totalCostContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EEF2F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  totalCostLabel: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  totalCostValue: {
    fontSize: 18,
    color: '#0F354A',
    fontWeight: '700',
  },
});
