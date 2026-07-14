import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  ...(isGitHubPages
    ? {
        output: "export" as const,
        basePath: "/AFFL_Wrapped",
        assetPrefix: "/AFFL_Wrapped/",
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
