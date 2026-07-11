import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ESLint is not run as part of the production build. TypeScript type-checking
  // stays enabled (typescript.ignoreBuildErrors is intentionally NOT set), so
  // `next build` still fails on real type errors. Lint is handled separately via
  // `next lint` to avoid the pre-existing project-wide no-explicit-any wall
  // blocking builds.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
