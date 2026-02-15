import type { PostgrestError } from '@supabase/supabase-js';

export function formatHabitWriteError(error: PostgrestError): string {
  if (error.message.includes("Could not find the 'name' column of 'habits' in the schema cache")) {
    return "Supabaseのhabitsテーブルにnameカラムがありません。`supabase/sql/003_add_name_column_compat.sql`を実行して、スキーマキャッシュを更新してください。";
  }

  if (error.message.includes('null value in column "title" of relation "habits" violates not-null constraint')) {
    return "Supabaseのhabitsテーブルが旧スキーマ（title必須）です。`supabase/sql/004_make_title_compatible.sql`を実行して、titleカラムをnameと同期してください。";
  }

  return error.message;
}
