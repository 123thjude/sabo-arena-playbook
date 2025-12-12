import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Check, X, User, Phone, FileText } from "lucide-react";
import Navigation from "@/components/Navigation";

interface RankRequest {
  id: string;
  user_id: string;
  club_id: string;
  requested_rank: string;
  phone_number: string;
  notes: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  user: {
    display_name: string;
    username: string;
    avatar_url: string | null;
  };
}

interface Club {
  id: string;
  name: string;
}

const ClubManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [myClub, setMyClub] = useState<Club | null>(null);
  const [requests, setRequests] = useState<RankRequest[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadClubAndRequests();
    }
  }, [user]);

  const loadClubAndRequests = async () => {
    try {
      setLoading(true);
      
      // 1. Get the club owned by the user
      const { data: clubs, error: clubError } = await supabase
        .from("clubs")
        .select("id, name")
        .eq("owner_id", user?.id)
        .single();

      if (clubError) {
        if (clubError.code !== "PGRST116") { // PGRST116 is "The result contains 0 rows"
          console.error("Error loading club:", clubError);
        }
        setLoading(false);
        return;
      }

      if (clubs) {
        setMyClub(clubs);
        
        // 2. Get rank requests for this club
        const { data: requestsData, error: requestsError } = await supabase
          .from("club_rank_requests")
          .select(`
            *,
            user:users(display_name, username, avatar_url)
          `)
          .eq("club_id", clubs.id)
          .order("created_at", { ascending: false });

        if (requestsError) {
          console.error("Error loading requests:", requestsError);
        } else {
          // Transform data to match interface if needed (Supabase returns array of objects)
          // The join returns user as an object or array depending on relationship. 
          // Assuming one-to-one or many-to-one correctly set up.
          setRequests(requestsData as any || []);
        }
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId: string, action: "approved" | "rejected", userId: string, rank: string) => {
    try {
      setProcessingId(requestId);

      // 1. Update request status
      const { error: updateError } = await supabase
        .from("club_rank_requests")
        .update({ status: action })
        .eq("id", requestId);

      if (updateError) throw updateError;

      // 2. If approved, update user's rank
      if (action === "approved") {
        const { error: userUpdateError } = await supabase
          .from("users")
          .update({ rank: rank })
          .eq("id", userId);

        if (userUpdateError) throw userUpdateError;
      }

      // 3. Update local state
      setRequests(requests.map(req => 
        req.id === requestId ? { ...req, status: action } : req
      ));

      toast({
        title: action === "approved" ? "Đã duyệt yêu cầu" : "Đã từ chối yêu cầu",
        description: `Yêu cầu đã được xử lý thành công.`,
      });

    } catch (error: any) {
      console.error("Error processing request:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi xử lý yêu cầu.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!myClub) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Bạn không quản lý câu lạc bộ nào</h1>
          <p className="text-slate-400">Vui lòng liên hệ admin để đăng ký câu lạc bộ của bạn.</p>
        </div>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === "pending");
  const historyRequests = requests.filter(r => r.status !== "pending");

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-24">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Quản lý Câu Lạc Bộ</h1>
            <p className="text-gold text-lg">{myClub.name}</p>
          </div>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="mb-8 bg-slate-800">
            <TabsTrigger value="pending">Yêu cầu chờ duyệt ({pendingRequests.length})</TabsTrigger>
            <TabsTrigger value="history">Lịch sử ({historyRequests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <div className="grid gap-4">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-12 bg-slate-800/50 rounded-lg">
                  <p className="text-slate-400">Không có yêu cầu nào đang chờ duyệt.</p>
                </div>
              ) : (
                pendingRequests.map((request) => (
                  <RequestCard 
                    key={request.id} 
                    request={request} 
                    onAction={handleRequestAction}
                    isProcessing={processingId === request.id}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="grid gap-4">
              {historyRequests.length === 0 ? (
                <div className="text-center py-12 bg-slate-800/50 rounded-lg">
                  <p className="text-slate-400">Chưa có lịch sử duyệt yêu cầu.</p>
                </div>
              ) : (
                historyRequests.map((request) => (
                  <RequestCard 
                    key={request.id} 
                    request={request} 
                    onAction={handleRequestAction}
                    isProcessing={processingId === request.id}
                    readonly
                  />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const RequestCard = ({ 
  request, 
  onAction, 
  isProcessing, 
  readonly = false 
}: { 
  request: RankRequest; 
  onAction: (id: string, action: "approved" | "rejected", userId: string, rank: string) => void;
  isProcessing: boolean;
  readonly?: boolean;
}) => {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
              {request.user.avatar_url ? (
                <img src={request.user.avatar_url} alt={request.user.display_name} className="h-full w-full object-cover" />
              ) : (
                <User className="h-6 w-6 text-slate-400" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">{request.user.display_name || "Người dùng"}</h3>
              <p className="text-slate-400 text-sm mb-2">@{request.user.username}</p>
              
              <div className="flex flex-wrap gap-3 mt-2">
                <Badge variant="outline" className="bg-slate-900/50 border-gold/30 text-gold">
                  Hạng mong muốn: {request.requested_rank}
                </Badge>
                {request.phone_number && (
                  <div className="flex items-center text-sm text-slate-300">
                    <Phone className="h-3 w-3 mr-1" />
                    {request.phone_number}
                  </div>
                )}
              </div>
              
              {request.notes && (
                <div className="mt-3 bg-slate-900/30 p-3 rounded-md border border-slate-700/50">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-slate-500 mt-0.5" />
                    <p className="text-sm text-slate-300 italic">"{request.notes}"</p>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-slate-500 mt-2">
                Gửi lúc: {new Date(request.created_at).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:self-center">
            {readonly ? (
              <Badge className={
                request.status === 'approved' 
                  ? "bg-green-500/20 text-green-400 hover:bg-green-500/20" 
                  : "bg-red-500/20 text-red-400 hover:bg-red-500/20"
              }>
                {request.status === 'approved' ? "Đã duyệt" : "Đã từ chối"}
              </Badge>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  onClick={() => onAction(request.id, "rejected", request.user_id, request.requested_rank)}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-2" />}
                  Từ chối
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => onAction(request.id, "approved", request.user_id, request.requested_rank)}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                  Duyệt
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClubManager;
