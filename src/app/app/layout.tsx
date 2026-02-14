'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppNav } from '@/components/AppNav';
import { createClient } from '@/lib/supabase/browser';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/login');
      else setReady(true);
    });
  }, [router]);

  if (!ready) return <p>Checking session...</p>;

  return (
    <div>
      <AppNav />
      {children}
    </div>
  );
}
