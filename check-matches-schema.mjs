import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mogjjvscxjwvhtpkrlqr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZ2pqdnNjeGp3dmh0cGtybHFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MTk1ODAsImV4cCI6MjA3MzQ5NTU4MH0.u1urXd3uiT0fuqWlJ1Nhp7uJhgdiyOdLSdSWJWczHoQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMatchesSchema() {
  console.log('🔍 Checking matches table schema\n');

  // Get tournament
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, title')
    .ilike('title', '%SBP%DESTINY%')
    .limit(1)
    .single();

  if (!tournaments) {
    console.log('No tournament found');
    return;
  }

  console.log(`Tournament: ${tournaments.title}`);
  console.log(`ID: ${tournaments.id}\n`);

  // Get first match to see actual columns
  const { data: match, error } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', tournaments.id)
    .limit(1)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('📋 Columns in matches table:');
  console.log(Object.keys(match).sort().join('\n'));
  
  console.log('\n📊 Sample match data:');
  console.log(JSON.stringify(match, null, 2));
}

await checkMatchesSchema();
