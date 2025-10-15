/** @type {import('next').NextConfig} */
module.exports = {
  env: {
    FIREBASE_ENV: process.env.NODE_ENV === 'development' ? 'development' : 'production',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com', // ✅ add this line
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com', // ✅ optional: also used for YouTube thumbnails
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};
