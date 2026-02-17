'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

export default function ログインPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [sentAtLabel, setSentAtLabel] = useState('');
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

  const sendMagicLink = async () => {
    setIsSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/app/today` }
    });

    if (error) {
      setMessage(error.message);
    } else {
      setSentTo(email);
      setSentAtLabel(new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }));
      setMessage('メールを送信しました。Magic Link を確認してください。');
    }

    setIsSubmitting(false);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await sendMagicLink();
  };

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-3">
      <h1 className="text-xl font-semibold">ログイン</h1>
      <p className="text-sm text-gray-600">このアプリはパスワードの代わりに Magic Link でログインします。</p>
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full" />
      <button type="submit" disabled={isSubmitting}>{isSubmitting ? '送信中...' : 'ログインリンクを送信'}</button>
      <p className="min-h-6 text-sm">{message}</p>

      {sentTo && (
        <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          <p>
            <span className="font-medium">送信先:</span> {sentTo}
            {sentAtLabel ? `（${sentAtLabel}）` : ''}
          </p>
          <ol className="list-inside list-decimal space-y-1">
            <li>受信トレイで件名「Magic Link」を開く</li>
            <li>見つからない場合は迷惑メールフォルダも確認する</li>
            <li>リンクをタップすると自動で Today 画面に移動する</li>
          </ol>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void sendMagicLink()} disabled={isSubmitting}>
              {isSubmitting ? '再送中...' : '同じメールアドレスに再送'}
            </button>
            <a
              href={`mailto:${sentTo}`}
              className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              メールアプリを開く
            </a>
          </div>
        </div>
      )}
    </form>
  );
}
