import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Platform } from 'react-native';
import type { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { supabase } from '../api/supabase';

if (Platform.OS !== 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isPro: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Derive the iOS OAuth redirect from the reversed client ID (Google's standard scheme). */
function buildIosRedirectUri(): string | undefined {
  if (Platform.OS === 'web' || !GOOGLE_IOS_CLIENT_ID) return undefined;
  const reversedClientId = GOOGLE_IOS_CLIENT_ID.split('.').reverse().join('.');
  return `${reversedClientId}:/oauthredirect`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);

  const [, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    redirectUri: buildIosRedirectUri(),
  });

  // Bootstrap session + subscribe to auth changes
  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session: current } }) => setSession(current))
      .finally(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, updated) => setSession(updated),
    );

    return () => subscription.unsubscribe();
  }, []);

  // Proactive token refresh — refresh 30s before expiry to avoid 401s
  useEffect(() => {
    if (!session?.expires_at) return;

    const expiresAtMs = session.expires_at * 1000;
    const refreshAt = expiresAtMs - 30_000;
    const delay = refreshAt - Date.now();

    if (delay <= 0) {
      supabase.auth.refreshSession();
      return;
    }

    const timer = setTimeout(() => {
      supabase.auth.refreshSession();
    }, delay);

    return () => clearTimeout(timer);
  }, [session?.expires_at]);

  // Fetch is_pro from the users table when session changes
  useEffect(() => {
    if (!session?.user?.id) {
      setIsPro(false);
      return;
    }
    let stale = false;
    Promise.resolve(
      supabase
        .from('users')
        .select('is_pro')
        .eq('id', session.user.id)
        .single(),
    ).then(({ data }) => {
      if (!stale) setIsPro(data?.is_pro ?? false);
    }).catch(() => {
      if (!stale) setIsPro(false);
    });
    return () => { stale = true; };
  }, [session?.user?.id]);

  // Exchange Google ID token for a Supabase session (native only)
  useEffect(() => {
    if (response?.type !== 'success') return;

    const idToken = response.authentication?.idToken;
    if (!idToken) return;

    supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })
      .then(({ error }) => {
        if (error && __DEV__) console.error('Google sign-in failed:', error.message);
      });
  }, [response]);

  const signInWithGoogle = useCallback(async () => {
    if (Platform.OS === 'web') {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      return;
    }
    await promptAsync();
  }, [promptAsync]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      isPro,
      signInWithGoogle,
      signOut,
    }),
    [session, loading, isPro, signInWithGoogle, signOut],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
