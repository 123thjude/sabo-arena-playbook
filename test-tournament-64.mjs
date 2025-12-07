import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Tournament 64 người
const TOURNAMENT_ID = '7f7bfa59-a65b-4b38-b038-8e3cb6503af6';

console.log('='.repeat(80));
console.log('🎯 TEST BẢNG ĐẤU 64 NGƯỜI - SBP x DESTINY 9 BALL OPEN');
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
  .order('display_order')
  .limit(10);

if (matchesError) {
  console.error('❌ LỖI:', matchesError.message);
  process.exit(1);
}

console.log(`\n✅ Tìm thấy matches (hiển thị 10 đầu tiên)\n`);
console.log('='.repeat(80));

let withUserData = 0;
let withoutUserData = 0;

for (const match of matchesData) {
  const p1Data = Array.isArray(match.player1) ? match.player1[0] : match.player1;
  const p2Data = Array.isArray(match.player2) ? match.player2[0] : match.player2;
  
  const p1Name = p1Data?.full_name || p1Data?.display_name || p1Data?.username || 'TBD';
  const p2Name = p2Data?.full_name || p2Data?.display_name || p2Data?.username || 'TBD';
  
  if ((p1Data && (p1Data.full_name || p1Data.display_name || p1Data.username)) ||
      (p2Data && (p2Data.full_name || p2Data.display_name || p2Data.username))) {
    withUserData++;
  } else {
    withoutUserData++;
  }
  
  console.log(`\n📍 Match #${match.display_order} [${match.bracket_type || 'N/A'}]`);
  console.log(`   Group: ${match.bracket_group || 'N/A'} | Round: ${match.round_number || 'N/A'}`);
  console.log(`   Player 1: ${p1Name}`);
  if (p1Data?.rank) console.log(`      Rank: ${p1Data.rank}`);
  if (p1Data?.avatar_url) console.log(`      Avatar: ✓`);
  
  console.log(`   Player 2: ${p2Name}`);
  if (p2Data?.rank) console.log(`      Rank: ${p2Data.rank}`);
  if (p2Data?.avatar_url) console.log(`      Avatar: ✓`);
  
  if (match.player1_score !== null || match.player2_score !== null) {
    console.log(`   Score: ${match.player1_score || 0} - ${match.player2_score || 0}`);
  }
  
  console.log(`   Status: ${match.status}`);
  
  // Hiển thị đầy đủ data structure để debug
  if (matchesData.indexOf(match) === 0) {
    console.log('\n   📊 Raw data structure (first match only):');
    console.log('   Player1 object:', JSON.stringify(p1Data, null, 2));
    console.log('   Player2 object:', JSON.stringify(p2Data, null, 2));
  }
}

console.log('\n' + '='.repeat(80));
console.log('📊 THỐNG KÊ:');
console.log('='.repeat(80));
console.log(`✅ Matches có thông tin user: ${withUserData}/${matchesData.length}`);
console.log(`⚠️  Matches chưa có user (TBD): ${withoutUserData}/${matchesData.length}`);

console.log('\n' + '='.repeat(80));
console.log('🎯 KẾT QUẢ:');
console.log('='.repeat(80));

if (withUserData > 0) {
  console.log('✅ THÀNH CÔNG! Query đã hoạt động đúng');
  console.log('✅ Thông tin user được load từ bảng "users"');
  console.log('✅ Bảng đấu SPB sẽ hiển thị đúng tên người chơi, rank, avatar');
  console.log('\n📱 Hãy refresh lại web để thấy thay đổi!');
} else {
  console.log('⚠️  Tournament này chưa có players được assign');
}

console.log('='.repeat(80));

// Đếm tổng số matches trong tournament
const { count: totalMatches } = await supabase
  .from('matches')
  .select('id', { count: 'exact', head: true })
  .eq('tournament_id', TOURNAMENT_ID);

console.log(`\n💡 INFO: Tournament này có tổng ${totalMatches} matches`);

// Phân tích theo bracket type
const { data: allMatches } = await supabase
  .from('matches')
  .select('bracket_type, bracket_group')
  .eq('tournament_id', TOURNAMENT_ID);

if (allMatches) {
  const byBracket = allMatches.reduce((acc, m) => {
    const key = m.bracket_type || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\n📊 Phân bổ theo Bracket Type:');
  for (const [bracket, count] of Object.entries(byBracket).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${bracket}: ${count} matches`);
  }
  
  const byGroup = allMatches.reduce((acc, m) => {
    const key = m.bracket_group || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\n📊 Phân bổ theo Group:');
  for (const [group, count] of Object.entries(byGroup).sort()) {
    console.log(`   Group ${group}: ${count} matches`);
  }
}

console.log('\n' + '='.repeat(80));
