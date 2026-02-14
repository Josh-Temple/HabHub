'use client';

import Link from 'next/link';
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

  if (!ready) {
    return <p className="px-10 pt-20">Checking session...</p>;
  }

  return (
    <div className="mx-auto min-h-screen max-w-xl bg-white">
      <header className="fixed top-0 z-[60] h-20 w-full max-w-xl bg-white/90 px-10 backdrop-blur-xl">
        <div className="flex h-full items-center justify-between">
          <Link href="/app/today" className="micro-label opacity-60">
            HABHUB
          </Link>
          <Link href="/app/settings" className="tap-active text-2xl text-[#c3c3c7]">
            ⚙
          </Link>
        </div>
      </header>
      <main className="shell-main px-10 pb-48 pt-32">{children}</main>
      <AppNav />
    </div>
  );
}
