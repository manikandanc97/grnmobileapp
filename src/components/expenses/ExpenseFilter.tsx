import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ExpenseCategory, PaymentMethod } from '@/types/dashboard';
import { FilterButton } from '@/components/ui/FilterButton';
import { Spacing } from '@/constants/theme';

interface ExpenseFilterProps {
  categories: ('All' | ExpenseCategory)[];
  selectedCategory: 'All' | ExpenseCategory;
  onSelectCategory: (category: 'All' | ExpenseCategory) => void;
  periods: string[];
  selectedPeriod: string;
  onSelectPeriod: (period: string) => void;
  paymentMethods: ('All' | PaymentMethod)[];
  selectedPaymentMethod: 'All' | PaymentMethod;
  onSelectPaymentMethod: (method: 'All' | PaymentMethod) => void;
}

export function ExpenseFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  periods,
  selectedPeriod,
  onSelectPeriod,
  paymentMethods,
  selectedPaymentMethod,
  onSelectPaymentMethod,
}: ExpenseFilterProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rowContent}
        style={styles.row}
      >
        {periods.map((period) => (
          <FilterButton
            key={`period-${period}`}
            label={period}
            isActive={selectedPeriod === period}
            onPress={() => onSelectPeriod(period)}
          />
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rowContent}
        style={styles.row}
      >
        {categories.map((category) => (
          <FilterButton
            key={`category-${category}`}
            label={category}
            isActive={selectedCategory === category}
            onPress={() => onSelectCategory(category)}
          />
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rowContent}
        style={styles.row}
      >
        {paymentMethods.map((method) => (
          <FilterButton
            key={`method-${method}`}
            label={method}
            isActive={selectedPaymentMethod === method}
            onPress={() => onSelectPaymentMethod(method)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  row: {
    flexGrow: 0,
    marginBottom: Spacing.sm,
  },
  rowContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
});
