import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppDownloadModalProvider } from "@/contexts/AppDownloadModalContext";
import { FloatingAppPromo } from "@/components/FloatingAppPromo";
import { ChatWidget } from "@/components/ChatWidget";
import Index from "./pages/Index";
import Rankings from "./pages/Rankings";
import TournamentDetails from "./pages/TournamentDetails";
import ClubDirectory from "./pages/ClubDirectory";
import MyProfile from "./pages/MyProfile";
import Blog from "./pages/Blog";
import NewsDetail from "./pages/NewsDetail";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import DeleteAccount from "./pages/DeleteAccount";
import UserProfile from "./pages/UserProfile";
import DeepLinkDemo from "./pages/DeepLinkDemo";
import LiveMatch from "./pages/LiveMatch";
import LiveMatchDemo from "./pages/LiveMatchDemo";
import LiveMatches from "./pages/LiveMatches";
import AINewsAdmin from "./pages/AINewsAdmin";
import AINewsAdminV2 from "./pages/AINewsAdminV2";
import NewsTest from "./pages/NewsTest";
import FullTournamentBracket from "./pages/FullTournamentBracket";
import DocsPortal from "./pages/DocsPortal";
import ImageAdmin from "./pages/ImageAdmin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppDownloadModalProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/rankings" element={<Rankings />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/tournaments/:id" element={<TournamentDetails />} />
                <Route path="/tournament/:id/full" element={<FullTournamentBracket />} />
                <Route path="/clubs" element={<ClubDirectory />} />
                <Route path="/profile" element={<MyProfile />} />
                <Route path="/news/:slug" element={<NewsDetail />} />
                <Route path="/ai-news-admin" element={<AINewsAdmin />} />
                <Route path="/ai-news-admin-v2" element={<AINewsAdminV2 />} />
                <Route path="/news-test" element={<NewsTest />} />
                <Route path="/image-admin" element={<ImageAdmin />} />
                <Route path="/user/:userId" element={<UserProfile />} />
                <Route path="/deeplink-demo" element={<DeepLinkDemo />} />
                <Route path="/live-matches" element={<LiveMatches />} />
                <Route path="/live-match-demo" element={<LiveMatchDemo />} />
                <Route path="/live-match/:id" element={<LiveMatch />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/delete-account" element={<DeleteAccount />} />
                <Route path="/docs" element={<DocsPortal />} />
                <Route path="/docs/:category/:slug" element={<DocsPortal />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              {/* Floating App Download Promo - only show on mobile */}
              <div className="lg:hidden">
                <FloatingAppPromo />
              </div>
              {/* AI Chat Widget */}
              <ChatWidget apiUrl={import.meta.env.VITE_CHATBOT_API_URL || "/api/chat"} />
            </BrowserRouter>
          </TooltipProvider>
        </AppDownloadModalProvider>
      </AuthProvider>
    </LanguageProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
