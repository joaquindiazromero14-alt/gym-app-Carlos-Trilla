import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zsciwodmsmmujqqlwpnq.supabase.co';
const supabaseKey = 'sb_publishable_o0S0BOik2CN0mO2oG4kVlA_Ys4iUkZa';

export const supabase = createClient(supabaseUrl, supabaseKey);