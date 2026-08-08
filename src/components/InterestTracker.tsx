"use client";

import { useEffect } from "react";

// Records the category the user just viewed into a lightweight cookie, so the
// homepage can recommend similar products. Most-recent-first, deduped, capped at 5.
export default function InterestTracker({ slug }: { slug: string }) {
  useEffect(() => {
    try {
      const KEY = "cm_interests";
      const raw = document.cookie
        .split("; ")
        .find((c) => c.startsWith(KEY + "="));
      const current = raw
        ? decodeURIComponent(raw.split("=")[1]).split(",").filter(Boolean)
        : [];
      const next = [slug, ...current.filter((s) => s !== slug)].slice(0, 5);
      document.cookie = `${KEY}=${encodeURIComponent(next.join(","))}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
    } catch {
      /* cookies unavailable — ignore */
    }
  }, [slug]);

  return null;
}
