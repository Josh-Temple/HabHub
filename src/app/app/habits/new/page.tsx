'use client';

import type { PostgrestError } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { HabitForm } from '@/components/HabitForm';
import { createClient } from '@/lib/supabase/browser';
import { formatHabitWriteError } from '@/lib/supabase/habitErrors';

export default function NewHabitPage() {
  const router = useRouter();

  return <HabitForm onSubmit={async (payload) => {
    const { error } = await createClient().from('habits').insert(payload);
    if (error) {
      throw new Error(formatHabitWriteError(error as PostgrestError));
    }
    router.push('/app/habits');
  }} />;
}
