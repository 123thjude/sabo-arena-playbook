import { useState } from "react";
import { Menu, X, Languages, User, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import AuthModal from "@/components/AuthModal";
import { PremiumStoreButtons } from "@/components/PremiumStoreButtons";
import saboLogo from "@/assets/sabo-logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { user, signOut } = useAuth();
  const location = useLocation();

  const handleNavClick = (href: string) => {
    if (href.startsWith("#")) {
      // Nếu là hash link và đang ở trang chủ
      if (location.pathname === "/") {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
          setIsMenuOpen(false);
        }
      } else {
        // Nếu không ở trang chủ, chuyển về trang chủ với hash
        window.location.href = "/" + href;
      }
    }
  };

  const navItems = [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.tournaments"), href: "#tournaments" },
    { label: t("nav.rankings"), href: "/rankings" },
    { label: "Live Matches", href: "/live-matches" },
    { label: t("nav.players"), href: "#players" },
    { label: t("nav.clubs"), href: "/clubs" },
    { label: t("nav.news"), href: "#news" },
  ];

  if (user) {
    navItems.splice(2, 0, { label: "Tạo Giải Đấu", href: "/create-tournament" });
  }

  const renderNavItem = (item: { label: string; href: string; external?: boolean }) => {
    // External link (opens in new tab or same tab for /docs)
    if (item.external) {
      return (
        <a
          key={item.label}
          href={item.href}
          className="text-sm font-semibold text-muted-foreground hover:text-gold transition-colors relative group"
        >
          {item.label}
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
        </a>
      );
    }
    // Internal router link
    if (item.href.startsWith("/") && !item.href.startsWith("/#")) {
      return (
        <Link
          key={item.label}
          to={item.href}
          className="text-sm font-semibold text-muted-foreground hover:text-gold transition-colors relative group"
        >
          {item.label}
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
        </Link>
      );
    }
    // Hash link
    return (
      <a
        key={item.label}
        href={item.href}
        onClick={(e) => {
          if (item.href.startsWith("#")) {
            e.preventDefault();
            handleNavClick(item.href);
          }
        }}
        className="text-sm font-semibold text-muted-foreground hover:text-gold transition-colors relative group cursor-pointer"
      >
        {item.label}
        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
      </a>
    );
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Hamburger Menu */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-muted rounded-lg transition-colors lg:hidden"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {navItems.map((item) => renderNavItem(item))}
            </div>

            {/* Logo */}
            <div className="flex items-center">
              <img 
                src={saboLogo} 
                alt="SABO Arena" 
                className="h-8 w-auto"
              />
            </div>

            {/* Language Switcher & Auth */}
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Languages className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 text-xs font-bold text-gold">
                      {language.toUpperCase()}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border z-[100]">
                  <DropdownMenuItem
                    onClick={() => setLanguage("vi")}
                    className={`cursor-pointer ${
                      language === "vi" ? "bg-muted text-gold font-bold" : ""
                    }`}
                  >
                    <span className="mr-2">🇻🇳</span>
                    Tiếng Việt
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setLanguage("en")}
                    className={`cursor-pointer ${
                      language === "en" ? "bg-muted text-gold font-bold" : ""
                    }`}
                  >
                    <span className="mr-2">🇬🇧</span>
                    English
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name || user.email} />
                        <AvatarFallback className="bg-gold/20 text-gold">
                          {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5 text-sm font-medium text-foreground">
                      {user.user_metadata?.full_name || user.email}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile">{t("nav.profile")}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/club-manager">Quản lý CLB</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      {t("auth.signOut")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => setShowAuthModal(true)}>
                    {t("auth.signIn")}
                  </Button>
                  <Button variant="default" onClick={() => setShowAuthModal(true)} className="hidden lg:inline-flex">
                    {t("auth.signUp")}
                  </Button>
                </>
              )}
            </div>
            <div className="lg:hidden w-10" /> {/* Spacer for mobile */}
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed top-16 left-0 bottom-0 w-80 bg-card border-r border-border z-40 lg:hidden overflow-y-auto"
          >
            <div className="p-6 space-y-4">
              {navItems.map((item) => (
                item.external ? (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="block text-lg font-semibold text-foreground hover:text-gold transition-colors py-3 border-b border-border"
                  >
                    {item.label}
                  </a>
                ) : item.href.startsWith("/") && !item.href.startsWith("/#") ? (
                  <Link
                    key={item.label}
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="block text-lg font-semibold text-foreground hover:text-gold transition-colors py-3 border-b border-border"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={(e) => {
                      if (item.href.startsWith("#")) {
                        e.preventDefault();
                        handleNavClick(item.href);
                      } else {
                        setIsMenuOpen(false);
                      }
                    }}
                    className="block text-lg font-semibold text-foreground hover:text-gold transition-colors py-3 border-b border-border cursor-pointer"
                  >
                    {item.label}
                  </a>
                )
              ))}
              
              {/* Mobile Language Switcher */}
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3 uppercase tracking-wider">
                  {language === "vi" ? "Ngôn ngữ" : "Language"}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant={language === "vi" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setLanguage("vi")}
                  >
                    🇻🇳 Tiếng Việt
                  </Button>
                  <Button
                    variant={language === "en" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setLanguage("en")}
                  >
                    🇬🇧 English
                  </Button>
                </div>
              </div>
              
              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-3 uppercase tracking-wider">
                  {t("app.getTheApp")}
                </p>
                <PremiumStoreButtons
                  size="sm"
                  layout="vertical"
                  className="w-full"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab="login"
      />
    </>
  );
};

export default Navigation;
