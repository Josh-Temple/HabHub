import type { EmailOtpType } from '@supabase/supabase-js';
import AuthCallbackClient from './AuthCallbackClient';
import { sanitizeAppRedirectPath } from '@/lib/security/redirect';

type CallbackPageProps = {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string }>;
};

const ALLOWED_EMAIL_OTP_TYPES: ReadonlySet<EmailOtpType> = new Set([
  'signup',
  'magiclink',
  'recovery',
  'invite',
  'email',
  'email_change',
]);

function toEmailOtpType(value: string | undefined): EmailOtpType | null {
  if (!value) return null;
  if (ALLOWED_EMAIL_OTP_TYPES.has(value as EmailOtpType)) {
    return value as EmailOtpType;
  }
  return null;
}

export default async function CallbackPage({ searchParams }: CallbackPageProps) {
  const params = await searchParams;

  return (
    <AuthCallbackClient
      tokenHash={params.token_hash ?? null}
      type={toEmailOtpType(params.type)}
      nextPath={sanitizeAppRedirectPath(params.next)}
    />
  );
}
