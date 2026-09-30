import React, { lazy, Suspense } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

const ExpenseForm = lazy(() => import('@/components/forms/ExpenseForm').then(m => ({ default: m.ExpenseForm })));

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Suspense fallback={<View style={styles.loader}><LoadingSkeleton type="card" height={300} /></View>}>
      <ExpenseForm mode="edit" expenseId={id} />
    </Suspense>;
}

const styles = StyleSheet.create({
  loader: { flex: 1, padding: 24, paddingTop: 100 },
});
