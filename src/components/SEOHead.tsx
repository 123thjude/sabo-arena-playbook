import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article';
  keywords?: string[];
  noIndex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  locale?: string;
  alternateLocale?: string;
  children?: React.ReactNode;
}

/**
 * SEO Head Component - Reusable meta tags for all pages
 * Optimized for Google, Facebook, Twitter
 */
export default function SEOHead({
  title,
  description,
  canonical,
  image = 'https://saboarena.com/og-image.jpg',
  type = 'website',
  keywords = [],
  noIndex = false,
  publishedTime,
  modifiedTime,
  author = 'SABO ARENA Team',
  section,
  locale = 'vi_VN',
  alternateLocale = 'en_US',
  children
}: SEOHeadProps) {
  const siteName = 'SABO ARENA';
  const twitterHandle = '@SABOArena';
  const fullTitle = title.includes('SABO') ? title : `${title} | SABO ARENA`;
  
  // Default keywords for billiards
  const defaultKeywords = [
    'SABO ARENA',
    'bi-a',
    'billiards',
    'bida',
    'giải đấu bi-a',
    'thi đấu bida',
    'ELO bida',
    'xếp hạng bi-a',
    'pool',
    'snooker',
    'carom',
    'bida Việt Nam'
  ];
  
  const allKeywords = [...new Set([...defaultKeywords, ...keywords])];
  
  // Generate WebSite Schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": siteName,
    "url": "https://saboarena.com",
    "description": "Nền tảng thi đấu bi-a chuyên nghiệp #1 Việt Nam",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://saboarena.com/rankings?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };
  
  // Generate Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": siteName,
    "url": "https://saboarena.com",
    "logo": "https://saboarena.com/favicon.png",
    "sameAs": [
      "https://facebook.com/saboarena",
      "https://twitter.com/SABOArena",
      "https://youtube.com/@saboarena"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+84-xxx-xxx-xxx",
      "contactType": "customer service",
      "availableLanguage": ["Vietnamese", "English"]
    }
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={allKeywords.join(', ')} />
      <meta name="author" content={author} />
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'} />
      <meta name="language" content={locale === 'vi_VN' ? 'Vietnamese' : 'English'} />
      <meta name="revisit-after" content="1 days" />
      <meta name="rating" content="general" />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Alternate Language */}
      {canonical && (
        <>
          <link rel="alternate" hrefLang="vi" href={canonical} />
          <link rel="alternate" hrefLang="en" href={canonical.replace('saboarena.com', 'saboarena.com/en')} />
          <link rel="alternate" hrefLang="x-default" href={canonical} />
        </>
      )}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      <meta property="og:locale:alternate" content={alternateLocale} />
      
      {/* Article specific */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}
      {type === 'article' && section && (
        <meta property="article:section" content={section} />
      )}
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonical} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      <meta name="twitter:site" content={twitterHandle} />
      <meta name="twitter:creator" content={twitterHandle} />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      
      {/* Additional elements */}
      {children}
    </Helmet>
  );
}

// Pre-configured SEO for common pages
export const SEO_PAGES = {
  home: {
    title: 'SABO ARENA - Nền Tảng Thi Đấu Bi-a Chuyên Nghiệp #1 Việt Nam',
    description: 'Tham gia SABO ARENA - nền tảng thi đấu bi-a trực tuyến lớn nhất Việt Nam. Xếp hạng ELO, giải đấu hàng tuần, cộng đồng bi-a sôi động. Tải app miễn phí ngay!',
    canonical: 'https://saboarena.com',
    keywords: ['thi đấu bi-a online', 'app bi-a', 'giải bi-a Việt Nam', 'ELO bi-a', 'xếp hạng bida']
  },
  rankings: {
    title: 'Bảng Xếp Hạng Bi-a ELO - Top Cơ Thủ Việt Nam 2025',
    description: 'Xem bảng xếp hạng ELO bi-a real-time. Top 100 cơ thủ bi-a giỏi nhất Việt Nam, thống kê chi tiết, lịch sử đấu. Cập nhật liên tục!',
    canonical: 'https://saboarena.com/rankings',
    keywords: ['xếp hạng bida', 'ELO bida', 'top cơ thủ', 'bảng xếp hạng bi-a', 'ranking pool']
  },
  clubs: {
    title: 'Danh Sách Câu Lạc Bộ Bi-a Việt Nam - Tìm CLB Gần Bạn',
    description: 'Tìm câu lạc bộ bi-a gần bạn trên SABO ARENA. Đánh giá, địa chỉ, số bàn, giá cả. Hơn 500 CLB bi-a trên toàn quốc!',
    canonical: 'https://saboarena.com/clubs',
    keywords: ['CLB bi-a', 'câu lạc bộ bida', 'quán bi-a', 'địa điểm bi-a', 'phòng bi-a gần tôi']
  },
  liveMatches: {
    title: 'Trực Tiếp Trận Đấu Bi-a - Live Match SABO ARENA',
    description: 'Xem trực tiếp các trận đấu bi-a đang diễn ra. Điểm số real-time, bình luận trực tiếp, thống kê chi tiết từ SABO ARENA.',
    canonical: 'https://saboarena.com/live-matches',
    keywords: ['bi-a trực tiếp', 'live bi-a', 'xem bi-a online', 'trận đấu bi-a', 'stream bida']
  },
  blog: {
    title: 'Blog Bi-a - Tin Tức, Hướng Dẫn & Mẹo Chơi Bi-a',
    description: 'Khám phá blog bi-a SABO ARENA. Hướng dẫn kỹ thuật, luật chơi, mẹo nâng cao ELO, tin tức giải đấu. Cập nhật hàng tuần!',
    canonical: 'https://saboarena.com/blog',
    keywords: ['blog bi-a', 'hướng dẫn bida', 'kỹ thuật bi-a', 'mẹo chơi bi-a', 'học bi-a']
  }
};
