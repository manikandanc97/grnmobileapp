import React, { lazy, Suspense } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

const MaterialForm = lazy(() => import('@/components/forms/MaterialForm').then(m => ({ default: m.MaterialForm })));

export default function EditMaterialScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Suspense fallback={<View style={styles.loader}><LoadingSkeleton type="card" height={300} /></View>}>
      <MaterialForm mode="edit" materialId={id} />
    </Suspense>;
}

const styles = StyleSheet.create({
  loader: { flex: 1, padding: 24, paddingTop: 100 },
});
