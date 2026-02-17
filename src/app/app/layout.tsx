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
    return <p className="px-5 pt-14 text-sm sm:px-10 sm:pt-20">セッションを確認中です...</p>;
  }

  return (
    <div className="mx-auto min-h-screen max-w-xl bg-white">
      <header className="fixed top-0 z-[60] h-16 w-full max-w-xl bg-white/90 px-5 backdrop-blur-xl sm:h-20 sm:px-10">
        <div className="flex h-full items-center justify-between">
          <Link href="/app/today" className="micro-label opacity-80">
            HABHUB
          </Link>
          <Link href="/app/settings" className="tap-active rounded-xl px-2 py-1 text-sm font-bold text-[#6f6f78] sm:text-base" aria-label="設定">
            設定
          </Link>
        </div>
      </header>
      <main className="shell-main px-5 pb-40 pt-24 sm:px-10 sm:pb-48 sm:pt-32">{children}</main>
      <AppNav />
    </div>
  );
}
