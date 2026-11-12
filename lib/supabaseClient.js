import { createClient } from '@supabase/supabase-js';

// On utilise la clé secrète pour avoir les droits d'écriture
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);