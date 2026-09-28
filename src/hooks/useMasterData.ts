import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_MATERIAL_CATEGORIES, DEFAULT_MATERIAL_UNITS } from '@/constants/masterData';
import { getMaterials } from '@/services/materials';

const CATEGORY_STORAGE_KEY = '@grn_material_categories';
const UNIT_STORAGE_KEY = '@grn_material_units';

export function useMasterData() {
  const [categories, setCategories] = useState<string[]>(DEFAULT_MATERIAL_CATEGORIES);
  const [units, setUnits] = useState<string[]>(DEFAULT_MATERIAL_UNITS);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const storedCategories = await AsyncStorage.getItem(CATEGORY_STORAGE_KEY);
      const storedUnits = await AsyncStorage.getItem(UNIT_STORAGE_KEY);

      if (storedCategories) {
        setCategories(JSON.parse(storedCategories));
      } else {
        setCategories(DEFAULT_MATERIAL_CATEGORIES);
      }

      if (storedUnits) {
        setUnits(JSON.parse(storedUnits));
      } else {
        setUnits(DEFAULT_MATERIAL_UNITS);
      }
    } catch (e) {
      console.error('Failed to load master data', e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const addCategory = async (newCategory: string) => {
    if (!newCategory.trim() || categories.includes(newCategory.trim())) return;
    const updated = [...categories, newCategory.trim()];
    setCategories(updated);
    await AsyncStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(updated));
  };

  const deleteCategory = async (categoryToDelete: string): Promise<{ success: boolean; message?: string }> => {
    try {
      // Check if any materials use this category
      const materials = await getMaterials();
      const inUse = materials.some(m => m.category === categoryToDelete);
      
      if (inUse) {
        return { 
          success: false, 
          message: 'This category is currently used by existing materials and cannot be deleted.' 
        };
      }

      const updated = categories.filter(c => c !== categoryToDelete);
      setCategories(updated);
      await AsyncStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(updated));
      return { success: true };
    } catch (e) {
      console.error('Failed to delete category', e);
      return { success: false, message: 'Failed to check category usage.' };
    }
  };

  const addUnit = async (newUnit: string) => {
    if (!newUnit.trim() || units.includes(newUnit.trim())) return;
    const updated = [...units, newUnit.trim()];
    setUnits(updated);
    await AsyncStorage.setItem(UNIT_STORAGE_KEY, JSON.stringify(updated));
  };

  return {
    categories,
    units,
    loading,
    addCategory,
    deleteCategory,
    addUnit,
  };
}
