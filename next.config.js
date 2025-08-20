/** @type {import('next').NextConfig} */
const nextConfig = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  images: {
    remotePatterns: [
      new URL('https://d13e14gtps4iwl.cloudfront.net/**'),
      new URL('https://app.playmfl.com/**'),
    ],
    minimumCacheTTL: 2592000,
  },
};

module.exports = nextConfig;
