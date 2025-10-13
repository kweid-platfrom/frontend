import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No authorization code' }, { status: 400 });
  }

  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const redirectUri = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/api/auth/youtube/callback';

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

    return new NextResponse(`
      <html>
        <body style="font-family: Arial; padding: 40px;">
          <h2>✅ Success!</h2>
          <p>Copy this refresh token to your .env.local:</p>
          <textarea style="width: 100%; height: 100px; padding: 10px;">${tokens.refresh_token}</textarea>
          <p>Add: <code>YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}</code></p>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}