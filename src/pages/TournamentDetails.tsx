import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import React, { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTournamentDetails } from "@/hooks/useTournamentDetails";
import { useTournamentMatches, TournamentMatch } from "@/hooks/useTournamentMatches";
import { useTournamentParticipants } from "@/hooks/useTournamentParticipants";
import { formatCurrency, formatDate, getDisplayName } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import TournamentRegistration from "@/components/TournamentRegistration";
import Navigation from "@/components/Navigation";
import { DE64BracketVisualization } from "@/components/DE64BracketVisualization";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { advancePlayersFromMatch } from "@/services/bracketAdvancementService";
import { 
  Calendar, 
  Users, 
  Trophy, 
  Coins, 
  Clock, 
  Award,
  ArrowLeft,
  Share2,
  Edit3,
  Check,
  X,
  Minus,
  Plus
} from "lucide-react";

// Helper function to format tournament description with auto line breaks
const formatTournamentDescription = (description: string) => {
  // Define patterns that should trigger a new line
  const lineBreakPatterns = [
    /([•●○◦▪▸►])/g,  // Bullet points
    /(📍|🎱|💰|👑|🏆|⏰|📅|🎯|⚠️|📌|🔥|✅|❌|🥇|🥈|🥉|💵|🎖️|🏅|⭐)/g,  // Emojis that typically start sections
    /(Thời gian:|Địa điểm:|Lệ phí:|Hạng thi đấu:|Số lượng|CƠ CẤU GIẢI THƯỞNG|THỂ LỆ THI ĐẤU|TỶ LỆ CHẤP|QUY ĐỊNH TỪ BAN TỔ CHỨC)/gi,
    /(Champions:|Runner-up:|3rd Place|Top \d+-\d+:)/gi,
    /(Tứ kết:|Bán kết:|Chung kết:)/gi,
  ];

  // First, split by existing line breaks
  let lines = description.split(/\n/);
  
  // Process each line and split further based on patterns
  const processedLines: string[] = [];
  
  lines.forEach(line => {
    let currentLine = line.trim();
    if (!currentLine) return;
    
    // Check for bullet/emoji patterns and split
    // Split by common separators that indicate new items
    const parts = currentLine.split(/(?=•)|(?=📍)|(?=🎱)|(?=💰)|(?=👑)|(?=🏆)|(?=⏰)|(?=📅)|(?=🎯)|(?=⚠️)|(?=📌)|(?=🔥)|(?=✅)|(?=❌)|(?=🥇)|(?=🥈)|(?=🥉)|(?=💵)|(?=🎖️)|(?=🏅)|(?=⭐)/);
    
    parts.forEach(part => {
      const trimmedPart = part.trim();
      if (trimmedPart) {
        processedLines.push(trimmedPart);
      }
    });
  });
  
  return processedLines;
};

// Match Result Card Component with Score Entry
interface MatchResultCardProps {
  match: TournamentMatch;
  index: number;
  canEdit?: boolean;
  onEditScore?: (match: TournamentMatch) => void;
}

const MatchResultCard = ({ match, index, canEdit = false, onEditScore }: MatchResultCardProps) => {
  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "Hoàn thành";
      case "ongoing": return "Đang đấu";
      case "upcoming": return "Sắp diễn ra";
      default: return "Chưa xác định";
    }
  };

  const hasPlayers = match.player1_id && match.player2_id;

  return (
    <div className="p-3 md:p-4 bg-slate-700/50 rounded-lg border border-slate-600">
      <div className="flex flex-col gap-3">
        {/* Match header */}
        <div className="flex items-center justify-between">
          <div className="text-xs md:text-sm font-bold text-gold">
            #{match.match_number || index + 1}
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={match.status === "completed" ? "default" : "outline"}
              className={`${match.status === "completed" ? "bg-green-600" : ""} text-xs`}
            >
              {getStatusText(match.status)}
            </Badge>
            {/* Edit button for CLB owner */}
            {canEdit && hasPlayers && (
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 text-xs border-amber-500/50 text-amber-400 hover:bg-amber-500/20"
                onClick={() => onEditScore?.(match)}
              >
                <Edit3 className="w-3 h-3 mr-1" />
                Nhập điểm
              </Button>
            )}
          </div>
        </div>

        {/* Match info */}
        <p className="text-xs md:text-sm text-slate-400">
          {match.bracket_type && `${match.bracket_type} • `}
          Round {match.round_number || "N/A"}
          {match.match_date && ` • ${formatDate(match.match_date)}`}
        </p>

        {/* Players with avatars */}
        <div className="space-y-2">
          {/* Player 1 */}
          <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {match.player1?.avatar_url ? (
                <img 
                  src={match.player1.avatar_url} 
                  alt={getDisplayName(match.player1.display_name, match.player1.username, match.player1.full_name)}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-slate-600"
                />
              ) : (
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/40 flex items-center justify-center text-xs font-bold text-blue-300">
                  P1
                </div>
              )}
              <span className="font-semibold text-white text-sm md:text-base truncate">
                {getDisplayName(match.player1?.display_name, match.player1?.username, match.player1?.full_name) || "TBD"}
              </span>
              {match.winner_id === match.player1_id && (
                <Trophy className="w-4 h-4 text-gold flex-shrink-0" />
              )}
            </div>
            {match.player1_score !== null && match.player1_score !== undefined && (
              <div className="text-lg md:text-xl font-bold text-white ml-2">
                {match.player1_score}
              </div>
            )}
          </div>

          {/* VS divider */}
          <div className="text-center text-xs text-slate-500 font-semibold">VS</div>

          {/* Player 2 */}
          <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {match.player2?.avatar_url ? (
                <img 
                  src={match.player2.avatar_url} 
                  alt={getDisplayName(match.player2.display_name, match.player2.username, match.player2.full_name)}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-slate-600"
                />
              ) : (
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-red-500/20 to-red-500/40 flex items-center justify-center text-xs font-bold text-red-300">
                  P2
                </div>
              )}
              <span className="font-semibold text-white text-sm md:text-base truncate">
                {getDisplayName(match.player2?.display_name, match.player2?.username, match.player2?.full_name) || "TBD"}
              </span>
              {match.winner_id === match.player2_id && (
                <Trophy className="w-4 h-4 text-gold flex-shrink-0" />
              )}
            </div>
            {match.player2_score !== null && match.player2_score !== undefined && (
              <div className="text-lg md:text-xl font-bold text-white ml-2">
                {match.player2_score}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TournamentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  
  const { data: tournament, isLoading: tournamentLoading } = useTournamentDetails(id || "");
  const { data: matches, isLoading: matchesLoading } = useTournamentMatches(id || "");
  const { data: participants, isLoading: participantsLoading } = useTournamentParticipants(id || "");

  // Score entry state
  const [editingMatch, setEditingMatch] = useState<TournamentMatch | null>(null);
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if current user can edit (is CLB owner)
  const [canEdit, setCanEdit] = useState(false);
  
  React.useEffect(() => {
    const checkEditPermission = async () => {
      if (!tournament?.club_id) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCanEdit(false);
        return;
      }
      
      // Check if user is owner of the club
      const { data: club } = await supabase
        .from('clubs')
        .select('owner_id')
        .eq('id', tournament.club_id)
        .single();
      
      setCanEdit(club?.owner_id === user.id);
    };
    
    checkEditPermission();
  }, [tournament?.club_id]);

  // Handle score submission
  const handleSaveScore = async () => {
    if (!editingMatch) return;
    
    const p1Score = Number.parseInt(score1, 10);
    const p2Score = Number.parseInt(score2, 10);
    
    if (Number.isNaN(p1Score) || Number.isNaN(p2Score) || p1Score < 0 || p2Score < 0) {
      toast.error("Điểm số không hợp lệ");
      return;
    }

    // Validate: Score cannot be 0-0
    if (p1Score === 0 && p2Score === 0) {
      toast.error("Tỷ số không thể là 0-0");
      return;
    }

    // Must have a winner (no draws)
    if (p1Score === p2Score) {
      toast.error("Phải có người thắng (không được hòa)");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Determine winner
      const winnerId = p1Score > p2Score ? editingMatch.player1_id : editingMatch.player2_id;
      
      // 1. Update match score and winner
      const { error } = await supabase
        .from('matches')
        .update({
          player1_score: p1Score,
          player2_score: p2Score,
          winner_id: winnerId,
          status: 'completed'
        })
        .eq('id', editingMatch.id);
      
      if (error) throw error;
      
      console.log('✅ Match score updated, now advancing players...');
      
      // 2. Auto-advance winner and loser to next matches
      const advanceResult = await advancePlayersFromMatch(editingMatch.id);
      
      if (advanceResult.success) {
        if (advanceResult.isFinal) {
          toast.success("🏆 Giải đấu đã hoàn thành! Đã xác định nhà vô địch!");
        } else {
          toast.success("Đã cập nhật điểm số và đẩy người chơi vào trận tiếp theo!");
        }
      } else {
        console.warn('⚠️ Score saved but advancement had issues:', advanceResult.message);
        toast.success("Đã cập nhật điểm số!");
      }
      
      // Refresh matches data
      queryClient.invalidateQueries({ queryKey: ['tournament-matches', id] });
      
      // Close modal
      setEditingMatch(null);
      setScore1("");
      setScore2("");
    } catch (error) {
      console.error('Error updating score:', error);
      toast.error("Không thể cập nhật điểm số");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit modal with current scores
  const handleEditScore = (match: TournamentMatch) => {
    setEditingMatch(match);
    setScore1(match.player1_score?.toString() || "");
    setScore2(match.player2_score?.toString() || "");
  };

  if (tournamentLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-24">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-12 w-96 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-96" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t("tournaments.notFound")}</h2>
          <p className="text-muted-foreground mb-4">{t("tournaments.notFoundDesc")}</p>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("common.backHome")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "upcoming": return "default";
      case "ongoing": return "secondary";
      case "completed": return "outline";
      default: return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming": return "text-blue-400";
      case "ongoing": return "text-green-400";
      case "completed": return "text-gold";
      default: return "text-muted-foreground";
    }
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background pt-16">{/* Add pt-16 for navigation spacing */}
      {/* Header - Compact */}
      <section className="py-2 md:py-4 bg-slate-900 border-b border-slate-700">
        <div className="container mx-auto px-3 md:px-4">
          {/* Mobile: Inline back + share buttons */}
          <div className="flex items-center justify-between mb-2">
            <Button 
              variant="ghost" 
              size="sm"
              asChild 
              className="text-slate-400 hover:text-white -ml-2 h-8"
            >
              <Link to="/tournaments">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="gap-1 h-8">
              <Share2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Compact: Logo + Title + Badges in one line */}
            <div className="flex items-center gap-2 mb-2">
              {tournament.club?.logo_url && (
                <img
                  src={tournament.club.logo_url}
                  alt={tournament.club.name}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover border border-slate-600 flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-lg md:text-2xl font-bold text-white leading-tight truncate mb-1">
                  {tournament.title}
                </h1>
                <div className="flex items-center gap-1.5">
                  <Badge 
                    variant={getStatusBadgeVariant(tournament.status)}
                    className={`${getStatusColor(tournament.status)} text-xs h-5`}
                  >
                    {t(`tournaments.status.${tournament.status}`)}
                  </Badge>
                  {tournament.game_format && (
                    <Badge variant="outline" className="border-gold/30 text-gold text-xs h-5">
                      {tournament.game_format}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats - Horizontal scroll */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
              {tournament.prize_pool && (
                <Card className="p-2 bg-slate-800/50 border-slate-700 flex items-center gap-2 min-w-fit flex-shrink-0">
                  <Trophy className="w-4 h-4 text-gold" />
                  <div>
                    <p className="text-xs font-bold text-white whitespace-nowrap">
                      {formatCurrency(tournament.prize_pool)}
                    </p>
                    <p className="text-xs text-slate-500">Giải thưởng</p>
                  </div>
                </Card>
              )}
              {tournament.entry_fee && (
                <Card className="p-2 bg-slate-800/50 border-slate-700 flex items-center gap-2 min-w-fit flex-shrink-0">
                  <Coins className="w-4 h-4 text-gold" />
                  <div>
                    <p className="text-xs font-bold text-white whitespace-nowrap">
                      {formatCurrency(tournament.entry_fee)}
                    </p>
                    <p className="text-xs text-slate-500">Phí tham gia</p>
                  </div>
                </Card>
              )}
              <Card className="p-2 bg-slate-800/50 border-slate-700 flex items-center gap-2 min-w-fit flex-shrink-0">
                <Users className="w-4 h-4 text-gold" />
                <div>
                  <p className="text-xs font-bold text-white">
                    {tournament.current_participants}/{tournament.max_participants}
                  </p>
                  <p className="text-xs text-slate-500">Người chơi</p>
                </div>
              </Card>
              <Card className="p-2 bg-slate-800/50 border-slate-700 flex items-center gap-2 min-w-fit flex-shrink-0">
                <Calendar className="w-4 h-4 text-gold" />
                <div>
                  <p className="text-xs font-bold text-white whitespace-nowrap">
                    {formatDate(tournament.start_date)}
                  </p>
                  <p className="text-xs text-slate-500">Ngày thi đấu</p>
                </div>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tabs Navigation - Prominent position */}
      <section className="sticky top-16 z-40 bg-slate-950 border-b border-slate-700">
        <div className="container mx-auto px-3 md:px-4">
          <Tabs 
            defaultValue={tournament.status === "completed" ? "results" : "bracket"} 
            className="w-full"
          >
            {/* Main Tabs - Full width, prominent */}
            <TabsList className="grid w-full grid-cols-4 h-auto bg-slate-900/50 rounded-none border-0">
              <TabsTrigger 
                value="overview" 
                className="text-xs md:text-sm px-3 py-3 md:py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:bg-slate-800/50"
              >
                <span className="hidden sm:inline">Tổng quan</span>
                <span className="sm:hidden">Tổng quan</span>
              </TabsTrigger>
              <TabsTrigger 
                value="participants" 
                className="text-xs md:text-sm px-3 py-3 md:py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:bg-slate-800/50"
              >
                <span className="hidden sm:inline">Người chơi</span>
                <span className="sm:hidden">Người chơi</span>
              </TabsTrigger>
              <TabsTrigger 
                value="bracket" 
                className={`text-xs md:text-sm px-3 py-3 md:py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 ${
                  tournament.status !== "completed" ? "data-[state=active]:bg-blue-900/20" : "data-[state=active]:bg-slate-800/50"
                }`}
              >
                Bảng đấu
              </TabsTrigger>
              <TabsTrigger 
                value="results" 
                className={`text-xs md:text-sm px-3 py-3 md:py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 ${
                  tournament.status === "completed" ? "data-[state=active]:bg-green-900/20" : "data-[state=active]:bg-slate-800/50"
                }`}
              >
                Kết quả
              </TabsTrigger>
            </TabsList>

            {/* Main Content - Mobile Optimized */}
            <div className="py-4 md:py-8">
              <div className="container mx-auto px-3 md:px-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                  {/* Tab Content Area */}
                  <div className="lg:col-span-2">

                  {/* Overview Tab - Mobile optimized */}
                  <TabsContent value="overview" className="space-y-4 md:space-y-6">
                  <Card className="p-4 md:p-6 bg-slate-800/50 border-slate-700">
                    <h3 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4">
                      {t("tournaments.about")}
                    </h3>
                    <div className="space-y-3 md:space-y-4 text-slate-300">
                      {/* Mobile: Single column for better readability */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        <div>
                          <p className="text-xs md:text-sm text-slate-400 mb-1">{t("tournaments.format")}</p>
                          <p className="font-semibold text-sm md:text-base">
                            {tournament.game_format || t("tournaments.standard")}
                          </p>
                        </div>
                        {tournament.venue_address && (
                          <div>
                            <p className="text-xs md:text-sm text-slate-400 mb-1">{t("tournaments.venue")}</p>
                            <p className="font-semibold text-sm md:text-base break-words">
                              {tournament.venue_address}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs md:text-sm text-slate-400 mb-1">{t("tournaments.startDate")}</p>
                          <p className="font-semibold text-sm md:text-base">{formatDate(tournament.start_date)}</p>
                        </div>
                        {tournament.end_date && (
                          <div>
                            <p className="text-xs md:text-sm text-slate-400 mb-1">{t("tournaments.endDate")}</p>
                            <p className="font-semibold text-sm md:text-base">{formatDate(tournament.end_date)}</p>
                          </div>
                        )}
                      </div>
                      
                      {tournament.description && (
                        <div className="mt-4 pt-4 border-t border-slate-600">
                          <p className="text-xs md:text-sm text-slate-400 mb-3 font-semibold uppercase tracking-wide">{t("tournaments.description")}</p>
                          <div className="space-y-2">
                            {formatTournamentDescription(tournament.description).map((line, index) => {
                              // Check if line starts with emoji or special character
                              const isHeader = /^(📍|🎱|💰|👑|🏆|⏰|📅|🎯|⚠️|📌|🔥)/.test(line);
                              const isWarning = /^⚠️/.test(line) || line.includes('QUY ĐỊNH') || line.includes('PHÁT HIỆN GIAN LẬN');
                              const isPrize = line.includes('Champions:') || line.includes('Runner-up:') || line.includes('3rd Place') || line.includes('GIẢI THƯỞNG');
                              const isBullet = /^[•●○◦▪▸►]/.test(line);
                              
                              return (
                                <div 
                                  key={index}
                                  className={`
                                    text-sm md:text-base leading-relaxed
                                    ${isHeader ? 'font-semibold text-white mt-3 first:mt-0' : ''}
                                    ${isWarning ? 'text-yellow-400 bg-yellow-400/10 px-3 py-2 rounded-lg border border-yellow-400/20' : ''}
                                    ${isPrize ? 'text-gold font-medium' : ''}
                                    ${isBullet ? 'pl-2' : ''}
                                    ${!isHeader && !isWarning && !isPrize ? 'text-slate-300' : ''}
                                  `}
                                >
                                  {line}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Tournament Rules - Mobile optimized */}
                  <Card className="p-4 md:p-6 bg-slate-800/50 border-slate-700">
                    <h3 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4">
                      {t("tournaments.rules")}
                    </h3>
                    <div className="space-y-2 md:space-y-3 text-slate-300">
                      <div className="flex items-start gap-2 md:gap-3">
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gold mt-1.5 md:mt-2 flex-shrink-0" />
                        <p className="text-sm md:text-base">{t("tournaments.rule1")}</p>
                      </div>
                      <div className="flex items-start gap-2 md:gap-3">
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gold mt-1.5 md:mt-2 flex-shrink-0" />
                        <p className="text-sm md:text-base">{t("tournaments.rule2")}</p>
                      </div>
                      <div className="flex items-start gap-2 md:gap-3">
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gold mt-1.5 md:mt-2 flex-shrink-0" />
                        <p className="text-sm md:text-base">{t("tournaments.rule3")}</p>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                {/* Participants Tab - Mobile: Single column */}
                <TabsContent value="participants" className="space-y-4 md:space-y-6">
                  <Card className="p-4 md:p-6 bg-slate-800/50 border-slate-700">
                    <h3 className="text-base md:text-xl font-bold text-white mb-3 md:mb-4">
                      Danh sách người chơi ({participants?.length || 0})
                    </h3>
                    {participantsLoading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        {Array.from({ length: 8 }, (_, i) => i + 1).map((id) => (
                          <Skeleton key={`participant-skeleton-${id}`} className="h-14 md:h-16 w-full" />
                        ))}
                      </div>
                    ) : participants && participants.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        {participants.map((participant, index) => (
                          <div 
                            key={participant.id}
                            className="p-3 md:p-4 bg-slate-700/50 rounded-lg border border-slate-600 hover:border-gold/30 transition-colors"
                          >
                            <div className="flex items-center gap-2 md:gap-3">
                              {/* Avatar or Rank Badge */}
                              {participant.avatar_url ? (
                                <img 
                                  src={participant.avatar_url} 
                                  alt={getDisplayName(participant.display_name, participant.username, participant.full_name)}
                                  className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-gold/30 object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-gold/20 to-gold/40 flex items-center justify-center text-gold font-bold text-sm md:text-base flex-shrink-0">
                                  #{index + 1}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-white text-sm md:text-base truncate">
                                  {getDisplayName(participant.display_name, participant.username, participant.full_name)}
                                </p>
                                {participant.rank && (
                                  <p className="text-xs md:text-sm text-gold">Rank {participant.rank}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <Users className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4" />
                        <p className="text-sm md:text-base">Chưa có người chơi đăng ký</p>
                      </div>
                    )}
                  </Card>
                </TabsContent>

                {/* Bracket Tab - Mobile: Full viewport height */}
                <TabsContent value="bracket" className="space-y-4 md:space-y-6">
                  <Card className="p-0 bg-slate-800/50 border-slate-700 overflow-hidden">
                    <div className="p-3 md:p-4 border-b border-slate-700 bg-slate-900/50">
                      <h3 className="text-base md:text-xl font-bold text-white flex items-center gap-2">
                        <Trophy className="w-4 h-4 md:w-5 md:h-5 text-gold" />
                        Sơ đồ bảng đấu
                      </h3>
                      <p className="text-xs md:text-sm text-slate-400 mt-1">
                        Xem toàn bộ cấu trúc giải đấu với Winner Bracket, Loser Bracket và Grand Finals
                      </p>
                    </div>
                    {/* Mobile: Taller viewport for better bracket view */}
                    <div className="h-[60vh] md:h-[calc(100vh-300px)]">
                      {id ? (
                        <DE64BracketVisualization tournamentId={id} />
                      ) : (
                        <div className="text-center py-8 text-slate-400">
                          <Trophy className="w-12 h-12 mx-auto mb-4" />
                          <p>Chưa có bảng đấu</p>
                        </div>
                      )}
                    </div>
                  </Card>
                </TabsContent>

                {/* Results Tab - Mobile optimized with sub-tabs */}
                <TabsContent value="results" className="space-y-4 md:space-y-6">
                  <Card className="p-4 md:p-6 bg-slate-800/50 border-slate-700">
                    <h3 className="text-base md:text-xl font-bold text-white mb-3 md:mb-4 flex items-center gap-2">
                      <Trophy className="w-4 h-4 md:w-5 md:h-5 text-gold" />
                      {tournament.status === "completed" ? "Kết quả giải đấu" : "Trận đấu đang diễn ra"}
                    </h3>
                    
                    {matchesLoading ? (
                      <div className="space-y-3 md:space-y-4">
                        {Array.from({ length: 5 }, (_, i) => i + 1).map((id) => (
                          <Skeleton key={`match-skeleton-${id}`} className="h-14 md:h-16 w-full" />
                        ))}
                      </div>
                    ) : matches && matches.length > 0 ? (
                      <Tabs defaultValue="all" className="w-full">
                        {/* Check if tournament has groups (DE64) or no groups (DE16) */}
                        {(() => {
                          const hasGroups = matches.some(m => 
                            m.bracket_group === 'A' || m.bracket_group === 'B' || 
                            m.bracket_group === 'C' || m.bracket_group === 'D'
                          );
                          
                          if (hasGroups) {
                            // DE64 format with groups A, B, C, D, Cross
                            return (
                              <>
                                <TabsList className="grid w-full grid-cols-6 mb-4 bg-slate-700/50 text-xs">
                                  <TabsTrigger value="all" className="text-xs md:text-sm px-1 md:px-3">
                                    Tất cả ({matches.length})
                                  </TabsTrigger>
                                  <TabsTrigger value="a" className="text-xs md:text-sm px-1 md:px-3">
                                    Bảng A ({matches.filter(m => m.bracket_group === 'A').length})
                                  </TabsTrigger>
                                  <TabsTrigger value="b" className="text-xs md:text-sm px-1 md:px-3">
                                    Bảng B ({matches.filter(m => m.bracket_group === 'B').length})
                                  </TabsTrigger>
                                  <TabsTrigger value="c" className="text-xs md:text-sm px-1 md:px-3">
                                    Bảng C ({matches.filter(m => m.bracket_group === 'C').length})
                                  </TabsTrigger>
                                  <TabsTrigger value="d" className="text-xs md:text-sm px-1 md:px-3">
                                    Bảng D ({matches.filter(m => m.bracket_group === 'D').length})
                                  </TabsTrigger>
                                  <TabsTrigger value="cross" className="text-xs md:text-sm px-1 md:px-3">
                                    Cross ({matches.filter(m => 
                                      m.bracket_group?.toUpperCase() === 'CROSS' ||
                                      (m.bracket_group !== 'A' && m.bracket_group !== 'B' && 
                                       m.bracket_group !== 'C' && m.bracket_group !== 'D')
                                    ).length})
                                  </TabsTrigger>
                                </TabsList>

                                {/* All matches */}
                                <TabsContent value="all" className="space-y-3 md:space-y-4 mt-0">
                                  {[...matches]
                                    .sort((a, b) => (b.round_number || 0) - (a.round_number || 0))
                                    .map((match, index) => (
                                      <MatchResultCard key={match.id} match={match} index={index} canEdit={canEdit} onEditScore={handleEditScore} />
                                    ))}
                                </TabsContent>

                                {/* Group A matches */}
                                <TabsContent value="a" className="space-y-3 md:space-y-4 mt-0">
                                  {[...matches]
                                    .filter(m => m.bracket_group === 'A')
                                    .sort((a, b) => (b.round_number || 0) - (a.round_number || 0))
                                    .map((match, index) => (
                                      <MatchResultCard key={match.id} match={match} index={index} canEdit={canEdit} onEditScore={handleEditScore} />
                                    ))}
                                </TabsContent>

                                {/* Group B matches */}
                                <TabsContent value="b" className="space-y-3 md:space-y-4 mt-0">
                                  {[...matches]
                                    .filter(m => m.bracket_group === 'B')
                                    .sort((a, b) => (b.round_number || 0) - (a.round_number || 0))
                                    .map((match, index) => (
                                      <MatchResultCard key={match.id} match={match} index={index} canEdit={canEdit} onEditScore={handleEditScore} />
                                    ))}
                                </TabsContent>

                                {/* Group C matches */}
                                <TabsContent value="c" className="space-y-3 md:space-y-4 mt-0">
                                  {[...matches]
                                    .filter(m => m.bracket_group === 'C')
                                    .sort((a, b) => (b.round_number || 0) - (a.round_number || 0))
                                    .map((match, index) => (
                                      <MatchResultCard key={match.id} match={match} index={index} canEdit={canEdit} onEditScore={handleEditScore} />
                                    ))}
                                </TabsContent>

                                {/* Group D matches */}
                                <TabsContent value="d" className="space-y-3 md:space-y-4 mt-0">
                                  {[...matches]
                                    .filter(m => m.bracket_group === 'D')
                                    .sort((a, b) => (b.round_number || 0) - (a.round_number || 0))
                                    .map((match, index) => (
                                      <MatchResultCard key={match.id} match={match} index={index} canEdit={canEdit} onEditScore={handleEditScore} />
                                    ))}
                                </TabsContent>

                                {/* Cross Finals matches */}
                                <TabsContent value="cross" className="space-y-3 md:space-y-4 mt-0">
                                  {[...matches]
                                    .filter(m => 
                                      m.bracket_group?.toUpperCase() === 'CROSS' ||
                                      (m.bracket_group !== 'A' && m.bracket_group !== 'B' && 
                                       m.bracket_group !== 'C' && m.bracket_group !== 'D')
                                    )
                                    .sort((a, b) => (b.round_number || 0) - (a.round_number || 0))
                                    .map((match, index) => (
                                      <MatchResultCard key={match.id} match={match} index={index} canEdit={canEdit} onEditScore={handleEditScore} />
                                    ))}
                                </TabsContent>
                              </>
                            );
                          } else {
                            // DE16 format with WB, LB-A, LB-B, SABO
                            return (
                              <>
                                <TabsList className="grid w-full grid-cols-5 mb-4 bg-slate-700/50 text-xs">
                                  <TabsTrigger value="all" className="text-xs md:text-sm px-1 md:px-3">
                                    Tất cả ({matches.length})
                                  </TabsTrigger>
                                  <TabsTrigger value="wb" className="text-xs md:text-sm px-1 md:px-3 text-green-400">
                                    WB ({matches.filter(m => m.bracket_type === 'WB').length})
                                  </TabsTrigger>
                                  <TabsTrigger value="lba" className="text-xs md:text-sm px-1 md:px-3 text-orange-400">
                                    LB-A ({matches.filter(m => m.bracket_type === 'LB-A').length})
                                  </TabsTrigger>
                                  <TabsTrigger value="lbb" className="text-xs md:text-sm px-1 md:px-3 text-red-400">
                                    LB-B ({matches.filter(m => m.bracket_type === 'LB-B').length})
                                  </TabsTrigger>
                                  <TabsTrigger value="sabo" className="text-xs md:text-sm px-1 md:px-3 text-purple-400">
                                    SABO ({matches.filter(m => m.bracket_type === 'SABO').length})
                                  </TabsTrigger>
                                </TabsList>

                                {/* All matches */}
                                <TabsContent value="all" className="space-y-3 md:space-y-4 mt-0">
                                  {[...matches]
                                    .sort((a, b) => (a.match_number || 0) - (b.match_number || 0))
                                    .map((match, index) => (
                                      <MatchResultCard key={match.id} match={match} index={index} canEdit={canEdit} onEditScore={handleEditScore} />
                                    ))}
                                </TabsContent>

                                {/* WB matches */}
                                <TabsContent value="wb" className="space-y-3 md:space-y-4 mt-0">
                                  {[...matches]
                                    .filter(m => m.bracket_type === 'WB')
                                    .sort((a, b) => (a.round_number || 0) - (b.round_number || 0) || (a.match_number || 0) - (b.match_number || 0))
                                    .map((match, index) => (
                                      <MatchResultCard key={match.id} match={match} index={index} canEdit={canEdit} onEditScore={handleEditScore} />
                                    ))}
                                </TabsContent>

                                {/* LB-A matches */}
                                <TabsContent value="lba" className="space-y-3 md:space-y-4 mt-0">
                                  {[...matches]
                                    .filter(m => m.bracket_type === 'LB-A')
                                    .sort((a, b) => (a.round_number || 0) - (b.round_number || 0) || (a.match_number || 0) - (b.match_number || 0))
                                    .map((match, index) => (
                                      <MatchResultCard key={match.id} match={match} index={index} canEdit={canEdit} onEditScore={handleEditScore} />
                                    ))}
                                </TabsContent>

                                {/* LB-B matches */}
                                <TabsContent value="lbb" className="space-y-3 md:space-y-4 mt-0">
                                  {[...matches]
                                    .filter(m => m.bracket_type === 'LB-B')
                                    .sort((a, b) => (a.round_number || 0) - (b.round_number || 0) || (a.match_number || 0) - (b.match_number || 0))
                                    .map((match, index) => (
                                      <MatchResultCard key={match.id} match={match} index={index} canEdit={canEdit} onEditScore={handleEditScore} />
                                    ))}
                                </TabsContent>

                                {/* SABO Finals matches */}
                                <TabsContent value="sabo" className="space-y-3 md:space-y-4 mt-0">
                                  {[...matches]
                                    .filter(m => m.bracket_type === 'SABO')
                                    .sort((a, b) => (a.round_number || 0) - (b.round_number || 0) || (a.match_number || 0) - (b.match_number || 0))
                                    .map((match, index) => (
                                      <MatchResultCard key={match.id} match={match} index={index} canEdit={canEdit} onEditScore={handleEditScore} />
                                    ))}
                                </TabsContent>
                              </>
                            );
                          }
                        })()}
                      </Tabs>
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <Clock className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4" />
                        <p className="text-sm md:text-base">Chưa có trận đấu nào</p>
                      </div>
                    )}
                  </Card>
                </TabsContent>
                </div>

                {/* Sidebar - Desktop only */}
                <div className="hidden lg:block space-y-6">
                  {/* Tournament Registration */}
                  <TournamentRegistration tournament={tournament} />

                  {/* Organizer */}
                  {tournament.club && (
                    <Card className="p-6 bg-slate-800/50 border-slate-700">
                      <h3 className="text-lg font-bold text-white mb-4">{t("tournaments.organizer")}</h3>
                      <div className="flex items-center gap-3">
                        {tournament.club.logo_url ? (
                          <img
                            src={tournament.club.logo_url}
                            alt={tournament.club.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gold/20 rounded-lg flex items-center justify-center">
                            <Award className="w-6 h-6 text-gold" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-white">{tournament.club.name}</p>
                          {tournament.club.address && (
                            <p className="text-sm text-slate-400">{tournament.club.address}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Quick Stats */}
                  <Card className="p-6 bg-slate-800/50 border-slate-700">
                    <h3 className="text-lg font-bold text-white mb-4">{t("tournaments.quickStats")}</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">{t("tournaments.avgRating")}</span>
                        <span className="font-bold text-white">2400</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">{t("tournaments.topSeed")}</span>
                        <span className="font-bold text-gold">Master</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">{t("tournaments.totalPrize")}</span>
                        <span className="font-bold text-white">
                          {tournament.prize_pool ? formatCurrency(tournament.prize_pool) : "N/A"}
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
          </Tabs>
        </div>
      </section>
      </div>

      {/* Score Entry Modal */}
      <Dialog open={!!editingMatch} onOpenChange={(open) => !open && setEditingMatch(null)}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Nhập điểm số</DialogTitle>
          </DialogHeader>
          
          {editingMatch && (
            <div className="space-y-4">
              {/* Match info */}
              <div className="text-center text-sm text-slate-400">
                Trận #{editingMatch.match_number || ""} • {editingMatch.bracket_type || ""}
              </div>
              
              {/* Player 1 */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                  {editingMatch.player1?.avatar_url ? (
                    <img 
                      src={editingMatch.player1.avatar_url} 
                      alt=""
                      className="w-10 h-10 rounded-full border-2 border-blue-500"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-500/50 flex items-center justify-center text-blue-300 font-bold">
                      P1
                    </div>
                  )}
                  <span className="font-semibold text-white truncate">
                    {getDisplayName(editingMatch.player1?.display_name, editingMatch.player1?.username, editingMatch.player1?.full_name) || "TBD"}
                  </span>
                </div>
                <Input
                  type="number"
                  min="0"
                  max="99"
                  value={score1}
                  onChange={(e) => setScore1(e.target.value)}
                  className="w-20 text-center text-xl font-bold bg-slate-700 border-slate-600"
                  placeholder="0"
                />
              </div>

              {/* VS */}
              <div className="text-center text-slate-500 font-semibold">VS</div>

              {/* Player 2 */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                  {editingMatch.player2?.avatar_url ? (
                    <img 
                      src={editingMatch.player2.avatar_url} 
                      alt=""
                      className="w-10 h-10 rounded-full border-2 border-red-500"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500/30 to-red-500/50 flex items-center justify-center text-red-300 font-bold">
                      P2
                    </div>
                  )}
                  <span className="font-semibold text-white truncate">
                    {getDisplayName(editingMatch.player2?.display_name, editingMatch.player2?.username, editingMatch.player2?.full_name) || "TBD"}
                  </span>
                </div>
                <Input
                  type="number"
                  min="0"
                  max="99"
                  value={score2}
                  onChange={(e) => setScore2(e.target.value)}
                  className="w-20 text-center text-xl font-bold bg-slate-700 border-slate-600"
                  placeholder="0"
                />
              </div>

              {/* Buttons */}
              <DialogFooter className="gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setEditingMatch(null)}
                  className="border-slate-600"
                >
                  Hủy
                </Button>
                <Button 
                  onClick={handleSaveScore}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? "Đang lưu..." : "Lưu điểm"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TournamentDetails;