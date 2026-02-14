'use client';

import { useRouter } from 'next/navigation';
import { HabitForm } from '@/components/HabitForm';
import { createClient } from '@/lib/supabase/browser';

export default function NewHabitPage() {
  const router = useRouter();

  return <HabitForm onSubmit={async (payload) => {
    await createClient().from('habits').insert(payload);
    router.push('/app/habits');
  }} />;
}
