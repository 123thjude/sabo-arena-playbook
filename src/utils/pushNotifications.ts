/**
 * ============================================
 * 🔔 PUSH NOTIFICATIONS SERVICE
 * ============================================
 * 
 * Web Push Notifications for SABO ARENA
 */

// VAPID Public Key (replace with actual key from server)
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

// Check if push notifications are supported
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }
  
  const permission = await Notification.requestPermission();
  return permission;
}

// Register service worker and subscribe to push
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    console.warn('Push notifications not supported');
    return null;
  }
  
  try {
    // Request permission first
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return null;
    }
    
    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered:', registration);
    
    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    
    console.log('Push subscription:', subscription);
    
    // Send subscription to server
    await sendSubscriptionToServer(subscription);
    
    return subscription;
  } catch (error) {
    console.error('Error subscribing to push:', error);
    return null;
  }
}

// Unsubscribe from push
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      await removeSubscriptionFromServer(subscription);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    return false;
  }
}

// Check if user is subscribed
export async function isSubscribed(): Promise<boolean> {
  if (!isPushSupported()) return false;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
}

// Send local notification (for testing)
export function sendLocalNotification(title: string, options?: NotificationOptions) {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/favicon.png',
      badge: '/favicon.png',
      ...options,
    });
  }
}

// ============ HELPER FUNCTIONS ============

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

async function sendSubscriptionToServer(subscription: PushSubscription) {
  // TODO: Send to your backend API
  console.log('Sending subscription to server:', JSON.stringify(subscription));
  
  // Example:
  // await fetch('/api/push/subscribe', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(subscription),
  // });
}

async function removeSubscriptionFromServer(subscription: PushSubscription) {
  // TODO: Remove from your backend API
  console.log('Removing subscription from server:', subscription.endpoint);
  
  // Example:
  // await fetch('/api/push/unsubscribe', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ endpoint: subscription.endpoint }),
  // });
}

// ============ NOTIFICATION TEMPLATES ============

export const NotificationTemplates = {
  matchStarted: (matchId: string, player1: string, player2: string) => ({
    title: '🎱 Trận đấu bắt đầu!',
    body: `${player1} vs ${player2}`,
    data: { url: `/live-matches/${matchId}` },
  }),
  
  matchEnded: (winner: string, loser: string, score: string) => ({
    title: '🏆 Trận đấu kết thúc!',
    body: `${winner} thắng ${loser} với tỷ số ${score}`,
    data: { url: '/rankings' },
  }),
  
  newArticle: (title: string, slug: string) => ({
    title: '📰 Bài viết mới!',
    body: title,
    data: { url: `/news/${slug}` },
  }),
  
  tournamentReminder: (tournamentName: string, time: string) => ({
    title: '⏰ Nhắc nhở giải đấu',
    body: `${tournamentName} sẽ bắt đầu lúc ${time}`,
    data: { url: '/tournaments' },
  }),
  
  eloUpdate: (newElo: number, change: number) => ({
    title: change > 0 ? '📈 ELO tăng!' : '📉 ELO giảm',
    body: `ELO mới: ${newElo} (${change > 0 ? '+' : ''}${change})`,
    data: { url: '/profile' },
  }),
};
