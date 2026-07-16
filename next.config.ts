import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const isSitesStatic = process.env.SITES_STATIC === "true";

const nextConfig: NextConfig = {
  ...(isGitHubPages || isSitesStatic
    ? {
        output: "export" as const,
        ...(isGitHubPages
          ? {
              basePath: "/AFFL_Wrapped",
              assetPrefix: "/AFFL_Wrapped/",
            }
          : {}),
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
