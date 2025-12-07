/**
 * Score Entry Modal - Click on match card to enter scores
 * Features: +/- buttons, confirm winner, realtime update
 */

import React, { useState, useEffect } from 'react';
import { X, Minus, Plus, Trophy, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { BracketMatch } from '@/types/bracket';

interface ScoreEntryModalProps {
  match: BracketMatch | null;
  isOpen: boolean;
  onClose: () => void;
  onScoreUpdated?: () => void;
}

export const ScoreEntryModal: React.FC<ScoreEntryModalProps> = ({
  match,
  isOpen,
  onClose,
  onScoreUpdated
}) => {
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reset scores when match changes
  useEffect(() => {
    if (match) {
      setPlayer1Score(match.player1_score ?? 0);
      setPlayer2Score(match.player2_score ?? 0);
      setError(null);
      setSuccessMessage(null);
    }
  }, [match]);

  if (!isOpen || !match) return null;

  const player1Name = match.player1?.display_name || match.player1?.full_name || match.player1_name || 'Player 1';
  const player2Name = match.player2?.display_name || match.player2?.full_name || match.player2_name || 'Player 2';
  
  const canSubmit = match.player1_id && match.player2_id && (player1Score > 0 || player2Score > 0);
  const hasWinner = player1Score !== player2Score;

  const handleScoreChange = (player: 1 | 2, delta: number) => {
    if (player === 1) {
      setPlayer1Score(prev => Math.max(0, prev + delta));
    } else {
      setPlayer2Score(prev => Math.max(0, prev + delta));
    }
    setError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async () => {
    if (!match || !canSubmit) return;
    
    if (player1Score === player2Score) {
      setError('Tỷ số hòa không hợp lệ. Phải có người thắng!');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const winnerId = player1Score > player2Score ? match.player1_id : match.player2_id;
      const loserId = player1Score > player2Score ? match.player2_id : match.player1_id;

      const { error: updateError } = await supabase
        .from('matches')
        .update({
          player1_score: player1Score,
          player2_score: player2Score,
          winner_id: winnerId,
          loser_id: loserId,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', match.id);

      if (updateError) throw updateError;

      setSuccessMessage('Đã lưu tỷ số thành công!');
      
      // Call callback to refresh data
      if (onScoreUpdated) {
        setTimeout(() => {
          onScoreUpdated();
          onClose();
        }, 1000);
      } else {
        setTimeout(onClose, 1500);
      }

    } catch (err: any) {
      console.error('Error updating score:', err);
      setError(err.message || 'Lỗi khi lưu tỷ số. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (!match) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('matches')
        .update({
          player1_score: null,
          player2_score: null,
          winner_id: null,
          loser_id: null,
          status: 'scheduled',
          completed_at: null
        })
        .eq('id', match.id);

      if (updateError) throw updateError;

      setPlayer1Score(0);
      setPlayer2Score(0);
      setSuccessMessage('Đã reset trận đấu!');
      
      if (onScoreUpdated) {
        setTimeout(() => {
          onScoreUpdated();
        }, 1000);
      }

    } catch (err: any) {
      console.error('Error resetting match:', err);
      setError(err.message || 'Lỗi khi reset. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 bg-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">Nhập Tỷ Số</h2>
            <p className="text-xs text-slate-400">Trận #{match.match_number} • {match.bracket_type}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Error/Success Messages */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          {successMessage && (
            <div className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm">
              <Trophy className="w-4 h-4 flex-shrink-0" />
              {successMessage}
            </div>
          )}

          {/* Player 1 */}
          <div className={`p-4 rounded-xl border-2 transition-all ${
            player1Score > player2Score 
              ? 'bg-green-500/10 border-green-500' 
              : 'bg-slate-800 border-slate-600'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {match.player1?.avatar_url ? (
                  <img 
                    src={match.player1.avatar_url} 
                    alt="" 
                    className="w-10 h-10 rounded-full object-cover border-2 border-slate-600"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                    {player1Name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-white truncate max-w-[150px]">{player1Name}</p>
                  {match.player1?.rank && (
                    <span className="text-xs text-amber-400">{match.player1.rank}</span>
                  )}
                </div>
              </div>
              {player1Score > player2Score && (
                <Trophy className="w-5 h-5 text-amber-400" />
              )}
            </div>
            
            {/* Score Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => handleScoreChange(1, -1)}
                disabled={player1Score <= 0 || isSubmitting}
                className="w-12 h-12 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors active:scale-95"
              >
                <Minus className="w-6 h-6 text-white" />
              </button>
              <div className="w-20 h-16 bg-slate-950 rounded-xl flex items-center justify-center">
                <span className="text-4xl font-bold text-white">{player1Score}</span>
              </div>
              <button
                onClick={() => handleScoreChange(1, 1)}
                disabled={isSubmitting}
                className="w-12 h-12 rounded-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors active:scale-95"
              >
                <Plus className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* VS Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-slate-500 font-bold">VS</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>

          {/* Player 2 */}
          <div className={`p-4 rounded-xl border-2 transition-all ${
            player2Score > player1Score 
              ? 'bg-green-500/10 border-green-500' 
              : 'bg-slate-800 border-slate-600'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {match.player2?.avatar_url ? (
                  <img 
                    src={match.player2.avatar_url} 
                    alt="" 
                    className="w-10 h-10 rounded-full object-cover border-2 border-slate-600"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                    {player2Name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-white truncate max-w-[150px]">{player2Name}</p>
                  {match.player2?.rank && (
                    <span className="text-xs text-amber-400">{match.player2.rank}</span>
                  )}
                </div>
              </div>
              {player2Score > player1Score && (
                <Trophy className="w-5 h-5 text-amber-400" />
              )}
            </div>
            
            {/* Score Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => handleScoreChange(2, -1)}
                disabled={player2Score <= 0 || isSubmitting}
                className="w-12 h-12 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors active:scale-95"
              >
                <Minus className="w-6 h-6 text-white" />
              </button>
              <div className="w-20 h-16 bg-slate-950 rounded-xl flex items-center justify-center">
                <span className="text-4xl font-bold text-white">{player2Score}</span>
              </div>
              <button
                onClick={() => handleScoreChange(2, 1)}
                disabled={isSubmitting}
                className="w-12 h-12 rounded-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors active:scale-95"
              >
                <Plus className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 bg-slate-800 border-t border-slate-700 flex gap-3">
          {match.status === 'completed' && (
            <button
              onClick={handleReset}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 rounded-xl font-semibold text-white transition-colors flex items-center justify-center gap-2"
            >
              Reset
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || !hasWinner || isSubmitting}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Trophy className="w-5 h-5" />
                Xác Nhận Kết Quả
              </>
            )}
          </button>
        </div>

        {/* Help Text */}
        {!match.player1_id || !match.player2_id ? (
          <div className="px-5 py-3 bg-amber-500/10 border-t border-amber-500/30 text-amber-400 text-xs text-center">
            ⚠️ Trận đấu chưa có đủ 2 người chơi
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ScoreEntryModal;
