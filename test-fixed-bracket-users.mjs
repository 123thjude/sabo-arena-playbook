import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const TOURNAMENT_ID = 'bda71012-21b2-437a-9550-7424fee93834';

console.log('='.repeat(80));
console.log('✅ TEST QUERY SAU KHI SỬA (từ bảng USERS)');
console.log('='.repeat(80));

// Giống query đã sửa trong FullTournamentBracket.tsx
const { data: matchesData, error: matchesError } = await supabase
  .from('matches')
  .select(`
    id,
    display_order,
    bracket_type,
    bracket_group,
    stage_round,
    round_number,
    player1_id,
    player2_id,
    player1_score,
    player2_score,
    winner_id,
    status,
    winner_advances_to,
    loser_advances_to,
    player1:users!player1_id(id, display_name, username, full_name, avatar_url, rank),
    player2:users!player2_id(id, display_name, username, full_name, avatar_url, rank)
  `)
  .eq('tournament_id', TOURNAMENT_ID)
  .limit(5)
  .order('display_order');

if (matchesError) {
  console.error('❌ LỖI:', matchesError.message);
  process.exit(1);
}

console.log(`\n✅ Tìm thấy ${matchesData.length} matches (sample 5 đầu tiên)\n`);

for (const match of matchesData) {
  const p1Data = Array.isArray(match.player1) ? match.player1[0] : match.player1;
  const p2Data = Array.isArray(match.player2) ? match.player2[0] : match.player2;
  
  const p1Name = p1Data?.full_name || p1Data?.display_name || p1Data?.username || 'TBD';
  const p2Name = p2Data?.full_name || p2Data?.display_name || p2Data?.username || 'TBD';
  
  console.log(`📍 Match #${match.display_order} [${match.bracket_type}] Round ${match.round_number}`);
  console.log(`   Group: ${match.bracket_group || 'N/A'}`);
  console.log(`   Player 1: ${p1Name} ${p1Data?.rank ? `(${p1Data.rank})` : ''}`);
  console.log(`   Player 2: ${p2Name} ${p2Data?.rank ? `(${p2Data.rank})` : ''}`);
  
  if (match.player1_score !== null || match.player2_score !== null) {
    console.log(`   Score: ${match.player1_score || 0} - ${match.player2_score || 0}`);
  }
  
  console.log(`   Status: ${match.status}`);
  console.log('');
}

console.log('='.repeat(80));
console.log('🎯 KẾT QUẢ:');
console.log('='.repeat(80));

const hasUserData = matchesData.some(m => 
  (m.player1 && (m.player1.full_name || m.player1.display_name || m.player1.username)) ||
  (m.player2 && (m.player2.full_name || m.player2.display_name || m.player2.username))
);

if (hasUserData) {
  console.log('✅ THÀNH CÔNG! Thông tin user đã được load đúng');
  console.log('✅ Bảng đấu SPB sẽ hiển thị đúng tên người chơi');
} else {
  console.log('⚠️  Chưa có dữ liệu user trong matches');
  console.log('   (Có thể tournament chưa assign players)');
}

console.log('='.repeat(80));
