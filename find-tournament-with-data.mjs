import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('='.repeat(80));
console.log('🔍 TÌM TOURNAMENT CÓ DỮ LIỆU ĐỂ TEST');
console.log('='.repeat(80));

// 1. Lấy danh sách tournaments
const { data: tournaments, error: tourError } = await supabase
  .from('tournaments')
  .select('id, title, status, current_participants')
  .order('created_at', { ascending: false })
  .limit(10);

if (tourError) {
  console.error('❌ Lỗi:', tourError.message);
  process.exit(1);
}

console.log(`\n✅ Tìm thấy ${tournaments.length} tournaments (10 gần nhất):\n`);

for (const t of tournaments) {
  console.log(`📍 ${t.title}`);
  console.log(`   ID: ${t.id}`);
  console.log(`   Status: ${t.status}`);
  console.log(`   Participants: ${t.current_participants || 0}`);
  
  // Đếm số matches của tournament này
  const { count } = await supabase
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .eq('tournament_id', t.id);
  
  console.log(`   Matches: ${count || 0}`);
  console.log('');
}

// 2. Tìm tournament có nhiều matches nhất
const { data: matchCounts } = await supabase
  .from('matches')
  .select('tournament_id')
  .limit(1000);

if (matchCounts && matchCounts.length > 0) {
  const tournamentCounts = matchCounts.reduce((acc, m) => {
    acc[m.tournament_id] = (acc[m.tournament_id] || 0) + 1;
    return acc;
  }, {});
  
  const sorted = Object.entries(tournamentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  console.log('\n🏆 TOP 3 TOURNAMENTS CÓ NHIỀU MATCHES NHẤT:\n');
  
  for (const [tourId, count] of sorted) {
    const { data: tour } = await supabase
      .from('tournaments')
      .select('title')
      .eq('id', tourId)
      .single();
    
    console.log(`   ${tour?.title || 'Unknown'}`);
    console.log(`   ID: ${tourId}`);
    console.log(`   Matches: ${count}`);
    console.log('');
    
    // Test query với tournament này
    const { data: sampleMatches } = await supabase
      .from('matches')
      .select(`
        id,
        bracket_type,
        round_number,
        player1:users!player1_id(full_name, display_name, username),
        player2:users!player2_id(full_name, display_name, username)
      `)
      .eq('tournament_id', tourId)
      .not('player1_id', 'is', null)
      .limit(2);
    
    if (sampleMatches && sampleMatches.length > 0) {
      console.log(`   ✅ Sample matches có user data:`);
      for (const m of sampleMatches) {
        const p1 = m.player1;
        const p2 = m.player2;
        const p1Name = p1?.full_name || p1?.display_name || p1?.username || 'TBD';
        const p2Name = p2?.full_name || p2?.display_name || p2?.username || 'TBD';
        console.log(`      - ${p1Name} vs ${p2Name} [${m.bracket_type}]`);
      }
    }
    console.log('');
  }
}

console.log('='.repeat(80));
