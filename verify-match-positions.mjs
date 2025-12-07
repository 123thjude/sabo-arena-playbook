import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('=== KIỂM TRA VỊ TRÍ CÁC TRẬN ===\n');

// Lấy các trận Cross Finals
const { data: matches } = await supabase
  .from('matches')
  .select(`
    match_number,
    display_order,
    bracket_type,
    round_number,
    player1:users!player1_id(full_name, display_name),
    player2:users!player2_id(full_name, display_name)
  `)
  .eq('tournament_id', '7f7bfa59-a65b-4b38-b038-8e3cb6503af6')
  .eq('bracket_type', 'CROSS')
  .in('match_number', [107, 108, 109, 110, 113, 114, 115])
  .order('match_number');

matches.forEach(m => {
  console.log(`M${m.match_number} [Round ${m.round_number}]`);
  console.log(`  P1: ${m.player1?.full_name || m.player1?.display_name || 'TBD'}`);
  console.log(`  P2: ${m.player2?.full_name || m.player2?.display_name || 'TBD'}`);
  console.log(`  Display Order: ${m.display_order}\n`);
});
