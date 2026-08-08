"use client";

import { useEffect, useState } from "react";
import { LOGO_MARK_SRC } from "./Logo";

/**
 * Intro splash: the logo drops in and dangles from a string, then the overlay
 * fades away to reveal the page. Shown once per browser session so it never
 * becomes an obstacle — and skipped entirely for users who prefer reduced motion
 * (they get a brief fade instead). Total ~2.4s.
 */
const SESSION_KEY = "cm_splash_seen";

export default function SplashScreen() {
  // Start hidden; we only turn it on after confirming this is a fresh session.
  const [show, setShow] = useState(false);

  useEffect(() => {
    let seen = true;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      seen = false; // storage blocked — just show it
    }
    if (seen) return;

    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(true);
    const t = setTimeout(() => setShow(false), 2400);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div
      className="cm-splash fixed inset-0 z-[100] flex items-start justify-center bg-background"
      aria-hidden="true"
    >
      <div className="cm-drop mt-[22vh] flex flex-col items-center">
        {/* the "string" the logo hangs from */}
        <span className="cm-string block h-14 w-px bg-navy/25" />
        <div className="cm-swing origin-top">
          <span className="mx-auto mb-1 block h-2 w-2 rounded-full bg-navy/40" />
          <img
            src={LOGO_MARK_SRC}
            alt=""
            className="h-24 w-auto sm:h-28 drop-shadow-xl"
            decoding="async"
          />
        </div>
      </div>
    </div>
  );
}
