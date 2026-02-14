import type { EmailOtpType } from '@supabase/supabase-js';
import AuthCallbackClient from './AuthCallbackClient';

type CallbackPageProps = {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string }>;
};

export default async function CallbackPage({ searchParams }: CallbackPageProps) {
  const params = await searchParams;

  return (
    <AuthCallbackClient
      tokenHash={params.token_hash ?? null}
      type={(params.type as EmailOtpType | undefined) ?? null}
      nextPath={params.next ?? '/app/today'}
    />
  );
}
