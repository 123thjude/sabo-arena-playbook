import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface NewsArticle {
  id: string;
  title: string;
  title_en: string | null;
  slug: string;
  excerpt: string;
  excerpt_en: string | null;
  category: string;
  cover_image_url: string | null;
  published_at: string;
  views: number;
  is_featured: boolean;
}

export default function Blog() {
  const { language } = useLanguage();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { data: articles, isLoading } = useQuery({
    queryKey: ['blog-articles', categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from('news')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as NewsArticle[];
    }
  });

  const categories = [
    { value: 'all', label: language === 'vi' ? 'Tất cả' : 'All' },
    { value: 'guide', label: language === 'vi' ? 'Hướng dẫn' : 'Guides' },
    { value: 'news', label: language === 'vi' ? 'Tin tức' : 'News' },
    { value: 'tournament', label: language === 'vi' ? 'Giải đấu' : 'Tournaments' },
    { value: 'player', label: language === 'vi' ? 'Cầu thủ' : 'Players' }
  ];

  const title = language === 'vi' 
    ? 'Blog - SABO ARENA | Tin tức & Hướng dẫn Bi-a'
    : 'Blog - SABO ARENA | Billiards News & Guides';
    
  const description = language === 'vi'
    ? 'Khám phá tin tức mới nhất, hướng dẫn chơi bi-a, phân tích giải đấu và bí quyết nâng cao ELO từ SABO ARENA - nền tảng thi đấu bi-a #1 Việt Nam.'
    : 'Discover the latest billiards news, playing guides, tournament analysis and ELO improvement tips from SABO ARENA - Vietnam\'s #1 billiards platform.';

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://saboarena.com/blog" />
        <link rel="canonical" href="https://saboarena.com/blog" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              {language === 'vi' ? '📝 Blog SABO ARENA' : '📝 SABO ARENA Blog'}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {language === 'vi' 
                ? 'Tin tức, hướng dẫn và bí quyết bi-a từ chuyên gia'
                : 'Billiards news, guides and expert tips'}
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <Badge
                key={cat.value}
                variant={categoryFilter === cat.value ? 'default' : 'outline'}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setCategoryFilter(cat.value)}
              >
                {cat.label}
              </Badge>
            ))}
          </div>

          {/* Articles Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <Skeleton className="h-48 w-full" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : articles && articles.length > 0 ? (
            <>
              {/* Featured Article */}
              {articles[0]?.is_featured && (
                <Link to={`/news/${articles[0].slug}`} className="block mb-8">
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="relative h-64 md:h-auto overflow-hidden">
                        <img
                          src={articles[0].cover_image_url || 'https://images.unsplash.com/photo-1511688878353-3a2f5be94cd7?w=800&fit=crop&q=80'}
                          alt={language === 'vi' ? articles[0].title : articles[0].title_en || articles[0].title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                        <Badge className="absolute top-4 left-4 bg-primary">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {language === 'vi' ? 'Nổi bật' : 'Featured'}
                        </Badge>
                      </div>
                      <CardContent className="p-6 flex flex-col justify-center">
                        <Badge variant="secondary" className="w-fit mb-3">
                          {articles[0].category}
                        </Badge>
                        <h2 className="text-2xl md:text-3xl font-bold mb-3 hover:text-primary transition-colors">
                          {language === 'vi' ? articles[0].title : articles[0].title_en || articles[0].title}
                        </h2>
                        <p className="text-muted-foreground mb-4 line-clamp-3">
                          {language === 'vi' ? articles[0].excerpt : articles[0].excerpt_en || articles[0].excerpt}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(articles[0].published_at).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {Math.ceil(articles[0].excerpt.length / 200)} min
                          </span>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              )}

              {/* Other Articles */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.slice(articles[0]?.is_featured ? 1 : 0).map((article) => (
                  <Link key={article.id} to={`/news/${article.slug}`}>
                    <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={article.cover_image_url || 'https://images.unsplash.com/photo-1511688878353-3a2f5be94cd7?w=400&fit=crop&q=80'}
                          alt={language === 'vi' ? article.title : article.title_en || article.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <CardHeader>
                        <Badge variant="secondary" className="w-fit mb-2">
                          {article.category}
                        </Badge>
                        <CardTitle className="line-clamp-2 hover:text-primary transition-colors">
                          {language === 'vi' ? article.title : article.title_en || article.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {language === 'vi' ? article.excerpt : article.excerpt_en || article.excerpt}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(article.published_at).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {Math.ceil(article.excerpt.length / 200)} min
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                {language === 'vi' ? 'Chưa có bài viết nào' : 'No articles yet'}
              </p>
            </div>
          )}

          {/* Internal Links Section - SEO */}
          <div className="mt-16 pt-8 border-t border-border">
            <h2 className="text-xl font-bold text-center mb-6">
              {language === 'vi' ? '🎱 Khám Phá Thêm' : '🎱 Explore More'}
            </h2>
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              <Link to="/rankings" className="px-4 py-2 rounded-full bg-muted hover:bg-gold/20 transition-colors flex items-center gap-2">
                🏆 {language === 'vi' ? 'Bảng Xếp Hạng ELO' : 'ELO Rankings'}
              </Link>
              <Link to="/clubs" className="px-4 py-2 rounded-full bg-muted hover:bg-gold/20 transition-colors flex items-center gap-2">
                🏠 {language === 'vi' ? 'Tìm CLB Bi-a' : 'Find Clubs'}
              </Link>
              <Link to="/live-matches" className="px-4 py-2 rounded-full bg-muted hover:bg-gold/20 transition-colors flex items-center gap-2">
                📺 {language === 'vi' ? 'Xem Trận Đấu Live' : 'Watch Live'}
              </Link>
              <Link to="/" className="px-4 py-2 rounded-full bg-muted hover:bg-gold/20 transition-colors flex items-center gap-2">
                🏠 {language === 'vi' ? 'Trang Chủ' : 'Home'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
