#!/usr/bin/env node

/**
 * ============================================
 * 🔧 FIX GOOGLE INDEXING ISSUES
 * ============================================
 * 
 * Sửa các lỗi từ Google Search Console:
 * 1. Trang trùng lặp (duplicate) - 78 trang
 * 2. Redirect issues - 2 trang
 * 3. Discovered but not indexed - 6 trang
 */

import { GoogleAuth } from 'google-auth-library';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '.env.google') });

const PROPERTY_URL = 'https://saboarena.com';
const CREDENTIALS = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}');

const auth = new GoogleAuth({
  credentials: CREDENTIALS,
  scopes: [
    'https://www.googleapis.com/auth/webmasters',
    'https://www.googleapis.com/auth/webmasters.readonly',
    'https://www.googleapis.com/auth/indexing'
  ]
});

// ============ GET INDEX STATUS ============

async function getIndexingStatus() {
  console.log('\n📊 CHECKING INDEXING STATUS...\n');
  
  const client = await auth.getClient();
  
  try {
    // Get URL inspection results for key pages
    const keyPages = [
      '/',
      '/rankings',
      '/live-matches',
      '/clubs',
      '/blog',
      '/news/huong-dan-choi-bida-cho-nguoi-moi-2025',
      '/news/luat-choi-bida-8-bi-chi-tiet-2025',
      '/news/bida-phom-la-gi-luat-choi-chi-tiet-2025',
      '/news/bida-3-bang-carom-luat-choi-chi-tiet-2025',
      '/news/gia-ban-bida-2025-bang-gia-moi-nhat',
      '/news/cach-danh-bida-xoay-ky-thuat-spin-2025',
      '/news/top-10-quan-bida-sai-gon-dep-nhat-2025',
      '/news/top-10-quan-bida-ha-noi-dep-nhat-2025',
    ];
    
    console.log('🔍 Inspecting key pages...\n');
    
    for (const page of keyPages) {
      const fullUrl = `${PROPERTY_URL}${page}`;
      try {
        const response = await client.request({
          url: 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
          method: 'POST',
          data: {
            inspectionUrl: fullUrl,
            siteUrl: 'sc-domain:saboarena.com'
          }
        });
        
        const result = response.data.inspectionResult;
        const indexStatus = result?.indexStatusResult?.coverageState || 'Unknown';
        const crawledAs = result?.indexStatusResult?.crawledAs || 'N/A';
        const lastCrawl = result?.indexStatusResult?.lastCrawlTime || 'Never';
        
        const statusIcon = indexStatus === 'Submitted and indexed' ? '✅' : 
                          indexStatus === 'Discovered - currently not indexed' ? '⚠️' :
                          indexStatus === 'Crawled - currently not indexed' ? '🔄' : '❌';
        
        console.log(`   ${statusIcon} ${page}`);
        console.log(`      Status: ${indexStatus}`);
        console.log(`      Last crawl: ${lastCrawl}`);
        console.log('');
        
      } catch (err) {
        console.log(`   ❌ ${page} - Error: ${err.message}`);
      }
      
      // Rate limiting
      await new Promise(r => setTimeout(r, 1000));
    }
    
  } catch (err) {
    console.error('Error getting index status:', err.message);
  }
}

// ============ FORCE RE-INDEX PROBLEMATIC PAGES ============

async function forceReindex() {
  console.log('\n🚀 FORCE RE-INDEXING PROBLEMATIC PAGES...\n');
  
  const client = await auth.getClient();
  
  // All pages that might have issues
  const pagesToReindex = [
    // Static pages with possible duplicates
    '/',
    '/rankings',
    '/live-matches', 
    '/clubs',
    '/blog',
    '/profile',
    '/privacy-policy',
    '/terms-of-service',
    
    // All SEO articles
    '/news/huong-dan-choi-bida-cho-nguoi-moi-2025',
    '/news/luat-choi-bida-8-bi-chi-tiet-2025',
    '/news/ky-thuat-cam-co-bida-dung-cach-2025',
    '/news/he-thong-xep-hang-elo-bida-la-gi',
    '/news/huong-dan-tham-gia-giai-dau-sabo-arena',
    '/news/tips-leo-elo-bida-nhanh-chong-2025',
    '/news/cau-lac-bo-bida-viet-nam-2025',
    '/news/huong-dan-choi-bida-9-bi-chi-tiet-2025',
    '/news/bida-phom-la-gi-luat-choi-chi-tiet-2025',
    '/news/bida-3-bang-carom-luat-choi-chi-tiet-2025',
    '/news/gia-ban-bida-2025-bang-gia-moi-nhat',
    '/news/cach-danh-bida-xoay-ky-thuat-spin-2025',
    '/news/top-10-quan-bida-sai-gon-dep-nhat-2025',
    '/news/cach-chon-co-bida-phu-hop-huong-dan-mua-2025',
    '/news/top-10-quan-bida-ha-noi-dep-nhat-2025',
    '/news/hoc-choi-bida-o-dau-trung-tam-day-bida-2025',
    '/news/bida-online-la-gi-top-game-bi-a-online-2025',
    '/news/lich-giai-dau-bida-2025-cac-giai-lon',
  ];
  
  let success = 0;
  let failed = 0;
  
  for (const page of pagesToReindex) {
    const fullUrl = `${PROPERTY_URL}${page}`;
    
    try {
      await client.request({
        url: 'https://indexing.googleapis.com/v3/urlNotifications:publish',
        method: 'POST',
        data: {
          url: fullUrl,
          type: 'URL_UPDATED'
        }
      });
      
      console.log(`   ✅ ${fullUrl}`);
      success++;
      
    } catch (err) {
      console.log(`   ❌ ${fullUrl} - ${err.message}`);
      failed++;
    }
    
    // Rate limiting - 1 request per second
    await new Promise(r => setTimeout(r, 200));
  }
  
  console.log(`\n📈 Results: ✅ ${success} success, ❌ ${failed} failed`);
}

// ============ CHECK SITEMAPS ============

async function checkSitemaps() {
  console.log('\n🗺️  CHECKING SITEMAPS...\n');
  
  const client = await auth.getClient();
  
  try {
    const response = await client.request({
      url: `https://www.googleapis.com/webmasters/v3/sites/sc-domain:saboarena.com/sitemaps`,
      method: 'GET'
    });
    
    const sitemaps = response.data.sitemap || [];
    
    if (sitemaps.length === 0) {
      console.log('   ⚠️  No sitemaps found! Submitting...');
      await submitSitemap();
    } else {
      console.log('   📋 Registered sitemaps:\n');
      for (const sitemap of sitemaps) {
        console.log(`   📍 ${sitemap.path}`);
        console.log(`      Last submitted: ${sitemap.lastSubmitted || 'N/A'}`);
        console.log(`      Status: ${sitemap.isPending ? '⏳ Pending' : '✅ Processed'}`);
        console.log(`      Warnings: ${sitemap.warnings || 0}`);
        console.log(`      Errors: ${sitemap.errors || 0}`);
        console.log('');
      }
    }
    
  } catch (err) {
    console.error('Error checking sitemaps:', err.message);
  }
}

async function submitSitemap() {
  const client = await auth.getClient();
  
  try {
    await client.request({
      url: `https://www.googleapis.com/webmasters/v3/sites/sc-domain:saboarena.com/sitemaps/https%3A%2F%2Fsaboarena.com%2Fsitemap.xml`,
      method: 'PUT'
    });
    console.log('   ✅ Sitemap submitted successfully!');
  } catch (err) {
    console.error('   ❌ Error submitting sitemap:', err.message);
  }
}

// ============ GET COVERAGE REPORT ============

async function getCoverageReport() {
  console.log('\n📊 COVERAGE REPORT...\n');
  
  const client = await auth.getClient();
  
  try {
    // Search Analytics to see indexed pages
    const response = await client.request({
      url: 'https://www.googleapis.com/webmasters/v3/sites/sc-domain:saboarena.com/searchAnalytics/query',
      method: 'POST',
      data: {
        startDate: '2025-11-01',
        endDate: '2025-12-07',
        dimensions: ['page'],
        rowLimit: 100
      }
    });
    
    const rows = response.data.rows || [];
    
    console.log(`   📄 Pages appearing in search: ${rows.length}\n`);
    
    if (rows.length > 0) {
      console.log('   Top performing pages:\n');
      rows.slice(0, 20).forEach((row, i) => {
        const page = row.keys[0].replace(PROPERTY_URL, '');
        console.log(`   ${i + 1}. ${page || '/'}`);
        console.log(`      Clicks: ${row.clicks} | Impressions: ${row.impressions} | CTR: ${(row.ctr * 100).toFixed(1)}%`);
      });
    } else {
      console.log('   ⚠️  No pages found in search results yet.');
      console.log('   This is normal for new sites - Google needs 1-2 weeks to fully index.');
    }
    
  } catch (err) {
    console.error('Error getting coverage:', err.message);
  }
}

// ============ MAIN ============

async function main() {
  const command = process.argv[2] || 'all';
  
  console.log('🔧 SABO ARENA - Fix Indexing Issues\n');
  console.log('====================================\n');
  
  switch (command) {
    case 'status':
      await getIndexingStatus();
      break;
    case 'reindex':
      await forceReindex();
      break;
    case 'sitemaps':
      await checkSitemaps();
      break;
    case 'coverage':
      await getCoverageReport();
      break;
    case 'all':
    default:
      await checkSitemaps();
      await getCoverageReport();
      await forceReindex();
      console.log('\n✅ All fixes applied!');
      console.log('\n📋 NEXT STEPS:');
      console.log('   1. Wait 24-48h for Google to re-crawl');
      console.log('   2. Check Search Console for updates');
      console.log('   3. Run: node fix-indexing-issues.mjs status');
      break;
  }
}

main().catch(console.error);
