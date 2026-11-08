import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uronprxoepcxjogydqcr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Khởi tạo Supabase client an toàn
// Nếu chưa điền ANON KEY vào .env, client sẽ hoạt động ở chế độ chờ (graceful fallback)
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = () => Boolean(supabaseUrl && supabaseAnonKey);

