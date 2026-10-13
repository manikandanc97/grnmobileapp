import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { supabase } from '@/lib/supabase';
import { dataSync } from '@/lib/dataSync';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  userId: string;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userId: '',
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = async () => {
    try {
      if (Platform.OS !== 'web') {
        await GoogleSignin.signOut();
      }
    } catch (e) {
      console.warn('Google Sign-In signOut error:', e);
    }
    await supabase.auth.signOut();
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          dataSync.clearAll();
          try {
            if (Platform.OS !== 'web') {
              await GoogleSignin.signOut();
            }
          } catch {
            // ignore if not signed in or already cleared
          }
        }
        setSession(session);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const user = session?.user ?? null;
  const userId = user?.id ?? '';

  return (
    <AuthContext.Provider value={{ session, user, userId, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
