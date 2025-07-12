/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Tối ưu performance cho development
  swcMinify: true,
  experimental: {
    // Sử dụng Turbopack khi có thể
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js'
        }
      }
    },
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

    // Tối ưu cho development - chỉ dùng polling khi cần thiết
    if (dev) {
      config.watchOptions = {
        // Chỉ dùng polling trên Windows nếu có vấn đề với file watching
        // poll: 1000, // Bỏ comment này nếu gặp vấn đề file watching
        aggregateTimeout: 300,
        ignored: /node_modules/
      };
    }

    return config;
  }
};

module.exports = nextConfig;
