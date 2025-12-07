/**
 * 🤖 SABO Arena AI Chatbot
 * 
 * Chatbot tích hợp RAG + Gemini AI
 * - Nhận câu hỏi từ user
 * - Search trong docs
 * - Dùng AI để generate câu trả lời
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ragQuery } = require('./rag-system');

// Initialize Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
let geminiModel = null;

if (GEMINI_API_KEY) {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  console.log('[Chatbot] ✅ Gemini AI initialized');
} else {
  console.log('[Chatbot] ⚠️ No Gemini API key, using RAG-only mode');
}

/**
 * Generate AI answer từ RAG context
 */
async function generateAnswer(question, ragResult) {
  if (!geminiModel) {
    // Fallback: trả về raw context
    if (ragResult.found) {
      return {
        answer: `Dựa trên tài liệu:\n\n${ragResult.context}`,
        sources: ragResult.sources,
        aiGenerated: false,
      };
    }
    return {
      answer: 'Xin lỗi, tôi không tìm thấy thông tin liên quan. Vui lòng liên hệ hotline 0329 640 232.',
      sources: [],
      aiGenerated: false,
    };
  }
  
  try {
    const prompt = `Bạn là AI Assistant của SABO Arena - nền tảng giải đấu Billiards.

CÂU HỎI: "${question}"

${ragResult.found ? `THÔNG TIN TỪ TÀI LIỆU:
${ragResult.context}` : 'Không tìm thấy thông tin cụ thể trong tài liệu.'}

HƯỚNG DẪN:
1. Trả lời ngắn gọn, súc tích, thân thiện
2. Sử dụng thông tin từ tài liệu nếu có
3. Nếu không có thông tin, nói rõ và gợi ý liên hệ hotline
4. Sử dụng emoji phù hợp
5. Trả lời bằng tiếng Việt
6. Tối đa 200 từ

Trả lời:`;

    const result = await geminiModel.generateContent(prompt);
    const answer = result.response.text();
    
    return {
      answer,
      sources: ragResult.sources,
      aiGenerated: true,
    };
  } catch (error) {
    console.error('[Chatbot] AI Error:', error.message);
    
    // Fallback
    if (ragResult.found) {
      return {
        answer: ragResult.sources.map(s => `📌 ${s.title}\n${s.excerpt}`).join('\n\n'),
        sources: ragResult.sources,
        aiGenerated: false,
      };
    }
    
    return {
      answer: 'Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau hoặc liên hệ hotline 0329 640 232.',
      sources: [],
      aiGenerated: false,
    };
  }
}

/**
 * Main chat function
 */
async function chat(question) {
  console.log(`[Chatbot] Question: "${question}"`);
  
  // 1. RAG search
  const ragResult = await ragQuery(question);
  console.log(`[Chatbot] RAG found: ${ragResult.found}, sources: ${ragResult.sources.length}`);
  
  // 2. Generate answer
  const result = await generateAnswer(question, ragResult);
  console.log(`[Chatbot] AI generated: ${result.aiGenerated}`);
  
  return result;
}

/**
 * Express API endpoint handler
 */
async function handleChatRequest(req, res) {
  try {
    const { question } = req.body;
    
    if (!question || question.trim().length < 2) {
      return res.status(400).json({ error: 'Vui lòng nhập câu hỏi' });
    }
    
    const result = await chat(question);
    return res.json(result);
  } catch (error) {
    console.error('[Chatbot] Error:', error);
    return res.status(500).json({ error: 'Lỗi hệ thống' });
  }
}

// CLI Test
if (require.main === module) {
  const question = process.argv.slice(2).join(' ') || 'SABO Arena là gì?';
  
  console.log('\n🤖 SABO Arena Chatbot Test\n');
  console.log(`Question: ${question}\n`);
  
  chat(question).then(result => {
    console.log('---');
    console.log('Answer:', result.answer);
    console.log('\nSources:', result.sources.map(s => s.title).join(', ') || 'None');
    console.log('AI Generated:', result.aiGenerated);
  });
}

module.exports = { chat, handleChatRequest };
