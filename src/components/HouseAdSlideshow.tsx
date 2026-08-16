"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * House ads: a 3D rotating slideshow that fills the top banner slot until real
 * paid advertisers are booked. Each slide promotes one of the site's own value
 * propositions. Pure CSS/SVG — no images to download, which matters on slow
 * Cuban connections.
 */

type Slide = {
  key: string;
  href: string;
  external?: boolean;
  /** tailwind gradient classes */
  bg: string;
  icon: string;
};

const SLIDES: Slide[] = [
  {
    key: "free",
    href: "/post",
    bg: "from-[#6cb023] via-[#5a9a1b] to-[#3f7a10]",
    icon: "🏷️",
  },
  {
    key: "verified",
    href: "/register",
    bg: "from-[#2b5290] via-[#13315f] to-[#0b1f3f]",
    icon: "🎓",
  },
  {
    key: "boost",
    href: "/account/listings",
    bg: "from-[#f0b429] via-[#de911d] to-[#b44d12]",
    icon: "⭐",
  },
  {
    key: "everything",
    href: "/",
    bg: "from-[#0f766e] via-[#115e59] to-[#134e4a]",
    icon: "📚",
  },
  {
    key: "advertise",
    href: "mailto:ads@campusmercado.shop",
    external: true,
    bg: "from-[#7c3aed] via-[#5b21b6] to-[#3b0764]",
    icon: "📣",
  },
];

const INTERVAL = 5000;

export default function HouseAdSlideshow() {
  const t = useTranslations("houseAds");
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setI((n) => (n + 1) % SLIDES.length), INTERVAL);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <div
      className="ha-stage relative h-32 sm:h-36 w-full select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      {SLIDES.map((s, idx) => {
        const offset = idx - i;
        const isActive = offset === 0;
        // slides live on a 3D carousel: the active one faces you, the rest are
        // rotated away to the sides
        const rotate = isActive ? 0 : offset > 0 ? 65 : -65;
        const translate = isActive ? 0 : offset > 0 ? 40 : -40;

        const inner = (
          <div
            className={`flex h-full w-full items-center gap-3 rounded-xl bg-gradient-to-br ${s.bg} px-4 sm:px-6 text-white shadow-lg`}
          >
            <span className="ha-icon text-3xl sm:text-4xl drop-shadow-lg" aria-hidden>
              {s.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base sm:text-lg font-extrabold leading-tight drop-shadow">
                {t(`${s.key}.title`)}
              </span>
              <span className="mt-0.5 block text-xs sm:text-sm text-white/85 leading-snug">
                {t(`${s.key}.text`)}
              </span>
            </span>
            <span className="hidden sm:inline-flex shrink-0 items-center rounded-md bg-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur-sm ring-1 ring-white/30">
              {t(`${s.key}.cta`)}
            </span>
          </div>
        );

        const style: React.CSSProperties = {
          transform: `perspective(1000px) rotateY(${rotate}deg) translateX(${translate}%) scale(${isActive ? 1 : 0.88})`,
          opacity: isActive ? 1 : 0,
          pointerEvents: isActive ? "auto" : "none",
          zIndex: isActive ? 2 : 1,
        };

        return (
          <div
            key={s.key}
            className="ha-slide absolute inset-0"
            style={style}
            aria-hidden={!isActive}
          >
            {s.external ? (
              <a href={s.href} className="block h-full">
                {inner}
              </a>
            ) : (
              <Link href={s.href} className="block h-full">
                {inner}
              </Link>
            )}
          </div>
        );
      })}

      {/* dots */}
      <div className="absolute -bottom-3 left-0 right-0 z-10 flex justify-center gap-1.5">
        {SLIDES.map((s, idx) => (
          <button
            key={s.key}
            onClick={() => setI(idx)}
            aria-label={`${idx + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              idx === i ? "w-5 bg-navy" : "w-1.5 bg-navy/25 hover:bg-navy/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
