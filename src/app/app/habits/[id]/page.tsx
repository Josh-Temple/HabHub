'use client';

import type { PostgrestError } from '@supabase/supabase-js';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { HabitForm } from '@/components/HabitForm';
import { createClient } from '@/lib/supabase/browser';
import { toHabitSaveErrorMessage } from '@/lib/supabase/habitErrors';
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
    const { error } = await createClient().from('habits').upsert(payload);
    if (error) {
      throw new Error(toHabitSaveErrorMessage(error as PostgrestError));
    }
    router.push('/app/habits');
  }} />;
}
