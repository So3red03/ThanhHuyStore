/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
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
  webpack: (config, { isServer }) => {
    // Exclude bcrypt from client-side bundle
    if (!isServer) {
      config.externals = config.externals || [];
      config.externals.push('bcrypt');
    }

    return config;
  }
};

module.exports = nextConfig;
