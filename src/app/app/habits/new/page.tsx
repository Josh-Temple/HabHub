'use client';

import type { PostgrestError } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { HabitForm } from '@/components/HabitForm';
import { createClient } from '@/lib/supabase/browser';
import { formatHabitWriteError } from '@/lib/supabase/habitErrors';

export default function NewHabitPage() {
  const router = useRouter();

  return <HabitForm onSubmit={async (payload) => {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('ログイン状態を確認できませんでした。再ログインしてからもう一度お試しください。');
    }

    const { error } = await supabase.from('habits').insert({ ...payload, user_id: user.id });
    if (error) {
      throw new Error(formatHabitWriteError(error as PostgrestError));
    }
    router.push('/app/habits');
  }} />;
}
