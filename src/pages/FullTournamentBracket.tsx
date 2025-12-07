/**
 * Full Tournament Bracket Page
 * Displays full DE64 tournament bracket in landscape mode
 * URL: /tournament/:id/full
 */

import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FullTournamentView } from '@/components/FullTournamentView';
import type { BracketMatch } from '@/types/bracket';

export default function FullTournamentBracket() {
  const { id } = useParams<{ id: string }>();
  const [matches, setMatches] = useState<BracketMatch[]>([]);
  const [tournamentName, setTournamentName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Force landscape orientation hint
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    if (!id) return;

    async function loadTournamentData() {
      try {
        setLoading(true);
        
        // Load tournament info
        const { data: tournament, error: tournamentError } = await supabase
          .from('tournaments')
          .select('title, bracket_format')
          .eq('id', id)
          .single();

        if (tournamentError) throw tournamentError;
        
        setTournamentName(tournament?.title || '');

        // Load all matches with player data
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
          .eq('tournament_id', id)
          .order('display_order');

        if (matchesError) throw matchesError;

        // Transform to BracketMatch format
        const transformedMatches: BracketMatch[] = (matchesData || []).map((match) => {
          const player1Data = Array.isArray(match.player1) ? match.player1[0] : match.player1;
          const player2Data = Array.isArray(match.player2) ? match.player2[0] : match.player2;
          
          return {
            id: match.id,
            tournament_id: id,
            display_order: match.display_order,
            bracket_type: match.bracket_type,
            bracket_group: match.bracket_group,
            stage_round: match.stage_round,
            round_number: match.round_number,
            match_number: match.display_order,
            player1_id: match.player1_id,
            player1_name: player1Data?.display_name || player1Data?.username || player1Data?.full_name || null,
            player1: player1Data ? {
              id: player1Data.id,
              display_name: player1Data.display_name,
              username: player1Data.username,
              full_name: player1Data.full_name,
              avatar_url: player1Data.avatar_url,
              rank: player1Data.rank,
            } : null,
            player2_id: match.player2_id,
            player2_name: player2Data?.display_name || player2Data?.username || player2Data?.full_name || null,
            player2: player2Data ? {
              id: player2Data.id,
              display_name: player2Data.display_name,
              username: player2Data.username,
              full_name: player2Data.full_name,
              avatar_url: player2Data.avatar_url,
              rank: player2Data.rank,
            } : null,
            player1_score: match.player1_score,
            player2_score: match.player2_score,
            winner_id: match.winner_id,
            loser_id: null,
            status: match.status,
            scheduled_time: null,
            started_at: null,
            completed_at: null,
            bracket_position: null,
            next_match_id: null,
            winner_advances_to: match.winner_advances_to,
            loser_advances_to: match.loser_advances_to,
            created_at: '',
            updated_at: '',
          };
        });

        setMatches(transformedMatches);
        setLoading(false);
      } catch (err) {
        console.error('Error loading tournament:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    }

    loadTournamentData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading tournament...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-red-500 text-xl">Error: {error}</div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">No matches found</div>
      </div>
    );
  }

  // Group matches by bracket type and group
  const groupAMatches = matches.filter(m => m.bracket_group === 'A');
  const groupBMatches = matches.filter(m => m.bracket_group === 'B');
  const groupCMatches = matches.filter(m => m.bracket_group === 'C');
  const groupDMatches = matches.filter(m => m.bracket_group === 'D');
  const crossMatches = matches.filter(m => 
    m.bracket_type === 'R16' || 
    m.bracket_type === 'QF' || 
    m.bracket_type === 'SF' || 
    m.bracket_type === 'FINAL'
  );

  return (
    <div className="min-h-screen bg-gray-900 overflow-hidden">
      <FullTournamentView
        allMatches={matches}
        groupAMatches={groupAMatches}
        groupBMatches={groupBMatches}
        groupCMatches={groupCMatches}
        groupDMatches={groupDMatches}
        crossMatches={crossMatches}
        tournamentName={tournamentName}
      />
    </div>
  );
}
