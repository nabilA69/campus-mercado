"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { LOGO_MARK_SRC } from "./Logo";

/**
 * Intro splash. Rendered in the SERVER HTML (initial state = visible) so it covers
 * the page from the very first paint — otherwise it would flash in after hydration,
 * i.e. after the user already saw the home page.
 *
 * Dismissal is connection-aware: it waits for the page to finish loading, but never
 * shorter than MIN_MS and never longer than MAX_MS.
 *
 * Repeat visits in the same session skip it entirely — an inline script in the
 * layout sets html[data-splash="seen"], which hides it via CSS before paint.
 */
const MIN_MS = 15_000;
const MAX_MS = 20_000;
const SESSION_KEY = "cm_splash_seen";

export default function SplashScreen() {
  const t = useTranslations("splash");
  const [gone, setGone] = useState(false);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      /* storage blocked — treat as unseen */
    }
    if (seen) {
      setGone(true);
      return;
    }
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }

    const started = performance.now();
    let minTimer: ReturnType<typeof setTimeout>;
    let fadeTimer: ReturnType<typeof setTimeout>;

    const dismiss = () => {
      setHiding(true); // play the fade, then unmount
      fadeTimer = setTimeout(() => setGone(true), 450);
    };

    const onReady = () => {
      const elapsed = performance.now() - started;
      minTimer = setTimeout(dismiss, Math.max(0, MIN_MS - elapsed));
    };

    if (document.readyState === "complete") onReady();
    else window.addEventListener("load", onReady, { once: true });

    // hard stop so a stalled asset can never trap the user
    const hardStop = setTimeout(dismiss, MAX_MS);

    return () => {
      clearTimeout(minTimer);
      clearTimeout(fadeTimer);
      clearTimeout(hardStop);
      window.removeEventListener("load", onReady);
    };
  }, []);

  if (gone) return null;

  const word = t("loading");

  return (
    <div
      className={`cm-splash fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background ${hiding ? "is-hiding" : ""}`}
      role="status"
      aria-live="polite"
    >
      {/* dangling logo */}
      <div className="cm-drop flex flex-col items-center">
        <span className="cm-string block h-16 w-px bg-navy/25" />
        <div className="cm-swing flex flex-col items-center">
          <span className="mb-1 block h-2 w-2 rounded-full bg-navy/40" />
          <img
            src={LOGO_MARK_SRC}
            alt=""
            className="cm-float h-24 w-auto sm:h-28 drop-shadow-2xl"
            decoding="async"
          />
        </div>
      </div>

      {/* 3D flipping "Loading…" */}
      <div className="cm-word mt-10 flex gap-[2px]">
        {word.split("").map((ch, i) => (
          <span
            key={i}
            className="cm-letter text-xl sm:text-2xl font-extrabold text-navy"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            {ch === " " ? " " : ch}
          </span>
        ))}
      </div>

      {/* progress track */}
      <div className="mt-6 h-1.5 w-48 overflow-hidden rounded-full bg-navy/10">
        <span className="cm-progress block h-full w-full rounded-full bg-brand" />
      </div>
    </div>
  );
}
