import React, { lazy, Suspense } from 'react';
import { View, StyleSheet } from 'react-native';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

import { useLocalSearchParams } from 'expo-router';

const MaterialForm = lazy(() => import('@/components/forms/MaterialForm').then(m => ({ default: m.MaterialForm })));

export default function AddMaterialScreen() {
  const { siteId } = useLocalSearchParams<{ siteId?: string }>();
  return (
    <Suspense fallback={<View style={styles.loader}><LoadingSkeleton type="card" height={300} /></View>}>
      <MaterialForm mode="create" initialData={siteId ? { site_id: siteId } : undefined} />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, padding: 24, paddingTop: 100 },
});
