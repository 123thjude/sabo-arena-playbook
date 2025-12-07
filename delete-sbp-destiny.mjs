import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mogjjvscxjwvhtpkrlqr.supabase.co';
// Using service role key for deletion
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZ2pqdnNjeGp3dmh0cGtybHFyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzkxOTU4MCwiZXhwIjoyMDczNDk1NTgwfQ.T2ntQv-z2EL4mkGb9b3QyXM3dT8pAOFSPKvqWPd7Xoo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteTournament() {
  console.log('🔍 Tìm giải đấu SBP x DESTINY 9 BALL OPEN...\n');

  // 1. Find tournament
  const { data: tournaments, error: tourError } = await supabase
    .from('tournaments')
    .select('id, title, status, current_participants, max_participants')
    .ilike('title', '%SBP%DESTINY%')
    .order('created_at', { ascending: false });

  if (tourError) {
    console.error('❌ Error:', tourError.message);
    return;
  }

  if (!tournaments || tournaments.length === 0) {
    console.log('⚠️ Không tìm thấy giải đấu "SBP x DESTINY"');
    return;
  }

  console.log(`📋 Tìm thấy ${tournaments.length} giải đấu:`);
  tournaments.forEach((t, i) => {
    console.log(`   ${i + 1}. ${t.title} (${t.current_participants}/${t.max_participants}) - Status: ${t.status}`);
    console.log(`      ID: ${t.id}`);
  });

  // Get the first (most recent) tournament
  const tournament = tournaments[0];
  console.log(`\n🎯 Sẽ xóa giải: "${tournament.title}"`);
  console.log(`   ID: ${tournament.id}`);

  // 2. Check for paid participants
  const { data: paidParticipants, error: paidError } = await supabase
    .from('tournament_participants')
    .select('id, payment_status')
    .eq('tournament_id', tournament.id)
    .in('payment_status', ['paid', 'completed']);

  if (paidError) {
    console.error('❌ Error checking paid participants:', paidError.message);
    return;
  }

  if (paidParticipants && paidParticipants.length > 0) {
    console.log(`\n⚠️ Có ${paidParticipants.length} người đã thanh toán.`);
    console.log('   Vẫn tiếp tục xóa (force delete)...');
  }

  // 3. Delete bracket data first
  console.log('\n🗑️ Đang xóa dữ liệu bracket...');
  const { error: bracketError } = await supabase
    .from('tournament_brackets')
    .delete()
    .eq('tournament_id', tournament.id);
  
  if (bracketError) {
    console.log('   ⚠️ Bracket:', bracketError.message);
  } else {
    console.log('   ✅ Đã xóa brackets');
  }

  // 4. Delete matches
  console.log('🗑️ Đang xóa matches...');
  const { error: matchError } = await supabase
    .from('matches')
    .delete()
    .eq('tournament_id', tournament.id);
  
  if (matchError) {
    console.log('   ⚠️ Matches:', matchError.message);
  } else {
    console.log('   ✅ Đã xóa matches');
  }

  // 5. Delete participants
  console.log('🗑️ Đang xóa participants...');
  const { error: partError } = await supabase
    .from('tournament_participants')
    .delete()
    .eq('tournament_id', tournament.id);
  
  if (partError) {
    console.error('   ❌ Participants:', partError.message);
    return;
  }
  console.log('   ✅ Đã xóa participants');

  // 6. Delete tournament
  console.log('🗑️ Đang xóa giải đấu...');
  const { error: delError } = await supabase
    .from('tournaments')
    .delete()
    .eq('id', tournament.id);
  
  if (delError) {
    console.error('   ❌ Tournament:', delError.message);
    return;
  }

  console.log('\n✅✅✅ ĐÃ XÓA THÀNH CÔNG GIẢI ĐẤU! ✅✅✅');
  console.log(`   "${tournament.title}"`);
}

deleteTournament().catch(console.error);
