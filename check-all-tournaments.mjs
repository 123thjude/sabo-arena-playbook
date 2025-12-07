import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mogjjvscxjwvhtpkrlqr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZ2pqdnNjeGp3dmh0cGtybHFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MTk1ODAsImV4cCI6MjA3MzQ5NTU4MH0.u1urXd3uiT0fuqWlJ1Nhp7uJhgdiyOdLSdSWJWczHoQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllTournaments() {
  console.log('🔍 Checking all tournaments\n');

  const { data: tournaments, error } = await supabase
    .from('tournaments')
    .select('id, title, status, current_participants, max_participants, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${tournaments.length} tournaments:\n`);

  for (const t of tournaments) {
    console.log(`📋 ${t.title}`);
    console.log(`   ID: ${t.id}`);
    console.log(`   Status: ${t.status}`);
    console.log(`   Participants: ${t.current_participants}/${t.max_participants}`);
    console.log(`   Created: ${t.created_at}`);

    // Count actual participants
    const { count: partCount } = await supabase
      .from('tournament_participants')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', t.id);

    console.log(`   Actual participants in DB: ${partCount || 0}`);

    // Get first 3 participants
    const { data: participants } = await supabase
      .from('tournament_participants')
      .select(`
        users (
          display_name,
          username,
          full_name
        )
      `)
      .eq('tournament_id', t.id)
      .limit(3);

    if (participants && participants.length > 0) {
      console.log(`   Sample participants:`);
      participants.forEach((p, i) => {
        const name = p.users?.display_name || p.users?.full_name || p.users?.username || 'Unknown';
        console.log(`      ${i + 1}. ${name}`);
      });
    }

    // Count matches
    const { count: matchCount } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', t.id);

    console.log(`   Matches: ${matchCount || 0}`);
    console.log('');
  }
}

await checkAllTournaments();
