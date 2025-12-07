import { Helmet } from 'react-helmet-async';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSchemaProps {
  faqs: FAQItem[];
  pageUrl?: string;
}

/**
 * FAQ Schema Component for Rich Snippets
 * Helps Google display FAQ rich results in search
 */
export default function FAQSchema({ faqs, pageUrl }: FAQSchemaProps) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </script>
    </Helmet>
  );
}

// Pre-defined FAQs for common pages
export const PAGE_FAQS = {
  home: [
    {
      question: "SABO ARENA là gì?",
      answer: "SABO ARENA là nền tảng thi đấu bi-a trực tuyến #1 Việt Nam. Cho phép người chơi theo dõi điểm số, xếp hạng ELO, tham gia giải đấu và kết nối cộng đồng bi-a."
    },
    {
      question: "Làm sao để tham gia SABO ARENA?",
      answer: "Bạn có thể tải app SABO ARENA miễn phí trên App Store hoặc Google Play, đăng ký tài khoản và bắt đầu theo dõi các trận đấu, giải đấu ngay lập tức."
    },
    {
      question: "ELO trong bi-a là gì?",
      answer: "ELO là hệ thống xếp hạng điểm số được sử dụng để đánh giá trình độ người chơi bi-a. Điểm ELO tăng khi thắng và giảm khi thua, phụ thuộc vào trình độ đối thủ."
    },
    {
      question: "SABO ARENA có miễn phí không?",
      answer: "Có! SABO ARENA hoàn toàn miễn phí để tải và sử dụng. Bạn có thể theo dõi xếp hạng, xem trận đấu trực tiếp và tham gia cộng đồng mà không mất phí."
    },
    {
      question: "Làm sao để leo rank trong SABO ARENA?",
      answer: "Để leo rank, bạn cần thắng các trận đấu được ghi nhận trên hệ thống. Thắng đối thủ có ELO cao hơn sẽ được nhiều điểm hơn. Chơi đều đặn và cải thiện kỹ năng là chìa khóa."
    }
  ],
  rankings: [
    {
      question: "Bảng xếp hạng bi-a cập nhật khi nào?",
      answer: "Bảng xếp hạng ELO trên SABO ARENA được cập nhật real-time sau mỗi trận đấu. Bạn có thể xem thay đổi ngay khi trận đấu kết thúc."
    },
    {
      question: "ELO được tính như thế nào?",
      answer: "ELO được tính dựa trên kết quả trận đấu và chênh lệch điểm với đối thủ. Thắng đối thủ mạnh hơn = nhiều điểm hơn. Công thức chuẩn quốc tế được áp dụng."
    },
    {
      question: "Làm sao để vào Top 100?",
      answer: "Để vào Top 100, bạn cần tích lũy đủ điểm ELO thông qua việc thắng nhiều trận đấu. Chơi thường xuyên, thắng các đối thủ mạnh sẽ giúp bạn leo rank nhanh hơn."
    }
  ],
  clubs: [
    {
      question: "Làm sao tìm quán bi-a gần tôi?",
      answer: "Vào trang Clubs trên SABO ARENA, cho phép truy cập vị trí và hệ thống sẽ hiển thị các quán bi-a gần bạn nhất, kèm đánh giá và thông tin chi tiết."
    },
    {
      question: "Quán bi-a nào tốt nhất ở TP.HCM?",
      answer: "SABO ARENA có danh sách và đánh giá các quán bi-a hàng đầu tại TP.HCM. Xem review từ cộng đồng để chọn quán phù hợp với nhu cầu của bạn."
    },
    {
      question: "Làm sao đăng ký quán bi-a lên SABO ARENA?",
      answer: "Chủ quán có thể liên hệ team SABO ARENA qua email hoặc hotline để đăng ký quán. Chúng tôi sẽ xác minh và thêm quán vào hệ thống miễn phí."
    }
  ],
  blog: [
    {
      question: "Người mới nên học chơi bi-a như thế nào?",
      answer: "Người mới nên bắt đầu với tư thế cầm cơ đúng, học cách đánh thẳng, hiểu góc phản xạ. Đọc các bài hướng dẫn trên blog SABO ARENA để nắm kiến thức cơ bản."
    },
    {
      question: "Luật chơi bi-a 8 bi như thế nào?",
      answer: "Bi-a 8 bi: Mỗi người chơi chọn nhóm bi (trơn 1-7 hoặc sọc 9-15), phải đánh hết bi của mình rồi mới được đánh bi số 8 để thắng. Chi tiết xem bài luật chơi 8-ball."
    },
    {
      question: "Cách đánh bi-a xoáy?",
      answer: "Đánh xoáy bằng cách đánh lệch tâm bi cái: đánh cao = top spin (bi chạy tiếp), đánh thấp = back spin (bi kéo về), đánh hai bên = side spin. Cần luyện tập nhiều."
    }
  ]
};

// HowTo Schema for tutorial articles
interface HowToStep {
  name: string;
  text: string;
  image?: string;
}

interface HowToSchemaProps {
  name: string;
  description: string;
  totalTime?: string;
  steps: HowToStep[];
  image?: string;
}

export function HowToSchema({ name, description, totalTime, steps, image }: HowToSchemaProps) {
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": name,
    "description": description,
    "totalTime": totalTime,
    "image": image,
    "step": steps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.name,
      "text": step.text,
      "image": step.image
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(howToSchema)}
      </script>
    </Helmet>
  );
}

// Breadcrumb Schema
interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
    </Helmet>
  );
}

// Article Schema for blog posts
interface ArticleSchemaProps {
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  url: string;
}

export function ArticleSchema({ 
  headline, 
  description, 
  image, 
  datePublished, 
  dateModified,
  author = 'SABO ARENA Team',
  url 
}: ArticleSchemaProps) {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": headline,
    "description": description,
    "image": image,
    "datePublished": datePublished,
    "dateModified": dateModified || datePublished,
    "author": {
      "@type": "Organization",
      "name": author,
      "url": "https://saboarena.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "SABO ARENA",
      "logo": {
        "@type": "ImageObject",
        "url": "https://saboarena.com/favicon.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(articleSchema)}
      </script>
    </Helmet>
  );
}
