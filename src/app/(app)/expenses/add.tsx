import React, { lazy, Suspense } from 'react';
import { View, StyleSheet } from 'react-native';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

const ExpenseForm = lazy(() => import('@/components/forms/ExpenseForm').then(m => ({ default: m.ExpenseForm })));

export default function AddExpenseScreen() {
  return <Suspense fallback={<View style={styles.loader}><LoadingSkeleton type="card" height={300} /></View>}>
      <ExpenseForm mode="create" />
    </Suspense>;
}

const styles = StyleSheet.create({
  loader: { flex: 1, padding: 24, paddingTop: 100 },
});
