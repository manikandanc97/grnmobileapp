import React, { lazy, Suspense } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

const SiteForm = lazy(() => import('@/components/forms/SiteForm').then(m => ({ default: m.SiteForm })));

export default function EditSiteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Suspense fallback={<View style={styles.loader}><LoadingSkeleton type="card" height={300} /></View>}>
      <SiteForm mode="edit" siteId={id} />
    </Suspense>;
}

const styles = StyleSheet.create({
  loader: { flex: 1, padding: 24, paddingTop: 100 },
});
