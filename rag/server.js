/**
 * 🌐 SABO Arena Chatbot API
 * 
 * Express server cho chatbot API
 * Endpoint: POST /api/chat
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const { chat } = require('./chatbot');
const { ingestDocs } = require('./rag-system');

const app = express();
const PORT = process.env.CHATBOT_PORT || 3010;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'SABO Arena Chatbot',
    timestamp: new Date().toISOString(),
  });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question || question.trim().length < 2) {
      return res.status(400).json({ 
        error: 'Vui lòng nhập câu hỏi',
        answer: null,
      });
    }
    
    console.log(`[API] Chat request: "${question}"`);
    
    const result = await chat(question);
    
    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[API] Error:', error);
    return res.status(500).json({ 
      error: 'Lỗi hệ thống, vui lòng thử lại',
      answer: null,
    });
  }
});

// Ingest docs endpoint (admin only)
app.post('/api/ingest', async (req, res) => {
  try {
    const docs = await ingestDocs();
    return res.json({
      success: true,
      docsCount: docs.length,
      message: 'Docs ingested successfully',
    });
  } catch (error) {
    console.error('[API] Ingest error:', error);
    return res.status(500).json({ error: 'Ingest failed' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🤖 SABO Arena Chatbot API running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Chat:   POST http://localhost:${PORT}/api/chat`);
  
  // Auto-ingest docs on start
  ingestDocs().catch(console.error);
});

module.exports = app;
