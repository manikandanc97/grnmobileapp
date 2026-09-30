import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { SiteForm } from '@/components/forms/SiteForm';

export default function EditSiteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SiteForm mode="edit" siteId={id} />;
}
