import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet, View } from 'react-native';
import { ExpenseCategory } from '@/types/dashboard';

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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rowContent}
        style={styles.row}
      >
        {periods.map((period) => {
          const isSelected = selectedPeriod === period;
          return (
            <Pressable
              key={period}
              style={[styles.periodChip, isSelected && styles.periodChipSelected]}
              onPress={() => onSelectPeriod(period)}
            >
              <Text
                style={[
                  styles.periodChipText,
                  isSelected && styles.periodChipTextSelected,
                ]}
              >
                {period}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rowContent}
        style={styles.row}
      >
        {categories.map((category) => {
          const isSelected = selectedCategory === category;
          return (
            <Pressable
              key={category}
              style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
              onPress={() => onSelectCategory(category)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  isSelected && styles.categoryChipTextSelected,
                ]}
              >
                {category}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  row: {
    flexGrow: 0,
    marginBottom: 12,
  },
  rowContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  periodChipSelected: {
    backgroundColor: '#F2A619',
    borderColor: '#F2A619',
  },
  periodChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7A85',
  },
  periodChipTextSelected: {
    color: '#FFFFFF',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  categoryChipSelected: {
    backgroundColor: '#0F354A',
    borderColor: '#0F354A',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7A85',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
});
