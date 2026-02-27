/** DB Infrastructure: Khởi tạo Singleton Supabase Client (Browser side). */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  
  if (typeof window !== 'undefined') {
    console.warn('Supabase keys are missing. Please check .env.local');
  }
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);
