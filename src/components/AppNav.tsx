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
    <nav className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-1.25rem)] max-w-[32rem] -translate-x-1/2 px-2 sm:bottom-6 sm:w-[calc(100%-2.5rem)] sm:px-6">
      <div className="flex h-16 items-center justify-between rounded-full border border-[#f0f0f0] bg-white/90 px-3 shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-2xl sm:h-20 sm:px-4 sm:shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
        {links.map(([href, icon, label]) => {
          const active = pathname === href || (href !== '/app/habits/new' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={`tap-active flex h-12 w-12 items-center justify-center rounded-full text-xl transition-all sm:h-14 sm:w-14 sm:text-2xl ${
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
