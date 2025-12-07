#!/usr/bin/env node

/**
 * ====================================
 * 📝 PUBLISH ALL SEO ARTICLES TO DATABASE
 * ====================================
 * Tự động publish 8 bài viết SEO tiếng Việt lên SABO ARENA
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase credentials (using SERVICE_ROLE to bypass RLS)
const SUPABASE_URL = 'https://mogjjvscxjwvhtpkrlqr.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZ2pqdnNjeGp3dmh0cGtybHFyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzkxOTU4MCwiZXhwIjoyMDczNDk1NTgwfQ.T2ntQv-z2EL4mkGb9b3QyXM3dT8pAOFSPKvqWPd7Xoo';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Billiards stock images from Unsplash (verified working)
const coverImages = [
  'https://images.unsplash.com/photo-1511688878353-3a2f5be94cd7?w=1200&h=630&fit=crop&q=80', // Pool balls on table
  'https://images.unsplash.com/photo-1585185602488-bd3b7eb7e4e2?w=1200&h=630&fit=crop&q=80', // Pool cue closeup
  'https://images.unsplash.com/photo-1543351611-58f69d7c1781?w=1200&h=630&fit=crop&q=80', // Pool hall
  'https://images.unsplash.com/photo-1602197405689-4c20d32bb56e?w=1200&h=630&fit=crop&q=80', // Billiard balls
  'https://images.unsplash.com/photo-1513267048331-5611cad62e41?w=1200&h=630&fit=crop&q=80', // Pool game
  'https://images.unsplash.com/photo-1577741314755-048d8525d31e?w=1200&h=630&fit=crop&q=80', // Pool cue and balls
  'https://images.unsplash.com/photo-1519663254736-b95e8e10d707?w=1200&h=630&fit=crop&q=80', // Billiard table
  'https://images.unsplash.com/photo-1605914285443-9c06fa61f631?w=1200&h=630&fit=crop&q=80', // Pool hall atmosphere
];

// Articles configuration
const articles = [
  {
    file: '01-huong-dan-choi-bida-cho-nguoi-moi.md',
    slug: 'huong-dan-choi-bida-cho-nguoi-moi-2025',
    title_en: 'Beginner Guide to Playing Billiards: From A to Z (2025)',
    excerpt: 'Hướng dẫn chơi bi-a cho người mới bắt đầu từ A-Z. Học cách cầm cơ, tư thế đánh, luật 8-ball và 10 mẹo vàng từ cộng đồng SABO ARENA.',
    excerpt_en: 'Complete beginner guide to playing billiards. Learn grip, stance, 8-ball rules and 10 golden tips from the SABO ARENA community.',
    category: 'guide',
    is_featured: true,
  },
  {
    file: '02-luat-choi-bida-8-bi-chi-tiet.md',
    slug: 'luat-choi-bida-8-bi-chi-tiet-2025',
    title_en: 'Complete 8-Ball Billiards Rules Guide 2025: Basic to Advanced',
    excerpt: 'Luật chơi bi-a 8 bi (8-Ball) chi tiết nhất 2025 theo chuẩn WPA. Hướng dẫn đầy đủ về break, xác định phe, các lỗi phổ biến và luật bi số 8.',
    excerpt_en: 'Complete 8-Ball billiards rules guide following WPA standards. Covers break, team selection, common fouls and 8-ball regulations.',
    category: 'guide',
    is_featured: true,
  },
  {
    file: '03-ky-thuat-cam-co-bida-dung-cach.md',
    slug: 'ky-thuat-cam-co-bida-dung-cach-2025',
    title_en: 'Proper Billiards Cue Grip Technique: Pro Player Secrets (2025)',
    excerpt: 'Hướng dẫn kỹ thuật cầm cơ bi-a đúng cách từ các pro player. Học các loại bridge, cách cầm cơ, tư thế đứng và bài tập rèn luyện.',
    excerpt_en: 'Learn proper billiards cue grip technique from pro players. Master bridge types, grip, stance and training drills.',
    category: 'guide',
    is_featured: false,
  },
  {
    file: '04-he-thong-xep-hang-elo-bida-la-gi.md',
    slug: 'he-thong-xep-hang-elo-bida-la-gi',
    title_en: 'What is the Billiards ELO Ranking System? Easiest Explanation (2025)',
    excerpt: 'Giải thích hệ thống xếp hạng ELO bi-a một cách dễ hiểu nhất. Tìm hiểu cách tính ELO, 12 cấp độ xếp hạng tại SABO ARENA và mẹo leo rank.',
    excerpt_en: 'Simplest explanation of the billiards ELO ranking system. Learn how ELO is calculated, 12 rank tiers at SABO ARENA and rank climbing tips.',
    category: 'guide',
    is_featured: true,
  },
  {
    file: '05-huong-dan-tham-gia-giai-dau-sabo-arena.md',
    slug: 'huong-dan-tham-gia-giai-dau-sabo-arena',
    title_en: 'How to Join SABO ARENA Tournaments: From Registration to Competition',
    excerpt: 'Hướng dẫn chi tiết cách tham gia giải đấu bi-a tại SABO ARENA. Từ đăng ký tài khoản, tìm giải phù hợp, đến thi đấu và nhận ELO.',
    excerpt_en: 'Detailed guide on how to join SABO ARENA billiards tournaments. From account registration to finding matches and earning ELO.',
    category: 'guide',
    is_featured: true,
  },
  {
    file: '06-tips-leo-elo-bida-nhanh-chong.md',
    slug: 'tips-leo-elo-bida-nhanh-chong-2025',
    title_en: '10 Tips to Climb Billiards ELO Fast: SABO ARENA Community Secrets (2025)',
    excerpt: '10 tips leo ELO bi-a nhanh chóng từ cộng đồng SABO ARENA. Từ kỹ thuật cơ bản đến tâm lý thi đấu, tất cả những gì bạn cần để tăng rank.',
    excerpt_en: '10 tips to climb billiards ELO fast from the SABO ARENA community. From basic techniques to competition psychology.',
    category: 'guide',
    is_featured: false,
  },
  {
    file: '07-cau-lac-bo-bida-viet-nam.md',
    slug: 'cau-lac-bo-bida-viet-nam-2025',
    title_en: 'Vietnam Billiards Clubs: Complete Guide to Finding the Right Club (2025)',
    excerpt: 'Cẩm nang tìm kiếm câu lạc bộ bi-a phù hợp tại Việt Nam. Hướng dẫn đánh giá CLB, lợi ích khi tham gia và cách kết nối qua SABO ARENA.',
    excerpt_en: 'Complete guide to finding the right billiards club in Vietnam. Club evaluation tips, membership benefits and SABO ARENA connection.',
    category: 'guide',
    is_featured: false,
  },
  {
    file: '08-huong-dan-choi-bida-9-bi-chi-tiet.md',
    slug: 'huong-dan-choi-bida-9-bi-chi-tiet-2025',
    title_en: 'Complete 9-Ball Billiards Guide: Basic to Advanced (2025)',
    excerpt: 'Hướng dẫn chơi bi-a 9 bi (9-Ball) chi tiết từ cơ bản đến nâng cao. Luật chơi, cách xếp bi, chiến thuật và so sánh với 8-ball.',
    excerpt_en: 'Complete 9-Ball billiards guide from basic to advanced. Rules, rack setup, strategies and comparison with 8-ball.',
    category: 'guide',
    is_featured: false,
  },
  // ========== NEW SEO ARTICLES (09-18) ==========
  {
    file: '09-bida-phom-la-gi-luat-choi-chi-tiet.md',
    slug: 'bida-phom-la-gi-luat-choi-chi-tiet-2025',
    title_en: 'What is Pool Billiards (Bida Phỏm)? Complete Rules Guide 2025',
    excerpt: 'Bida phỏm là gì? Hướng dẫn luật chơi bida phỏm (pool billiards) chi tiết từ A-Z. Cách đánh, kỹ thuật và tips cho người mới.',
    excerpt_en: 'What is Pool Billiards? Complete rules guide from A-Z. Techniques and tips for beginners.',
    category: 'guide',
    is_featured: true,
  },
  {
    file: '10-bida-3-bang-carom-luat-choi-chi-tiet.md',
    slug: 'bida-3-bang-carom-luat-choi-chi-tiet-2025',
    title_en: '3-Cushion Billiards (Carom) Complete Rules Guide 2025',
    excerpt: 'Hướng dẫn luật chơi bida 3 băng (carom/three cushion) chi tiết. Cách tính điểm, kỹ thuật đánh và tips từ cao thủ Việt Nam.',
    excerpt_en: 'Complete 3-cushion billiards rules guide. Scoring, techniques and tips from Vietnamese pros.',
    category: 'guide',
    is_featured: true,
  },
  {
    file: '11-gia-ban-bida-2025-bang-gia-moi-nhat.md',
    slug: 'gia-ban-bida-2025-bang-gia-moi-nhat',
    title_en: 'Billiard Table Prices 2025 - Complete Price Guide Vietnam',
    excerpt: 'Bảng giá bàn bida 2025 mới nhất tại Việt Nam. So sánh các loại bàn pool, snooker, carom từ bình dân đến cao cấp.',
    excerpt_en: 'Complete billiard table price guide 2025 in Vietnam. Compare pool, snooker, carom tables from budget to premium.',
    category: 'guide',
    is_featured: true,
  },
  {
    file: '12-cach-danh-bida-xoay-ky-thuat-spin.md',
    slug: 'cach-danh-bida-xoay-ky-thuat-spin-2025',
    title_en: 'How to Apply Spin in Billiards - English/Draw Shot Tutorial 2025',
    excerpt: 'Hướng dẫn cách đánh bida xoáy (spin/english) chi tiết. Kỹ thuật top spin, draw, side spin và masse cho người chơi bida.',
    excerpt_en: 'Complete guide to spin shots in billiards. Top spin, draw, side spin and masse techniques.',
    category: 'guide',
    is_featured: true,
  },
  {
    file: '13-top-10-quan-bida-sai-gon-dep-nhat.md',
    slug: 'top-10-quan-bida-sai-gon-dep-nhat-2025',
    title_en: 'Top 10 Best Billiard Clubs in Ho Chi Minh City 2025',
    excerpt: 'Top 10 quán bida Sài Gòn đẹp nhất 2025. Địa chỉ, giá cả, review chi tiết các CLB billiard hàng đầu TP.HCM.',
    excerpt_en: 'Top 10 best billiard clubs in Ho Chi Minh City 2025. Addresses, prices and detailed reviews.',
    category: 'guide',
    is_featured: true,
  },
  {
    file: '14-cach-chon-co-bida-phu-hop-huong-dan-mua.md',
    slug: 'cach-chon-co-bida-phu-hop-huong-dan-mua-2025',
    title_en: 'How to Choose the Right Billiard Cue - Buying Guide 2025',
    excerpt: 'Hướng dẫn cách chọn cơ bida phù hợp từ A-Z. So sánh các loại cơ bi-a, thương hiệu nổi tiếng, mức giá và lưu ý khi mua.',
    excerpt_en: 'Complete guide to choosing the right billiard cue. Compare cue types, famous brands, prices and buying tips.',
    category: 'guide',
    is_featured: false,
  },
  {
    file: '15-top-10-quan-bida-ha-noi-dep-nhat-2025.md',
    slug: 'top-10-quan-bida-ha-noi-dep-nhat-2025',
    title_en: 'Top 10 Best Billiard Clubs in Hanoi 2025',
    excerpt: 'Top 10 quán bida Hà Nội đẹp nhất 2025. Địa chỉ CLB billiard thủ đô từ bình dân đến cao cấp.',
    excerpt_en: 'Top 10 best billiard clubs in Hanoi 2025. Club addresses from budget to premium.',
    category: 'guide',
    is_featured: true,
  },
  {
    file: '16-hoc-choi-bida-o-dau-trung-tam-day-bida.md',
    slug: 'hoc-choi-bida-o-dau-trung-tam-day-bida-2025',
    title_en: 'Where to Learn Billiards in Vietnam - Training Centers 2025',
    excerpt: 'Tổng hợp các trung tâm dạy chơi bida uy tín nhất 2025. Học bida từ cơ bản đến nâng cao, học phí và lộ trình chi tiết.',
    excerpt_en: 'Best billiards training centers in Vietnam 2025. Learning paths, fees and detailed curriculum.',
    category: 'guide',
    is_featured: false,
  },
  {
    file: '17-bida-online-la-gi-top-game-bi-a-hay-nhat.md',
    slug: 'bida-online-la-gi-top-game-bi-a-online-2025',
    title_en: 'What is Online Billiards? Top Billiard Games 2025',
    excerpt: 'Tìm hiểu bida online là gì? Top game bi-a online hay nhất 2025. So sánh 8 Ball Pool, Real Pool 3D và các game bida mobile.',
    excerpt_en: 'What is online billiards? Top billiard games 2025. Compare 8 Ball Pool, Real Pool 3D and mobile games.',
    category: 'guide',
    is_featured: false,
  },
  {
    file: '18-lich-giai-dau-bida-2025-cac-giai-lon.md',
    slug: 'lich-giai-dau-bida-2025-cac-giai-lon',
    title_en: 'Billiards Tournament Calendar 2025 - Major Events Guide',
    excerpt: 'Tổng hợp lịch giải đấu bida 2025 trong nước và quốc tế. Các giải Pool, Snooker, Carom 3 băng lớn nhất năm.',
    excerpt_en: 'Complete billiards tournament calendar 2025. Major Pool, Snooker, and 3-Cushion events worldwide.',
    category: 'news',
    is_featured: true,
  },
];

// Parse markdown file to extract title and content
function parseMarkdownFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Extract title (first line starting with #)
  let title = '';
  let contentStartIndex = 0;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('# ')) {
      title = lines[i].replace(/^#\s*/, '').replace(/🎱|📝|🏆|👋|🎯/g, '').trim();
      contentStartIndex = i + 1;
      break;
    }
  }
  
  // Get content (skip title and empty lines after it)
  while (contentStartIndex < lines.length && lines[contentStartIndex].trim() === '') {
    contentStartIndex++;
  }
  
  const articleContent = lines.slice(contentStartIndex).join('\n').trim();
  
  return { title, content: articleContent };
}

async function publishAllArticles() {
  console.log('====================================================');
  console.log('  📝 SABO ARENA - Auto Publish SEO Articles');
  console.log('====================================================\n');
  
  const seoArticlesDir = join(__dirname, 'seo-articles');
  let successCount = 0;
  let errorCount = 0;
  const publishedUrls = [];
  
  for (let i = 0; i < articles.length; i++) {
    const articleConfig = articles[i];
    const filePath = join(seoArticlesDir, articleConfig.file);
    
    console.log(`\n[${i + 1}/${articles.length}] Processing: ${articleConfig.file}`);
    
    try {
      // Parse markdown file
      const { title, content } = parseMarkdownFile(filePath);
      
      // Check if article with this slug already exists
      const { data: existing } = await supabase
        .from('news')
        .select('id, slug')
        .eq('slug', articleConfig.slug)
        .single();
      
      if (existing) {
        console.log(`    ⏭️  Skipped (already exists): ${articleConfig.slug}`);
        publishedUrls.push(`https://saboarena.com/news/${articleConfig.slug}`);
        successCount++;
        continue;
      }
      
      // Prepare article data
      const article = {
        title: title,
        title_en: articleConfig.title_en,
        slug: articleConfig.slug,
        content: content,
        content_en: 'Coming soon...',
        excerpt: articleConfig.excerpt,
        excerpt_en: articleConfig.excerpt_en,
        category: articleConfig.category,
        cover_image_url: coverImages[i % coverImages.length],
        status: 'published',
        is_featured: articleConfig.is_featured,
        published_at: new Date().toISOString(),
        views: Math.floor(Math.random() * 100) + 10, // Random initial views
      };
      
      // Insert article
      const { data, error } = await supabase
        .from('news')
        .insert([article])
        .select();
      
      if (error) {
        console.log(`    ❌ Error: ${error.message}`);
        errorCount++;
      } else {
        console.log(`    ✅ Published: ${article.title.substring(0, 50)}...`);
        console.log(`       🔗 URL: https://saboarena.com/news/${article.slug}`);
        publishedUrls.push(`https://saboarena.com/news/${article.slug}`);
        successCount++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (err) {
      console.log(`    ❌ Error reading file: ${err.message}`);
      errorCount++;
    }
  }
  
  // Summary
  console.log('\n====================================================');
  console.log('  📊 SUMMARY');
  console.log('====================================================');
  console.log(`  ✅ Success: ${successCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  console.log(`  📝 Total: ${articles.length}`);
  
  if (publishedUrls.length > 0) {
    console.log('\n====================================================');
    console.log('  🔗 PUBLISHED URLS');
    console.log('====================================================');
    publishedUrls.forEach(url => console.log(`  ${url}`));
    
    console.log('\n====================================================');
    console.log('  📋 NEXT STEPS');
    console.log('====================================================');
    console.log('  1. Verify articles at: https://saboarena.com/blog');
    console.log('  2. Index to Google:');
    console.log('     node index-sabo-pages.mjs index-all');
    console.log('  3. Regenerate sitemap:');
    console.log('     node generate-sitemap.mjs');
    console.log('  4. Submit sitemap:');
    console.log('     node index-sabo-pages.mjs submit-sitemap');
  }
  
  console.log('\n====================================================\n');
}

// Run
publishAllArticles().catch(console.error);
