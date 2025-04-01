
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
    ],
  },
};
