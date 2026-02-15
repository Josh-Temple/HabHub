import type { PostgrestError } from '@supabase/supabase-js';

export function toHabitSaveErrorMessage(error: PostgrestError): string {
  const raw = `${error.message} ${error.details ?? ''}`.toLowerCase();

  const isSchemaMismatch =
    raw.includes("goal_count") ||
    raw.includes("schedule") ||
    raw.includes('schema cache') ||
    raw.includes('could not find the');

  if (isSchemaMismatch) {
    return 'Supabaseのテーブル定義がアプリと一致していません。`supabase/sql/001_schema_rls.sql` をSupabase SQL Editorで実行し、スキーマ更新後に再度保存してください。';
  }

  return error.message;
}
