const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const configuredAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(configuredUrl && configuredAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase environment variables are missing. Running in limited mode until NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
  );
}

export const supabaseUrl = configuredUrl ?? 'https://placeholder.supabase.co';
export const supabaseAnonKey = configuredAnonKey ?? 'placeholder-anon-key';
