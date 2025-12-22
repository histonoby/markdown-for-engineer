import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Supabase設定
// 本番環境では環境変数を使用してください
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Supabaseが設定されているかチェック
export const isSupabaseConfigured = () => {
  return supabaseUrl !== '' && supabaseAnonKey !== '';
};

// Supabaseクライアントを作成（設定されている場合のみ）
// 設定されていない場合はダミークライアントを使用
let supabaseClient: SupabaseClient<Database> | null = null;

if (isSupabaseConfigured()) {
  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}

export const supabase = supabaseClient as SupabaseClient<Database>;
