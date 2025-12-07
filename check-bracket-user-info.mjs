import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const TOURNAMENT_ID = 'bda71012-21b2-437a-9550-7424fee93834';

console.log('='.repeat(80));
console.log('🔍 KIỂM TRA THÔNG TIN USER TRONG BẢNG ĐẤU (SPB)');
console.log('='.repeat(80));

// 1. Kiểm tra query hiện tại từ FullTournamentBracket (profiles)
console.log('\n1️⃣ Query từ PROFILES (FullTournamentBracket.tsx - SAI):');
console.log('-'.repeat(80));

const { data: profilesData, error: profilesError } = await supabase
  .from('matches')
  .select(`
    id,
    match_number,
    round_number,
    bracket_type,
    player1_id,
    player2_id,
    player1:profiles!matches_player1_id_fkey(id, full_name, avatar_url),
    player2:profiles!matches_player2_id_fkey(id, full_name, avatar_url)
  `)
  .eq('tournament_id', TOURNAMENT_ID)
  .eq('bracket_type', 'WB')
  .eq('round_number', 1)
  .limit(3);

if (profilesError) {
  console.error('❌ Lỗi query profiles:', profilesError.message);
} else {
  console.log(`✅ Tìm thấy ${profilesData.length} matches`);
  profilesData.forEach(m => {
    console.log(`\n  Match ${m.match_number}:`);
    console.log(`    Player1: ${m.player1?.full_name || 'NULL'}`);
    console.log(`    Player2: ${m.player2?.full_name || 'NULL'}`);
    console.log(`    Player1 Data:`, m.player1);
    console.log(`    Player2 Data:`, m.player2);
  });
}

// 2. Kiểm tra query đúng từ users
console.log('\n\n2️⃣ Query từ USERS (useTournamentBracket.ts - ĐÚNG):');
console.log('-'.repeat(80));

const { data: usersData, error: usersError } = await supabase
  .from('matches')
  .select(`
    id,
    match_number,
    round_number,
    bracket_type,
    player1_id,
    player2_id,
    player1:users!player1_id(id, display_name, username, full_name, avatar_url, rank),
    player2:users!player2_id(id, display_name, username, full_name, avatar_url, rank)
  `)
  .eq('tournament_id', TOURNAMENT_ID)
  .eq('bracket_type', 'WB')
  .eq('round_number', 1)
  .limit(3);

if (usersError) {
  console.error('❌ Lỗi query users:', usersError.message);
} else {
  console.log(`✅ Tìm thấy ${usersData.length} matches`);
  usersData.forEach(m => {
    console.log(`\n  Match ${m.match_number}:`);
    console.log(`    Player1: ${m.player1?.full_name || m.player1?.display_name || m.player1?.username || 'NULL'}`);
    console.log(`    Player2: ${m.player2?.full_name || m.player2?.display_name || m.player2?.username || 'NULL'}`);
    console.log(`    Player1 Data:`, m.player1);
    console.log(`    Player2 Data:`, m.player2);
  });
}

// 3. Kiểm tra xem có bảng profiles không
console.log('\n\n3️⃣ Kiểm tra bảng PROFILES tồn tại không:');
console.log('-'.repeat(80));

const { data: profileCheck, error: profileCheckError } = await supabase
  .from('profiles')
  .select('id, full_name')
  .limit(1);

if (profileCheckError) {
  console.error('❌ Bảng profiles KHÔNG TỒN TẠI hoặc không thể truy cập:', profileCheckError.message);
  console.log('   ⚠️  ĐÂY LÀ VẤN ĐỀ: Code đang query từ bảng không tồn tại!');
} else {
  console.log(`✅ Bảng profiles tồn tại, có ${profileCheck.length} record (sample)`);
}

// 4. Kiểm tra bảng users
console.log('\n\n4️⃣ Kiểm tra bảng USERS:');
console.log('-'.repeat(80));

const { data: userCheck, error: userCheckError } = await supabase
  .from('users')
  .select('id, display_name, username, full_name')
  .limit(3);

if (userCheckError) {
  console.error('❌ Lỗi query users:', userCheckError.message);
} else {
  console.log(`✅ Bảng users tồn tại, có ${userCheck.length} records (sample):`);
  userCheck.forEach(u => {
    console.log(`  - ${u.full_name || u.display_name || u.username}`);
  });
}

console.log('\n' + '='.repeat(80));
console.log('📋 KẾT LUẬN:');
console.log('='.repeat(80));
console.log('❌ FullTournamentBracket.tsx đang query sai từ bảng "profiles"');
console.log('✅ Cần sửa thành query từ bảng "users" như useTournamentBracket.ts');
console.log('='.repeat(80));
