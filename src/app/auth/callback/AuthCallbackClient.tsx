'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/browser';

type AuthCallbackClientProps = {
  nextPath: string;
  tokenHash: string | null;
  type: EmailOtpType | null;
};

export default function AuthCallbackClient({ nextPath, tokenHash, type }: AuthCallbackClientProps) {
  const router = useRouter();
  const [message, setMessage] = useState('Completing sign-in...');

  useEffect(() => {
    if (!tokenHash || !type) {
      setMessage('Invalid link. Please try again from the sign-in page.');
      router.replace('/login');
      return;
    }

    const run = async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

      if (error) {
        setMessage(`Sign-in failed: ${error.message}`);
        router.replace('/login');
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('user_settings').upsert({ user_id: user.id, week_start: 1, language: 'en' }, { onConflict: 'user_id' });
      }

      router.replace(nextPath);
    };

    run();
  }, [nextPath, router, tokenHash, type]);

  return <p>{message}</p>;
}
