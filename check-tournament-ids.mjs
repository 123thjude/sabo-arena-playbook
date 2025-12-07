import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Dùng service role key để có quyền đầy đủ
);

console.log('='.repeat(80));
console.log('🔍 KIỂM TRA TOURNAMENT ID VÀ BẢNG MATCHES');
console.log('='.repeat(80));

// 1. Lấy danh sách tournaments
console.log('\n1️⃣ DANH SÁCH TOURNAMENTS:\n');

const { data: tournaments, error: tourError } = await supabase
  .from('tournaments')
  .select('id, title, status, current_participants, max_participants, created_at')
  .order('created_at', { ascending: false })
  .limit(5);

if (tourError) {
  console.error('❌ Lỗi:', tourError.message);
  process.exit(1);
}

for (const t of tournaments) {
  console.log(`📍 ${t.title}`);
  console.log(`   ID: ${t.id}`);
  console.log(`   Status: ${t.status}`);
  console.log(`   Participants: ${t.current_participants}/${t.max_participants}`);
  console.log(`   Created: ${new Date(t.created_at).toLocaleDateString('vi-VN')}`);
  
  // Đếm matches
  const { count } = await supabase
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .eq('tournament_id', t.id);
  
  console.log(`   Matches: ${count || 0}`);
  console.log('');
}

// 2. Kiểm tra matches của tournament ID cũ (có thể sai)
const OLD_TOURNAMENT_ID = 'bda71012-21b2-437a-9550-7424fee93834';

console.log('\n2️⃣ KIỂM TRA TOURNAMENT ID CŨ:\n');
console.log(`   ID: ${OLD_TOURNAMENT_ID}\n`);

const { data: oldTournament, error: oldTourError } = await supabase
  .from('tournaments')
  .select('id, title, status')
  .eq('id', OLD_TOURNAMENT_ID)
  .single();

if (oldTourError) {
  console.log(`   ❌ Tournament này KHÔNG TỒN TẠI: ${oldTourError.message}`);
} else {
  console.log(`   ✅ Tournament tồn tại: ${oldTournament.title}`);
  console.log(`   Status: ${oldTournament.status}`);
  
  const { count: oldMatchCount } = await supabase
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .eq('tournament_id', OLD_TOURNAMENT_ID);
  
  console.log(`   Matches: ${oldMatchCount || 0}`);
}

// 3. Tìm tournament 64 người
console.log('\n\n3️⃣ TÌM TOURNAMENT 64 NGƯỜI:\n');

const { data: tour64, error: tour64Error } = await supabase
  .from('tournaments')
  .select('id, title, status, current_participants, max_participants')
  .eq('max_participants', 64)
  .order('created_at', { ascending: false });

if (tour64Error) {
  console.error('❌ Lỗi:', tour64Error.message);
} else if (tour64 && tour64.length > 0) {
  console.log(`✅ Tìm thấy ${tour64.length} tournament(s) 64 người:\n`);
  
  for (const t of tour64) {
    console.log(`📍 ${t.title}`);
    console.log(`   ID: ${t.id}`);
    console.log(`   Status: ${t.status}`);
    console.log(`   Participants: ${t.current_participants}/${t.max_participants}`);
    
    const { count } = await supabase
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .eq('tournament_id', t.id);
    
    console.log(`   Matches: ${count || 0}`);
    
    // Lấy sample matches với user data
    if (count && count > 0) {
      const { data: sampleMatches } = await supabase
        .from('matches')
        .select(`
          id,
          bracket_type,
          round_number,
          player1_id,
          player2_id,
          player1:users!player1_id(full_name, display_name, username),
          player2:users!player2_id(full_name, display_name, username)
        `)
        .eq('tournament_id', t.id)
        .not('player1_id', 'is', null)
        .limit(3);
      
      if (sampleMatches && sampleMatches.length > 0) {
        console.log(`   ✅ Sample matches có players:`);
        for (const m of sampleMatches) {
          const p1 = m.player1;
          const p2 = m.player2;
          const p1Name = p1?.full_name || p1?.display_name || p1?.username || 'TBD';
          const p2Name = p2?.full_name || p2?.display_name || p2?.username || 'TBD';
          console.log(`      - ${p1Name} vs ${p2Name} [${m.bracket_type}]`);
        }
      }
    }
    console.log('');
  }
}

// 4. Kiểm tra structure của bảng matches
console.log('\n4️⃣ STRUCTURE BẢNG MATCHES:\n');

const { data: sampleMatch } = await supabase
  .from('matches')
  .select('*')
  .not('player1_id', 'is', null)
  .limit(1)
  .single();

if (sampleMatch) {
  console.log('✅ Columns trong bảng matches:');
  const columns = Object.keys(sampleMatch);
  for (const col of columns) {
    const value = sampleMatch[col];
    const type = typeof value;
    console.log(`   - ${col}: ${type} = ${value !== null ? String(value).substring(0, 50) : 'null'}`);
  }
}

console.log('\n' + '='.repeat(80));
console.log('📋 KẾT LUẬN:');
console.log('='.repeat(80));
console.log('Hãy sử dụng tournament ID từ danh sách trên để test');
console.log('='.repeat(80));
