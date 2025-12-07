import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNewsDetail } from "@/hooks/useNews";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Eye, ArrowLeft, Share2, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

const NewsDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const { data: article, isLoading } = useNewsDetail(slug || "");

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "tournament": "bg-gold/20 text-gold border-gold/30",
      "players": "bg-blue-500/20 text-blue-400 border-blue-500/30",
      "guide": "bg-green-500/20 text-green-400 border-green-500/30",
      "club": "bg-purple-500/20 text-purple-400 border-purple-500/30",
      "interview": "bg-pink-500/20 text-pink-400 border-pink-500/30",
      "regulation": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    };
    return colors[category.toLowerCase()] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, { vi: string; en: string }> = {
      "tournament": { vi: "Giải đấu", en: "Tournament" },
      "players": { vi: "Cơ Thủ", en: "Players" },
      "guide": { vi: "Hướng Dẫn", en: "Guide" },
      "club": { vi: "Câu Lạc Bộ", en: "Club" },
      "interview": { vi: "Phỏng Vấn", en: "Interview" },
      "regulation": { vi: "Quy Định", en: "Regulation" },
    };
    return language === "vi" 
      ? names[category.toLowerCase()]?.vi || category 
      : names[category.toLowerCase()]?.en || category;
  };

  const handleShare = () => {
    if (navigator.share && article) {
      navigator.share({
        title: language === "vi" ? article.title : (article.title_en || article.title),
        text: language === "vi" ? article.excerpt : (article.excerpt_en || article.excerpt),
        url: window.location.href,
      });
    }
  };

  if (isLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-background pt-20">
          <div className="container mx-auto px-4 py-12 max-w-4xl">
            <Skeleton className="h-8 w-32 mb-8" />
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-6 w-full mb-6" />
            <Skeleton className="h-96 w-full mb-8" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!article) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
          <Card className="max-w-md p-12 text-center">
            <h1 className="text-2xl font-bold mb-4">
              {language === "vi" ? "Không tìm thấy bài viết" : "Article not found"}
            </h1>
            <p className="text-muted-foreground mb-6">
              {language === "vi" 
                ? "Bài viết bạn tìm kiếm không tồn tại hoặc đã bị xóa" 
                : "The article you are looking for does not exist or has been deleted"}
            </p>
            <Link to="/">
              <Button className="bg-gold text-black hover:bg-gold/90">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {language === "vi" ? "Về trang chủ" : "Back to home"}
              </Button>
            </Link>
          </Card>
        </div>
        <Footer />
      </>
    );
  }

  const title = language === "vi" ? article.title : (article.title_en || article.title);
  const content = language === "vi" ? article.content : (article.content_en || article.content);
  const excerpt = language === "vi" ? article.excerpt : (article.excerpt_en || article.excerpt);
  const canonicalUrl = `https://saboarena.com/news/${article.slug}`;
  const imageUrl = article.cover_image_url || "https://saboarena.com/favicon.png";

  return (
    <>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>{title} | SABO ARENA - Nền Tảng Bi-a #1 Việt Nam</title>
        <meta name="title" content={`${title} | SABO ARENA`} />
        <meta name="description" content={excerpt} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={excerpt} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:site_name" content="SABO ARENA" />
        <meta property="article:published_time" content={article.published_at} />
        <meta property="article:section" content={getCategoryName(article.category)} />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={canonicalUrl} />
        <meta property="twitter:title" content={title} />
        <meta property="twitter:description" content={excerpt} />
        <meta property="twitter:image" content={imageUrl} />
        <meta name="twitter:site" content="@SABOArena" />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <meta name="language" content={language === "vi" ? "Vietnamese" : "English"} />
        <meta name="author" content="SABO ARENA Team" />
        <meta name="keywords" content={`bi-a, billiards, sabo arena, ${getCategoryName(article.category).toLowerCase()}, giải đấu bi-a, thi đấu bi-a`} />
        
        {/* Structured Data - Article Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": title,
            "description": excerpt,
            "image": imageUrl,
            "datePublished": article.published_at,
            "dateModified": article.updated_at,
            "author": {
              "@type": "Organization",
              "name": "SABO ARENA",
              "url": "https://saboarena.com"
            },
            "publisher": {
              "@type": "Organization",
              "name": "SABO ARENA",
              "logo": {
                "@type": "ImageObject",
                "url": "https://saboarena.com/favicon.png"
              }
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": canonicalUrl
            }
          })}
        </script>
      </Helmet>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-background to-slate-900 pt-20">
        <article className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Link to="/#news">
              <Button variant="ghost" className="hover:text-gold">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {language === "vi" ? "Quay lại" : "Back"}
              </Button>
            </Link>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Badge className={`${getCategoryColor(article.category)} border mb-4`}>
              {getCategoryName(article.category)}
            </Badge>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(article.published_at).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{article.views.toLocaleString()} {language === "vi" ? "lượt xem" : "views"}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="hover:text-gold"
              >
                <Share2 className="w-4 h-4 mr-2" />
                {language === "vi" ? "Chia sẻ" : "Share"}
              </Button>
            </div>
          </motion.div>

          {/* Featured Image */}
          {article.cover_image_url && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-12"
            >
              <img
                src={article.cover_image_url}
                alt={title}
                className="w-full h-auto rounded-lg shadow-2xl"
              />
            </motion.div>
          )}

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="prose prose-invert prose-lg max-w-none mb-12"
          >
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-3xl font-bold text-gold mb-4">{children}</h1>,
                h2: ({ children }) => <h2 className="text-2xl font-bold text-white mb-3 mt-8">{children}</h2>,
                h3: ({ children }) => <h3 className="text-xl font-bold text-white mb-2 mt-6">{children}</h3>,
                p: ({ children }) => <p className="text-slate-300 mb-4 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-4 text-slate-300 space-y-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-4 text-slate-300 space-y-2">{children}</ol>,
                li: ({ children }) => <li className="ml-4">{children}</li>,
                a: ({ children, href }) => <a href={href} className="text-gold hover:text-gold/80 underline">{children}</a>,
                blockquote: ({ children }) => <blockquote className="border-l-4 border-gold pl-4 italic text-slate-400 my-4">{children}</blockquote>,
              }}
            >
              {content}
            </ReactMarkdown>
          </motion.div>

          {/* Author Info (if available) */}
          {article.author_id && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-gold/20 bg-slate-800/50 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                    <User className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">
                      {language === "vi" ? "Tác giả" : "Author"}
                    </p>
                    <p className="font-semibold text-white">SABO Arena Team</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Internal Links - Related Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 pt-8 border-t border-slate-700"
          >
            <h3 className="text-xl font-bold text-white mb-6">
              {language === "vi" ? "📚 Bài Viết Liên Quan" : "📚 Related Articles"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link 
                to="/news/huong-dan-choi-bida-cho-nguoi-moi-2025" 
                className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-gold/50 transition-colors"
              >
                <h4 className="font-semibold text-white hover:text-gold transition-colors">
                  Hướng dẫn chơi bida cho người mới
                </h4>
                <p className="text-sm text-slate-400 mt-1">Kiến thức cơ bản cho người mới bắt đầu</p>
              </Link>
              <Link 
                to="/news/luat-choi-bida-8-bi-chi-tiet-2025" 
                className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-gold/50 transition-colors"
              >
                <h4 className="font-semibold text-white hover:text-gold transition-colors">
                  Luật chơi bida 8 bi chi tiết
                </h4>
                <p className="text-sm text-slate-400 mt-1">Quy định chính thức cho bida 8 bi</p>
              </Link>
              <Link 
                to="/news/ky-thuat-cam-co-bida-dung-cach-2025" 
                className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-gold/50 transition-colors"
              >
                <h4 className="font-semibold text-white hover:text-gold transition-colors">
                  Kỹ thuật cầm cơ bida đúng cách
                </h4>
                <p className="text-sm text-slate-400 mt-1">Nâng cao kỹ năng cầm cơ</p>
              </Link>
              <Link 
                to="/news/tips-leo-elo-bida-nhanh-chong-2025" 
                className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-gold/50 transition-colors"
              >
                <h4 className="font-semibold text-white hover:text-gold transition-colors">
                  10 Tips leo ELO bida nhanh chóng
                </h4>
                <p className="text-sm text-slate-400 mt-1">Bí quyết tăng rank hiệu quả</p>
              </Link>
            </div>

            {/* Quick Links */}
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Link to="/rankings" className="px-4 py-2 rounded-full bg-gold/10 text-gold hover:bg-gold/20 transition-colors text-sm font-medium">
                🏆 Xem Bảng Xếp Hạng
              </Link>
              <Link to="/clubs" className="px-4 py-2 rounded-full bg-gold/10 text-gold hover:bg-gold/20 transition-colors text-sm font-medium">
                🏠 Tìm CLB Bi-a
              </Link>
              <Link to="/blog" className="px-4 py-2 rounded-full bg-gold/10 text-gold hover:bg-gold/20 transition-colors text-sm font-medium">
                📖 Xem Tất Cả Bài Viết
              </Link>
            </div>
          </motion.div>
        </article>
      </div>
      <Footer />
    </>
  );
};

export default NewsDetail;
