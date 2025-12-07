import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import FeaturedPlayers from "@/components/FeaturedPlayers";
import UpcomingTournaments from "@/components/UpcomingTournaments";
import News from "@/components/News";
import Footer from "@/components/Footer";
import { PremiumStoreButtons } from "@/components/PremiumStoreButtons";
import AppDownloadModal from "@/components/AppDownloadModal";
import { useLanguage } from "@/contexts/LanguageContext";
import { Download } from "lucide-react";
import SEOHead, { SEO_PAGES } from "@/components/SEOHead";
import { Link } from "react-router-dom";

const Index = () => {
  const { t, language } = useLanguage();
  
  // Dynamic SEO based on language
  const seo = language === 'vi' ? SEO_PAGES.home : {
    ...SEO_PAGES.home,
    title: 'SABO ARENA - #1 Professional Billiards Platform in Vietnam',
    description: 'Join SABO ARENA - Vietnam\'s largest online billiards competition platform. ELO rankings, weekly tournaments, vibrant community. Download the free app now!'
  };
  
  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title={seo.title}
        description={seo.description}
        canonical={seo.canonical}
        keywords={seo.keywords}
      />
      <Navigation />
      <main>
        <HeroSection />
        <div id="players">
          <FeaturedPlayers />
        </div>
        <div id="tournaments">
          <UpcomingTournaments />
        </div>
        <div id="news">
          <News />
        </div>
        <div className="container mx-auto px-4 py-12">
          <div className="bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/20 rounded-lg p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Download className="w-6 h-6 text-gold" />
              <h3 className="text-2xl font-bold">{t("app.downloadTitle")}</h3>
            </div>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              {t("app.downloadDescription")}
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 mb-6 max-w-md mx-auto">
              <li className="flex items-center gap-2">
                <span className="text-gold">✓</span> {t("app.feature1")}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gold">✓</span> {t("app.feature2")}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gold">✓</span> {t("app.feature3")}
              </li>
            </ul>
            <PremiumStoreButtons
              size="lg"
              layout="horizontal"
              className="justify-center max-w-md mx-auto"
            />
          </div>
        </div>

        {/* Internal Links Section - SEO Optimized */}
        <section className="container mx-auto px-4 py-12 border-t border-border/50">
          <h2 className="text-2xl font-bold text-center mb-8">
            {language === 'vi' ? '🎱 Khám Phá SABO ARENA' : '🎱 Explore SABO ARENA'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <Link 
              to="/rankings" 
              className="p-4 rounded-lg bg-card border border-border hover:border-gold/50 transition-colors text-center group"
            >
              <div className="text-3xl mb-2">🏆</div>
              <h3 className="font-semibold group-hover:text-gold transition-colors">
                {language === 'vi' ? 'Bảng Xếp Hạng' : 'Rankings'}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {language === 'vi' ? 'Top cơ thủ ELO' : 'Top ELO Players'}
              </p>
            </Link>
            <Link 
              to="/clubs" 
              className="p-4 rounded-lg bg-card border border-border hover:border-gold/50 transition-colors text-center group"
            >
              <div className="text-3xl mb-2">🏠</div>
              <h3 className="font-semibold group-hover:text-gold transition-colors">
                {language === 'vi' ? 'Câu Lạc Bộ' : 'Clubs'}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {language === 'vi' ? '500+ CLB toàn quốc' : '500+ nationwide'}
              </p>
            </Link>
            <Link 
              to="/live-matches" 
              className="p-4 rounded-lg bg-card border border-border hover:border-gold/50 transition-colors text-center group"
            >
              <div className="text-3xl mb-2">📺</div>
              <h3 className="font-semibold group-hover:text-gold transition-colors">
                {language === 'vi' ? 'Trực Tiếp' : 'Live Matches'}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {language === 'vi' ? 'Xem trận đấu live' : 'Watch live games'}
              </p>
            </Link>
            <Link 
              to="/blog" 
              className="p-4 rounded-lg bg-card border border-border hover:border-gold/50 transition-colors text-center group"
            >
              <div className="text-3xl mb-2">📚</div>
              <h3 className="font-semibold group-hover:text-gold transition-colors">
                {language === 'vi' ? 'Blog & Hướng Dẫn' : 'Blog & Guides'}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {language === 'vi' ? 'Học kỹ thuật bi-a' : 'Learn techniques'}
              </p>
            </Link>
          </div>
          
          {/* Popular Articles Links */}
          <div className="mt-8 max-w-4xl mx-auto">
            <h3 className="font-semibold text-center mb-4 text-muted-foreground">
              {language === 'vi' ? '📖 Bài Viết Phổ Biến' : '📖 Popular Articles'}
            </h3>
            <div className="flex flex-wrap justify-center gap-2 text-sm">
              <Link to="/news/huong-dan-choi-bida-cho-nguoi-moi-2025" className="px-3 py-1 rounded-full bg-muted hover:bg-gold/20 transition-colors">
                Hướng dẫn chơi bida
              </Link>
              <Link to="/news/luat-choi-bida-8-bi-chi-tiet-2025" className="px-3 py-1 rounded-full bg-muted hover:bg-gold/20 transition-colors">
                Luật bida 8 bi
              </Link>
              <Link to="/news/ky-thuat-cam-co-bida-dung-cach-2025" className="px-3 py-1 rounded-full bg-muted hover:bg-gold/20 transition-colors">
                Kỹ thuật cầm cơ
              </Link>
              <Link to="/news/he-thong-xep-hang-elo-bida-la-gi" className="px-3 py-1 rounded-full bg-muted hover:bg-gold/20 transition-colors">
                Hệ thống ELO
              </Link>
              <Link to="/news/tips-leo-elo-bida-nhanh-chong-2025" className="px-3 py-1 rounded-full bg-muted hover:bg-gold/20 transition-colors">
                Tips leo ELO
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <AppDownloadModal />
    </div>
  );
};

export default Index;
