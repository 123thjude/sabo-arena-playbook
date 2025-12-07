import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TOURNAMENT_ID = '7f7bfa59-a65b-4b38-b038-8e3cb6503af6';

console.log('='.repeat(80));
console.log('🔍 ĐỐI CHIẾU USER DATABASE VS UI - SBP x DESTINY 9 BALL OPEN');
console.log('='.repeat(80));

// 1. Kiểm tra matches trong database
console.log('\n1️⃣ KIỂM TRA MATCHES TRONG DATABASE:\n');

const { data: dbMatches, error: matchError } = await supabase
  .from('matches')
  .select(`
    id,
    display_order,
    bracket_type,
    bracket_group,
    round_number,
    player1_id,
    player2_id,
    status
  `)
  .eq('tournament_id', TOURNAMENT_ID)
  .order('display_order')
  .limit(10);

if (matchError) {
  console.error('❌ Lỗi:', matchError.message);
  process.exit(1);
}

console.log(`✅ Tìm thấy ${dbMatches.length} matches (10 đầu tiên)\n`);

if (dbMatches.length === 0) {
  console.log('⚠️  Giải này KHÔNG CÒN MATCHES NÀO trong database!');
  console.log('   Matches đã bị xóa hoặc chưa được tạo.');
  console.log('\n💡 Giải pháp:');
  console.log('   1. Tạo lại matches cho tournament này');
  console.log('   2. Hoặc test với tournament khác có matches');
  process.exit(0);
}

// 2. Với mỗi match, lấy thông tin user từ database
console.log('2️⃣ THÔNG TIN USER TỪ DATABASE (query như FullTournamentBracket.tsx):\n');

const { data: matchesWithUsers, error: userError } = await supabase
  .from('matches')
  .select(`
    id,
    display_order,
    bracket_type,
    bracket_group,
    round_number,
    player1_id,
    player2_id,
    player1:users!player1_id(id, display_name, username, full_name, avatar_url, rank),
    player2:users!player2_id(id, display_name, username, full_name, avatar_url, rank)
  `)
  .eq('tournament_id', TOURNAMENT_ID)
  .order('display_order')
  .limit(10);

if (userError) {
  console.error('❌ Lỗi khi query user:', userError.message);
  process.exit(1);
}

for (const match of matchesWithUsers) {
  console.log(`\n📍 Match #${match.display_order} [${match.bracket_type || 'N/A'}]`);
  console.log(`   Group: ${match.bracket_group || 'N/A'} | Round: ${match.round_number || 'N/A'}`);
  
  // Player 1
  console.log(`\n   👤 PLAYER 1:`);
  console.log(`      ID: ${match.player1_id || 'NULL'}`);
  
  if (match.player1_id && !match.player1) {
    console.log(`      ❌ KHÔNG TÌM THẤY USER TRONG BẢNG USERS!`);
    
    // Kiểm tra user có tồn tại không
    const { data: userCheck } = await supabase
      .from('users')
      .select('id, display_name, username, full_name')
      .eq('id', match.player1_id)
      .single();
    
    if (!userCheck) {
      console.log(`      ⚠️  User ID này không tồn tại trong bảng users!`);
    }
  } else if (match.player1) {
    const p1 = Array.isArray(match.player1) ? match.player1[0] : match.player1;
    console.log(`      ✅ Name: ${p1.full_name || p1.display_name || p1.username || 'N/A'}`);
    console.log(`         - full_name: ${p1.full_name || 'null'}`);
    console.log(`         - display_name: ${p1.display_name || 'null'}`);
    console.log(`         - username: ${p1.username || 'null'}`);
    console.log(`         - rank: ${p1.rank || 'null'}`);
    console.log(`         - avatar: ${p1.avatar_url ? 'YES' : 'NO'}`);
  } else {
    console.log(`      ⚪ TBD (chưa có player)`);
  }
  
  // Player 2
  console.log(`\n   👤 PLAYER 2:`);
  console.log(`      ID: ${match.player2_id || 'NULL'}`);
  
  if (match.player2_id && !match.player2) {
    console.log(`      ❌ KHÔNG TÌM THẤY USER TRONG BẢNG USERS!`);
    
    const { data: userCheck } = await supabase
      .from('users')
      .select('id, display_name, username, full_name')
      .eq('id', match.player2_id)
      .single();
    
    if (!userCheck) {
      console.log(`      ⚠️  User ID này không tồn tại trong bảng users!`);
    }
  } else if (match.player2) {
    const p2 = Array.isArray(match.player2) ? match.player2[0] : match.player2;
    console.log(`      ✅ Name: ${p2.full_name || p2.display_name || p2.username || 'N/A'}`);
    console.log(`         - full_name: ${p2.full_name || 'null'}`);
    console.log(`         - display_name: ${p2.display_name || 'null'}`);
    console.log(`         - username: ${p2.username || 'null'}`);
    console.log(`         - rank: ${p2.rank || 'null'}`);
    console.log(`         - avatar: ${p2.avatar_url ? 'YES' : 'NO'}`);
  } else {
    console.log(`      ⚪ TBD (chưa có player)`);
  }
}

// 3. Tổng hợp vấn đề
console.log('\n\n' + '='.repeat(80));
console.log('📊 PHÂN TÍCH VẤN ĐỀ:');
console.log('='.repeat(80));

let matchesWithPlayers = 0;
let matchesWithMissingUsers = 0;
let matchesWithValidUsers = 0;
let matchesTBD = 0;

for (const match of matchesWithUsers) {
  const hasPlayer1 = !!match.player1_id;
  const hasPlayer2 = !!match.player2_id;
  const hasPlayer1Data = !!match.player1;
  const hasPlayer2Data = !!match.player2;
  
  if (hasPlayer1 || hasPlayer2) {
    matchesWithPlayers++;
    
    if ((hasPlayer1 && !hasPlayer1Data) || (hasPlayer2 && !hasPlayer2Data)) {
      matchesWithMissingUsers++;
    } else if ((hasPlayer1 && hasPlayer1Data) || (hasPlayer2 && hasPlayer2Data)) {
      matchesWithValidUsers++;
    }
  } else {
    matchesTBD++;
  }
}

console.log(`\n✅ Matches có player IDs: ${matchesWithPlayers}/${matchesWithUsers.length}`);
console.log(`✅ Matches có user data đầy đủ: ${matchesWithValidUsers}/${matchesWithUsers.length}`);
console.log(`❌ Matches có player ID nhưng thiếu user data: ${matchesWithMissingUsers}/${matchesWithUsers.length}`);
console.log(`⚪ Matches TBD (chưa có players): ${matchesTBD}/${matchesWithUsers.length}`);

if (matchesWithMissingUsers > 0) {
  console.log('\n⚠️  VẤN ĐỀ PHÁT HIỆN:');
  console.log('   - Có matches có player_id nhưng không tìm thấy user trong bảng users');
  console.log('   - Có thể user đã bị xóa hoặc player_id sai');
}

console.log('\n' + '='.repeat(80));
