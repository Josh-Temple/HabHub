'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        await supabase.from('user_settings').upsert({ user_id: data.session.user.id, week_start: 1 }, { onConflict: 'user_id' });
        router.push('/app/today');
      }
    });
  }, [router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/app/today` }
    });
    setMessage(error ? error.message : 'メールを送信しました。Magic Link を確認してください。');
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-3">
      <h1 className="text-xl font-semibold">Login</h1>
      <p className="text-sm text-gray-600">このアプリはパスワードの代わりに Magic Link でログインします。</p>
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full" />
      <button type="submit" disabled={isSubmitting}>{isSubmitting ? '送信中...' : 'ログインリンクを送信'}</button>
      <p>{message}</p>
    </form>
  );
}
