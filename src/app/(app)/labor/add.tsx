import React, { lazy, Suspense } from 'react';
import { View, StyleSheet } from 'react-native';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

const WorkerForm = lazy(() => import('@/components/forms/WorkerForm').then(m => ({ default: m.WorkerForm })));

export default function AddWorkerScreen() {
  return <Suspense fallback={<View style={styles.loader}><LoadingSkeleton type="card" height={300} /></View>}>
      <WorkerForm mode="create" />
    </Suspense>;
}

const styles = StyleSheet.create({
  loader: { flex: 1, padding: 24, paddingTop: 100 },
});
