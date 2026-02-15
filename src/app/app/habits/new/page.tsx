'use client';

import type { PostgrestError } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { HabitForm } from '@/components/HabitForm';
import { createClient } from '@/lib/supabase/browser';

export default function NewHabitPage() {
  const router = useRouter();

  return <HabitForm onSubmit={async (payload) => {
    const { error } = await createClient().from('habits').insert(payload);
    if (error) {
      throw new Error((error as PostgrestError).message);
    }
    router.push('/app/habits');
  }} />;
}
