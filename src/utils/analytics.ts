/**
 * ============================================
 * 📊 GOOGLE ANALYTICS 4 - EVENT TRACKING
 * ============================================
 * 
 * Track user behavior for better insights
 */

// GA4 Measurement ID
const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // Replace with actual ID

// Initialize GA4
export function initGA() {
  if (typeof window === 'undefined') return;
  
  // Load gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  window.gtag = gtag;
  
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    page_title: document.title,
    page_location: window.location.href,
  });
}

// Track page views (for SPA)
export function trackPageView(pagePath: string, pageTitle: string) {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: pagePath,
    page_title: pageTitle,
  });
}

// ============ CUSTOM EVENTS ============

// User engagement events
export const trackEvent = {
  // User actions
  userSignUp: (method: string) => {
    window.gtag?.('event', 'sign_up', { method });
  },
  
  userLogin: (method: string) => {
    window.gtag?.('event', 'login', { method });
  },
  
  // Content engagement
  articleView: (articleId: string, articleTitle: string) => {
    window.gtag?.('event', 'article_view', {
      article_id: articleId,
      article_title: articleTitle,
    });
  },
  
  articleShare: (articleId: string, platform: string) => {
    window.gtag?.('event', 'share', {
      content_type: 'article',
      item_id: articleId,
      method: platform,
    });
  },
  
  searchQuery: (query: string, resultsCount: number) => {
    window.gtag?.('event', 'search', {
      search_term: query,
      results_count: resultsCount,
    });
  },
  
  // Match/Tournament events
  matchView: (matchId: string) => {
    window.gtag?.('event', 'match_view', { match_id: matchId });
  },
  
  tournamentJoin: (tournamentId: string, tournamentName: string) => {
    window.gtag?.('event', 'tournament_join', {
      tournament_id: tournamentId,
      tournament_name: tournamentName,
    });
  },
  
  // Club events
  clubView: (clubId: string, clubName: string) => {
    window.gtag?.('event', 'club_view', {
      club_id: clubId,
      club_name: clubName,
    });
  },
  
  clubContact: (clubId: string, contactType: string) => {
    window.gtag?.('event', 'club_contact', {
      club_id: clubId,
      contact_type: contactType,
    });
  },
  
  // Rankings events
  rankingsFilter: (filterType: string, filterValue: string) => {
    window.gtag?.('event', 'rankings_filter', {
      filter_type: filterType,
      filter_value: filterValue,
    });
  },
  
  playerProfileView: (playerId: string) => {
    window.gtag?.('event', 'player_view', { player_id: playerId });
  },
  
  // App download CTA
  appDownloadClick: (platform: 'ios' | 'android') => {
    window.gtag?.('event', 'app_download_click', { platform });
  },
  
  // Scroll depth
  scrollDepth: (depth: number, pagePath: string) => {
    window.gtag?.('event', 'scroll_depth', {
      depth_percentage: depth,
      page_path: pagePath,
    });
  },
  
  // Time on page
  timeOnPage: (seconds: number, pagePath: string) => {
    window.gtag?.('event', 'time_on_page', {
      engagement_time: seconds,
      page_path: pagePath,
    });
  },
  
  // CTA clicks
  ctaClick: (ctaName: string, ctaLocation: string) => {
    window.gtag?.('event', 'cta_click', {
      cta_name: ctaName,
      cta_location: ctaLocation,
    });
  },
  
  // Error tracking
  errorOccurred: (errorType: string, errorMessage: string) => {
    window.gtag?.('event', 'error', {
      error_type: errorType,
      error_message: errorMessage,
    });
  },
};

// ============ SCROLL TRACKING ============

export function initScrollTracking() {
  if (typeof window === 'undefined') return;
  
  const depths = [25, 50, 75, 100];
  const tracked: Set<number> = new Set();
  
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.round((scrollTop / docHeight) * 100);
    
    depths.forEach(depth => {
      if (scrollPercent >= depth && !tracked.has(depth)) {
        tracked.add(depth);
        trackEvent.scrollDepth(depth, window.location.pathname);
      }
    });
  }, { passive: true });
}

// ============ TIME ON PAGE TRACKING ============

export function initTimeTracking() {
  if (typeof window === 'undefined') return;
  
  const startTime = Date.now();
  const thresholds = [30, 60, 120, 300]; // seconds
  const tracked: Set<number> = new Set();
  
  const checkTime = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    
    thresholds.forEach(threshold => {
      if (elapsed >= threshold && !tracked.has(threshold)) {
        tracked.add(threshold);
        trackEvent.timeOnPage(threshold, window.location.pathname);
      }
    });
  };
  
  setInterval(checkTime, 5000);
  
  // Track on page leave
  window.addEventListener('beforeunload', () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    trackEvent.timeOnPage(elapsed, window.location.pathname);
  });
}

// Type declarations
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}
