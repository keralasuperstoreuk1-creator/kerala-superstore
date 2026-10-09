import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rnwthwaputocyirjtabd.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_uQQqx6qVrL0z9eGDpRBObg_ZHvTKqIf';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  (supabaseAnonKey || supabaseServiceKey) && 
  supabaseUrl !== 'https://your-project-id.supabase.co'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey)
  : null;

// Server-side admin client that bypasses RLS for POS sync and inventory updates
export const supabaseAdmin = Boolean(supabaseUrl && supabaseServiceKey && supabaseUrl !== 'https://your-project-id.supabase.co')
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : supabase;

