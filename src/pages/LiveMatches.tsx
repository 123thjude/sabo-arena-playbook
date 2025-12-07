import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { 
  Activity, 
  Clock, 
  Users, 
  Trophy,
  Play,
  Eye,
  Zap,
  Search,
  Calendar,
  MapPin,
  Filter
} from "lucide-react";
import SEOHead, { SEO_PAGES } from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";

interface LiveMatch {
  id: string;
  tournament: {
    name: string;
    venue?: string;
  };
  player1: {
    name: string;
    avatar_url?: string;
  };
  player2: {
    name: string;
    avatar_url?: string;
  };
  player1_score: number;
  player2_score: number;
  current_frame: number;
  total_frames: number;
  status: 'scheduled' | 'live' | 'completed' | 'paused';
  spectators_count: number;
  current_break?: number;
  start_time?: string;
  created_at: string;
}

const LiveMatches = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { language } = useLanguage();

  // Fetch live matches from database
  const { data: matches = [], isLoading, error } = useQuery({
    queryKey: ['live-matches', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('match_statistics')
        .select(`
          match_id,
          tournament_name,
          player1_name,
          player1_avatar,
          player2_name, 
          player2_avatar,
          player1_score,
          player2_score,
          current_frame,
          total_frames,
          status,
          active_spectators,
          start_time,
          progress_percentage
        `)
        .order('start_time', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.limit(20);
      
      if (error) {
        console.error('Error fetching matches:', error);
        return [];
      }

      return data?.map(match => ({
        id: match.match_id,
        tournament: {
          name: match.tournament_name || 'Tournament',
          venue: 'SABO Arena'
        },
        player1: {
          name: match.player1_name || 'Player 1',
          avatar_url: match.player1_avatar
        },
        player2: {
          name: match.player2_name || 'Player 2', 
          avatar_url: match.player2_avatar
        },
        player1_score: match.player1_score || 0,
        player2_score: match.player2_score || 0,
        current_frame: match.current_frame || 1,
        total_frames: match.total_frames || 9,
        status: match.status || 'scheduled',
        spectators_count: match.active_spectators || 0,
        start_time: match.start_time,
        created_at: new Date().toISOString()
      })) || [];
    },
    refetchInterval: 3000, // Refresh every 3 seconds for live data
    refetchOnWindowFocus: true, // Refresh when user comes back
    staleTime: 2000, // Consider data stale after 2 seconds for live matches
  });

  // Sample matches for when database is empty
  const sampleMatches: LiveMatch[] = [
    {
      id: "live-match-1",
      tournament: { name: "SABO Championship 2024", venue: "SABO Arena Ho Chi Minh" },
      player1: { name: "Nguyễn Văn A" },
      player2: { name: "Trần Văn B" }, 
      player1_score: 3,
      player2_score: 2,
      current_frame: 6,
      total_frames: 9,
      status: "live" as const,
      spectators_count: 127,
      current_break: 47,
      start_time: new Date(Date.now() - 2700000).toISOString(),
      created_at: new Date().toISOString()
    },
    {
      id: "live-match-2", 
      tournament: { name: "Vietnam Open 2024", venue: "Billiard Center Saigon" },
      player1: { name: "Lê Văn C" },
      player2: { name: "Phạm Văn D" },
      player1_score: 1,
      player2_score: 4,
      current_frame: 6,
      total_frames: 7,
      status: "live" as const,
      spectators_count: 89,
      start_time: new Date(Date.now() - 1800000).toISOString(),
      created_at: new Date().toISOString()
    },
    {
      id: "live-match-3",
      tournament: { name: "Ho Chi Minh City Cup", venue: "Diamond Billiard Club" },
      player1: { name: "Hoàng Văn E" },
      player2: { name: "Đỗ Văn F" },
      player1_score: 0,
      player2_score: 0,
      current_frame: 1,
      total_frames: 5,
      status: "scheduled" as const,
      spectators_count: 0,
      start_time: new Date(Date.now() + 900000).toISOString(),
      created_at: new Date().toISOString()
    }
  ];

  // Use database matches or fallback to samples  
  const displayMatches = matches.length > 0 ? matches : sampleMatches;

  // Helper function to get button class
  const getButtonClass = (status: string) => {
    if (status === 'live') return 'bg-red-600 hover:bg-red-700 animate-pulse';
    if (status === 'scheduled') return 'bg-blue-600 hover:bg-blue-700';
    return 'bg-gold hover:bg-gold/90 text-black';
  };

  // Helper function to get button content
  const getButtonContent = (status: string) => {
    if (status === 'live') {
      return (
        <>
          <Eye className="w-4 h-4 mr-2" />
          Xem Live
        </>
      );
    }
    if (status === 'scheduled') {
      return (
        <>
          <Clock className="w-4 h-4 mr-2" />
          Theo dõi
        </>
      );
    }
    return (
      <>
        <Play className="w-4 h-4 mr-2" />
        Xem kết quả
      </>
    );
  };

  // Filter matches based on search and status
  const filteredMatches = displayMatches.filter(match => {
    const matchesSearch = searchQuery === "" || 
      match.player1.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.player2.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.tournament.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || match.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return (
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Badge className="bg-red-500 hover:bg-red-600">
              <Activity className="w-3 h-3 mr-1" />
              LIVE
            </Badge>
          </motion.div>
        );
      case 'paused':
        return (
          <Badge variant="outline" className="text-yellow-400 border-yellow-400/50">
            <Clock className="w-3 h-3 mr-1" />
            TẠM DỪNG
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge variant="outline" className="text-blue-400 border-blue-400/50">
            <Calendar className="w-3 h-3 mr-1" />
            SẮP DIỄN RA
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="text-green-400 border-green-400/50">
            <Trophy className="w-3 h-3 mr-1" />
            ĐÃ KẾT THÚC
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDuration = (startTime: string, status: string) => {
    if (status !== 'live' || !startTime) return null;
    
    const now = new Date();
    const start = new Date(startTime);
    const diffMs = now.getTime() - start.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatStartTime = (startTime: string, status: string) => {
    if (!startTime) return '';
    
    const date = new Date(startTime);
    
    if (status === 'scheduled') {
      const now = new Date();
      const diffMs = date.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffMinutes < 60) {
        return `Bắt đầu sau ${diffMinutes} phút`;
      } else if (diffMinutes < 1440) {
        const hours = Math.floor(diffMinutes / 60);
        return `Bắt đầu sau ${hours} giờ`;
      } else {
        return `Bắt đầu ${date.toLocaleDateString('vi-VN')} lúc ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
      }
    }
    
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  if (error) {
    console.error('Error loading matches:', error);
  }

  return (
    <>
      <SEOHead 
        title={language === 'vi' ? SEO_PAGES.liveMatches.title : 'Live Billiards Matches - SABO ARENA Live Stream'}
        description={language === 'vi' ? SEO_PAGES.liveMatches.description : 'Watch live billiards matches in real-time. Live scores, commentary, detailed statistics from SABO ARENA.'}
        canonical={SEO_PAGES.liveMatches.canonical}
        keywords={SEO_PAGES.liveMatches.keywords}
      />
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gold to-yellow-300 bg-clip-text text-transparent mb-4">
              Live Matches
            </h1>
            <p className="text-xl text-slate-400 mb-6">
              Theo dõi các trận đấu trực tiếp và sắp diễn ra
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card className="border-gold/20 bg-background/95 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Tìm kiếm player hoặc tournament..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Lọc theo trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="live">Đang Live</SelectItem>
                      <SelectItem value="scheduled">Sắp diễn ra</SelectItem>
                      <SelectItem value="paused">Tạm dừng</SelectItem>
                      <SelectItem value="completed">Đã kết thúc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <Card className="border-red-500/20 bg-red-500/5 text-center p-4">
              <div className="text-2xl font-bold text-red-400">
                {filteredMatches.filter(m => m.status === 'live').length}
              </div>
              <div className="text-sm text-slate-400">Đang Live</div>
            </Card>
            
            <Card className="border-blue-500/20 bg-blue-500/5 text-center p-4">
              <div className="text-2xl font-bold text-blue-400">
                {filteredMatches.filter(m => m.status === 'scheduled').length}
              </div>
              <div className="text-sm text-slate-400">Sắp diễn ra</div>
            </Card>
            
            <Card className="border-gold/20 bg-gold/5 text-center p-4">
              <div className="text-2xl font-bold text-gold">
                {filteredMatches.reduce((sum, m) => sum + m.spectators_count, 0)}
              </div>
              <div className="text-sm text-slate-400">Tổng viewers</div>
            </Card>
            
            <Card className="border-green-500/20 bg-green-500/5 text-center p-4">
              <div className="text-2xl font-bold text-green-400">
                {filteredMatches.filter(m => m.status === 'completed').length}
              </div>
              <div className="text-sm text-slate-400">Đã kết thúc</div>
            </Card>
          </motion.div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full mx-auto"
              />
              <p className="text-slate-400 mt-2">Đang tải danh sách trận đấu...</p>
            </div>
          )}

          {/* Matches Grid */}
          {!isLoading && (
            <div className="grid gap-6 max-w-6xl mx-auto">
              {filteredMatches.length > 0 ? (
                filteredMatches.map((match, index) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="border-gold/20 bg-background/95 backdrop-blur-sm hover:border-gold/40 transition-colors">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2 text-white">
                              <Trophy className="w-5 h-5 text-gold" />
                              {match.tournament.name}
                            </CardTitle>
                            <CardDescription className="mt-1 flex items-center gap-2">
                              <MapPin className="w-3 h-3" />
                              {match.tournament.venue}
                            </CardDescription>
                          </div>
                          {getStatusBadge(match.status)}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Players & Score */}
                        <div className="flex items-center justify-center gap-8">
                          <div className="text-center flex-1">
                            <div className="font-semibold text-white text-lg">{match.player1.name}</div>
                            <div className="text-3xl font-bold text-gold mt-2">
                              {match.player1_score}
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="text-slate-400 text-sm mb-2">Frame {match.current_frame}/{match.total_frames}</div>
                            <div className="text-2xl font-bold text-white">VS</div>
                          </div>

                          <div className="text-center flex-1">
                            <div className="font-semibold text-white text-lg">{match.player2.name}</div>
                            <div className="text-3xl font-bold text-gold mt-2">
                              {match.player2_score}
                            </div>
                          </div>
                        </div>

                        {/* Match Info */}
                        <div className="flex items-center justify-center gap-6 text-sm text-slate-400 flex-wrap">
                          {match.status === 'live' && match.start_time && (
                            <>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{match.spectators_count} watching</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{formatDuration(match.start_time, match.status)}</span>
                              </div>
                              {Boolean('current_break' in match && match.current_break && match.current_break > 0) && (
                                <div className="flex items-center gap-1 text-gold">
                                  <Zap className="w-4 h-4" />
                                  <span>Break: {'current_break' in match ? match.current_break : 0}</span>
                                </div>
                              )}
                            </>
                          )}
                          
                          {match.status === 'scheduled' && match.start_time && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatStartTime(match.start_time, match.status)}</span>
                            </div>
                          )}

                          {match.status === 'completed' && (
                            <div className="flex items-center gap-1 text-green-400">
                              <Trophy className="w-4 h-4" />
                              <span>Match completed</span>
                            </div>
                          )}
                        </div>

                        {/* Action Button */}
                        <div className="flex justify-center pt-2">
                          <Link to={`/live-match/${match.id}`}>
                            <Button 
                              className={`${getButtonClass(match.status)} min-w-[140px]`}
                            >
                              {getButtonContent(match.status)}
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <Card className="border-slate-700 text-center p-8">
                  <CardContent>
                    <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Không tìm thấy trận đấu nào
                    </h3>
                    <p className="text-slate-400">
                      {searchQuery || statusFilter !== 'all' 
                        ? 'Thử thay đổi bộ lọc để xem thêm trận đấu' 
                        : 'Hiện tại chưa có trận đấu nào. Hãy quay lại sau!'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LiveMatches;