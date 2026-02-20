'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  ['/app/today', 'Today'],
  ['/app/habits/new', 'Add Habit'],
  ['/app/analysis', 'Analysis'],
  ['/app/habits', 'Habits']
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-1.25rem)] max-w-[32rem] -translate-x-1/2 px-2 sm:bottom-6 sm:w-[calc(100%-2.5rem)] sm:px-6" aria-label="App navigation">
      <div className="flex h-16 items-center justify-between rounded-full border border-[#e7e7eb] bg-white/95 px-3 shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-2xl sm:h-20 sm:px-4 sm:shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
        {links.map(([href, label]) => {
          const active = pathname === href || (href !== '/app/habits/new' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className={`tap-active flex min-w-[4.5rem] flex-col items-center justify-center gap-0.5 rounded-2xl border-b-2 px-2 py-1.5 text-[10px] font-semibold leading-none transition-all sm:min-w-[5.5rem] sm:gap-1 sm:text-xs ${
                active
                  ? 'scale-105 border-black bg-[#f4f4f7] font-black text-black'
                  : 'border-transparent text-[#7f7f88]'
              }`}
            >
              <span className="text-[11px] uppercase tracking-[0.16em] leading-none sm:text-xs">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
