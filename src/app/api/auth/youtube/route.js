// app/api/auth/youtube/route.js
import { NextResponse } from 'next/server';
import { getBaseUrl } from '@/utils/url';

export async function GET() {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  
  // ✅ FIXED: Dynamic redirect URI
  const baseUrl = getBaseUrl();
  const redirectUri = `${baseUrl}/api/auth/youtube/callback`;

  if (!clientId) {
    return NextResponse.json({ 
      error: 'YouTube API not configured' 
    }, { status: 500 });
  }

  const scope = 'https://www.googleapis.com/auth/youtube.upload';
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');

  return NextResponse.redirect(authUrl.toString());
}
