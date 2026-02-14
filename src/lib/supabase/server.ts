import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { supabaseAnonKey, supabaseUrl } from './env';

export async function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}
