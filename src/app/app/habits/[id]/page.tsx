'use client';

import type { PostgrestError } from '@supabase/supabase-js';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { HabitForm } from '@/components/HabitForm';
import { createClient } from '@/lib/supabase/browser';
import { formatHabitWriteError } from '@/lib/supabase/habitErrors';
import { withLegacyTitleFallback } from '@/lib/supabase/habitWriteCompat';
import { Habit } from '@/types/domain';

export default function EditHabitPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [habit, setHabit] = useState<Habit | null>(null);

  useEffect(() => {
    createClient().from('habits').select('*').eq('id', id).single().then(({ data }) => setHabit(data as Habit));
  }, [id]);

  if (!habit) return <p>Loading...</p>;

  return <HabitForm initial={habit} onSubmit={async (payload) => {
    const supabase = createClient();
    const error = await withLegacyTitleFallback(
      async () => {
        const { error } = await supabase.from('habits').upsert(payload);
        return { error: error as PostgrestError | null };
      },
      async () => {
        const { error } = await supabase.from('habits').upsert({ ...payload, title: payload.name });
        return { error: error as PostgrestError | null };
      }
    );

    if (error) {
      throw new Error(formatHabitWriteError(error));
    }
    router.push('/app/habits');
  }} />;
}
