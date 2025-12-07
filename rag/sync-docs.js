/**
 * Auto-sync Docusaurus docs to RAG system
 * 
 * Script này sẽ:
 * 1. Đọc tất cả .md files từ docs-portal/docs
 * 2. Parse frontmatter và content
 * 3. Ingest vào RAG system
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const DOCS_DIR = path.join(__dirname, '../../docs-portal/docs');
const RAG_DOCS_DIR = path.join(__dirname, 'docs');
const RAG_API = 'http://localhost:3010/api';

// Recursively get all .md files
function getAllMarkdownFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      getAllMarkdownFiles(fullPath, files);
    } else if (item.endsWith('.md') || item.endsWith('.mdx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Parse markdown file with frontmatter
function parseMarkdown(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content: body } = matter(content);
  
  // Get relative path for doc ID
  const relativePath = path.relative(DOCS_DIR, filePath);
  const docId = relativePath.replace(/\\/g, '/').replace(/\.(md|mdx)$/, '');
  
  return {
    id: docId,
    title: frontmatter.title || path.basename(filePath, path.extname(filePath)),
    description: frontmatter.description || '',
    keywords: frontmatter.keywords || [],
    content: body.trim(),
    source: `docs/${docId}`,
    category: docId.split('/')[0],
    lastModified: fs.statSync(filePath).mtime.toISOString(),
  };
}

// Convert to RAG-friendly format
function convertToRAGDoc(doc) {
  // Remove markdown syntax for better RAG
  let cleanContent = doc.content
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/\|.*\|/g, '') // Remove tables
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
    .replace(/#{1,6}\s/g, '') // Remove headers markers
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // Remove bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // Remove italic
    .replace(/:::\w+/g, '') // Remove admonitions
    .replace(/:::/g, '')
    .replace(/\n{3,}/g, '\n\n') // Normalize newlines
    .trim();

  return {
    title: doc.title,
    content: `${doc.title}\n\n${doc.description}\n\n${cleanContent}`,
    metadata: {
      source: doc.source,
      category: doc.category,
      keywords: doc.keywords,
      description: doc.description,
    },
  };
}

// Save to RAG docs folder
function saveToRAGDocs(docs) {
  // Ensure RAG docs directory exists
  if (!fs.existsSync(RAG_DOCS_DIR)) {
    fs.mkdirSync(RAG_DOCS_DIR, { recursive: true });
  }

  // Clear existing synced docs
  const existingFiles = fs.readdirSync(RAG_DOCS_DIR);
  for (const file of existingFiles) {
    if (file.startsWith('synced-')) {
      fs.unlinkSync(path.join(RAG_DOCS_DIR, file));
    }
  }

  // Group by category
  const categories = {};
  for (const doc of docs) {
    const cat = doc.metadata.category || 'general';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(doc);
  }

  // Save each category as a file
  for (const [category, catDocs] of Object.entries(categories)) {
    const filename = `synced-${category}.md`;
    const content = catDocs.map(d => 
      `# ${d.title}\n\n${d.content}\n\n---\n`
    ).join('\n');
    
    fs.writeFileSync(path.join(RAG_DOCS_DIR, filename), content);
    console.log(`📝 Saved: ${filename} (${catDocs.length} docs)`);
  }
}

// Main sync function
async function syncDocs() {
  console.log('🔄 Starting docs sync...\n');
  
  // Check if docs-portal exists
  if (!fs.existsSync(DOCS_DIR)) {
    console.error('❌ docs-portal/docs directory not found!');
    process.exit(1);
  }

  // Get all markdown files
  const files = getAllMarkdownFiles(DOCS_DIR);
  console.log(`📚 Found ${files.length} markdown files\n`);

  // Parse all files
  const docs = [];
  for (const file of files) {
    try {
      const parsed = parseMarkdown(file);
      const ragDoc = convertToRAGDoc(parsed);
      docs.push(ragDoc);
      console.log(`✅ Parsed: ${parsed.title}`);
    } catch (err) {
      console.error(`❌ Error parsing ${file}: ${err.message}`);
    }
  }

  console.log(`\n📊 Total docs parsed: ${docs.length}`);

  // Save to RAG docs folder
  saveToRAGDocs(docs);

  // Try to ingest via API if server is running
  try {
    const response = await fetch(`${RAG_API}/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: true }),
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`\n🚀 RAG system refreshed: ${result.documents} documents indexed`);
    }
  } catch (err) {
    console.log('\n⚠️ RAG API not available. Documents saved to docs/ folder.');
    console.log('   Run the RAG server and call /api/ingest to index.');
  }

  console.log('\n✅ Sync complete!');
}

// Generate summary JSON
function generateSummary(docs) {
  const summary = {
    totalDocs: docs.length,
    lastSync: new Date().toISOString(),
    categories: {},
  };

  for (const doc of docs) {
    const cat = doc.metadata.category;
    if (!summary.categories[cat]) {
      summary.categories[cat] = { count: 0, docs: [] };
    }
    summary.categories[cat].count++;
    summary.categories[cat].docs.push(doc.title);
  }

  fs.writeFileSync(
    path.join(RAG_DOCS_DIR, 'sync-summary.json'),
    JSON.stringify(summary, null, 2)
  );

  return summary;
}

// Run
syncDocs().catch(console.error);
