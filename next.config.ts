import type { NextConfig } from "next";
import * as packageJson from "./package.json";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: ["a.dev.yhw.tw", "b.dev.yhw.tw"],
  env: {
    NEXT_VERSION: packageJson.dependencies.next,
    CCM_VERSION: packageJson.version,
  },
};

export default nextConfig;
