import { createClient } from '@supabase/supabase-js';

const supabaseUrl = null;
const supabaseAnonKey = null;

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
