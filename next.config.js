/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Tối ưu performance cho development
  swcMinify: true,
  experimental: {
    // Tối ưu memory usage
    optimizePackageImports: ['@mui/material', '@mui/icons-material']
  },
  images: {
    domains: [
      'm.media-amazon.com',
      'lh3.googleusercontent.com',
      'firebasestorage.googleapis.com',
      'file.hstatic.net',
      'theme.hstatic.net',
      'static.id.gtech.asia'
    ]
  },
  webpack: (config, { isServer, dev }) => {
    // Exclude bcrypt from client-side bundle
    if (!isServer) {
      config.externals = config.externals || [];
      config.externals.push('bcrypt');
    }

    // Tối ưu cho development - enable hot reload
    if (dev) {
      config.watchOptions = {
        poll: 1000, // Enable polling cho Windows
        aggregateTimeout: 300,
        ignored: /node_modules/
      };

      // Ensure hot reload works properly
      config.cache = false;
    }

    return config;
  }
};

module.exports = nextConfig;
