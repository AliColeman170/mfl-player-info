/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    ppr: 'incremental',
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  images: {
    domains: ['d13e14gtps4iwl.cloudfront.net'],
    minimumCacheTTL: 2592000,
  },
};

module.exports = nextConfig;
