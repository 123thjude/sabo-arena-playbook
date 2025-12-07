# 🤖 SABO Arena RAG + Docs + Chatbot System

Hệ thống RAG (Retrieval-Augmented Generation) cho SABO Arena, có thể copy sang các dự án khác.

## 📁 Cấu trúc thư mục

```
project/
├── docs/                  # Tài liệu Markdown
│   ├── README.md
│   ├── getting-started/
│   │   ├── introduction.md
│   │   └── registration.md
│   ├── features/
│   │   ├── tournaments.md
│   │   └── sabo-token.md
│   └── faq/
│       └── general.md
├── rag/                   # RAG System
│   ├── package.json
│   ├── server.js          # Express API server
│   ├── chatbot.js         # AI Chatbot với Gemini
│   ├── rag-system.js      # RAG engine
│   └── docs-index.json    # Cache index (auto-generated)
└── src/
    ├── components/
    │   └── ChatWidget.tsx  # Chat widget component
    └── pages/
        └── DocsPortal.tsx  # Docs viewer page
```

## 🚀 Quick Start

### 1. Install dependencies

```bash
cd rag
npm install
```

### 2. Setup environment

Copy `.env.local` với các biến:

```env
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

### 3. Ingest docs

```bash
npm run ingest
```

### 4. Start server

```bash
npm start
# Server runs on http://localhost:3001
```

## 📝 Viết Docs

Tạo file markdown trong thư mục `docs/`:

```markdown
# Tiêu đề

Nội dung tài liệu...

## Heading 2

Chi tiết...
```

## 🔧 API Endpoints

### POST /api/chat
Chat với AI

```json
{
  "question": "SABO Arena là gì?"
}
```

Response:
```json
{
  "success": true,
  "answer": "SABO Arena là nền tảng giải đấu Billiards...",
  "sources": [
    { "title": "Giới thiệu", "path": "getting-started/introduction.md" }
  ],
  "aiGenerated": true
}
```

### POST /api/ingest
Rebuild docs index (admin)

### GET /api/health
Health check

## 🔄 Copy sang dự án khác

1. Copy thư mục `docs/` và `rag/`
2. Copy `ChatWidget.tsx` và `DocsPortal.tsx`
3. Thay đổi tên project trong các file
4. Update docs content
5. Add routes trong App.tsx

## 🛠️ Customize

### Thêm docs section mới

1. Tạo thư mục trong `docs/`
2. Thêm vào `docsStructure` trong `DocsPortal.tsx`
3. Run `npm run ingest`

### Thay đổi AI model

Sửa trong `chatbot.js`:

```javascript
geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
```

### Thay đổi port

```env
CHATBOT_PORT=3002
```

## 📞 Support

- Hotline: 0329 640 232
- Email: support@saboarena.com
