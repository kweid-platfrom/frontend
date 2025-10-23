// app/api/auth/youtube/callback/route.js
import { NextResponse } from 'next/server';
import { getBaseUrl } from '@/utils/url';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Check if user denied access
  if (error) {
    return new NextResponse(`
      <html>
        <body style="font-family: Arial; padding: 40px;">
          <h2>❌ Authorization Error</h2>
          <p>Error: ${error}</p>
          <p>${searchParams.get('error_description') || 'User denied access'}</p>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  }

  if (!code) {
    return NextResponse.json({ 
      error: 'No authorization code' 
    }, { status: 400 });
  }

  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  
  const baseUrl = getBaseUrl();
  const redirectUri = `${baseUrl}/api/auth/youtube/callback`;

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokens = await response.json();

    // ✅ CRITICAL: Check if Google returned an error
    if (tokens.error) {
      return new NextResponse(`
        <html>
          <body style="font-family: Arial; padding: 40px;">
            <h2>❌ Token Exchange Failed</h2>
            <p><strong>Error:</strong> ${tokens.error}</p>
            <p><strong>Description:</strong> ${tokens.error_description || 'Unknown error'}</p>
            <hr>
            <h3>Common Solutions:</h3>
            <ul>
              <li>The authorization code may have already been used (codes expire after first use)</li>
              <li>The redirect_uri might not match what's configured in Google Console</li>
              <li>Try the authorization flow again from the beginning</li>
            </ul>
            <p><a href="/api/auth/youtube">Click here to try again</a></p>
          </body>
        </html>
      `, { 
        headers: { 'Content-Type': 'text/html' },
        status: 400 
      });
    }

    // ✅ Check if refresh_token is missing
    if (!tokens.refresh_token) {
      return new NextResponse(`
        <html>
          <body style="font-family: Arial; padding: 40px;">
            <h2>⚠️ No Refresh Token Received</h2>
            <p>Google returned tokens but no refresh_token.</p>
            <p><strong>This usually means:</strong></p>
            <ul>
              <li>You've already authorized this app before</li>
              <li>Google won't issue a new refresh_token unless you revoke access first</li>
            </ul>
            <hr>
            <h3>Solution:</h3>
            <ol>
              <li>Go to <a href="https://myaccount.google.com/permissions" target="_blank">Google Account Permissions</a></li>
              <li>Find your app and click "Remove Access"</li>
              <li>Then <a href="/api/auth/youtube">try again</a></li>
            </ol>
            <hr>
            <p><small>Access Token (for debugging): ${tokens.access_token?.substring(0, 50)}...</small></p>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    return new NextResponse(`
      <html>
        <body style="font-family: Arial; padding: 40px;">
          <h2>✅ Success!</h2>
          <p>Copy this refresh token to your .env.local:</p>
          <textarea style="width: 100%; height: 100px; padding: 10px; font-family: monospace;">${tokens.refresh_token}</textarea>
          <br><br>
          <p>Add this line to your <code>.env.local</code> file:</p>
          <pre style="background: #f5f5f5; padding: 10px;">YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}</pre>
          <p style="color: #666; font-size: 14px;">⚠️ Keep this token secure! Anyone with this token can upload videos to your YouTube channel.</p>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });

  } catch (error) {
    return new NextResponse(`
      <html>
        <body style="font-family: Arial; padding: 40px;">
          <h2>❌ Server Error</h2>
          <p>${error.message}</p>
          <p><a href="/api/auth/youtube">Try again</a></p>
        </body>
      </html>
    `, { 
      headers: { 'Content-Type': 'text/html' },
      status: 500 
    });
  }
}