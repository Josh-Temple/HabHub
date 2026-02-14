'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

const links = [
  ['/app/today', 'Today'],
  ['/app/habits', 'Inventory'],
  ['/app/analysis', 'Analysis'],
  ['/app/settings', 'Settings']
] as const;

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="mb-4 flex gap-2 items-center flex-wrap">
      {links.map(([href, label]) => (
        <Link key={href} href={href} className={pathname.startsWith(href) ? 'font-bold underline' : ''}>{label}</Link>
      ))}
      <button
        className="ml-auto"
        onClick={async () => {
          await createClient().auth.signOut();
          router.push('/login');
        }}
      >
        Logout
      </button>
    </div>
  );
}
