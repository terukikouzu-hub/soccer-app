// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// メモした Project URL と Anon Key をここに入力
const supabaseUrl = 'https://eyiqlwbscwztnneeqste.supabase.co';
const supabaseAnonKey = 'sb_publishable_Ejelx7TDY-maD-8Zhdhp6g_wB-FTlTY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);