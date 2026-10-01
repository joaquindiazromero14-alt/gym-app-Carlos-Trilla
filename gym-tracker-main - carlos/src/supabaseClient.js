import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rjztdqxkninaxrgizosb.supabase.co/rest/v1/'
const supabaseKey = 'sb_publishable_B-oBhmYXPDTxUYhpKo6o_A_TapFJYP2'

export const supabase = createClient(supabaseUrl, supabaseKey)
