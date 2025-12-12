import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Calendar, MapPin, Trophy, ArrowLeft, CheckCircle, CreditCard, Upload, Image as ImageIcon, AlertCircle } from "lucide-react";
import Navigation from "@/components/Navigation";
import { formatDate, formatCurrency } from "@/lib/helpers";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PaymentMethod {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  qr_code_url: string | null;
  method_type: string;
  is_default: boolean;
}

const TournamentRegistrationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [tournament, setTournament] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  
  // Payment state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [transactionRef, setTransactionRef] = useState("");

  useEffect(() => {
    if (id) {
      loadTournament();
    }
  }, [id, user]);

  const loadTournament = async () => {
    try {
      setLoading(true);
      
      // Load tournament details
      const { data: tournamentData, error: tournamentError } = await supabase
        .from("tournaments")
        .select(`
          *,
          club:clubs(name, address)
        `)
        .eq("id", id)
        .single();

      if (tournamentError) throw tournamentError;
      setTournament(tournamentData);

      // Load payment methods for the club
      if (tournamentData.club_id) {
        const { data: methods, error: methodsError } = await supabase
          .from("payment_methods")
          .select("*")
          .eq("club_id", tournamentData.club_id)
          .eq("is_active", true)
          .order("is_default", { ascending: false });
        
        if (!methodsError && methods) {
          setPaymentMethods(methods);
          if (methods.length > 0) {
            setSelectedMethodId(methods[0].id);
          }
        }
      }

      // Check if user is already registered
      if (user) {
        const { data: participantData, error: participantError } = await supabase
          .from("tournament_participants")
          .select("id, status, payment_status")
          .eq("tournament_id", id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (participantData) {
          setAlreadyRegistered(true);
          setRegistrationStatus(participantData.status);
          setPaymentStatus(participantData.payment_status);
        }
      }

    } catch (error) {
      console.error("Error loading tournament:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin giải đấu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để đăng ký tham gia.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedMethodId) {
      toast({
        title: "Chưa chọn phương thức thanh toán",
        description: "Vui lòng chọn một phương thức thanh toán.",
        variant: "destructive",
      });
      return;
    }

    if (!proofImage) {
      toast({
        title: "Thiếu ảnh xác nhận",
        description: "Vui lòng tải lên ảnh chụp màn hình giao dịch.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      // 1. Create participant record
      const { data: participant, error: participantError } = await supabase
        .from("tournament_participants")
        .insert({
          tournament_id: id,
          user_id: user.id,
          status: "registered",
          payment_status: "pending",
          payment_method_id: selectedMethodId,
          notes: notes
        })
        .select()
        .single();

      if (participantError) throw participantError;

      // 2. Upload proof image
      const fileExt = proofImage.name.split('.').pop();
      const fileName = `proof_${participant.id}_${Date.now()}.${fileExt}`;
      const filePath = `payment_proofs/${id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('tournament_assets')
        .upload(filePath, proofImage);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('tournament_assets')
        .getPublicUrl(filePath);

      // 3. Create payment record
      const { error: paymentError } = await supabase
        .from("tournament_payments")
        .insert({
          tournament_id: id!,
          user_id: user.id,
          club_id: tournament.club_id,
          payment_method: selectedMethodId,
          amount: tournament.entry_fee,
          status: "pending",
          receipt_image_url: publicUrl,
          registration_id: participant.id,
          transaction_reference: transactionRef,
          payment_type: 'tournament_entry'
        });

      if (paymentError) throw paymentError;

      toast({
        title: "Đăng ký thành công!",
        description: "Thông tin thanh toán của bạn đang được xác minh.",
      });

      setAlreadyRegistered(true);
      setRegistrationStatus("registered");
      setPaymentStatus("pending");

    } catch (error: any) {
      console.error("Error registering:", error);
      toast({
        title: "Lỗi đăng ký",
        description: error.message || "Đã có lỗi xảy ra. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Không tìm thấy giải đấu</h1>
            <Button onClick={() => navigate("/tournaments")} className="mt-4">
              Quay lại danh sách
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const selectedMethod = paymentMethods.find(m => m.id === selectedMethodId);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-6 pl-0 hover:bg-transparent" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Tournament Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Thông tin giải đấu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted mb-4">
                  <img 
                    src={tournament.banner_url || "/placeholder.svg"} 
                    alt={tournament.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div>
                  <h3 className="font-bold text-lg mb-2">{tournament.name}</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      {formatDate(tournament.start_date)}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="mr-2 h-4 w-4" />
                      {tournament.club?.name}
                    </div>
                    <div className="flex items-center">
                      <Trophy className="mr-2 h-4 w-4" />
                      {formatCurrency(tournament.total_prize_pool)}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">Phí tham gia</span>
                    <span className="font-bold text-lg text-primary">
                      {formatCurrency(tournament.entry_fee)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Registration Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Đăng ký tham gia</CardTitle>
                <CardDescription>
                  Hoàn tất thông tin và thanh toán để tham gia giải đấu
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {alreadyRegistered ? (
                  <div className="text-center py-8 space-y-4">
                    {paymentStatus === 'verified' || paymentStatus === 'completed' ? (
                      <>
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-green-600">Đăng ký thành công!</h3>
                        <p className="text-muted-foreground">
                          Bạn đã chính thức tham gia giải đấu này.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                          <AlertCircle className="h-8 w-8 text-yellow-600" />
                        </div>
                        <h3 className="text-xl font-bold text-yellow-600">Đang chờ xác nhận</h3>
                        <p className="text-muted-foreground">
                          Thông tin đăng ký và thanh toán của bạn đang được CLB kiểm tra.
                        </p>
                      </>
                    )}
                    <Button onClick={() => navigate(`/tournaments/${id}`)} className="mt-4">
                      Xem chi tiết giải đấu
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Payment Method Selection */}
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Phương thức thanh toán</Label>
                      <RadioGroup 
                        value={selectedMethodId} 
                        onValueChange={setSelectedMethodId}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        {paymentMethods.map((method) => (
                          <div key={method.id}>
                            <RadioGroupItem value={method.id} id={method.id} className="peer sr-only" />
                            <Label
                              htmlFor={method.id}
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full"
                            >
                              <CreditCard className="mb-3 h-6 w-6" />
                              <div className="text-center">
                                <div className="font-semibold">{method.bank_name}</div>
                                <div className="text-sm text-muted-foreground">{method.account_number}</div>
                                <div className="text-xs text-muted-foreground mt-1">{method.account_holder}</div>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    {/* QR Code Display */}
                    {selectedMethod && selectedMethod.qr_code_url && (
                      <div className="bg-muted/30 p-6 rounded-lg border flex flex-col items-center text-center space-y-4">
                        <h4 className="font-semibold">Quét mã QR để thanh toán</h4>
                        <div className="bg-white p-2 rounded-lg shadow-sm">
                          <img 
                            src={selectedMethod.qr_code_url} 
                            alt="QR Code" 
                            className="w-48 h-48 object-contain"
                          />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Nội dung chuyển khoản:</p>
                          <p className="font-mono font-bold text-foreground mt-1">
                            {user?.email?.split('@')[0]} T{tournament.id.substring(0, 4)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Proof Upload */}
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Xác nhận thanh toán</Label>
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Lưu ý</AlertTitle>
                        <AlertDescription>
                          Vui lòng chụp ảnh màn hình giao dịch thành công và tải lên bên dưới.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="proof">Ảnh giao dịch</Label>
                        <Input id="proof" type="file" accept="image/*" onChange={handleImageChange} />
                      </div>

                      {proofPreview && (
                        <div className="mt-4 relative w-full max-w-xs aspect-[3/4] rounded-lg overflow-hidden border">
                          <img 
                            src={proofPreview} 
                            alt="Proof preview" 
                            className="w-full h-full object-cover"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6"
                            onClick={() => {
                              setProofImage(null);
                              setProofPreview(null);
                            }}
                          >
                            <ArrowLeft className="h-4 w-4 rotate-45" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Additional Info */}
                    <div className="space-y-4">
                      <div className="grid w-full gap-1.5">
                        <Label htmlFor="ref">Mã giao dịch (Tùy chọn)</Label>
                        <Input 
                          id="ref" 
                          placeholder="Nhập mã giao dịch ngân hàng..." 
                          value={transactionRef}
                          onChange={(e) => setTransactionRef(e.target.value)}
                        />
                      </div>
                      
                      <div className="grid w-full gap-1.5">
                        <Label htmlFor="notes">Ghi chú thêm</Label>
                        <Textarea 
                          id="notes" 
                          placeholder="Lời nhắn cho ban tổ chức..." 
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
              
              {!alreadyRegistered && (
                <CardFooter>
                  <Button 
                    className="w-full" 
                    size="lg" 
                    onClick={handleRegister}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Xác nhận đăng ký
                      </>
                    )}
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentRegistrationPage;
