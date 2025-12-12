import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface TournamentParticipant {
  id: string;
  display_name: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  rank: string | null;
  elo_rating: number;
  total_wins: number;
  total_losses: number;
  tournament_wins: number;
  // Registration details
  participant_id: string; // The ID of the tournament_participants record
  status: string;
  payment_status: string | null;
  payment_method_id: string | null;
  notes: string | null;
  registered_at: string | null;
}

export const useTournamentParticipants = (tournamentId: string) => {
  const queryClient = useQueryClient();

  // Set up real-time subscription
  useEffect(() => {
    if (!tournamentId) return;

    const channel = supabase
      .channel(`tournament_participants_${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_participants',
          filter: `tournament_id=eq.${tournamentId}`
        },
        () => {
          // Invalidate query to refetch data
          queryClient.invalidateQueries({ queryKey: ["tournament-participants", tournamentId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId, queryClient]);

  return useQuery({
    queryKey: ["tournament-participants", tournamentId],
    queryFn: async () => {
      if (!tournamentId) {
        throw new Error("Tournament ID is required");
      }

      // Get participants from tournament_participants table
      const { data: participants, error: participantsError } = await supabase
        .from("tournament_participants")
        .select(`
          id,
          user_id,
          status,
          payment_status,
          payment_method_id,
          notes,
          registered_at,
          seed_number,
          users (
            id,
            display_name,
            username,
            full_name,
            avatar_url,
            rank,
            elo_rating,
            total_wins,
            total_losses,
            tournament_wins
          )
        `)
        .eq("tournament_id", tournamentId)
        .in("status", ["registered", "confirmed", "checked_in", "pending", "approved"])
        .order("seed_number", { ascending: true, nullsFirst: false })
        .order("registered_at", { ascending: true });

      if (participantsError) {
        throw participantsError;
      }

      // Map to expected format
      return (participants || []).map(p => ({
        id: p.users?.id || p.user_id,
        display_name: p.users?.display_name || null,
        username: p.users?.username || null,
        full_name: p.users?.full_name || null,
        avatar_url: p.users?.avatar_url || null,
        rank: p.users?.rank || null,
        elo_rating: p.users?.elo_rating || 0,
        total_wins: p.users?.total_wins || 0,
        total_losses: p.users?.total_losses || 0,
        tournament_wins: p.users?.tournament_wins || 0,
        // Registration details
        participant_id: p.id,
        status: p.status,
        payment_status: p.payment_status,
        payment_method_id: p.payment_method_id,
        notes: p.notes,
        registered_at: p.registered_at,
      })) as TournamentParticipant[];
    },
    enabled: !!tournamentId,
    staleTime: 30 * 1000, // 30 seconds (shorter for real-time feel)
    refetchInterval: 60 * 1000, // Refetch every minute as backup
  });
};