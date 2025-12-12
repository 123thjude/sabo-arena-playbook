import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  player1_id: string | null;
  player2_id: string | null;
  winner_id: string | null;
  status: "scheduled" | "ongoing" | "completed" | "cancelled" | "upcoming";
  match_date: string | null;
  round: number;
  round_number?: number; // Alias for round
  match_number?: number; // Match number in tournament
  bracket_type?: string; // Winner/Loser bracket
  bracket_group?: string; // A, B, C, D, or Cross
  player1_score?: number | null;
  player2_score?: number | null;
  is_final?: boolean;
  is_third_place?: boolean;
  player1?: {
    id: string;
    display_name: string | null;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  player2?: {
    id: string;
    display_name: string | null;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  winner?: {
    id: string;
    display_name: string | null;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export const useTournamentMatches = (tournamentId: string) => {
  return useQuery({
    queryKey: ["tournament-matches", tournamentId],
    queryFn: async () => {
      if (!tournamentId) {
        throw new Error("Tournament ID is required");
      }

      const { data, error } = await supabase
        .from("matches")
        .select(`
          id,
          tournament_id,
          player1_id,
          player2_id,
          winner_id,
          status,
          match_date,
          round,
          round_number,
          match_number,
          bracket_type,
          bracket_group,
          player1_score,
          player2_score,
          is_final,
          is_third_place,
          player1:users!player1_id(
            id,
            display_name,
            username,
            full_name,
            avatar_url
          ),
          player2:users!player2_id(
            id,
            display_name,
            username,
            full_name,
            avatar_url
          ),
          winner:users!winner_id(
            id,
            display_name,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq("tournament_id", tournamentId)
        .order("round_number", { ascending: true })
        .order("match_number", { ascending: true });

      if (error) {
        throw error;
      }

      // Map data to proper types
      const matches = (data || []).map(match => ({
        ...match,
        round: Number(match.round_number) || 0,
        round_number: Number(match.round_number) || 0,
        match_number: match.match_number || 0
      }));

      return matches as TournamentMatch[];
    },
    enabled: !!tournamentId,
    staleTime: 2 * 60 * 1000, // 2 minutes - matches change more frequently
  });
};