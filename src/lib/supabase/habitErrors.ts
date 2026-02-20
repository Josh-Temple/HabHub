import type { PostgrestError } from '@supabase/supabase-js';

export function formatHabitWriteError(error: PostgrestError): string {
  if (error.message.includes("Could not find the 'name' column of 'habits' in the schema cache")) {
    return "The Supabase habits table is missing the name column. Run `supabase/sql/003_add_name_column_compat.sql` and refresh the schema cache.";
  }

  if (error.message.includes('null value in column "title" of relation "habits" violates not-null constraint')) {
    return "The Supabase habits table is using a legacy schema (title required). Run `supabase/sql/004_make_title_compatible.sql` to keep title in sync with name.";
  }

  return error.message;
}
