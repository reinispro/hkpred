import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ctzrzofymvwscoumltfb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0enJ6b2Z5bXZ3c2NvdW1sdGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NDYxNTAsImV4cCI6MjA3MzUyMjE1MH0.4ktexMb1wRNm2W3L26U01RtN8lBLqOlIrR3ZtWs0cYI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);