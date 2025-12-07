#!/usr/bin/env node

/**
 * ============================================
 * 🎱 SABO ARENA - SEO MASTER AUTOMATION TOOL
 * ============================================
 * 
 * Tận dụng tối đa Google APIs:
 * - Google Indexing API (index/remove URLs)
 * - Google Search Console API (performance, sitemaps, crawl errors)
 * 
 * Commands:
 *   node seo-master.mjs full-seo        - Chạy tất cả SEO tasks
 *   node seo-master.mjs index-all       - Index tất cả URLs
 *   node seo-master.mjs submit-sitemap  - Submit sitemap
 *   node seo-master.mjs performance     - Xem SEO performance
 *   node seo-master.mjs crawl-errors    - Xem lỗi crawl
 *   node seo-master.mjs keywords        - Xem top keywords
 */

import { GoogleAuth } from 'google-auth-library';
import { config } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load credentials
config({ path: join(__dirname, '.env.google') });

const PROPERTY_URL = 'https://saboarena.com';
const PROPERTY_URL_SC = 'sc-domain:saboarena.com'; // Search Console format
const CREDENTIALS = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}');

// All pages to index (static + SEO articles)
const ALL_PAGES = [
  // Static pages
  { url: '/', name: 'Homepage', priority: 1.0 },
  { url: '/rankings', name: 'Rankings', priority: 0.9 },
  { url: '/live-matches', name: 'Live Matches', priority: 0.9 },
  { url: '/clubs', name: 'Clubs', priority: 0.8 },
  { url: '/blog', name: 'Blog', priority: 0.8 },
  { url: '/profile', name: 'Profile', priority: 0.6 },
  { url: '/privacy-policy', name: 'Privacy Policy', priority: 0.3 },
  { url: '/terms-of-service', name: 'Terms of Service', priority: 0.3 },
  
  // SEO Articles (Original 8)
  { url: '/news/huong-dan-choi-bida-cho-nguoi-moi-2025', name: 'Hướng dẫn chơi bida người mới', priority: 0.8 },
  { url: '/news/luat-choi-bida-8-bi-chi-tiet-2025', name: 'Luật chơi bida 8 bi', priority: 0.8 },
  { url: '/news/ky-thuat-cam-co-bida-dung-cach-2025', name: 'Kỹ thuật cầm cơ bida', priority: 0.8 },
  { url: '/news/he-thong-xep-hang-elo-bida-la-gi', name: 'Hệ thống ELO bida', priority: 0.8 },
  { url: '/news/huong-dan-tham-gia-giai-dau-sabo-arena', name: 'Hướng dẫn tham gia giải đấu', priority: 0.8 },
  { url: '/news/tips-leo-elo-bida-nhanh-chong-2025', name: 'Tips leo ELO bida', priority: 0.8 },
  { url: '/news/cau-lac-bo-bida-viet-nam-2025', name: 'CLB bida Việt Nam', priority: 0.8 },
  { url: '/news/huong-dan-choi-bida-9-bi-chi-tiet-2025', name: 'Hướng dẫn chơi bida 9 bi', priority: 0.8 },
  
  // SEO Articles (NEW 10 - Hot Keywords)
  { url: '/news/bida-phom-la-gi-luat-choi-chi-tiet-2025', name: 'Bida phỏm là gì - luật chơi', priority: 0.9 },
  { url: '/news/bida-3-bang-carom-luat-choi-chi-tiet-2025', name: 'Bida 3 băng carom luật chơi', priority: 0.9 },
  { url: '/news/gia-ban-bida-2025-bang-gia-moi-nhat', name: 'Giá bàn bida 2025', priority: 0.9 },
  { url: '/news/cach-danh-bida-xoay-ky-thuat-spin-2025', name: 'Cách đánh bida xoáy spin', priority: 0.9 },
  { url: '/news/top-10-quan-bida-sai-gon-dep-nhat-2025', name: 'Top 10 quán bida Sài Gòn', priority: 0.9 },
  { url: '/news/cach-chon-co-bida-phu-hop-huong-dan-mua-2025', name: 'Cách chọn cơ bida', priority: 0.8 },
  { url: '/news/top-10-quan-bida-ha-noi-dep-nhat-2025', name: 'Top 10 quán bida Hà Nội', priority: 0.9 },
  { url: '/news/hoc-choi-bida-o-dau-trung-tam-day-bida-2025', name: 'Học chơi bida ở đâu', priority: 0.8 },
  { url: '/news/bida-online-la-gi-top-game-bi-a-online-2025', name: 'Bida online là gì game', priority: 0.8 },
  { url: '/news/lich-giai-dau-bida-2025-cac-giai-lon', name: 'Lịch giải đấu bida 2025', priority: 0.9 },
];

// Initialize Google Auth with all necessary scopes
const auth = new GoogleAuth({
  credentials: CREDENTIALS,
  scopes: [
    'https://www.googleapis.com/auth/webmasters',
    'https://www.googleapis.com/auth/webmasters.readonly',
    'https://www.googleapis.com/auth/indexing'
  ]
});

// ============ INDEXING API ============

async function indexUrl(url, type = 'URL_UPDATED') {
  try {
    const client = await auth.getClient();
    const fullUrl = url.startsWith('http') ? url : `${PROPERTY_URL}${url}`;
    
    const response = await client.request({
      url: 'https://indexing.googleapis.com/v3/urlNotifications:publish',
      method: 'POST',
      data: { url: fullUrl, type }
    });
    
    console.log(`   ✅ ${fullUrl}`);
    return true;
  } catch (error) {
    console.log(`   ❌ ${url} - ${error.message}`);
    return false;
  }
}

async function indexAllPages() {
  console.log('\n🚀 INDEXING ALL PAGES TO GOOGLE\n');
  console.log(`📊 Total: ${ALL_PAGES.length} pages\n`);
  
  let success = 0, failed = 0;
  
  for (const page of ALL_PAGES) {
    const result = await indexUrl(page.url);
    result ? success++ : failed++;
    await sleep(500); // Rate limit
  }
  
  console.log(`\n📈 Results: ✅ ${success} success, ❌ ${failed} failed\n`);
  return { success, failed };
}

// ============ SEARCH CONSOLE API ============

async function submitSitemap() {
  console.log('\n🗺️  SUBMITTING SITEMAP\n');
  
  try {
    const client = await auth.getClient();
    const sitemapUrl = `${PROPERTY_URL}/sitemap.xml`;
    
    // Try URL-prefix property first
    const properties = [PROPERTY_URL, PROPERTY_URL_SC];
    
    for (const property of properties) {
      try {
        const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
        
        await client.request({ url, method: 'PUT' });
        console.log(`   ✅ Sitemap submitted successfully!`);
        console.log(`   📍 Property: ${property}`);
        console.log(`   🔗 Sitemap: ${sitemapUrl}\n`);
        return true;
      } catch (e) {
        // Try next property
      }
    }
    
    console.log('   ⚠️  Could not submit via API - please submit manually');
    console.log(`   🔗 https://search.google.com/search-console/sitemaps\n`);
    return false;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
    return false;
  }
}

async function getPerformance(days = 28) {
  console.log(`\n📊 SEO PERFORMANCE (Last ${days} days)\n`);
  
  try {
    const client = await auth.getClient();
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const properties = [PROPERTY_URL, PROPERTY_URL_SC];
    
    for (const property of properties) {
      try {
        const response = await client.request({
          url: `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`,
          method: 'POST',
          data: {
            startDate,
            endDate,
            dimensions: ['query'],
            rowLimit: 20
          }
        });
        
        const data = response.data;
        
        if (!data.rows || data.rows.length === 0) {
          console.log('   📭 No data yet - website is new or not indexed\n');
          console.log('   💡 Data usually appears after 2-3 days of indexing\n');
          return null;
        }
        
        console.log('   🔍 TOP KEYWORDS:\n');
        console.log('   ┌────────────────────────────────────────┬────────┬────────┬─────────┬──────┐');
        console.log('   │ Keyword                                │ Clicks │ Impr.  │ CTR     │ Pos  │');
        console.log('   ├────────────────────────────────────────┼────────┼────────┼─────────┼──────┤');
        
        data.rows.slice(0, 15).forEach(row => {
          const keyword = row.keys[0].substring(0, 38).padEnd(38);
          const clicks = String(row.clicks).padStart(6);
          const impressions = String(row.impressions).padStart(6);
          const ctr = (row.ctr * 100).toFixed(1).padStart(6) + '%';
          const position = row.position.toFixed(1).padStart(4);
          console.log(`   │ ${keyword} │ ${clicks} │ ${impressions} │ ${ctr} │ ${position} │`);
        });
        
        console.log('   └────────────────────────────────────────┴────────┴────────┴─────────┴──────┘\n');
        return data;
      } catch (e) {
        // Try next property
      }
    }
    
    console.log('   ⚠️  Could not fetch performance data\n');
    return null;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
    return null;
  }
}

async function getTopPages(days = 28) {
  console.log(`\n📄 TOP PAGES (Last ${days} days)\n`);
  
  try {
    const client = await auth.getClient();
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const properties = [PROPERTY_URL, PROPERTY_URL_SC];
    
    for (const property of properties) {
      try {
        const response = await client.request({
          url: `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`,
          method: 'POST',
          data: {
            startDate,
            endDate,
            dimensions: ['page'],
            rowLimit: 20
          }
        });
        
        const data = response.data;
        
        if (!data.rows || data.rows.length === 0) {
          console.log('   📭 No page data yet\n');
          return null;
        }
        
        console.log('   ┌──────────────────────────────────────────────────┬────────┬────────┬──────┐');
        console.log('   │ Page                                             │ Clicks │ Impr.  │ Pos  │');
        console.log('   ├──────────────────────────────────────────────────┼────────┼────────┼──────┤');
        
        data.rows.slice(0, 15).forEach(row => {
          const page = row.keys[0].replace(PROPERTY_URL, '').substring(0, 48).padEnd(48);
          const clicks = String(row.clicks).padStart(6);
          const impressions = String(row.impressions).padStart(6);
          const position = row.position.toFixed(1).padStart(4);
          console.log(`   │ ${page} │ ${clicks} │ ${impressions} │ ${position} │`);
        });
        
        console.log('   └──────────────────────────────────────────────────┴────────┴────────┴──────┘\n');
        return data;
      } catch (e) {
        // Try next property
      }
    }
    
    console.log('   ⚠️  Could not fetch page data\n');
    return null;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
    return null;
  }
}

async function getSitemapStatus() {
  console.log('\n🗺️  SITEMAP STATUS\n');
  
  try {
    const client = await auth.getClient();
    const properties = [PROPERTY_URL, PROPERTY_URL_SC];
    
    for (const property of properties) {
      try {
        const response = await client.request({
          url: `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/sitemaps`,
          method: 'GET'
        });
        
        const sitemaps = response.data.sitemap || [];
        
        if (sitemaps.length === 0) {
          console.log('   📭 No sitemaps found - submitting now...\n');
          await submitSitemap();
          return null;
        }
        
        sitemaps.forEach(sitemap => {
          console.log(`   📍 ${sitemap.path}`);
          console.log(`      Status: ${sitemap.isPending ? '⏳ Pending' : '✅ Processed'}`);
          console.log(`      Submitted: ${sitemap.lastSubmitted || 'Unknown'}`);
          if (sitemap.contents?.[0]) {
            console.log(`      URLs: ${sitemap.contents[0].submitted || 0} submitted, ${sitemap.contents[0].indexed || 0} indexed`);
          }
          console.log('');
        });
        
        return sitemaps;
      } catch (e) {
        // Try next property
      }
    }
    
    console.log('   ⚠️  Could not fetch sitemap status\n');
    return null;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
    return null;
  }
}

async function getIndexingStatus() {
  console.log('\n📊 INDEXING STATUS CHECK\n');
  
  try {
    const client = await auth.getClient();
    const properties = [PROPERTY_URL, PROPERTY_URL_SC];
    
    for (const property of properties) {
      try {
        // Get URL inspection data (if available)
        const response = await client.request({
          url: `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`,
          method: 'POST',
          data: {
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            dimensions: ['page'],
            rowLimit: 100
          }
        });
        
        const indexedPages = response.data.rows?.map(r => r.keys[0]) || [];
        
        console.log(`   📈 Indexed pages with impressions: ${indexedPages.length}\n`);
        
        if (indexedPages.length > 0) {
          console.log('   ✅ Pages appearing in search:');
          indexedPages.slice(0, 10).forEach(page => {
            console.log(`      • ${page.replace(PROPERTY_URL, '')}`);
          });
          console.log('');
        }
        
        // Check which pages are NOT yet indexed
        const notIndexed = ALL_PAGES.filter(p => 
          !indexedPages.some(ip => ip.includes(p.url))
        );
        
        if (notIndexed.length > 0) {
          console.log('   ⏳ Pages pending indexing:');
          notIndexed.forEach(page => {
            console.log(`      • ${page.url} (${page.name})`);
          });
          console.log('');
        }
        
        return { indexed: indexedPages.length, pending: notIndexed.length };
      } catch (e) {
        // Try next property
      }
    }
    
    console.log('   💡 No indexing data yet - check back in 2-3 days\n');
    return null;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
    return null;
  }
}

// ============ FULL SEO AUTOMATION ============

async function runFullSEO() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║       🎱 SABO ARENA - FULL SEO AUTOMATION                 ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  const results = {
    indexing: null,
    sitemap: null,
    performance: null,
    pages: null
  };
  
  // Step 1: Index all pages
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📌 STEP 1: INDEX ALL PAGES TO GOOGLE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  results.indexing = await indexAllPages();
  
  // Step 2: Submit/Check Sitemap
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📌 STEP 2: SITEMAP STATUS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  results.sitemap = await getSitemapStatus();
  
  // Step 3: Check Performance
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📌 STEP 3: SEO PERFORMANCE CHECK');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  results.performance = await getPerformance(28);
  
  // Step 4: Top Pages
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📌 STEP 4: TOP PERFORMING PAGES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  results.pages = await getTopPages(28);
  
  // Step 5: Indexing Status
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📌 STEP 5: INDEXING STATUS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await getIndexingStatus();
  
  // Summary
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                    📊 SUMMARY                             ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log(`║  📄 Total pages: ${ALL_PAGES.length.toString().padEnd(40)}║`);
  console.log(`║  ✅ Indexed successfully: ${(results.indexing?.success || 0).toString().padEnd(31)}║`);
  console.log(`║  ❌ Failed: ${(results.indexing?.failed || 0).toString().padEnd(45)}║`);
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log('║  ⏱️  Expected timeline:                                   ║');
  console.log('║     • Google crawl: 24-48 hours                          ║');
  console.log('║     • Appear in search: 3-7 days                         ║');
  console.log('║     • Ranking improvement: 2-4 weeks                     ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  console.log('💡 NEXT STEPS:');
  console.log('   1. Run this script weekly: node seo-master.mjs full-seo');
  console.log('   2. Check performance: node seo-master.mjs performance');
  console.log('   3. Add more SEO articles for better ranking\n');
  
  return results;
}

// ============ UTILITIES ============

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============ CLI ============

async function main() {
  const command = process.argv[2];
  
  console.log('\n🎱 SABO ARENA - SEO Master Tool\n');
  
  if (!CREDENTIALS.private_key) {
    console.error('❌ Missing Google credentials!');
    console.error('💡 Check .env.google file\n');
    process.exit(1);
  }
  
  switch (command) {
    case 'full-seo':
      await runFullSEO();
      break;
      
    case 'index-all':
      await indexAllPages();
      break;
      
    case 'submit-sitemap':
      await submitSitemap();
      break;
      
    case 'performance':
    case 'keywords':
      await getPerformance(28);
      break;
      
    case 'pages':
      await getTopPages(28);
      break;
      
    case 'sitemap':
    case 'sitemap-status':
      await getSitemapStatus();
      break;
      
    case 'indexing-status':
    case 'status':
      await getIndexingStatus();
      break;
      
    default:
      console.log('📚 AVAILABLE COMMANDS:\n');
      console.log('  full-seo         - 🚀 Run complete SEO automation');
      console.log('  index-all        - 📄 Index all pages to Google');
      console.log('  submit-sitemap   - 🗺️  Submit sitemap to Search Console');
      console.log('  performance      - 📊 View SEO performance & keywords');
      console.log('  pages            - 📄 View top performing pages');
      console.log('  sitemap-status   - 🗺️  Check sitemap status');
      console.log('  status           - 📈 Check indexing status');
      console.log('');
      console.log('💡 QUICK START:');
      console.log('   node seo-master.mjs full-seo\n');
      break;
  }
}

main().catch(console.error);
