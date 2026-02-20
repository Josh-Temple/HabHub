'use client';

import type { PostgrestError } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { HabitForm } from '@/components/HabitForm';
import { createClient } from '@/lib/supabase/browser';
import { formatHabitWriteError } from '@/lib/supabase/habitErrors';
import { withLegacyTitleFallback } from '@/lib/supabase/habitWriteCompat';

export default function NewHabitPage() {
  const router = useRouter();

  return <HabitForm onSubmit={async (payload) => {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unable to verify login status. Please sign in again and retry.');
    }

    const error = await withLegacyTitleFallback(
      async () => {
        const { error } = await supabase.from('habits').insert({ ...payload, user_id: user.id });
        return { error: error as PostgrestError | null };
      },
      async () => {
        const { error } = await supabase
          .from('habits')
          .insert({ ...payload, title: payload.name, user_id: user.id });
        return { error: error as PostgrestError | null };
      }
    );

    if (error) {
      throw new Error(formatHabitWriteError(error));
    }
    router.push('/app/habits');
  }} />;
}
