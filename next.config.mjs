// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals = config.externals || [];
    config.externals.push({ canvas: "commonjs canvas" });
    return config;
  },
};
export default nextConfig;
