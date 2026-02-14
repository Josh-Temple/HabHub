'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { HabitForm } from '@/components/HabitForm';
import { createClient } from '@/lib/supabase/browser';
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
    await createClient().from('habits').upsert(payload);
    router.push('/app/habits');
  }} />;
}
