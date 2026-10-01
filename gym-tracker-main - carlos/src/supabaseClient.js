import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rjztdqxkninaxrgizosb.supabase.co'
const supabaseKey = 'B-oBhmYXPDTxUYhpKo6o_A_TapFJYP2'

export const supabase = createClient(supabaseUrl, supabaseKey)
