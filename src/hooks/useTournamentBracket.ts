import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { 
  BracketMatch, 
  BracketRound, 
  BracketStructure,
  BracketType
} from "@/types/bracket";

interface SupabaseMatch {
  id: string;
  tournament_id: string;
  round_number: number;
  match_number: number;
  bracket_position: number | null;
  bracket_type: string | null;
  bracket_group: string | null;
  player1_id: string | null;
  player2_id: string | null;
  player1_score: number | null;
  player2_score: number | null;
  winner_id: string | null;
  winner_advances_to: number | null;
  loser_advances_to: number | null;
  status: string;
  scheduled_time: string | null;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  updated_at: string;
  player1?: {
    id: string;
    display_name: string | null;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    rank: string | null;
  } | null;
  player2?: {
    id: string;
    display_name: string | null;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    rank: string | null;
  } | null;
}

/**
 * Custom hook to fetch and structure tournament bracket data
 * Optimized for Double Elimination 64 (DE64) format
 */
export const useTournamentBracket = (tournamentId: string) => {
  return useQuery({
    queryKey: ["tournament-bracket", tournamentId],
    queryFn: async () => {
      if (!tournamentId) {
        throw new Error("Tournament ID is required");
      }

      // First try to fetch from bracket_matches (new table)
      // Note: Using separate query for players to avoid FK relationship issues
      let { data: matches, error } = await supabase
        .from("bracket_matches")
        .select(`
          id,
          tournament_id,
          round_number,
          match_number,
          bracket_position,
          bracket_type,
          bracket_group,
          player1_id,
          player2_id,
          player1_score,
          player2_score,
          winner_id,
          status,
          scheduled_time,
          start_time,
          end_time,
          winner_advances_to,
          loser_advances_to,
          created_at,
          updated_at
        `)
        .eq("tournament_id", tournamentId)
        .order("round_number", { ascending: true })
        .order("match_number", { ascending: true });

      // If bracket_matches succeeded, fetch player data separately
      if (!error && matches && matches.length > 0) {
        // Get unique player IDs
        const playerIds = new Set<string>();
        matches.forEach((m: any) => {
          if (m.player1_id) playerIds.add(m.player1_id);
          if (m.player2_id) playerIds.add(m.player2_id);
        });

        // Fetch player data from users table (includes rank)
        let playersMap: Record<string, any> = {};
        if (playerIds.size > 0) {
          const { data: players } = await supabase
            .from("users")
            .select("id, full_name, display_name, avatar_url, rank")
            .in("id", Array.from(playerIds));
          
          if (players) {
            players.forEach((p: any) => {
              playersMap[p.id] = {
                id: p.id,
                name: p.display_name || p.full_name,
                full_name: p.full_name,
                display_name: p.display_name,
                avatar_url: p.avatar_url,
                rank: p.rank
              };
            });
          }
        }

        // Attach player data to matches
        matches = matches.map((m: any) => ({
          ...m,
          player1: m.player1_id ? playersMap[m.player1_id] || null : null,
          player2: m.player2_id ? playersMap[m.player2_id] || null : null
        }));
      }

      // If bracket_matches fails or is empty, try the matches table (legacy)
      if (error || !matches || matches.length === 0) {
        console.log("Trying legacy matches table...");
        const legacyResult = await supabase
          .from("matches")
          .select(`
            id,
            tournament_id,
            round_number,
            match_number,
            bracket_position,
            bracket_type,
            bracket_group,
            player1_id,
            player2_id,
            player1_score,
            player2_score,
            winner_id,
            status,
            scheduled_time,
            start_time,
            end_time,
            winner_advances_to,
            loser_advances_to,
            created_at,
            updated_at,
            player1:users!player1_id(
              id,
              display_name,
              username,
              full_name,
              avatar_url,
              rank
            ),
            player2:users!player2_id(
              id,
              display_name,
              username,
              full_name,
              avatar_url,
              rank
            )
          `)
          .eq("tournament_id", tournamentId)
          .order("round_number", { ascending: true })
          .order("match_number", { ascending: true });
        
        if (legacyResult.error) {
          throw legacyResult.error;
        }
        matches = legacyResult.data;
      }

      if (!matches || matches.length === 0) {
        return null;
      }

      // Transform bracket_matches format to match expected structure
      const transformedMatches = matches.map((match: any) => ({
        ...match,
        player1: match.player1 ? {
          id: match.player1.id,
          display_name: match.player1.name || match.player1.display_name,
          username: match.player1.username,
          full_name: match.player1.name || match.player1.full_name,
          avatar_url: match.player1.avatar_url,
          rank: match.player1.rank
        } : null,
        player2: match.player2 ? {
          id: match.player2.id,
          display_name: match.player2.name || match.player2.display_name,
          username: match.player2.username,
          full_name: match.player2.name || match.player2.full_name,
          avatar_url: match.player2.avatar_url,
          rank: match.player2.rank
        } : null
      }));

      // Structure the bracket data
      const bracketStructure = structureBracketData(transformedMatches as SupabaseMatch[]);
      
      return bracketStructure;
    },
    enabled: !!tournamentId,
    staleTime: 30 * 1000, // 30 seconds - refresh more often
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });
};

/**
 * Structure raw matches into organized bracket rounds
 */
function structureBracketData(matches: SupabaseMatch[]): BracketStructure {
  const winnerMatches: BracketMatch[] = [];
  const loserMatches: BracketMatch[] = [];
  const grandFinalMatches: BracketMatch[] = [];

  // Separate matches by bracket type
  // Use actual bracket_type from DB, fallback to inference only if missing
  for (const match of matches) {
    const actualBracketType = match.bracket_type || inferBracketType(match.round_number, match.match_number);
    
    const bracketMatch: BracketMatch = {
      id: match.id,
      tournament_id: match.tournament_id,
      round_number: match.round_number || 0,
      match_number: match.match_number || 0,
      bracket_type: actualBracketType as BracketType,
      bracket_group: match.bracket_group || undefined, // Pass through from DB
      
      player1_id: match.player1_id,
      player1_name: match.player1?.full_name || match.player1?.display_name || match.player1?.username || null,
      player1: match.player1 || null,
      
      player2_id: match.player2_id,
      player2_name: match.player2?.full_name || match.player2?.display_name || match.player2?.username || null,
      player2: match.player2 || null,
      
      player1_score: match.player1_score,
      player2_score: match.player2_score,
      winner_id: match.winner_id,
      loser_id: determineLoser(match),
      
      status: (match.status as BracketMatch['status']) || 'scheduled',
      scheduled_time: match.scheduled_time,
      started_at: match.start_time,
      completed_at: match.end_time,
      
      bracket_position: match.bracket_position,
      next_match_id: null,
      
      winner_advances_to: match.winner_advances_to,
      loser_advances_to: match.loser_advances_to,
      
      created_at: match.created_at,
      updated_at: match.updated_at
    };
    
    if (actualBracketType === 'grand_final') {
      grandFinalMatches.push(bracketMatch);
    } else if (actualBracketType === 'loser') {
      loserMatches.push(bracketMatch);
    } else {
      winnerMatches.push(bracketMatch);
    }
  }

  // Group matches into rounds
  const winnerRounds = groupMatchesByRounds(winnerMatches, 'winner');
  const loserRounds = groupMatchesByRounds(loserMatches, 'loser');

  return {
    winner_bracket: winnerRounds,
    loser_bracket: loserRounds,
    grand_finals: grandFinalMatches,
    total_rounds: winnerRounds.length + loserRounds.length,
    total_matches: matches.length
  };
}

/**
 * Group matches by round number
 */
function groupMatchesByRounds(matches: BracketMatch[], bracketType: BracketType): BracketRound[] {
  const roundsMap = new Map<number, BracketMatch[]>();

  for (const match of matches) {
    const roundNum = match.round_number;
    if (!roundsMap.has(roundNum)) {
      roundsMap.set(roundNum, []);
    }
    const roundMatches = roundsMap.get(roundNum);
    if (roundMatches) {
      roundMatches.push(match);
    }
  }

  const rounds: BracketRound[] = [];
  const sortedRoundNumbers = Array.from(roundsMap.keys()).sort((a, b) => a - b);

  for (const roundNum of sortedRoundNumbers) {
    const roundMatches = roundsMap.get(roundNum);
    if (!roundMatches) continue;
    
    // Generate round name based on type and number
    let roundName = `Round ${roundNum}`;
    if (bracketType === 'winner') {
      roundName = getWinnerRoundName(roundNum, roundMatches.length);
    } else if (bracketType === 'loser') {
      roundName = getLoserRoundName(roundNum, roundMatches.length);
    }

    rounds.push({
      round_number: roundNum,
      round_name: roundName,
      matches: roundMatches,
      bracket_type: bracketType
    });
  }

  return rounds;
}

/**
 * Infer bracket type from round/match numbers
 * Based on actual Sabo Arena DE64 structure:
 * - Rounds 1-6: Winner Bracket
 * - Rounds 101-112: Loser Bracket
 * - Rounds 201+: Grand Finals
 */
function inferBracketType(roundNumber: number, matchNumber: number): BracketType {
  // Grand Finals (round 201+)
  if (roundNumber >= 201) {
    return 'grand_final';
  }
  
  // Loser Bracket (round 101-199)
  if (roundNumber >= 101 && roundNumber < 200) {
    return 'loser';
  }
  
  // Winner Bracket (round 1-99)
  return 'winner';
}

/**
 * Determine loser from match data
 */
function determineLoser(match: SupabaseMatch): string | null {
  if (!match.winner_id) return null;
  
  if (match.player1_id === match.winner_id) {
    return match.player2_id;
  } else if (match.player2_id === match.winner_id) {
    return match.player1_id;
  }
  
  return null;
}

/**
 * Get winner bracket round name (SABO Enhanced)
 */
function getWinnerRoundName(roundNum: number, matchCount: number): string {
  // SABO enhanced structure
  const names: Record<number, string> = {
    1: `WB Round 1 (${matchCount})`, // 16 → 8
    2: `WB Round 2 (${matchCount})`, // 8 → 4
    3: `WB Round 3 (${matchCount})`, // 4 → 2
    4: `WB Finals (${matchCount})`,  // 2 → 1
    5: `Semi Finals (${matchCount})`,
    6: `Winner Finals (${matchCount})`
  };
  
  return names[roundNum] || `Winner R${roundNum} (${matchCount})`;
}

/**
 * Get loser bracket round name (SABO Enhanced)
 */
function getLoserRoundName(roundNum: number, matchCount: number): string {
  // SABO Enhanced: Different round number ranges for different bracket types
  
  // LB-A rounds: 101-103
  if (roundNum >= 101 && roundNum <= 103) {
    const lbAround = roundNum - 100;
    const lbAnames: Record<number, string> = {
      1: `LB-A Round 1 (${matchCount})`, // 8 → 4
      2: `LB-A Round 2 (${matchCount})`, // 4 → 2  
      3: `LB-A Round 3 (${matchCount})`  // 2 → 1
    };
    return lbAnames[lbAround] || `LB-A R${lbAround} (${matchCount})`;
  }
  
  // LB-B rounds: 201-203 (Enhanced!)
  if (roundNum >= 201 && roundNum <= 203) {
    const lbBround = roundNum - 200;
    const lbBnames: Record<number, string> = {
      1: `LB-B Round 1 (${matchCount})`,      // 4 → 2
      2: `LB-B Round 2 & 3 (${matchCount})`, // Concurrent rounds
      3: `LB-B Round 4 (${matchCount})`       // Final (NEW!)
    };
    return lbBnames[lbBround] || `LB-B R${lbBround} (${matchCount})`;
  }
  
  // Legacy/Generic loser rounds
  const loserRound = roundNum >= 100 ? roundNum - 100 : roundNum;
  const names: Record<number, string> = {
    1: `LR1 (${matchCount})`,
    2: `LR2 (${matchCount})`,
    3: `LR3 (${matchCount})`,
    4: `LR4 (${matchCount})`,
    5: `LR5 (${matchCount})`,
    6: `LR6 (${matchCount})`,
    7: `LR7 (${matchCount})`,
    8: `LR8 (${matchCount})`,
    9: `LR9 (${matchCount})`,
    10: `LR10 (${matchCount})`,
    11: `Loser Finals (${matchCount})`,
    12: `LR12 (${matchCount})`
  };
  
  return names[loserRound] || `Loser R${loserRound} (${matchCount})`;
}

/**
 * Helper to get display name for a player
 */
export function getPlayerDisplayName(match: BracketMatch, playerNum: 1 | 2): string {
  const player = playerNum === 1 ? match.player1 : match.player2;
  const name = playerNum === 1 ? match.player1_name : match.player2_name;
  
  if (!player && !name) {
    return 'TBD';
  }
  
  return player?.display_name || player?.username || player?.full_name || name || 'TBD';
}
