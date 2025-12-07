import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatWidgetProps {
  apiUrl?: string;
}

// Avatar URL cho SABO Linh - dùng emoji thay vì external API
const LINH_AVATAR = '';
const USE_EMOJI_AVATAR = true;

export function ChatWidget({ apiUrl = '/api/chat' }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '💖 Chào anh/chị! Em là **Linh** - trợ lý của SABO Arena nè~\n\nEm có thể giúp anh/chị:\n• 🎯 Đăng ký tham gia giải đấu\n• 🏆 Tìm hiểu luật thi đấu Pool\n• 💰 Hướng dẫn dùng SPA Points\n• 📱 Sử dụng App SABO\n• 🎱 Thông tin về hệ thống Rank\n\nAnh/chị cứ hỏi em nhé, em sẵn lòng hỗ trợ ạ! 😊',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setShowPulse(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Use RAG chatbot API
      const chatApiUrl = apiUrl.includes('http') ? apiUrl : 'https://sabo-arena-docs.vercel.app/api/chat';
      
      const response = await fetch(chatApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage.content }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer || data.response || 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '❌ Không thể kết nối. Vui lòng thử lại sau hoặc liên hệ:\n\n📞 Hotline: 0329 640 232\n💬 Zalo: zalo.me/saboarena',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Quick suggestions
  const suggestions = [
    'Cách đăng ký giải đấu?',
    'SPA Points là gì?',
    'Hệ thống Rank như thế nào?',
  ];

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-[60]"
          >
            {/* Pulse animation */}
            {showPulse && (
              <span className="absolute inset-0 rounded-full bg-gold/40 animate-ping" />
            )}
            
            <button
              onClick={() => setIsOpen(true)}
              className="h-16 w-16 rounded-full bg-gradient-to-br from-gold via-amber-500 to-orange-500 hover:from-amber-500 hover:to-orange-600 shadow-lg shadow-gold/30 border-2 border-white/40 overflow-hidden hover:scale-110 transition-transform duration-200 flex items-center justify-center"
            >
              <span className="text-3xl">👩‍💼</span>
            </button>
            
            {/* Tooltip */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 }}
              className="absolute right-20 top-1/2 -translate-y-1/2 bg-card border border-border rounded-lg px-3 py-2 shadow-lg whitespace-nowrap"
            >
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-gold" />
                <span>Chat với Linh nè~ 💕</span>
              </div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-2 h-2 bg-card border-r border-t border-border rotate-45" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 w-[380px] h-[550px] bg-background border border-border rounded-2xl shadow-2xl flex flex-col z-[60] overflow-hidden max-w-[calc(100vw-48px)] max-h-[calc(100vh-100px)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gold via-amber-500 to-orange-500">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-white/30 overflow-hidden border-2 border-white/50 flex items-center justify-center">
                  <span className="text-2xl">👩‍💼</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Linh 💕</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                    <p className="text-xs text-slate-800">Trợ lý SABO Arena</p>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-900 hover:bg-slate-900/10"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-gold to-amber-500 text-slate-900 rounded-br-md'
                          : 'bg-muted text-foreground rounded-bl-md border border-border'
                      }`}
                    >
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {msg.content.split('**').map((part, i) => 
                          i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                        )}
                      </div>
                      <div
                        className={`text-[10px] mt-1.5 ${
                          msg.role === 'user' ? 'text-slate-700' : 'text-muted-foreground'
                        }`}
                      >
                        {msg.timestamp.toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-muted border border-border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-gold" />
                      <span className="text-sm text-muted-foreground">Linh đang soạn tin... 💭</span>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Quick Suggestions */}
            {messages.length <= 2 && !isLoading && (
              <div className="px-4 pb-2">
                <p className="text-xs text-muted-foreground mb-2">Gợi ý câu hỏi:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setInput(suggestion);
                        setTimeout(() => sendMessage(), 100);
                      }}
                      className="text-xs px-3 py-1.5 rounded-full bg-gold/10 text-gold hover:bg-gold/20 transition-colors border border-gold/20"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-border bg-card/50">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập câu hỏi của bạn..."
                  disabled={isLoading}
                  className="flex-1 bg-background"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="bg-gradient-to-br from-gold to-amber-500 hover:from-amber-500 hover:to-orange-500 text-slate-900"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                💕 Linh - Trợ lý SABO Arena • <a href="tel:0329640232" className="text-gold hover:underline">0329 640 232</a>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ChatWidget;
