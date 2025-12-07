import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, ArrowRight, Calendar, Users, Trophy } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNextTournament } from "@/hooks/useNextTournament";
import { useRecentWinner } from "@/hooks/useRecentWinner";
import { formatCurrency, formatDate, getDisplayName } from "@/lib/helpers";
import { Skeleton } from "@/components/ui/skeleton";
import AppDownloadButtons from "@/components/AppDownloadButtons";
import AppDownloadModal from "@/components/AppDownloadModal";
import { useAppDownloadModal } from "@/hooks/useAppDownloadModal";
import heroImage from "@/assets/hero-player.jpg";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data: nextTournament, isLoading: isLoadingNext } = useNextTournament();
  const { data: recentWinner, isLoading: recentWinnerLoading, error: recentWinnerError } = useRecentWinner();
  const { openModal } = useAppDownloadModal();
  
  const handleJoinTournament = () => {
    console.log('Button clicked - handleJoinTournament');
    // Show professional modal for app download
    openModal({
      title: t("app.downloadTitle"),
      description: t("app.downloadDescription")
    });
    console.log('Modal opened');
  };

  const handleViewRankings = () => {
    navigate('/rankings');
  };
  
  return (
    <section className="relative min-h-screen w-full overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Professional pool player in action"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 min-h-screen flex items-center pt-20">
        <div className="grid lg:grid-cols-2 gap-12 w-full">
          {/* Left Side - Headlines */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col justify-center space-y-8"
          >
            <div className="space-y-4">
              <p className="text-gold text-sm font-bold tracking-widest uppercase">
                {t("hero.championship")}
              </p>
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black leading-none">
                <span className="text-foreground">{t("hero.title1")}</span>
                <br />
                <span className="text-foreground">{t("hero.title2")}</span>
                <br />
                <span className="text-gold">{t("hero.title3")}</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
                {t("hero.description")}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-base font-bold" onClick={handleJoinTournament}>
                {t("hero.joinTournament")}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-base font-bold" onClick={handleViewRankings}>
                {t("hero.viewRankings")}
              </Button>
            </div>

            {/* Mobile App Download CTA */}
            <div className="sm:hidden">
              <div className="bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/20 rounded-lg p-4">
                <p className="text-sm font-bold text-gold mb-2">{t("app.getTheApp")}</p>
                <p className="text-xs text-muted-foreground mb-3">{t("app.betterExperience")}</p>
                <AppDownloadButtons
                  variant="outline"
                  size="sm"
                  layout="horizontal"
                  className="w-full"
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border/50">
              <div>
                <p className="text-3xl md:text-4xl font-black text-gold">2.5K+</p>
                <p className="text-sm text-muted-foreground">{t("hero.activePlayers")}</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-black text-gold">150+</p>
                <p className="text-sm text-muted-foreground">{t("hero.tournaments")}</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-black text-gold">$500K</p>
                <p className="text-sm text-muted-foreground">{t("hero.prizePool")}</p>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Floating Cards */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:flex flex-col justify-center space-y-6"
          >
            {/* Tournament Card */}
            <Card className="p-8 border-2 border-gold bg-gradient-to-br from-card/95 via-card/90 to-gold/5 backdrop-blur-sm hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden">
              {/* Decorative glow effect */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-gold/10 rounded-full blur-3xl" />
              
              {isLoadingNext ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-8 w-24" />
                </div>
              ) : nextTournament ? (
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex-1 space-y-4">
                    <div className="inline-flex items-center gap-2 bg-gold/20 px-3 py-1 rounded-full">
                      <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
                      <p className="text-xs font-bold text-gold tracking-wider uppercase">
                        {t("hero.upcomingTournament")}
                      </p>
                    </div>
                    
                    <h3 className="text-2xl font-black text-foreground leading-tight">
                      {nextTournament.title}
                    </h3>
                    
                    <div className="space-y-3 py-2">
                      <p className="text-sm text-muted-foreground flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gold/10">
                          <Calendar className="w-4 h-4 text-gold" />
                        </span>
                        <span className="font-medium">{formatDate(nextTournament.start_date)}</span>
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gold/10">
                          <Users className="w-4 h-4 text-gold" />
                        </span>
                        <span className="font-medium">{nextTournament.current_participants}/{nextTournament.max_participants} {t("tournaments.participants")}</span>
                      </p>
                      {Boolean(nextTournament.prize_pool) && (
                        <p className="text-base font-bold text-gold flex items-center gap-3">
                          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gold/20">
                            <Trophy className="w-4 h-4" />
                          </span>
                          <span className="text-lg">{formatCurrency(nextTournament.prize_pool)}</span>
                        </p>
                      )}
                    </div>
                    
                    <Button 
                      variant="default" 
                      size="lg" 
                      className="font-bold bg-gold text-black hover:bg-gold/90 shadow-lg shadow-gold/20 mt-2"
                      onClick={() => navigate(`/tournaments/${nextTournament.id}`)}
                    >
                      {t("hero.joinNow")}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                  
                  {nextTournament.club?.logo_url ? (
                    <img 
                      src={nextTournament.club.logo_url} 
                      alt={nextTournament.club.name}
                      className="w-16 h-16 rounded-xl object-cover ml-4 ring-2 ring-gold/30 shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center ml-4 ring-2 ring-gold/30">
                      <Trophy className="w-8 h-8 text-gold" />
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold text-gold tracking-wider uppercase mb-2">
                    {t("hero.upcomingTournament")}
                  </p>
                  <h3 className="text-xl font-bold mb-2">
                    {t("tournaments.noUpcoming")}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t("hero.tournamentDesc")}
                  </p>
                  <Button variant="outline" size="sm" className="font-bold" onClick={handleJoinTournament}>
                    {t("nav.tournaments")}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              )}
            </Card>

            {/* Video Card */}
            <Card 
              className="p-6 border border-border bg-card/90 backdrop-blur-sm hover:shadow-hover hover:scale-105 transition-all duration-300 cursor-pointer group"
              onClick={() => {
                // Open video player or navigate to highlights page
                alert("Video highlights would open here. This could link to YouTube or a custom video player.");
              }}
            >
              <div className="relative rounded-lg overflow-hidden mb-4 aspect-video bg-muted">
                <div className="absolute inset-0 bg-gradient-to-tr from-background/80 to-transparent flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-gold/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 text-background fill-background ml-1" />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-2">
                  {t("hero.highlights")}
                </p>
                <h3 className="text-lg font-bold mb-2">{t("hero.topShots")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("hero.topShotsDesc")}
                </p>
              </div>
            </Card>

            {/* Recent Winner Card */}
            <Card className="p-6 border border-border bg-card/90 backdrop-blur-sm hover:shadow-hover hover:scale-105 transition-all duration-300 cursor-pointer">
              <p className="text-xs font-bold text-gold tracking-wider uppercase mb-2">
                {t("hero.latestNews")}
              </p>
              {recentWinnerLoading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-muted animate-pulse rounded" />
                  <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
                  <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                </div>
              ) : recentWinnerError || !recentWinner ? (
                <>
                  <h3 className="text-lg font-bold mb-2">
                    {t("hero.championshipRules")}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t("hero.rulesDesc")}
                  </p>
                  <button 
                    className="text-sm font-bold text-gold hover:underline flex items-center"
                    onClick={() => {
                      // Create a modal or navigate to rules page
                      alert(t("hero.rulesDesc") || "Tournament rules and regulations will be displayed here.");
                    }}
                  >
                    {t("hero.readMore")}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold mb-2">
                    🏆 {recentWinner.winner ? getDisplayName(recentWinner.winner.display_name, recentWinner.winner.username) : 'Champion'} Wins!
                  </h3>
                  <p className="text-sm text-muted-foreground mb-1">
                    {recentWinner.title}
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                  </p>
                  <div className="text-sm font-bold text-gold flex items-center">
                    Champion
                    <Trophy className="ml-2 w-4 h-4" />
                  </div>
                </>
              )}
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="flex flex-col items-center">
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
            {t("hero.scrollExplore")}
          </p>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 border-2 border-border rounded-full flex justify-center p-2"
          >
            <div className="w-1 h-3 bg-gold rounded-full" />
          </motion.div>
        </div>
      </motion.div>
      
      <AppDownloadModal />
    </section>
  );
};

export default HeroSection;
