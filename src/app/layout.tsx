import './globals.css';
import Link from 'next/link';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <header className="border-b bg-white">
          <div className="mx-auto max-w-5xl p-4 flex justify-between">
            <Link href="/app/today" className="font-semibold">HabHub</Link>
            <Link href="/login">Login</Link>
          </div>
        </header>
        <main className="mx-auto max-w-5xl p-4">{children}</main>
      </body>
    </html>
  );
}
