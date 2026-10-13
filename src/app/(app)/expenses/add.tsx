import React, { lazy, Suspense } from 'react';
import { View, StyleSheet } from 'react-native';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

import { Redirect, useLocalSearchParams } from 'expo-router';

const ExpenseForm = lazy(() => import('@/components/forms/ExpenseForm').then(m => ({ default: m.ExpenseForm })));

export default function AddExpenseScreen() {
  const { siteId, date } = useLocalSearchParams<{ siteId?: string; date?: string }>();
  if (!siteId) return <Redirect href="/(app)/sites" />;
  return (
    <Suspense fallback={<View style={styles.loader}><LoadingSkeleton type="card" height={300} /></View>}>
      <ExpenseForm
        mode="create"
        initialData={{
          site_id: siteId,
          ...(date ? { expense_date: date } : {}),
        }}
      />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, padding: 24, paddingTop: 100 },
});
