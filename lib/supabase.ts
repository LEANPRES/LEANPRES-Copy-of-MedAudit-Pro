
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const supabaseUrl = 'https://lxcsjadkogkmphozlper.supabase.co';
const supabaseAnonKey = 'sb_publishable_rP_eskNCSpWyXXydBx1FTQ_SgtzB0d5';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
