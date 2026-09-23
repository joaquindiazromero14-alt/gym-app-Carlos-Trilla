import { createClient } from '@supabase/supabase-js'

// URL corregida (sin el /rest/v1/)
const supabaseUrl = 'https://rjztdqxkninaxrgizosb.supabase.co'

// Clave pública (Anon Key)
const supabaseKey = 'sb_publishable_B-oBhmYXPDTxUYhpKo6o_A_TapFJYP2'

export const supabase = createClient(supabaseUrl, supabaseKey)
