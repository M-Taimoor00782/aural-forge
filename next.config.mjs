/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      beforeFiles: [{
        source: "/",
        has: [{ type: "query", key: "family", value: "(?<family>earbuds|product-03)" }],
        destination: "/product-view/:family",
      }],
    };
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
