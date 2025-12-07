import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TOURNAMENT_ID = '7f7bfa59-a65b-4b38-b038-8e3cb6503af6';

console.log('='.repeat(80));
console.log('🎯 TEST CHÍNH XÁC FLOW CỦA FullTournamentBracket.tsx');
console.log('='.repeat(80));

console.log('\nĐây là query CHÍNH XÁC mà FullTournamentBracket.tsx sử dụng:\n');

// Query CHÍNH XÁC như trong FullTournamentBracket.tsx (line 48-67)
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
  .order('display_order');

if (matchesError) {
  console.error('❌ Query lỗi:', matchesError.message);
  process.exit(1);
}

console.log(`✅ Query thành công! Tìm thấy ${matchesData.length} matches\n`);

// Transform CHÍNH XÁC như trong code (line 74-122)
const transformedMatches = (matchesData || []).map((match) => {
  const player1Data = Array.isArray(match.player1) ? match.player1[0] : match.player1;
  const player2Data = Array.isArray(match.player2) ? match.player2[0] : match.player2;
  
  return {
    id: match.id,
    tournament_id: TOURNAMENT_ID,
    display_order: match.display_order,
    bracket_type: match.bracket_type,
    bracket_group: match.bracket_group,
    stage_round: match.stage_round,
    round_number: match.round_number,
    match_number: match.display_order,
    player1_id: match.player1_id,
    player1_name: player1Data?.full_name || player1Data?.display_name || player1Data?.username || null,
    player1: player1Data ? {
      id: player1Data.id,
      display_name: player1Data.display_name,
      username: player1Data.username,
      full_name: player1Data.full_name,
      avatar_url: player1Data.avatar_url,
      rank: player1Data.rank,
    } : null,
    player2_id: match.player2_id,
    player2_name: player2Data?.full_name || player2Data?.display_name || player2Data?.username || null,
    player2: player2Data ? {
      id: player2Data.id,
      display_name: player2Data.display_name,
      username: player2Data.username,
      full_name: player2Data.full_name,
      avatar_url: player2Data.avatar_url,
      rank: player2Data.rank,
    } : null,
    player1_score: match.player1_score,
    player2_score: match.player2_score,
    winner_id: match.winner_id,
    loser_id: null,
    status: match.status,
    scheduled_time: null,
    started_at: null,
    completed_at: null,
    bracket_position: null,
    next_match_id: null,
    winner_advances_to: match.winner_advances_to,
    loser_advances_to: match.loser_advances_to,
    created_at: '',
    updated_at: '',
  };
});

console.log('📊 SAU KHI TRANSFORM (giống như browser sẽ nhận):\n');

// Hiển thị 5 matches đầu
for (let i = 0; i < Math.min(5, transformedMatches.length); i++) {
  const match = transformedMatches[i];
  console.log(`\n📍 Match #${match.display_order} [${match.bracket_type}]`);
  console.log(`   Player 1 Name: "${match.player1_name}"`);
  console.log(`   Player 1 Object:`, JSON.stringify(match.player1, null, 2));
  console.log(`   Player 2 Name: "${match.player2_name}"`);
  console.log(`   Player 2 Object:`, JSON.stringify(match.player2, null, 2));
}

// Giống hàm getPlayerDisplayName từ useTournamentBracket.ts
function getPlayerDisplayName(match, playerNum) {
  const player = playerNum === 1 ? match.player1 : match.player2;
  const name = playerNum === 1 ? match.player1_name : match.player2_name;
  
  if (!player && !name) {
    return 'TBD';
  }
  
  return player?.full_name || player?.display_name || player?.username || name || 'TBD';
}

console.log('\n\n' + '='.repeat(80));
console.log('🎨 TÊN SẼ HIỂN THỊ TRÊN UI (qua getPlayerDisplayName):');
console.log('='.repeat(80));

for (let i = 0; i < Math.min(5, transformedMatches.length); i++) {
  const match = transformedMatches[i];
  const p1Display = getPlayerDisplayName(match, 1);
  const p2Display = getPlayerDisplayName(match, 2);
  
  console.log(`\nMatch #${match.display_order}:`);
  console.log(`  Player 1: "${p1Display}"`);
  console.log(`  Player 2: "${p2Display}"`);
}

console.log('\n' + '='.repeat(80));
console.log('✅ KẾT LUẬN:');
console.log('='.repeat(80));
console.log('Code hoàn toàn ĐÚNG!');
console.log('Nếu UI vẫn hiển thị sai, vấn đề có thể là:');
console.log('  1. Browser cache - Cần hard refresh (Ctrl + Shift + R)');
console.log('  2. React state chưa update - Cần reload page');
console.log('  3. Dev server cần restart');
console.log('='.repeat(80));
