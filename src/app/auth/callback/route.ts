import { type EmailOtpType } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/app/today';

  if (token_hash && type) {
    const supabase = await createClient();
    await supabase.auth.verifyOtp({ type, token_hash });
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_settings').upsert({ user_id: user.id, week_start: 1 }, { onConflict: 'user_id' });
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
