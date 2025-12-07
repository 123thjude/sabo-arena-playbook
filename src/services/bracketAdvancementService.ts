/**
 * Bracket Advancement Service
 * Port from Flutter app: database_field_advancement_service.dart
 * 
 * Simple advancement service that reads winner_advances_to and loser_advances_to
 * from database and advances players accordingly.
 */

import { supabase } from "@/integrations/supabase/client";

interface AdvancementResult {
  success: boolean;
  message: string;
  winnerAdvanced?: boolean;
  loserAdvanced?: boolean;
  isFinal?: boolean;
  error?: string;
}

/**
 * Advance winner and loser based on database fields
 * Called after a match is completed
 */
export async function advancePlayersFromMatch(matchId: string): Promise<AdvancementResult> {
  console.log(`🚀 BRACKET ADVANCEMENT: Starting for match ${matchId}`);

  try {
    // 1. Get completed match with advancement info
    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .select(`
        id,
        display_order,
        winner_id,
        player1_id,
        player2_id,
        winner_advances_to,
        loser_advances_to,
        tournament_id
      `)
      .eq('id', matchId)
      .single();

    if (matchError || !matchData) {
      console.error('❌ Error fetching match:', matchError);
      return { success: false, message: 'Match not found', error: matchError?.message };
    }

    const {
      winner_id: winnerId,
      player1_id: player1Id,
      player2_id: player2Id,
      winner_advances_to: winnerAdvancesTo,
      loser_advances_to: loserAdvancesTo,
      tournament_id: tournamentId,
      display_order: displayOrder
    } = matchData;

    // 🚨 CRITICAL VALIDATION: Check if winner_id exists
    if (!winnerId) {
      console.error('❌ CRITICAL ERROR: Match is completed but has no winner_id!');
      return { success: false, message: 'No winner_id set', error: 'Cannot advance without winner' };
    }

    // Calculate loser ID (player who is NOT the winner)
    let loserId: string | null = null;
    if (winnerId === player1Id) {
      loserId = player2Id;
    } else if (winnerId === player2Id) {
      loserId = player1Id;
    } else {
      console.warn(`⚠️ WARNING: winner_id (${winnerId}) does not match player1_id or player2_id`);
    }

    console.log('📊 Match data:');
    console.log(`  - Display Order: ${displayOrder}`);
    console.log(`  - Winner: ${winnerId} → advances to: ${winnerAdvancesTo}`);
    console.log(`  - Loser: ${loserId} → advances to: ${loserAdvancesTo}`);

    let winnerAdvanced = false;
    let loserAdvanced = false;
    let isFinal = false;

    // 2. Advance winner if needed
    if (winnerAdvancesTo) {
      const result = await advancePlayer({
        playerId: winnerId,
        targetDisplayOrder: winnerAdvancesTo,
        tournamentId,
        isWinner: true
      });
      winnerAdvanced = result.success;
    } else {
      console.log('🏆 This is the FINAL match - no winner advancement needed');
      isFinal = true;
      
      // Update tournament with winner
      const { error: tournamentError } = await supabase
        .from('tournaments')
        .update({
          winner_id: winnerId,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', tournamentId);

      if (tournamentError) {
        console.error('❌ Error updating tournament winner:', tournamentError);
      } else {
        console.log('🏆 Tournament completed! Winner:', winnerId);
      }
    }

    // 3. Advance loser if needed (for Double Elimination)
    if (loserId && loserAdvancesTo) {
      const result = await advancePlayer({
        playerId: loserId,
        targetDisplayOrder: loserAdvancesTo,
        tournamentId,
        isWinner: false
      });
      loserAdvanced = result.success;
    } else if (!loserAdvancesTo) {
      console.log('⚠️ No loser advancement needed (loser eliminated)');
    }

    console.log('✅ BRACKET ADVANCEMENT: Completed successfully');

    return {
      success: true,
      message: 'Advancement completed',
      winnerAdvanced,
      loserAdvanced,
      isFinal
    };

  } catch (e) {
    console.error('❌ BRACKET ADVANCEMENT ERROR:', e);
    return { success: false, message: 'Advancement failed', error: String(e) };
  }
}

interface AdvancePlayerParams {
  playerId: string;
  targetDisplayOrder: number;
  tournamentId: string;
  isWinner: boolean;
}

interface AdvancePlayerResult {
  success: boolean;
  matchReady?: boolean;
  slot?: string;
  error?: string;
}

/**
 * Advance a player to target match
 * Uses display_order to find match (works with all bracket types: WB, LB-A, LB-B, SABO)
 */
async function advancePlayer({
  playerId,
  targetDisplayOrder,
  tournamentId,
  isWinner
}: AdvancePlayerParams): Promise<AdvancePlayerResult> {
  try {
    console.log(`🎯 Advancing ${isWinner ? 'winner' : 'loser'} ${playerId} to display_order ${targetDisplayOrder}`);

    // Find target match by display_order
    const { data: targetMatches, error: targetError } = await supabase
      .from('matches')
      .select('id, display_order, player1_id, player2_id, bracket_type, status')
      .eq('tournament_id', tournamentId)
      .eq('display_order', targetDisplayOrder);

    if (targetError || !targetMatches || targetMatches.length === 0) {
      console.error(`❌ Target match not found for display_order ${targetDisplayOrder}`);
      return { success: false, error: 'Target match not found' };
    }

    const targetMatch = targetMatches[0];
    const { id: targetMatchId, player1_id, player2_id, bracket_type } = targetMatch;

    console.log(`📍 Target match ${targetMatchId} (${bracket_type}): player1=${player1_id}, player2=${player2_id}`);

    // Check if player already in match
    if (player1_id === playerId || player2_id === playerId) {
      console.log(`⚠️ Player ${playerId} already in target match`);
      return { success: true, slot: 'already_in_match' };
    }

    // Determine which slot to fill
    let slotToFill: 'player1_id' | 'player2_id' | null = null;
    if (player1_id === null) {
      slotToFill = 'player1_id';
    } else if (player2_id === null) {
      slotToFill = 'player2_id';
    } else {
      console.error(`❌ Target match already full: player1=${player1_id}, player2=${player2_id}`);
      return { success: false, error: 'Target match already full' };
    }

    // Check if match will be ready after this update
    const willBeReady = (slotToFill === 'player1_id' && player2_id !== null) ||
                        (slotToFill === 'player2_id' && player1_id !== null);

    // Build update data
    const updateData: Record<string, unknown> = { [slotToFill]: playerId };
    
    // AUTO-SET STATUS: If both players will be assigned, set status to 'in_progress'
    if (willBeReady) {
      updateData['status'] = 'in_progress';
      console.log('🎯 Match will be ready! Setting status to in_progress');
    }

    // Update target match
    const { error: updateError } = await supabase
      .from('matches')
      .update(updateData)
      .eq('id', targetMatchId);

    if (updateError) {
      console.error('❌ Error updating target match:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log(`✅ Advanced player ${playerId} to ${slotToFill} of match (display_order ${targetDisplayOrder}, bracket_type: ${bracket_type})`);

    return {
      success: true,
      matchReady: willBeReady,
      slot: slotToFill
    };

  } catch (e) {
    console.error('❌ Error advancing player:', e);
    return { success: false, error: String(e) };
  }
}

export default advancePlayersFromMatch;
