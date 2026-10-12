import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ExpenseCategory } from '@/types/dashboard';
import { SelectField } from '@/components/ui/SelectField';
import { Spacing } from '@/constants/theme';

interface ExpenseFilterProps {
  categories: ('All' | ExpenseCategory)[];
  selectedCategory: 'All' | ExpenseCategory;
  onSelectCategory: (category: 'All' | ExpenseCategory) => void;
  periods: string[];
  selectedPeriod: string;
  onSelectPeriod: (period: string) => void;
}

export function ExpenseFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  periods,
  selectedPeriod,
  onSelectPeriod,
}: ExpenseFilterProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <SelectField
          value={selectedPeriod}
          options={periods.map(p => ({ label: p, value: p }))}
          onChange={(val) => onSelectPeriod(val)}
          placeholder="Filter by Period"
        />
      </View>

      <View style={styles.row}>
        <SelectField
          value={selectedCategory}
          options={categories.map(c => ({ label: c, value: c }))}
          onChange={(val) => onSelectCategory(val as any)}
          placeholder="Filter by Category"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  row: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
});
