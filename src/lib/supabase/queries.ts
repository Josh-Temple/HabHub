import { createClient } from './server';
import { UserSettings } from '@/types/domain';

export async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return { supabase, user };
}

export async function ensureSettings(userId: string): Promise<UserSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, week_start: 1 }, { onConflict: 'user_id' })
    .select('*')
    .single();

  return data as UserSettings;
}
