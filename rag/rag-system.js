/**
 * 🧠 SABO Arena RAG System
 * 
 * Hệ thống RAG (Retrieval-Augmented Generation) cho SABO Arena
 * - Ingest docs từ markdown files
 * - Vector embeddings với OpenAI/Gemini
 * - Semantic search
 * - AI-powered answers
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Config
const DOCS_DIR = path.join(__dirname, '../docs');
const EMBEDDINGS_FILE = path.join(__dirname, 'embeddings.json');

/**
 * Load tất cả markdown files từ docs folder
 */
function loadDocs() {
  const docs = [];
  
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.md')) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const relativePath = path.relative(DOCS_DIR, filePath);
        
        // Extract title từ first heading
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : file.replace('.md', '');
        
        docs.push({
          id: crypto.createHash('md5').update(filePath).digest('hex'),
          path: relativePath,
          title: title,
          content: content,
          chunks: chunkContent(content),
        });
      }
    }
  }
  
  walkDir(DOCS_DIR);
  return docs;
}

/**
 * Chia content thành chunks nhỏ hơn
 */
function chunkContent(content, maxChunkSize = 500) {
  const chunks = [];
  const lines = content.split('\n');
  let currentChunk = '';
  let currentHeading = '';
  
  for (const line of lines) {
    // Track current heading
    if (line.startsWith('#')) {
      currentHeading = line.replace(/^#+\s*/, '');
    }
    
    if ((currentChunk + line).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push({
        heading: currentHeading,
        text: currentChunk.trim(),
      });
      currentChunk = '';
    }
    
    currentChunk += line + '\n';
  }
  
  if (currentChunk.trim()) {
    chunks.push({
      heading: currentHeading,
      text: currentChunk.trim(),
    });
  }
  
  return chunks;
}

/**
 * Simple keyword-based search (fallback khi không có embeddings)
 */
function keywordSearch(docs, query, limit = 5) {
  const queryLower = query.toLowerCase();
  const keywords = queryLower.split(/\s+/).filter(w => w.length > 2);
  
  const results = [];
  
  for (const doc of docs) {
    const contentLower = doc.content.toLowerCase();
    let score = 0;
    
    // Title match bonus
    if (doc.title.toLowerCase().includes(queryLower)) {
      score += 10;
    }
    
    // Keyword matches
    for (const keyword of keywords) {
      const matches = (contentLower.match(new RegExp(keyword, 'g')) || []).length;
      score += matches;
    }
    
    if (score > 0) {
      results.push({
        doc,
        score,
        relevantChunk: findRelevantChunk(doc.chunks, keywords),
      });
    }
  }
  
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Tìm chunk relevant nhất
 */
function findRelevantChunk(chunks, keywords) {
  let bestChunk = chunks[0];
  let bestScore = 0;
  
  for (const chunk of chunks) {
    const textLower = chunk.text.toLowerCase();
    let score = 0;
    
    for (const keyword of keywords) {
      if (textLower.includes(keyword)) {
        score += 1;
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestChunk = chunk;
    }
  }
  
  return bestChunk;
}

/**
 * RAG Query - Tìm kiếm và trả về context
 */
async function ragQuery(query, limit = 3) {
  const docs = loadDocs();
  const results = keywordSearch(docs, query, limit);
  
  if (results.length === 0) {
    return {
      found: false,
      context: null,
      sources: [],
    };
  }
  
  // Build context từ kết quả
  const context = results.map((r, i) => 
    `[${i + 1}] ${r.doc.title}:\n${r.relevantChunk?.text || r.doc.content.substring(0, 500)}`
  ).join('\n\n');
  
  return {
    found: true,
    context,
    sources: results.map(r => ({
      title: r.doc.title,
      path: r.doc.path,
      excerpt: r.relevantChunk?.text?.substring(0, 200) || '',
    })),
  };
}

/**
 * Ingest docs - Rebuild index
 */
async function ingestDocs() {
  console.log('📚 Ingesting docs...');
  const docs = loadDocs();
  
  console.log(`Found ${docs.length} documents:`);
  docs.forEach(doc => {
    console.log(`  - ${doc.title} (${doc.chunks.length} chunks)`);
  });
  
  // Save to cache file
  const cache = {
    lastUpdated: new Date().toISOString(),
    docsCount: docs.length,
    docs: docs.map(d => ({
      id: d.id,
      title: d.title,
      path: d.path,
      chunksCount: d.chunks.length,
    })),
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'docs-index.json'),
    JSON.stringify(cache, null, 2)
  );
  
  console.log('✅ Docs ingested successfully!');
  return docs;
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === 'ingest') {
    ingestDocs();
  } else if (args[0] === 'search') {
    const query = args.slice(1).join(' ');
    ragQuery(query).then(result => {
      console.log('\n🔍 Search Results:');
      console.log(JSON.stringify(result, null, 2));
    });
  } else {
    console.log('Usage:');
    console.log('  node rag-system.js ingest    - Ingest all docs');
    console.log('  node rag-system.js search <query>  - Search docs');
  }
}

module.exports = { loadDocs, ragQuery, ingestDocs, keywordSearch };
