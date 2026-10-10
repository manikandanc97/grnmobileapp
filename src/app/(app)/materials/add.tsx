import React, { lazy, Suspense, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

import { useLocalSearchParams } from 'expo-router';

const MaterialForm = lazy(() => import('@/components/forms/MaterialForm').then(m => ({ default: m.MaterialForm })));

export default function AddMaterialScreen() {
  const { siteId, date } = useLocalSearchParams<{ siteId?: string; date?: string }>();
  const initialPurchaseDate = useMemo(() => {
    if (!date) return undefined;
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }, [date]);

  return (
    <Suspense fallback={<View style={styles.loader}><LoadingSkeleton type="card" height={300} /></View>}>
      <MaterialForm
        mode="create"
        initialData={{
          ...(siteId ? { site_id: siteId } : {}),
          ...(initialPurchaseDate ? { purchaseDate: initialPurchaseDate } : {}),
        }}
      />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, padding: 24, paddingTop: 100 },
});
