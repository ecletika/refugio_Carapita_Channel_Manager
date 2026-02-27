/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    swcMinify: false,
    images: {
        unoptimized: true,
    },
};

module.exports = nextConfig;
