import React, { lazy, Suspense } from 'react';
import { View, StyleSheet } from 'react-native';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

const MaterialForm = lazy(() => import('@/components/forms/MaterialForm').then(m => ({ default: m.MaterialForm })));

export default function AddMaterialScreen() {
  return <Suspense fallback={<View style={styles.loader}><LoadingSkeleton type="card" height={300} /></View>}>
      <MaterialForm mode="create" />
    </Suspense>;
}

const styles = StyleSheet.create({
  loader: { flex: 1, padding: 24, paddingTop: 100 },
});
