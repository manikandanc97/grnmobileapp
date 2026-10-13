import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { StartupScreen } from '@/components/brand/StartupScreen';

export default function AuthLayout() {
  const { session, loading } = useAuth();

  if (loading) return <StartupScreen />;

  if (session) {
    return <Redirect href="/(app)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="verify-otp" />
    </Stack>
  );
}
