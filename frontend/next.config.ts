import type { NextConfig } from "next";

// STATIC_EXPORT=1 gera o site estático em out/ (publicação no Render); sem ela, build normal para `next start`
const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  agentRules: false,
  ...(staticExport && { output: "export", trailingSlash: true }),
};

export default nextConfig;
