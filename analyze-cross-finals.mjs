import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TOURNAMENT_ID = '7f7bfa59-a65b-4b38-b038-8e3cb6503af6';

console.log('='.repeat(80));
console.log('🔍 PHÂN TÍCH CROSS FINALS - TRẬN M117 VÀ M118');
console.log('='.repeat(80));

// Lấy tất cả matches của Cross Finals
const { data: crossMatches, error } = await supabase
  .from('matches')
  .select(`
    id,
    match_number,
    display_order,
    bracket_type,
    bracket_group,
    round_number,
    player1_id,
    player2_id,
    winner_advances_to,
    loser_advances_to,
    player1:users!player1_id(full_name, display_name, username),
    player2:users!player2_id(full_name, display_name, username)
  `)
  .eq('tournament_id', TOURNAMENT_ID)
  .eq('bracket_group', 'CROSS')
  .order('display_order');

if (error) {
  console.error('❌ Lỗi:', error.message);
  process.exit(1);
}

console.log(`\n✅ Tìm thấy ${crossMatches.length} Cross Finals matches\n`);

// Tìm M117 và M118
const m117 = crossMatches.find(m => m.match_number === 117 || m.display_order === 117);
const m118 = crossMatches.find(m => m.match_number === 118 || m.display_order === 118);

console.log('📊 CHI TIẾT TRẬN M117:\n');
if (m117) {
  const p1 = m117.player1;
  const p2 = m117.player2;
  console.log(`   Display Order: ${m117.display_order}`);
  console.log(`   Match Number: ${m117.match_number}`);
  console.log(`   Bracket Type: ${m117.bracket_type}`);
  console.log(`   Bracket Group: ${m117.bracket_group}`);
  console.log(`   Round Number: ${m117.round_number}`);
  console.log(`   Player 1: ${p1?.full_name || p1?.display_name || p1?.username || 'TBD'}`);
  console.log(`   Player 2: ${p2?.full_name || p2?.display_name || p2?.username || 'TBD'}`);
  console.log(`   Winner advances to: ${m117.winner_advances_to || 'N/A'}`);
  console.log(`   Loser advances to: ${m117.loser_advances_to || 'N/A'}`);
} else {
  console.log('   ❌ KHÔNG TÌM THẤY');
}

console.log('\n📊 CHI TIẾT TRẬN M118:\n');
if (m118) {
  const p1 = m118.player1;
  const p2 = m118.player2;
  console.log(`   Display Order: ${m118.display_order}`);
  console.log(`   Match Number: ${m118.match_number}`);
  console.log(`   Bracket Type: ${m118.bracket_type}`);
  console.log(`   Bracket Group: ${m118.bracket_group}`);
  console.log(`   Round Number: ${m118.round_number}`);
  console.log(`   Player 1: ${p1?.full_name || p1?.display_name || p1?.username || 'TBD'}`);
  console.log(`   Player 2: ${p2?.full_name || p2?.display_name || p2?.username || 'TBD'}`);
  console.log(`   Winner advances to: ${m118.winner_advances_to || 'N/A'}`);
  console.log(`   Loser advances to: ${m118.loser_advances_to || 'N/A'}`);
} else {
  console.log('   ❌ KHÔNG TÌM THẤY');
}

// Hiển thị toàn bộ Cross Finals structure
console.log('\n\n' + '='.repeat(80));
console.log('🏆 CẤU TRÚC TOÀN BỘ CROSS FINALS:');
console.log('='.repeat(80));

// Group by bracket_type
const byType = crossMatches.reduce((acc, m) => {
  const key = m.bracket_type || 'Unknown';
  if (!acc[key]) acc[key] = [];
  acc[key].push(m);
  return acc;
}, {});

for (const [type, matches] of Object.entries(byType)) {
  console.log(`\n📍 ${type} (${matches.length} matches):`);
  for (const m of matches) {
    const p1 = m.player1;
    const p2 = m.player2;
    const p1Name = p1?.full_name || p1?.display_name || p1?.username || 'TBD';
    const p2Name = p2?.full_name || p2?.display_name || p2?.username || 'TBD';
    console.log(`   M${m.match_number || m.display_order}: ${p1Name} vs ${p2Name}`);
    console.log(`      → Winner to: M${m.winner_advances_to || '?'}, Loser to: M${m.loser_advances_to || '?'}`);
  }
}

// Phân tích advancement flow
console.log('\n\n' + '='.repeat(80));
console.log('🔄 PHÂN TÍCH ADVANCEMENT FLOW:');
console.log('='.repeat(80));

// Tìm các trận Round of 16 (R16)
const r16Matches = crossMatches.filter(m => m.bracket_type === 'R16');
console.log(`\n📍 Round of 16 (${r16Matches.length} matches):`);
for (const m of r16Matches.sort((a, b) => a.display_order - b.display_order)) {
  const p1 = m.player1;
  const p2 = m.player2;
  const p1Name = p1?.full_name || p1?.display_name || p1?.username || 'TBD';
  const p2Name = p2?.full_name || p2?.display_name || p2?.username || 'TBD';
  console.log(`   M${m.display_order}: ${p1Name} vs ${p2Name}`);
  console.log(`      Position: Round ${m.round_number}, Winner → M${m.winner_advances_to || '?'}`);
}

// Tìm các trận Quarter Finals (QF)
const qfMatches = crossMatches.filter(m => m.bracket_type === 'QF');
console.log(`\n📍 Quarter Finals (${qfMatches.length} matches):`);
for (const m of qfMatches.sort((a, b) => a.display_order - b.display_order)) {
  const p1 = m.player1;
  const p2 = m.player2;
  const p1Name = p1?.full_name || p1?.display_name || p1?.username || 'TBD';
  const p2Name = p2?.full_name || p2?.display_name || p2?.username || 'TBD';
  console.log(`   M${m.display_order}: ${p1Name} vs ${p2Name}`);
  console.log(`      Position: Round ${m.round_number}, Winner → M${m.winner_advances_to || '?'}`);
}

// Tìm các trận Semi Finals (SF)
const sfMatches = crossMatches.filter(m => m.bracket_type === 'SF');
console.log(`\n📍 Semi Finals (${sfMatches.length} matches):`);
for (const m of sfMatches.sort((a, b) => a.display_order - b.display_order)) {
  const p1 = m.player1;
  const p2 = m.player2;
  const p1Name = p1?.full_name || p1?.display_name || p1?.username || 'TBD';
  const p2Name = p2?.full_name || p2?.display_name || p2?.username || 'TBD';
  console.log(`   M${m.display_order}: ${p1Name} vs ${p2Name}`);
  console.log(`      Position: Round ${m.round_number}, Winner → M${m.winner_advances_to || '?'}`);
}

// Grand Final
const gfMatch = crossMatches.find(m => m.bracket_type === 'GF' || m.bracket_type === 'FINAL');
if (gfMatch) {
  const p1 = gfMatch.player1;
  const p2 = gfMatch.player2;
  const p1Name = p1?.full_name || p1?.display_name || p1?.username || 'TBD';
  const p2Name = p2?.full_name || p2?.display_name || p2?.username || 'TBD';
  console.log(`\n📍 Grand Final:`);
  console.log(`   M${gfMatch.display_order}: ${p1Name} vs ${p2Name}`);
}

console.log('\n' + '='.repeat(80));
console.log('🎯 KẾT LUẬN VỀ VẤN ĐỀ:');
console.log('='.repeat(80));
console.log('Dựa vào advancement flow, tôi sẽ xác định vấn đề bố trí matches');
console.log('='.repeat(80));
