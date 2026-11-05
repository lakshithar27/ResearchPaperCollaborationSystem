import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Disable the floating Next.js dev indicator ("N" icon) */
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
