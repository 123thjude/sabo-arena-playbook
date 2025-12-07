import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Home, Search, Menu, X, Book, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

// Docs structure
const docsStructure = [
  {
    title: 'Bắt đầu',
    slug: 'getting-started',
    items: [
      { title: 'Giới thiệu SABO Arena', slug: 'introduction' },
      { title: 'Đăng ký tài khoản', slug: 'registration' },
    ],
  },
  {
    title: 'Tính năng',
    slug: 'features',
    items: [
      { title: 'Hệ thống giải đấu', slug: 'tournaments' },
      { title: 'SABO Token', slug: 'sabo-token' },
    ],
  },
  {
    title: 'FAQ',
    slug: 'faq',
    items: [
      { title: 'Câu hỏi thường gặp', slug: 'general' },
    ],
  },
];

// Mock docs content (in production, load from API)
const docsContent: Record<string, { title: string; content: string }> = {
  'getting-started/introduction': {
    title: 'Giới thiệu SABO Arena',
    content: `
# Giới thiệu SABO Arena

**SABO Arena** là nền tảng giải đấu Billiards trực tuyến hàng đầu Việt Nam, kết nối cộng đồng cơ thủ trên toàn quốc.

## 🎱 Sứ mệnh

Chúng tôi mang đến trải nghiệm thi đấu chuyên nghiệp, minh bạch và công bằng cho mọi cơ thủ - từ nghiệp dư đến chuyên nghiệp.

## ✨ Tính năng nổi bật

- **Giải đấu hàng tuần**: Tham gia các giải đấu với giải thưởng hấp dẫn
- **SABO Token**: Hệ thống token thưởng có thể quy đổi
- **Bảng xếp hạng**: Theo dõi thứ hạng và tiến bộ
- **Cộng đồng**: Kết nối với hàng nghìn cơ thủ

## 📱 Tải ứng dụng

- [iOS App Store](#)
- [Google Play Store](#)

## 📞 Liên hệ

- Hotline: **0329 640 232**
- Email: **support@saboarena.com**
    `,
  },
  'getting-started/registration': {
    title: 'Đăng ký tài khoản',
    content: `
# Đăng ký tài khoản SABO Arena

Hướng dẫn chi tiết cách tạo tài khoản và bắt đầu tham gia các giải đấu.

## 📝 Các bước đăng ký

### Bước 1: Tải ứng dụng
Tải ứng dụng SABO Arena từ App Store hoặc Google Play.

### Bước 2: Nhập số điện thoại
- Mở ứng dụng
- Nhập số điện thoại của bạn
- Nhấn "Tiếp tục"

### Bước 3: Xác thực OTP
- Nhập mã OTP 6 số được gửi đến điện thoại
- Mã có hiệu lực trong 5 phút

### Bước 4: Hoàn tất hồ sơ
- Nhập họ tên
- Chọn avatar
- Nhập mã giới thiệu (nếu có)

## 🎁 Ưu đãi đăng ký

- **500 SABO Token** khi đăng ký thành công
- **200 SABO Token** khi giới thiệu bạn bè

## ❓ Gặp vấn đề?

Liên hệ hotline **0329 640 232** để được hỗ trợ.
    `,
  },
  'features/tournaments': {
    title: 'Hệ thống giải đấu',
    content: `
# Hệ thống Giải đấu SABO Arena

Tìm hiểu về các loại giải đấu và cách thức tham gia.

## 🏆 Các loại giải đấu

### 1. Giải đấu hàng tuần
- Diễn ra vào cuối tuần
- Phí tham gia: 50,000đ - 200,000đ
- Giải thưởng lên đến 5,000,000đ

### 2. Giải đấu mùa (Seasonal)
- 4 mùa trong năm
- Tích điểm xếp hạng
- Top 16 vào vòng chung kết

### 3. Giải đấu CLB
- Đối đầu giữa các CLB Billiards
- Format đồng đội

## 📋 Cách đăng ký

1. Mở app → Giải đấu
2. Chọn giải muốn tham gia
3. Nhấn "Đăng ký"
4. Thanh toán phí (nếu có)

## 🎯 Thể thức thi đấu

- **Vòng bảng**: 4 người/bảng, top 2 đi tiếp
- **Vòng loại trực tiếp**: Single Elimination
- **Chung kết**: Best of 5

## 💰 Giải thưởng

| Hạng | Giải thưởng |
|------|-------------|
| 🥇 Nhất | 50% tổng giải |
| 🥈 Nhì | 30% tổng giải |
| 🥉 Ba | 20% tổng giải |
    `,
  },
  'features/sabo-token': {
    title: 'SABO Token',
    content: `
# SABO Token ($SABO)

Hệ thống token thưởng của SABO Arena.

## 💰 SABO Token là gì?

**$SABO** là token thưởng của hệ sinh thái SABO Arena, cho phép người dùng nhận thưởng và quy đổi giá trị.

## 🎁 Cách nhận Token

### Hoạt động trong app
- Đăng ký tài khoản: **500 SABO**
- Giới thiệu bạn bè: **200 SABO/người**
- Hoàn thành profile: **100 SABO**

### Tham gia giải đấu
- Top 3: Thưởng thêm token
- Tham gia đủ 3 giải/tháng: **Bonus 300 SABO**

### Hoạt động cộng đồng
- Check-in hàng ngày: **10 SABO/ngày**
- Mời bạn bè xem match: **20 SABO**

## 💵 Quy đổi Token

- 1,000 SABO = 10,000 VNĐ
- Rút về ví Solana
- Mua vật phẩm trong shop

## 📈 Tokenomics

- **Tổng cung**: 1,000,000,000 SABO
- **Blockchain**: Solana
- **Contract**: [Xem trên Solscan](#)

## ⚠️ Lưu ý

Token chỉ sử dụng trong hệ sinh thái SABO Arena. Không phải tiền điện tử đầu tư.
    `,
  },
  'faq/general': {
    title: 'Câu hỏi thường gặp',
    content: `
# Câu hỏi thường gặp (FAQ)

## ❓ Tài khoản

### Làm sao để đổi số điện thoại?
Liên hệ hotline 0329 640 232 để được hỗ trợ đổi số.

### Quên mật khẩu thì làm sao?
SABO Arena sử dụng xác thực OTP, không cần mật khẩu. Chỉ cần số điện thoại.

### Làm sao để xóa tài khoản?
Vào Cài đặt → Tài khoản → Xóa tài khoản.

## 🏆 Giải đấu

### Phí đăng ký là bao nhiêu?
Tùy giải, từ 50,000đ đến 200,000đ. Một số giải miễn phí.

### Khi nào diễn ra giải đấu?
Phần lớn vào cuối tuần (Thứ 7, Chủ nhật).

### Làm sao để biết lịch thi đấu?
Xem trong tab "Giải đấu" trên app hoặc bật thông báo.

## 💰 SABO Token

### Token có giá trị thật không?
SABO Token có thể quy đổi thành tiền hoặc vật phẩm trong app.

### Làm sao để rút token?
Vào Ví → Rút → Nhập địa chỉ ví Solana.

## 📞 Hỗ trợ

- **Hotline**: 0329 640 232
- **Email**: support@saboarena.com
- **Fanpage**: fb.com/saboarena
    `,
  },
};

// Simple markdown renderer
function MarkdownContent({ content }: { content: string }) {
  // Very basic markdown parsing
  const lines = content.split('\n');
  
  return (
    <div className="prose prose-invert max-w-none">
      {lines.map((line, i) => {
        if (line.startsWith('# ')) {
          return <h1 key={i} className="text-3xl font-bold mb-6 text-foreground">{line.slice(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-2xl font-semibold mt-8 mb-4 text-foreground">{line.slice(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-xl font-medium mt-6 mb-3 text-foreground">{line.slice(4)}</h3>;
        }
        if (line.startsWith('- ')) {
          return <li key={i} className="text-muted-foreground ml-4">{line.slice(2)}</li>;
        }
        if (line.startsWith('|')) {
          return null; // Skip tables for now
        }
        if (line.trim() === '') {
          return <br key={i} />;
        }
        // Bold text
        const boldLine = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        return (
          <p 
            key={i} 
            className="text-muted-foreground mb-2"
            dangerouslySetInnerHTML={{ __html: boldLine }}
          />
        );
      })}
    </div>
  );
}

export default function DocsPortal() {
  const { category, slug } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Determine current doc
  const currentPath = category && slug ? `${category}/${slug}` : 'getting-started/introduction';
  const currentDoc = docsContent[currentPath] || docsContent['getting-started/introduction'];

  // Find current section for breadcrumb
  const currentSection = docsStructure.find(s => s.slug === category) || docsStructure[0];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="flex pt-16">
        {/* Sidebar */}
        <aside 
          className={`fixed lg:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-card border-r border-border transform transition-transform duration-200 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="p-4">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm docs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Navigation */}
            <ScrollArea className="h-[calc(100vh-12rem)]">
              <nav className="space-y-6">
                {docsStructure.map((section) => (
                  <div key={section.slug}>
                    <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                      <Book className="h-4 w-4" />
                      {section.title}
                    </h4>
                    <ul className="space-y-1 ml-6">
                      {section.items.map((item) => {
                        const isActive = currentPath === `${section.slug}/${item.slug}`;
                        return (
                          <li key={item.slug}>
                            <Link
                              to={`/docs/${section.slug}/${item.slug}`}
                              className={`block text-sm py-1.5 px-2 rounded transition-colors ${
                                isActive
                                  ? 'bg-primary/10 text-primary font-medium'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                              }`}
                            >
                              {item.title}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </nav>
            </ScrollArea>
          </div>
        </aside>

        {/* Mobile sidebar toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="fixed bottom-4 left-4 z-50 lg:hidden bg-primary text-primary-foreground shadow-lg"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-4rem)] lg:ml-0">
          <div className="max-w-3xl mx-auto px-6 py-8">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link to="/" className="hover:text-foreground flex items-center gap-1">
                <Home className="h-4 w-4" />
                Trang chủ
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link to="/docs" className="hover:text-foreground">
                Docs
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{currentSection.title}</span>
            </nav>

            {/* Content */}
            <article className="bg-card rounded-lg p-6 border border-border">
              <MarkdownContent content={currentDoc.content} />
            </article>

            {/* Footer navigation */}
            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={() => navigate(-1)}>
                ← Quay lại
              </Button>
              <Button variant="outline" asChild>
                <a href="tel:0329640232">
                  📞 Hotline: 0329 640 232
                </a>
              </Button>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
