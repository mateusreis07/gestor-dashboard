import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY). Auth middleware will fail.');
}

// Client padrão (anon key) - para verificar tokens
export const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// Client admin (service role key) - para criar/deletar usuários
// Só disponível se SUPABASE_SERVICE_ROLE_KEY estiver configurado
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl || '', supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  : null;
