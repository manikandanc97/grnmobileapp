import React, { lazy, Suspense } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

const WorkerForm = lazy(() => import('@/components/forms/WorkerForm').then(m => ({ default: m.WorkerForm })));

export default function EditWorkerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Suspense fallback={<View style={styles.loader}><LoadingSkeleton type="card" height={300} /></View>}>
      <WorkerForm mode="edit" workerId={id} />
    </Suspense>;
}

const styles = StyleSheet.create({
  loader: { flex: 1, padding: 24, paddingTop: 100 },
});
