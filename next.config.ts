import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Keep pages light for low-bandwidth (Cuba). Prefer WebP.
  images: {
    formats: ["image/webp"],
  },
};

export default withNextIntl(nextConfig);
