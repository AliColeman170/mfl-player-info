/** @type {import('next').NextConfig} */
const nextConfig = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  images: {
    domains: ['d13e14gtps4iwl.cloudfront.net', 'app.playmfl.com'],
    minimumCacheTTL: 2592000,
  },
};

module.exports = nextConfig;
