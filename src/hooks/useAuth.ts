import { useState, useEffect, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
}

export function useAuth() {
  const configured = isSupabaseConfigured();
  
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: configured, // 設定されていない場合は即座にfalse
    isConfigured: configured,
  });

  useEffect(() => {
    // Supabaseが設定されていない場合は何もしない
    if (!configured || !supabase) {
      return;
    }

    // 現在のセッションを取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        isLoading: false,
      }));
    }).catch((error) => {
      console.error('Failed to get session:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    });

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
        }));
      }
    );

    return () => subscription.unsubscribe();
  }, [configured]);

  // メールでサインアップ
  const signUp = useCallback(async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    if (!supabase) return { error: { message: 'Supabase not configured' } as AuthError };
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  }, []);

  // メールでサインイン
  const signIn = useCallback(async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    if (!supabase) return { error: { message: 'Supabase not configured' } as AuthError };
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  }, []);

  // GitHubでサインイン
  const signInWithGitHub = useCallback(async (): Promise<{ error: AuthError | null }> => {
    if (!supabase) return { error: { message: 'Supabase not configured' } as AuthError };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin,
      },
    });
    return { error };
  }, []);

  // Googleでサインイン
  const signInWithGoogle = useCallback(async (): Promise<{ error: AuthError | null }> => {
    if (!supabase) return { error: { message: 'Supabase not configured' } as AuthError };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    return { error };
  }, []);

  // サインアウト
  const signOut = useCallback(async (): Promise<{ error: AuthError | null }> => {
    if (!supabase) return { error: { message: 'Supabase not configured' } as AuthError };
    const { error } = await supabase.auth.signOut();
    return { error };
  }, []);

  return {
    user: authState.user,
    session: authState.session,
    isLoading: authState.isLoading,
    isConfigured: authState.isConfigured,
    isAuthenticated: !!authState.user,
    signUp,
    signIn,
    signInWithGitHub,
    signInWithGoogle,
    signOut,
  };
}
