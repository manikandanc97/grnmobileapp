import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { WorkerForm } from '@/components/forms/WorkerForm';

export default function EditWorkerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <WorkerForm mode="edit" workerId={id} />;
}
