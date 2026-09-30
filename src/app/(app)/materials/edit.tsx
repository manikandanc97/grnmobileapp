import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { MaterialForm } from '@/components/forms/MaterialForm';

export default function EditMaterialScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MaterialForm mode="edit" materialId={id} />;
}
