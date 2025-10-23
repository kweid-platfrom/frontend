// ============================================
// 1. Create URL Helper (utils/url.js)
// ============================================

export const getBaseUrl = () => {
  // Client-side
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Server-side
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  return 'http://localhost:3000';
};