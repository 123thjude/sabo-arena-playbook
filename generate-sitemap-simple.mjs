import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Static pages
const STATIC_PAGES = [
  { url: '/', priority: 1, changefreq: 'daily', lastmod: '2025-12-07' },
  { url: '/rankings', priority: 0.9, changefreq: 'daily', lastmod: '2025-12-07' },
  { url: '/blog', priority: 0.9, changefreq: 'daily', lastmod: '2025-12-07' },
  { url: '/clubs', priority: 0.8, changefreq: 'weekly', lastmod: '2025-12-07' },
  { url: '/live-matches', priority: 0.9, changefreq: 'hourly', lastmod: '2025-12-07' },
  { url: '/profile', priority: 0.6, changefreq: 'monthly', lastmod: '2025-12-07' },
  { url: '/privacy-policy', priority: 0.3, changefreq: 'yearly', lastmod: '2025-12-07' },
  { url: '/terms-of-service', priority: 0.3, changefreq: 'yearly', lastmod: '2025-12-07' },
  // Older articles
  { url: '/news/sabo-arena-nen-tang-thi-dau-bida-1-viet-nam', priority: 0.9, changefreq: 'monthly', lastmod: '2025-11-11' },
  { url: '/news/top-10-co-thu-bia-vietnam-2025', priority: 0.8, changefreq: 'monthly', lastmod: '2025-11-11' },
  // NEW SEO Articles (December 2025)
  { url: '/news/huong-dan-choi-bida-cho-nguoi-moi-2025', priority: 0.9, changefreq: 'monthly', lastmod: '2025-12-07' },
  { url: '/news/luat-choi-bida-8-bi-chi-tiet-2025', priority: 0.9, changefreq: 'monthly', lastmod: '2025-12-07' },
  { url: '/news/ky-thuat-cam-co-bida-dung-cach-2025', priority: 0.8, changefreq: 'monthly', lastmod: '2025-12-07' },
  { url: '/news/he-thong-xep-hang-elo-bida-la-gi', priority: 0.9, changefreq: 'monthly', lastmod: '2025-12-07' },
  { url: '/news/huong-dan-tham-gia-giai-dau-sabo-arena', priority: 0.9, changefreq: 'monthly', lastmod: '2025-12-07' },
  { url: '/news/tips-leo-elo-bida-nhanh-chong-2025', priority: 0.8, changefreq: 'monthly', lastmod: '2025-12-07' },
  { url: '/news/cau-lac-bo-bida-viet-nam-2025', priority: 0.8, changefreq: 'monthly', lastmod: '2025-12-07' },
  { url: '/news/huong-dan-choi-bida-9-bi-chi-tiet-2025', priority: 0.8, changefreq: 'monthly', lastmod: '2025-12-07' },
];

function generateSitemapXML(urls) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
  
  return xml;
}

console.log('🗺️  SABO ARENA - Sitemap Generator (Static)\n');

const baseUrl = 'https://saboarena.com';
const urls = [];

for (const page of STATIC_PAGES) {
  urls.push({
    loc: `${baseUrl}${page.url}`,
    lastmod: page.lastmod,
    changefreq: page.changefreq,
    priority: page.priority
  });
  console.log(`✓ ${page.url}`);
}

const sitemapXML = generateSitemapXML(urls);
const publicPath = join(__dirname, 'public', 'sitemap.xml');
writeFileSync(publicPath, sitemapXML, 'utf-8');

console.log(`\n✅ Sitemap created: ${publicPath}`);
console.log(`📊 Total URLs: ${urls.length}`);
console.log(`📁 File size: ${(sitemapXML.length / 1024).toFixed(2)} KB`);
console.log(`🔗 View at: ${baseUrl}/sitemap.xml\n`);
