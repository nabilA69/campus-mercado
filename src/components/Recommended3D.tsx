"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import type { ListingCardData } from "./ListingCard";
import { formatPrice } from "@/lib/format";

/**
 * Dramatic 3D "coverflow" slideshow for recommended listings.
 * Auto-advances every 10s, pauses on hover/touch, supports swipe + arrows + dots.
 * Built with pure CSS 3D transforms (no carousel library) to stay light on
 * slow Cuban connections, and it honours prefers-reduced-motion.
 */
const INTERVAL_MS = 10_000;

export default function Recommended3D({
  title,
  cards,
  freeLabel,
  featuredLabel,
}: {
  title: string;
  cards: ListingCardData[];
  freeLabel: string;
  featuredLabel: string;
}) {
  const locale = useLocale();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const n = cards.length;

  const go = useCallback(
    (dir: number) => setActive((i) => (i + dir + n) % n),
    [n],
  );

  useEffect(() => {
    if (n <= 1 || paused) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = setInterval(() => go(1), INTERVAL_MS);
    return () => clearInterval(id);
  }, [n, paused, go]);

  if (n === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold mb-3">{title}</h2>

      <div
        className="relative select-none"
        style={{ perspective: "1200px" }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={(e) => {
          setPaused(true);
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          const start = touchX.current;
          touchX.current = null;
          setPaused(false);
          if (start == null) return;
          const dx = e.changedTouches[0].clientX - start;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
      >
        <div className="relative h-[290px] sm:h-[330px] [transform-style:preserve-3d]">
          {cards.map((c, i) => {
            // shortest signed distance on the ring
            let off = i - active;
            if (off > n / 2) off -= n;
            if (off < -n / 2) off += n;
            const abs = Math.abs(off);
            const hidden = abs > 2;

            return (
              <a
                key={c.id}
                href={`/${locale}/listing/${c.id}`}
                aria-hidden={hidden}
                tabIndex={hidden ? -1 : 0}
                className="absolute left-1/2 top-0 block w-52 sm:w-60 rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-xl"
                style={{
                  transform: `translateX(-50%) translateX(${off * 58}%) translateZ(${-abs * 140}px) rotateY(${off * -38}deg) scale(${1 - abs * 0.06})`,
                  opacity: hidden ? 0 : 1 - abs * 0.25,
                  zIndex: 10 - abs,
                  pointerEvents: hidden ? "none" : "auto",
                  transition:
                    "transform 800ms cubic-bezier(.22,.61,.36,1), opacity 600ms ease",
                  filter: abs > 0 ? `brightness(${1 - abs * 0.12})` : undefined,
                }}
              >
                <div className="relative aspect-[4/3] bg-gray-100 flex items-center justify-center overflow-hidden">
                  {c.isFeatured && (
                    <span className="absolute top-2 left-2 z-10 rounded bg-amber-400 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 shadow">
                      ★ {featuredLabel}
                    </span>
                  )}
                  {c.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.imageUrl}
                      alt={c.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl text-gray-300">📦</span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold line-clamp-2">{c.title}</p>
                  <p className="mt-1 text-brand font-extrabold text-lg">
                    {formatPrice(c.priceAmount, c.currency, freeLabel)}
                  </p>
                  {c.campus && (
                    <p className="text-xs text-gray-400 truncate">{c.campus}</p>
                  )}
                </div>
              </a>
            );
          })}
        </div>

        {n > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="Previous"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/90 border border-gray-200 shadow flex items-center justify-center text-gray-600 hover:text-brand"
            >
              ‹
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/90 border border-gray-200 shadow flex items-center justify-center text-gray-600 hover:text-brand"
            >
              ›
            </button>
          </>
        )}
      </div>

      {n > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {cards.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setActive(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? "w-6 bg-brand" : "w-1.5 bg-gray-300"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
