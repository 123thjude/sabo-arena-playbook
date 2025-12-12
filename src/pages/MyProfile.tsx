import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  User, 
  Loader2, 
  Trophy, 
  Target, 
  TrendingUp, 
  Calendar,
  Medal,
  Star,
  Edit3,
  Save,
  Award,
  Zap
} from "lucide-react";
import Navigation from "@/components/Navigation";

const MyProfile = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: "",
    username: "",
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error loading profile:", error);
        throw error;
      }

      if (data) {
        setProfile(data);
        setEditForm({
          display_name: data.display_name || "",
          username: data.username || "",
        });

        // Load rank requests
        const { data: requestsData } = await supabase
          .from("club_rank_requests")
          .select(`
            *,
            club:clubs(name)
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
          
        if (requestsData) {
          setRequests(requestsData);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          display_name: editForm.display_name,
          username: editForm.username,
        })
        .eq("id", user.id);
      
      if (!error) {
        setProfile({ ...profile, ...editForm });
        setEditing(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const getSpaPoints = () => {
    if (!profile) return 0;
    // Ưu tiên spa_points, nếu không có thì dùng ranking_points
    return profile.spa_points || profile.ranking_points || 0;
  };

  const getWinRate = () => {
    if (!profile) return 0;
    const total = profile.total_wins + profile.total_losses;
    return total > 0 ? ((profile.total_wins / total) * 100).toFixed(1) : 0;
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </>
    );
  }

  if (!user || !profile) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 flex items-center justify-center">
          <Card className="border-gold/20 bg-background/95 max-w-md">
            <CardContent className="p-12 text-center">
              <User className="w-16 h-16 text-gold mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-3">Không tìm thấy hồ sơ</h1>
              <p className="text-slate-400 mb-6">Vui lòng đăng nhập để xem hồ sơ</p>
              <Button onClick={() => window.location.href = "/"} className="bg-gold text-black hover:bg-gold/90">Đăng nhập</Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          
          {/* Profile Header */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Card className="border-gold/20 bg-background/95 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <Avatar className="w-32 h-32 border-4 border-gold shadow-xl">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="bg-gold/20 text-gold text-4xl font-bold">
                      {profile.display_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 text-center md:text-left">
                    <h1 className="text-4xl font-bold text-white mb-2">
                      {profile.display_name || "Người chơi"}
                    </h1>
                    <p className="text-slate-400 text-lg mb-4">@{profile.username}</p>
                    
                    {profile.rank && (
                      <Badge variant="secondary" className="mb-4 text-base px-4 py-1">
                        <Medal className="w-4 h-4 mr-2" />
                        {profile.rank}
                      </Badge>
                    )}
                    
                    <div className="flex flex-wrap gap-6 mt-4 justify-center md:justify-start">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-gold" />
                        <span className="text-slate-300"><span className="font-bold text-white">{profile.tournament_wins}</span> Vô địch</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-400" />
                        <span className="text-slate-300"><span className="font-bold text-white">{getWinRate()}%</span> Tỷ lệ thắng</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-purple-400" />
                        <span className="text-slate-300"><span className="font-bold text-white">{profile.elo_rating}</span> ELO</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-400" />
                        <span className="text-slate-300"><span className="font-bold text-white">{getSpaPoints()}</span> SPA</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="destructive" onClick={signOut} size="lg">
                    Đăng xuất
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tabs Content */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }}
          >
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5 max-w-3xl mx-auto">
                <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                <TabsTrigger value="stats">Thống kê</TabsTrigger>
                <TabsTrigger value="history">Lịch sử</TabsTrigger>
                <TabsTrigger value="requests">Yêu cầu</TabsTrigger>
                <TabsTrigger value="settings">Cài đặt</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="border-gold/20 bg-background/95 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-400">Tổng giải đấu</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gold">{profile.total_tournaments}</div>
                      <p className="text-xs text-slate-500 mt-1">Đã tham gia</p>
                    </CardContent>
                  </Card>

                  <Card className="border-green-500/20 bg-background/95 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-400">Tổng thắng</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-400">{profile.total_wins}</div>
                      <p className="text-xs text-slate-500 mt-1">Chiến thắng</p>
                    </CardContent>
                  </Card>

                  <Card className="border-red-500/20 bg-background/95 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-400">Tổng thua</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-400">{profile.total_losses}</div>
                      <p className="text-xs text-slate-500 mt-1">Thất bại</p>
                    </CardContent>
                  </Card>

                  <Card className="border-purple-500/20 bg-background/95 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-400">Tỷ lệ thắng</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-purple-400">{getWinRate()}%</div>
                      <p className="text-xs text-slate-500 mt-1">Win rate</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-gold/20 bg-background/95 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-gold" />
                      Thành tích nổi bật
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-6 bg-gold/10 rounded-lg border border-gold/20">
                        <Trophy className="w-12 h-12 text-gold mx-auto mb-3" />
                        <div className="text-2xl font-bold text-gold mb-1">{profile.tournament_wins}</div>
                        <div className="text-sm text-slate-400">Chức vô địch</div>
                      </div>
                      <div className="text-center p-6 bg-purple-500/10 rounded-lg border border-purple-500/20">
                        <Zap className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                        <div className="text-2xl font-bold text-purple-400 mb-1">{profile.elo_rating}</div>
                        <div className="text-sm text-slate-400">ELO Rating</div>
                      </div>
                      <div className="text-center p-6 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                        <Star className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                        <div className="text-2xl font-bold text-yellow-400 mb-1">{getSpaPoints()}</div>
                        <div className="text-sm text-slate-400">SPA Points</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Stats Tab */}
              <TabsContent value="stats" className="space-y-6">
                <Card className="border-gold/20 bg-background/95 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-gold" />
                      Phân tích chi tiết
                    </CardTitle>
                    <CardDescription>Thống kê hiệu suất thi đấu của bạn</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-slate-300">Tỷ lệ thắng</span>
                          <span className="text-sm font-bold text-gold">{getWinRate()}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-gold to-yellow-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${getWinRate()}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                          <div className="text-2xl font-bold text-white mb-1">{profile.total_wins}</div>
                          <div className="text-sm text-green-400">Trận thắng</div>
                        </div>
                        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                          <div className="text-2xl font-bold text-white mb-1">{profile.total_losses}</div>
                          <div className="text-sm text-red-400">Trận thua</div>
                        </div>
                        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                          <div className="text-2xl font-bold text-white mb-1">{profile.total_wins + profile.total_losses}</div>
                          <div className="text-sm text-blue-400">Tổng trận</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gold/20 bg-background/95 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Xếp hạng</CardTitle>
                    <CardDescription>Vị trí của bạn trên bảng xếp hạng</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gold/20 to-gold/5 rounded-lg border border-gold/30">
                      <div>
                        <div className="text-sm text-slate-400 mb-1">Hạng hiện tại</div>
                        <div className="text-3xl font-bold text-white">{profile.rank || "Chưa xếp hạng"}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-400 mb-1">SPA Points</div>
                        <div className="text-3xl font-bold text-gold">{getSpaPoints()}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-6">
                <Card className="border-gold/20 bg-background/95 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-gold" />
                      Lịch sử thi đấu
                    </CardTitle>
                    <CardDescription>Các giải đấu bạn đã tham gia</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 mb-2">Lịch sử thi đấu sẽ được cập nhật sớm</p>
                      <p className="text-sm text-slate-500">Thông tin chi tiết về các trận đấu và giải đấu của bạn</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              {/* Requests Tab */}
              <TabsContent value="requests" className="space-y-6">
                <Card className="border-gold/20 bg-background/95 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-gold" />
                      Yêu cầu đăng ký hạng
                    </CardTitle>
                    <CardDescription>Theo dõi trạng thái các yêu cầu xét hạng của bạn</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {requests.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                          Bạn chưa gửi yêu cầu đăng ký hạng nào.
                        </div>
                      ) : (
                        requests.map((request) => (
                          <div key={request.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                            <div>
                              <div className="font-bold text-white mb-1">
                                {request.club?.name || "Câu lạc bộ"}
                              </div>
                              <div className="text-sm text-slate-400">
                                Đăng ký hạng: <span className="text-gold font-bold">{request.requested_rank}</span>
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                {new Date(request.created_at).toLocaleDateString('vi-VN')}
                              </div>
                            </div>
                            <div>
                              <Badge className={
                                request.status === 'approved' 
                                  ? "bg-green-500/20 text-green-400 hover:bg-green-500/20" 
                                  : request.status === 'rejected'
                                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/20"
                                    : "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20"
                              }>
                                {request.status === 'approved' ? "Đã duyệt" : 
                                 request.status === 'rejected' ? "Từ chối" : "Đang chờ"}
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <Card className="border-gold/20 bg-background/95 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Edit3 className="w-5 h-5 text-gold" />
                      Chỉnh sửa hồ sơ
                    </CardTitle>
                    <CardDescription>Cập nhật thông tin cá nhân của bạn</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {editing ? (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="displayName">Tên hiển thị</Label>
                          <Input
                            id="displayName"
                            value={editForm.display_name}
                            onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                            placeholder="Nhập tên hiển thị"
                            className="bg-slate-800 border-slate-700"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            value={editForm.username}
                            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                            placeholder="Nhập username"
                            className="bg-slate-800 border-slate-700"
                          />
                        </div>

                        <Alert>
                          <AlertDescription>
                            Một số thông tin khác như ELO, điểm xếp hạng được cập nhật tự động dựa trên kết quả thi đấu của bạn.
                          </AlertDescription>
                        </Alert>
                        
                        <div className="flex gap-3">
                          <Button onClick={saveProfile} disabled={saving} className="bg-gold text-black hover:bg-gold/90">
                            {saving ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Đang lưu...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Lưu thay đổi
                              </>
                            )}
                          </Button>
                          <Button variant="outline" onClick={() => setEditing(false)}>
                            Hủy
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-sm font-medium text-slate-400 mb-2">Tên hiển thị</h4>
                            <p className="text-white text-lg">{profile.display_name || "Chưa cập nhật"}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-slate-400 mb-2">Username</h4>
                            <p className="text-white text-lg">@{profile.username || "Chưa cập nhật"}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-slate-400 mb-2">Hạng</h4>
                            <p className="text-white text-lg">{profile.rank || "Chưa xếp hạng"}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-slate-400 mb-2">ELO Rating</h4>
                            <p className="text-white text-lg">{profile.elo_rating}</p>
                          </div>
                        </div>
                        
                        <Button onClick={() => setEditing(true)} className="bg-gold text-black hover:bg-gold/90">
                          <Edit3 className="w-4 h-4 mr-2" />
                          Chỉnh sửa thông tin
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default MyProfile;
