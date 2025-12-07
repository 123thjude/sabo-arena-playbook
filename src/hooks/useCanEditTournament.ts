/**
 * Hook to check if current user is the owner/admin of a tournament
 * Used for authorization of score entry and tournament management
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseCanEditTournamentResult {
  canEdit: boolean;
  isLoading: boolean;
  userId: string | null;
  isAuthenticated: boolean;
  tournamentOwnerId: string | null;
  error: string | null;
}

export const useCanEditTournament = (tournamentId: string | null): UseCanEditTournamentResult => {
  const [canEdit, setCanEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tournamentOwnerId, setTournamentOwnerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      if (!tournamentId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // 1. Check if user is authenticated
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          console.error('Auth error:', authError);
          setError('Lỗi xác thực');
          setIsLoading(false);
          return;
        }

        if (!session?.user) {
          setIsAuthenticated(false);
          setCanEdit(false);
          setIsLoading(false);
          return;
        }

        setIsAuthenticated(true);
        setUserId(session.user.id);

        // 2. Fetch tournament to get owner info
        const { data: tournament, error: tournamentError } = await supabase
          .from('tournaments')
          .select('id, created_by, club_id')
          .eq('id', tournamentId)
          .single();

        if (tournamentError) {
          console.error('Tournament fetch error:', tournamentError);
          setError('Không tìm thấy giải đấu');
          setIsLoading(false);
          return;
        }

        setTournamentOwnerId(tournament.created_by);

        // 3. Check if user is tournament creator
        if (tournament.created_by === session.user.id) {
          setCanEdit(true);
          setIsLoading(false);
          return;
        }

        // 4. If tournament belongs to a club, check if user is club owner/admin
        if (tournament.club_id) {
          const { data: clubMember, error: clubError } = await supabase
            .from('club_members')
            .select('role')
            .eq('club_id', tournament.club_id)
            .eq('user_id', session.user.id)
            .single();

          if (!clubError && clubMember) {
            const adminRoles = ['owner', 'admin', 'manager'];
            if (adminRoles.includes(clubMember.role?.toLowerCase())) {
              setCanEdit(true);
              setIsLoading(false);
              return;
            }
          }
        }

        // User doesn't have permission
        setCanEdit(false);
        setIsLoading(false);

      } catch (err: any) {
        console.error('Permission check error:', err);
        setError(err.message || 'Lỗi kiểm tra quyền');
        setIsLoading(false);
      }
    };

    checkPermission();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkPermission();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [tournamentId]);

  return {
    canEdit,
    isLoading,
    userId,
    isAuthenticated,
    tournamentOwnerId,
    error
  };
};

export default useCanEditTournament;
