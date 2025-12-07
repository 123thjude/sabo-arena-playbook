import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tournament } from "@/types/database";
import { useEffect } from "react";

export const useTournamentDetails = (tournamentId: string) => {
  const queryClient = useQueryClient();

  // Set up real-time subscription for tournament updates
  useEffect(() => {
    if (!tournamentId) return;

    const channel = supabase
      .channel(`tournament_details_${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_participants',
          filter: `tournament_id=eq.${tournamentId}`
        },
        () => {
          // Invalidate query to refetch data when participants change
          queryClient.invalidateQueries({ queryKey: ["tournament-details", tournamentId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tournaments',
          filter: `id=eq.${tournamentId}`
        },
        () => {
          // Invalidate query to refetch data when tournament changes
          queryClient.invalidateQueries({ queryKey: ["tournament-details", tournamentId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId, queryClient]);

  return useQuery({
    queryKey: ["tournament-details", tournamentId],
    queryFn: async () => {
      if (!tournamentId) {
        throw new Error("Tournament ID is required");
      }

      const { data, error } = await supabase
        .from("tournaments")
        .select(`
          id,
          title,
          description,
          status,
          start_date,
          end_date,
          max_participants,
          current_participants,
          prize_pool,
          entry_fee,
          game_format,
          venue_address,
          club_id,
          club:clubs(
            id,
            name,
            logo_url,
            address
          )
        `)
        .eq("id", tournamentId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No results found
          return null;
        }
        throw error;
      }

      console.log('🔍 Tournament data from database:', {
        id: data.id,
        title: data.title,
        current_participants: data.current_participants,
        max_participants: data.max_participants
      });

      // Count actual participants from tournament_participants table
      const { count, error: countError } = await supabase
        .from("tournament_participants")
        .select("*", { count: 'exact', head: true })
        .eq("tournament_id", tournamentId)
        .in("status", ["registered", "confirmed", "checked_in", "pending"]);

      if (countError) {
        console.error("Error counting participants:", countError);
      }

      console.log('👥 Actual participant count:', {
        dbCount: data.current_participants,
        actualCount: count,
        willUse: count ?? data.current_participants
      });

      // Override current_participants with actual count
      const tournamentData = {
        ...data,
        current_participants: count ?? data.current_participants
      };

      console.log('✅ Final tournament data:', {
        title: tournamentData.title,
        current_participants: tournamentData.current_participants,
        max_participants: tournamentData.max_participants
      });

      return tournamentData as any; // Will fix with proper typing later
    },
    enabled: !!tournamentId,
    staleTime: 30 * 1000, // 30 seconds for more accurate count
  });
};