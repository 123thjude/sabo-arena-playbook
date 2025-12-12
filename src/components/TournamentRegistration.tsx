import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useDeepLink } from "@/hooks/useDeepLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Smartphone, 
  Monitor, 
  Download, 
  ExternalLink,
  Users,
  Calendar,
  Trophy,
  DollarSign,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import AuthModal from "@/components/AuthModal";

interface TournamentRegistrationProps {
  tournament: {
    id: string;
    name: string;
    description: string | null;
    start_date: string;
    end_date: string | null;
    max_participants: number | null;
    current_participants: number;
    entry_fee: number | null;
    prize_pool: number | null;
    venue: string | null;
    status: string;
    registration_deadline: string | null;
  };
}

const TournamentRegistration = ({ tournament }: TournamentRegistrationProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { deviceInfo, smartRedirect, getUniversalLink, openApp } = useDeepLink();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationMethod, setRegistrationMethod] = useState<"web" | "app" | null>(null);

  const canRegister = tournament.status === "upcoming" && 
                     (!tournament.max_participants || tournament.current_participants < tournament.max_participants) &&
                     (!tournament.registration_deadline || new Date(tournament.registration_deadline) > new Date());

  const handleRegistration = async (method: "web" | "app") => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsRegistering(true);
    setRegistrationMethod(method);

    try {
      if (method === "app" && deviceInfo.isMobile) {
        // Mobile app registration
        await smartRedirect({
          tournamentId: tournament.id,
          action: "register",
          userId: user.id,
          fallbackUrl: `/tournaments/${tournament.id}/register`,
        });
      } else {
        // Web registration
        navigate(`/tournaments/${tournament.id}/register`);
      }
    } catch (error) {
      console.error("Registration failed:", error);
    } finally {
      setIsRegistering(false);
      setRegistrationMethod(null);
    }
  };

  const handleShare = () => {
    const universalLink = getUniversalLink({
      tournamentId: tournament.id,
      action: "view",
    });

    if (navigator.share) {
      navigator.share({
        title: tournament.name,
        text: `${t("tournaments.register")} - ${tournament.name}`,
        url: universalLink,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(universalLink);
    }
  };

  return (
    <>
      <Card className="border-gold/20 bg-background/95 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-gold" />
                {t("tournaments.registration")}
              </CardTitle>
              <CardDescription>
                {deviceInfo.isMobile 
                  ? t("tournaments.registrationMobileDesc")
                  : t("tournaments.registrationWebDesc")
                }
              </CardDescription>
            </div>
            <Badge variant={canRegister ? "default" : "secondary"}>
              {canRegister ? t("tournaments.openRegistration") : t("tournaments.closedRegistration")}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Tournament Quick Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-slate-400">
                {tournament.current_participants}
                {tournament.max_participants && `/${tournament.max_participants}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-slate-400">
                {tournament.entry_fee ? `${tournament.entry_fee.toLocaleString()} VND` : t("tournaments.free")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-gold" />
              <span className="text-slate-400">
                {tournament.prize_pool ? `${tournament.prize_pool.toLocaleString()} VND` : "TBD"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span className="text-slate-400">
                {new Date(tournament.start_date).toLocaleDateString()}
              </span>
            </div>
          </div>

          <Separator />

          {/* Device-Specific Registration Options */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">{t("tournaments.registrationOptions")}</h4>
            
            {deviceInfo.isMobile ? (
              // Mobile Registration Options
              <div className="space-y-3">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={() => handleRegistration("app")}
                    disabled={!canRegister || isRegistering}
                    className="w-full h-auto p-4 flex items-center justify-between bg-gradient-to-r from-gold to-yellow-300 hover:from-gold/90 hover:to-yellow-300/90 text-black"
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-semibold">{t("tournaments.registerInApp")}</div>
                        <div className="text-xs opacity-80">{t("tournaments.recommendedMobile")}</div>
                      </div>
                    </div>
                    {isRegistering && registrationMethod === "app" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4" />
                    )}
                  </Button>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={() => handleRegistration("web")}
                    disabled={!canRegister || isRegistering}
                    variant="outline"
                    className="w-full h-auto p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Monitor className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-semibold">{t("tournaments.registerInBrowser")}</div>
                        <div className="text-xs opacity-60">{t("tournaments.alternativeOption")}</div>
                      </div>
                    </div>
                    {isRegistering && registrationMethod === "web" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4" />
                    )}
                  </Button>
                </motion.div>
              </div>
            ) : (
              // Desktop Registration Options
              <div className="space-y-3">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={() => handleRegistration("web")}
                    disabled={!canRegister || isRegistering}
                    className="w-full h-auto p-4 flex items-center justify-between bg-gradient-to-r from-gold to-yellow-300 hover:from-gold/90 hover:to-yellow-300/90 text-black"
                  >
                    <div className="flex items-center gap-3">
                      <Monitor className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-semibold">{t("tournaments.registerNow")}</div>
                        <div className="text-xs opacity-80">{t("tournaments.quickWebRegistration")}</div>
                      </div>
                    </div>
                    {isRegistering ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4" />
                    )}
                  </Button>
                </motion.div>

                <Alert>
                  <Smartphone className="h-4 w-4" />
                  <AlertDescription>
                    {t("tournaments.mobileAppPromo")}{" "}
                    <Button variant="link" className="p-0 h-auto text-gold">
                      {t("tournaments.downloadApp")}
                    </Button>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>

          {!canRegister && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {tournament.status !== "upcoming" 
                  ? t("tournaments.registrationClosed")
                  : tournament.max_participants && tournament.current_participants >= tournament.max_participants
                    ? t("tournaments.tournamentFull")
                    : t("tournaments.registrationDeadlinePassed")
                }
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Additional Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleShare} className="flex-1">
              <ExternalLink className="w-4 h-4 mr-2" />
              {t("common.share")}
            </Button>
            
            {tournament.venue && (
              <Button variant="outline" className="flex-1">
                <MapPin className="w-4 h-4 mr-2" />
                {t("tournaments.viewVenue")}
              </Button>
            )}
          </div>

          {/* Registration Info */}
          <div className="text-sm text-slate-400 space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>
                {tournament.registration_deadline 
                  ? `${t("tournaments.registrationDeadline")}: ${new Date(tournament.registration_deadline).toLocaleDateString()}`
                  : t("tournaments.noRegistrationDeadline")
                }
              </span>
            </div>
            
            {canRegister && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>{t("tournaments.instantConfirmation")}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab="login"
      />
    </>
  );
};

export default TournamentRegistration;