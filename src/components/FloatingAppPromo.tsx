import { useState } from "react";
import { X, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { AppStoreButton, GooglePlayButton } from "./PremiumStoreButtons";

export const FloatingAppPromo = () => {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(true);
  
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.8 }}
        className="fixed bottom-24 right-6 z-40 max-w-sm"
      >
        <div className="bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-gold/20 to-gold/10 p-4 relative">
            <button
              onClick={() => setIsVisible(false)}
              title="Đóng"
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/20 flex items-center justify-center hover:bg-black/40 transition-colors"
            >
              <X className="w-3 h-3 text-white" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gold to-gold/80 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-black" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">{t("app.getTheApp")}</h4>
                <p className="text-xs text-muted-foreground">{t("app.betterExperience")}</p>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-4">
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-gold">✓</span> {t("app.feature1")}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-gold">✓</span> {t("app.feature2")}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-gold">✓</span> {t("app.feature3")}
              </div>
            </div>
            
            <div className="space-y-2">
              <AppStoreButton size="sm" className="w-full" />
              <GooglePlayButton size="sm" className="w-full" />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};