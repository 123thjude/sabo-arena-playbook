import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Mail, Phone, MapPin, Globe, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import saboLogo from "@/assets/sabo-logo.png";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-900 text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="flex items-center space-x-3">
              <img src={saboLogo} alt="SABO Arena" className="w-10 h-10" />
              <h3 className="text-xl font-bold">SABO Arena</h3>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              {t("footer.description")}
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com/saboarena" target="_blank" rel="noopener noreferrer" title="Facebook" className="text-slate-400 hover:text-gold transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="https://instagram.com/saboarena" target="_blank" rel="noopener noreferrer" title="Instagram" className="text-slate-400 hover:text-gold transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.73-3.016-1.806C4.956 14.65 4.695 14.017 4.695 13.017c0-2.209 1.791-4 4-4s4 1.791 4 4-1.791 4-4 4zm7.024 0c-1.297 0-2.448-.73-3.016-1.806-.477-.532-.738-1.165-.738-2.165 0-2.209 1.791-4 4-4s4 1.791 4 4-1.791 4-4 4z"/>
                </svg>
              </a>
              <a href="https://youtube.com/@saboarena" target="_blank" rel="noopener noreferrer" title="YouTube" className="text-slate-400 hover:text-gold transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a href="https://twitter.com/saboarena" target="_blank" rel="noopener noreferrer" title="Twitter" className="text-slate-400 hover:text-gold transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h4 className="text-lg font-semibold">{t("footer.quickLinks")}</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-slate-400 hover:text-gold transition-colors text-sm">{t("nav.home")}</Link></li>
              <li><Link to="/rankings" className="text-slate-400 hover:text-gold transition-colors text-sm">{t("nav.tournaments")}</Link></li>
              <li><Link to="/rankings" className="text-slate-400 hover:text-gold transition-colors text-sm">{t("nav.rankings")}</Link></li>
              <li><Link to="/clubs" className="text-slate-400 hover:text-gold transition-colors text-sm">{t("nav.clubs")}</Link></li>
              <li><Link to="/live-matches" className="text-slate-400 hover:text-gold transition-colors text-sm">{t("footer.liveMatches")}</Link></li>
              <li><a href="https://sabo-arena-docs.vercel.app" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-gold transition-colors text-sm">{t("nav.docs")}</a></li>
            </ul>
          </motion.div>

          {/* Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h4 className="text-lg font-semibold">{t("footer.support")}</h4>
            <ul className="space-y-2">
              <li><Link to="/privacy-policy" className="text-slate-400 hover:text-gold transition-colors text-sm">{t("footer.privacy")}</Link></li>
              <li><Link to="/terms-of-service" className="text-slate-400 hover:text-gold transition-colors text-sm">{t("footer.terms")}</Link></li>
              <li><Link to="/delete-account" className="text-slate-400 hover:text-gold transition-colors text-sm">{t("footer.deleteAccount")}</Link></li>
              <li><a href="mailto:support@saboarena.com" className="text-slate-400 hover:text-gold transition-colors text-sm">{t("footer.contactUs")}</a></li>
              <li><button className="text-slate-400 hover:text-gold transition-colors text-sm" onClick={() => alert('FAQ page coming soon!')}>{t("footer.faq")}</button></li>
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <h4 className="text-lg font-semibold">{t("footer.contact")}</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-gold" />
                <a href="mailto:support@saboarena.com" className="text-slate-400 hover:text-gold transition-colors text-sm">
                  support@saboarena.com
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-gold" />
                <a href="tel:0329640232" className="text-slate-400 hover:text-gold transition-colors text-sm">
                  0329 640 232
                </a>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-gold mt-1" />
                <span className="text-slate-400 text-sm leading-relaxed">
                  {t("footer.address")}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-slate-400 text-sm text-center md:text-left">
              © {new Date().getFullYear()} SABO Arena. {t("footer.allRightsReserved")}
            </div>
            <div className="text-slate-400 text-sm text-center md:text-right">
              {t("footer.madeWith")} ❤️ {t("footer.forBilliardCommunity")}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;