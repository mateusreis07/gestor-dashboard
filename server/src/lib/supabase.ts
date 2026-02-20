import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY). Auth middleware will fail.');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
