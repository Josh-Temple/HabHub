'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  ['/app/today', '⌂', 'Home'],
  ['/app/habits/new', '+', 'Add'],
  ['/app/analysis', '▥', 'Analysis'],
  ['/app/habits', '☰', 'List']
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-2.5rem)] max-w-[32rem] -translate-x-1/2 px-6">
      <div className="flex h-20 items-center justify-between rounded-full border border-[#f0f0f0] bg-white/80 px-4 shadow-[0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur-2xl">
        {links.map(([href, icon, label]) => {
          const active = pathname === href || (href !== '/app/habits/new' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={`tap-active flex h-14 w-14 items-center justify-center rounded-full text-2xl transition-all ${
                active
                  ? 'scale-105 bg-[#f0f0f4] font-black text-black'
                  : 'text-[#c8c8cc]'
              }`}
            >
              {icon}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
