import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mogjjvscxjwvhtpkrlqr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZ2pqdnNjeGp3dmh0cGtybHFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MTk1ODAsImV4cCI6MjA3MzQ5NTU4MH0.u1urXd3uiT0fuqWlJ1Nhp7uJhgdiyOdLSdSWJWczHoQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTournamentData() {
  console.log('🔍 Checking Tournament: SBP x DESTINY 9 BALL OPEN\n');

  // 1. Find tournament by title
  const { data: tournaments, error: tourError } = await supabase
    .from('tournaments')
    .select('*')
    .ilike('title', '%SBP%DESTINY%')
    .order('created_at', { ascending: false });

  if (tourError) {
    console.error('❌ Error fetching tournament:', tourError);
    return;
  }

  if (!tournaments || tournaments.length === 0) {
    console.log('⚠️ No tournaments found matching "SBP DESTINY"');
    return;
  }

  const tournament = tournaments[0];
  console.log('📋 Tournament Info:');
  console.log(`   ID: ${tournament.id}`);
  console.log(`   Title: ${tournament.title}`);
  console.log(`   Status: ${tournament.status}`);
  console.log(`   Max Participants: ${tournament.max_participants}`);
  console.log(`   Current Participants (DB field): ${tournament.current_participants}`);
  console.log('');

  // 2. Count actual participants
  const { count: participantCount, error: partError } = await supabase
    .from('tournament_participants')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournament.id);

  if (partError) {
    console.error('❌ Error counting participants:', partError);
  } else {
    console.log(`👥 Actual Participants in tournament_participants: ${participantCount || 0}`);
  }

  // 3. Check participant statuses
  const { data: participants, error: partListError } = await supabase
    .from('tournament_participants')
    .select('status, user_id, registered_at')
    .eq('tournament_id', tournament.id);

  if (partListError) {
    console.error('❌ Error fetching participant list:', partListError);
  } else {
    console.log('\n📊 Participants by status:');
    const statusCounts = {};
    participants?.forEach(p => {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    });
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
  }

  // 4. Count matches
  const { count: matchCount, error: matchError } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournament.id);

  if (matchError) {
    console.error('❌ Error counting matches:', matchError);
  } else {
    console.log(`\n🎯 Total Matches: ${matchCount || 0}`);
  }

  // 5. Check matches by bracket and round
  const { data: matches, error: matchListError } = await supabase
    .from('matches')
    .select('bracket_type, round_number, group_name, match_number, status')
    .eq('tournament_id', tournament.id)
    .order('match_number', { ascending: true });

  if (matchListError) {
    console.error('❌ Error fetching match list:', matchListError);
  } else {
    console.log('\n📊 Matches breakdown:');
    
    // Group by bracket type
    const byBracket = {};
    matches?.forEach(m => {
      const key = m.bracket_type || 'unknown';
      if (!byBracket[key]) byBracket[key] = [];
      byBracket[key].push(m);
    });

    Object.entries(byBracket).forEach(([bracket, ms]) => {
      console.log(`\n   ${bracket}: ${ms.length} matches`);
      
      // Group by round
      const byRound = {};
      ms.forEach(m => {
        const roundKey = `R${m.round_number}`;
        if (!byRound[roundKey]) byRound[roundKey] = [];
        byRound[roundKey].push(m);
      });
      
      Object.entries(byRound).forEach(([round, rms]) => {
        console.log(`      ${round}: ${rms.length} matches`);
      });
    });

    // Group by group name
    console.log('\n📊 Matches by group:');
    const byGroup = {};
    matches?.forEach(m => {
      const key = m.group_name || 'Cross Finals';
      if (!byGroup[key]) byGroup[key] = [];
      byGroup[key].push(m);
    });

    Object.entries(byGroup).forEach(([group, ms]) => {
      console.log(`   ${group}: ${ms.length} matches`);
    });
  }

  console.log('\n✅ Done!');
}

checkTournamentData().catch(console.error);
