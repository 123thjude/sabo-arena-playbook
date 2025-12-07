import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useRankSystem } from "@/hooks/useRankSystem";
import { getDisplayName, getRankColor } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppDownloadButtons from "@/components/AppDownloadButtons";
import { Search, Trophy, Filter, Medal, Award, Users, RotateCcw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import type { Player } from "@/types/database";
import SEOHead, { SEO_PAGES } from "@/components/SEOHead";

const Rankings = () => {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [rankFilter, setRankFilter] = useState<string>("all");
  const [leaderboardType, setLeaderboardType] = useState<string>("elo");
  const [sortBy, setSortBy] = useState<string>("ranking_points");
  const [currentPage, setCurrentPage] = useState(1);
  const playersPerPage = 20;

  const queryClient = useQueryClient();
  const { data: players, isLoading: playersLoading, isFetching, refetch } = useLeaderboard(
    leaderboardType as 'elo' | 'wins' | 'tournaments' | 'spa_points',
    rankFilter === 'all' ? null : rankFilter,
    100
  );
  const { data: rankSystem } = useRankSystem();

  // Manual refresh function
  const handleRefresh = async () => {
    await refetch();
    queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
  };

  // Helper functions
  const getMainStat = (player: any) => {
    if (leaderboardType === 'elo') return player.elo_rating;
    if (leaderboardType === 'wins') return player.total_wins;
    if (leaderboardType === 'tournaments') return player.tournament_wins;
    return player.spa_points || player.ranking_points;
  };

  const getMainStatLabel = () => {
    if (leaderboardType === 'elo') return 'ELO';
    if (leaderboardType === 'wins') return 'Wins';
    if (leaderboardType === 'tournaments') return 'Tournaments';
    return 'SPA Points';
  };

  // Filter and search players
  const filteredPlayers = players?.filter((player) => {
    const nameMatch = searchQuery === "" || 
      getDisplayName(player.display_name, player.username).toLowerCase().includes(searchQuery.toLowerCase());
    
    const rankMatch = rankFilter === "all" || player.rank === rankFilter;
    
    return nameMatch && rankMatch;
  }) || [];

  // Sort players
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    switch (sortBy) {
      case "ranking_points":
        return b.ranking_points - a.ranking_points;
      case "tournament_wins":
        return b.tournament_wins - a.tournament_wins;
      case "total_wins":
        return b.total_wins - a.total_wins;
      case "elo_rating":
        return b.elo_rating - a.elo_rating;
      default:
        return b.ranking_points - a.ranking_points;
    }
  });

  // Pagination
  const startIndex = (currentPage - 1) * playersPerPage;
  const endIndex = startIndex + playersPerPage;
  const paginatedPlayers = sortedPlayers.slice(startIndex, endIndex);
  const totalPages = Math.ceil(sortedPlayers.length / playersPerPage);

  const getPlayerRankDisplay = (player: Player, index: number) => {
    if (sortBy === "ranking_points") {
      return startIndex + index + 1; // Overall ranking position
    }
    return startIndex + index + 1;
  };

  if (playersLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-24">
          <Skeleton className="h-12 w-64 mb-8 mx-auto" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((id) => (
              <Skeleton key={`skeleton-${id}`} className="h-64 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title={language === 'vi' ? SEO_PAGES.rankings.title : 'Billiards ELO Rankings - Top Players Vietnam 2025'}
        description={language === 'vi' ? SEO_PAGES.rankings.description : 'View real-time billiards ELO rankings. Top 100 best players in Vietnam, detailed stats, match history. Updated continuously!'}
        canonical={SEO_PAGES.rankings.canonical}
        keywords={SEO_PAGES.rankings.keywords}
      />
      {/* Hero Section */}
      <section className="py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-gold/5" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-gold/10 text-gold px-4 py-2 rounded-full text-sm font-bold tracking-wider uppercase mb-6">
              <Trophy className="w-4 h-4" />
              {t("nav.rankings")}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              {t("players.topRanked")} <span className="text-gold">{t("players.topRankedFull")}</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8">
              {t("players.eliteAthletes")}
            </p>

            {/* App Download CTA */}
            <div className="mb-8 max-w-md mx-auto">
              <div className="bg-gold/10 border border-gold/30 rounded-lg p-4 text-center">
                <p className="text-sm font-bold text-gold mb-2">{t("app.getTheApp")}</p>
                <p className="text-xs text-slate-400 mb-3">{t("app.betterExperience")}</p>
                <AppDownloadButtons
                  variant="outline"
                  size="sm"
                  layout="compact"
                  showText={false}
                  className="justify-center"
                />
              </div>
            </div>

            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
              <Card className="p-6 bg-slate-800/50 border-slate-700 hover:border-gold/30 transition-colors">
                <Users className="w-8 h-8 text-gold mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{filteredPlayers?.length || 0}</p>
                <p className="text-slate-400 text-sm">Total Players</p>
                <p className="text-xs text-gold mt-1">
                  {rankFilter !== 'all' ? `Rank ${rankFilter}` : 'All Ranks'}
                </p>
              </Card>
              
              <Card className="p-6 bg-slate-800/50 border-slate-700 hover:border-gold/30 transition-colors">
                <Trophy className="w-8 h-8 text-gold mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">
                  {players?.length > 0 ? Math.round(players.reduce((sum, p) => sum + (p.elo_rating || 0), 0) / players.length) : 0}
                </p>
                <p className="text-slate-400 text-sm">Average ELO</p>
                <p className="text-xs text-gold mt-1">
                  {leaderboardType === 'elo' ? 'Current Filter' : 'All Players'}
                </p>
              </Card>

              <Card className="p-6 bg-slate-800/50 border-slate-700 hover:border-gold/30 transition-colors">
                <Medal className="w-8 h-8 text-gold mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">
                  {players?.filter(p => ['C', 'D', 'E', 'F'].includes(p.rank || '')).length || 0}
                </p>
                <p className="text-slate-400 text-sm">Elite Ranks</p>
                <p className="text-xs text-gold mt-1">C, D, E, F Tiers</p>
              </Card>

              <Card className="p-6 bg-slate-800/50 border-slate-700 hover:border-gold/30 transition-colors">
                <Award className="w-8 h-8 text-gold mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">
                  {players?.reduce((sum, p) => sum + (p.tournament_wins || 0), 0) || 0}
                </p>
                <p className="text-slate-400 text-sm">Total Tournaments</p>
                <p className="text-xs text-gold mt-1">Won by All</p>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 bg-slate-800 border-b border-slate-700">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col lg:flex-row gap-4 items-center justify-between"
          >
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("players.searchPlayers")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600"
              />
            </div>

              {/* Refresh Button */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  size="sm"
                  disabled={isFetching}
                  className="bg-slate-700 border-slate-600 hover:bg-slate-600 hover:border-gold/50 transition-all"
                >
                  <motion.div
                    animate={isFetching ? { rotate: 360 } : { rotate: 0 }}
                    transition={{ duration: 1, repeat: isFetching ? Infinity : 0, ease: "linear" }}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                  </motion.div>
                  {isFetching ? 'Updating...' : 'Refresh'}
                </Button>
              </motion.div>            {/* Filters */}
            <div className="flex gap-4 items-center flex-wrap">
              {/* Leaderboard Type */}
              <Select value={leaderboardType} onValueChange={setLeaderboardType}>
                <SelectTrigger className="w-40 bg-slate-700 border-slate-600">
                  <Trophy className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Ranking Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="elo">🎯 ELO Rating</SelectItem>
                  <SelectItem value="wins">🏆 Total Wins</SelectItem>
                  <SelectItem value="tournaments">🥇 Tournaments</SelectItem>
                  <SelectItem value="spa_points">⭐ SPA Points</SelectItem>
                </SelectContent>
              </Select>

              {/* Rank Filter */}
              <Select value={rankFilter} onValueChange={setRankFilter}>
                <SelectTrigger className="w-40 bg-slate-700 border-slate-600">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Ranks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🏅 All Ranks</SelectItem>
                  {rankSystem?.map((rank) => (
                    <SelectItem key={rank.rank_code} value={rank.rank_code}>
                      {rank.rank_name_vi} ({rank.rank_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort Filter */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48 bg-slate-700 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ranking_points">{t("players.sortByPoints")}</SelectItem>
                  <SelectItem value="tournament_wins">{t("players.sortByTournaments")}</SelectItem>
                  <SelectItem value="total_wins">{t("players.sortByWins")}</SelectItem>
                  <SelectItem value="elo_rating">{t("players.sortByElo")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Players Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {playersLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="p-6 border-slate-700 bg-slate-800/50">
                    <Skeleton className="w-12 h-12 rounded-full mb-4" />
                    <Skeleton className="w-20 h-20 rounded-full mx-auto mb-4" />
                    <Skeleton className="h-6 w-32 mx-auto mb-2" />
                    <Skeleton className="h-4 w-16 mx-auto mb-4" />
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <Skeleton className="h-8 w-12 mx-auto mb-1" />
                        <Skeleton className="h-3 w-8 mx-auto" />
                      </div>
                      <div className="text-center">
                        <Skeleton className="h-8 w-12 mx-auto mb-1" />
                        <Skeleton className="h-3 w-12 mx-auto" />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : paginatedPlayers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">{t("players.noPlayersFound")}</h3>
              <p className="text-muted-foreground">{t("players.tryDifferentFilters")}</p>
            </motion.div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {paginatedPlayers.map((player, index) => {
                  const ranking = getPlayerRankDisplay(player, index);
                  const rankColor = getRankColor(player.rank, rankSystem);
                  const winRate = player.total_wins + player.total_losses > 0 
                    ? Math.round((player.total_wins / (player.total_wins + player.total_losses)) * 100)
                    : 0;

                  return (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.05 }}
                    >
                      <Card className="group overflow-hidden border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-gold/30 transition-all duration-300 cursor-pointer">
                        {/* Rank Badge */}
                        <div className="relative">
                          <div 
                            className="absolute top-4 left-4 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg z-10 text-black"
                            style={{ backgroundColor: rankColor }}
                          >
                            <span>#{ranking}</span>
                          </div>
                          
                          {/* Avatar */}
                          <div className="p-6 pt-20 text-center">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-4 border-slate-600 group-hover:border-gold transition-colors">
                              {player.avatar_url ? (
                                <img
                                  src={player.avatar_url}
                                  alt={getDisplayName(player.display_name, player.username)}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gold/20 to-gold/40 flex items-center justify-center">
                                  <Users className="w-8 h-8 text-gold" />
                                </div>
                              )}
                            </div>

                            {/* Player Info */}
                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-gold transition-colors">
                              {getDisplayName(player.display_name, player.username)}
                            </h3>

                            {/* Rank Badge */}
                            {player.rank && (
                              <Badge 
                                variant="outline"
                                className="mb-3"
                                style={{ 
                                  borderColor: rankColor,
                                  color: rankColor 
                                }}
                              >
                                {t("common.language") === "vi" 
                                  ? rankSystem?.find(r => r.rank_code === player.rank)?.rank_name_vi || player.rank
                                  : player.rank
                                }
                              </Badge>
                            )}

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-2xl font-bold text-gold">
                                  {getMainStat(player)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {getMainStatLabel()}
                                </p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-gold">{winRate}%</p>
                                <p className="text-xs text-muted-foreground">Win Rate</p>
                              </div>
                            </div>

                            {/* Additional Stats */}
                            <div className="grid grid-cols-3 gap-2 text-center mb-3">
                              <div className="bg-slate-700/50 rounded p-2">
                                <p className="text-sm font-bold text-white">{player.total_wins}</p>
                                <p className="text-xs text-muted-foreground">W</p>
                              </div>
                              <div className="bg-slate-700/50 rounded p-2">
                                <p className="text-sm font-bold text-white">{player.total_losses}</p>
                                <p className="text-xs text-muted-foreground">L</p>
                              </div>
                              <div className="bg-slate-700/50 rounded p-2">
                                <p className="text-sm font-bold text-white">{player.tournament_wins}</p>
                                <p className="text-xs text-muted-foreground">T</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="text-center">
                                <p className="font-bold text-white">{player.tournament_wins}</p>
                                <p className="text-muted-foreground">{t("players.tournaments")}</p>
                              </div>
                              <div className="text-center">
                                <p className="font-bold text-white">{player.elo_rating}</p>
                                <p className="text-muted-foreground">ELO</p>
                              </div>
                            </div>

                            {/* View Profile Button */}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-4 w-full border-gold/30 text-gold hover:bg-gold hover:text-black transition-all"
                            >
                              {t("players.viewProfile")}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="flex justify-center items-center gap-2 mt-12"
                >
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="border-slate-600"
                  >
                    {t("common.previous")}
                  </Button>

                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    const pageNumber = Math.max(1, currentPage - 2) + i;
                    if (pageNumber > totalPages) return null;

                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={currentPage === pageNumber 
                          ? "bg-gold text-black hover:bg-gold/90" 
                          : "border-slate-600"
                        }
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}

                  <Button
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="border-slate-600"
                  >
                    {t("common.next")}
                  </Button>
                </motion.div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Rankings;