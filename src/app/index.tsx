import { Redirect } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';

export default function Index() {
  const { session, loading } = useAuth();
  
  if (loading) return null;

  if (session) {
    return <Redirect href={"/(app)" as any} />;
  }

  return <Redirect href={"/(auth)" as any} />;
}
