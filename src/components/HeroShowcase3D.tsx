"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * The landing hero's moving panel: six CSS 3D scenes on a 3 second rotation,
 * swipeable by hand.
 *
 * No animation library. Every scene is transform and opacity keyframes, which
 * cost nothing to download and stay on the compositor — the deciding factor
 * for a student on Cuban mobile data.
 *
 * Only the visible slide animates. The other five carry data-off, which pauses
 * their keyframes, so a cheap phone composites one scene rather than six.
 */

const INTERVAL_MS = 3000;
/** Horizontal travel, in px, that counts as a swipe rather than a tap. */
const SWIPE_PX = 40;
/** How long auto-advance stays out of the way after a deliberate swipe. */
const RESUME_MS = 9000;

type Scene = { id: string; label: string; node: React.ReactNode };

const sea = "linear-gradient(150deg,var(--brand),var(--brand-dark))";
const seaDeep = "linear-gradient(150deg,var(--navy),var(--navy-dark))";
const turquesa = "linear-gradient(150deg,var(--turquesa),#0b8ea0)";
const sol = "linear-gradient(150deg,var(--sol),#e0a018)";
const coral = "linear-gradient(150deg,var(--coral),#d94436)";
const leaf = "linear-gradient(150deg,var(--leaf),#4f8a14)";

/** Each scene draws from the same six fills, so the set reads as one family. */
const FILLS = [turquesa, coral, sol, leaf, sea, seaDeep];

export default function HeroShowcase3D() {
  const t = useTranslations("hero3d");

  const scenes: Scene[] = [
    {
      id: "tunnel",
      label: t("tunnel"),
      node: (
        <div className="hx-tunnel">
          {[-7, 5, -3, 8, -5, 2].map((r, i) => (
            <i
              key={i}
              style={
                {
                  "--d": `${i * 0.85}s`,
                  "--r": `${r}deg`,
                  background: FILLS[i],
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      ),
    },
    {
      id: "ring",
      label: t("ring"),
      node: (
        <div className="hx-ring">
          {[t("cLibros"), t("cBici"), t("cLaptop"), t("cCuarto"), t("cTutor"), t("cRopa")].map(
            (name, i) => (
              <b
                key={name}
                style={
                  {
                    "--a": `${i * 60}deg`,
                    background: FILLS[i],
                    color: i === 2 ? "#4a3300" : "#fff",
                  } as React.CSSProperties
                }
              >
                {name}
              </b>
            ),
          )}
        </div>
      ),
    },
    {
      id: "tower",
      label: t("tower"),
      node: (
        <div className="hx-tower">
          {[0, 1, 2, 3, 4].map((i) => (
            <i
              key={i}
              style={
                {
                  "--z": `${i * 22}px`,
                  "--d": `${i * 0.35}s`,
                  background: FILLS[i],
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      ),
    },
    {
      id: "cart",
      label: t("cart"),
      node: (
        <div className="hx-cart">
          <span className="hx-goods">
            {[
              { p: "translate3d(-40px,0,16px)", d: "0s", bg: coral },
              { p: "translate3d(-8px,-6px,22px)", d: ".4s", bg: sol },
              { p: "translate3d(22px,2px,10px)", d: ".8s", bg: leaf },
            ].map((g, i) => (
              <i
                key={i}
                style={
                  { "--p": g.p, "--d": g.d, background: g.bg } as React.CSSProperties
                }
              />
            ))}
          </span>
          <span className="hx-basket">
            <i style={{ inset: 0, transform: "translateZ(30px)", background: sea }} />
            <i style={{ inset: 0, transform: "translateZ(-30px)", background: sea }} />
            <i
              style={{
                left: 0,
                top: 0,
                width: 60,
                height: 66,
                transform: "rotateY(90deg) translateZ(56px)",
                background: seaDeep,
              }}
            />
            <i
              style={{
                left: 0,
                top: 0,
                width: 60,
                height: 66,
                transform: "rotateY(-90deg) translateZ(56px)",
                background: seaDeep,
              }}
            />
            <i
              style={{
                left: 0,
                bottom: 0,
                width: 112,
                height: 60,
                transform: "rotateX(90deg) translateZ(-3px)",
                background: seaDeep,
              }}
            />
          </span>
          <span className="hx-wheel" style={{ left: 28 }} />
          <span className="hx-wheel" style={{ right: 28 }} />
        </div>
      ),
    },
    {
      id: "box",
      label: t("box"),
      node: (
        <div className="hx-box">
          <span className="hx-pops">
            {[
              { p: "translate3d(-42px,-46px,30px)", d: "0s", bg: coral },
              { p: "translate3d(-4px,-66px,44px)", d: ".12s", bg: sol },
              { p: "translate3d(36px,-48px,26px)", d: ".24s", bg: leaf },
              { p: "translate3d(12px,-82px,36px)", d: ".36s", bg: turquesa },
            ].map((g, i) => (
              <i
                key={i}
                style={
                  { "--p": g.p, "--d": g.d, background: g.bg } as React.CSSProperties
                }
              />
            ))}
          </span>
          <i style={{ transform: "translateZ(58px)", background: sea }} />
          <i style={{ transform: "rotateY(180deg) translateZ(58px)", background: sea }} />
          <i
            style={{
              width: 116,
              transform: "rotateY(90deg) translateZ(58px)",
              background: seaDeep,
            }}
          />
          <i
            style={{
              width: 116,
              transform: "rotateY(-90deg) translateZ(58px)",
              background: seaDeep,
            }}
          />
          <span className="hx-lid" style={{ background: turquesa }} />
        </div>
      ),
    },
    {
      id: "coins",
      label: t("coins"),
      node: (
        <div className="hx-coins">
          {[
            { l: "14%", dur: "3.4s", d: "0s", bg: sol, fg: "#5c4300", br: "#ffe9ad" },
            { l: "40%", dur: "4.1s", d: ".7s", bg: turquesa, fg: "#053b44", br: "#bdf0f7" },
            { l: "66%", dur: "3.1s", d: "1.4s", bg: sol, fg: "#5c4300", br: "#ffe9ad" },
            { l: "26%", dur: "4.6s", d: "2.1s", bg: coral, fg: "#5c1a12", br: "#ffd2cb" },
            { l: "80%", dur: "3.8s", d: "2.6s", bg: sol, fg: "#5c4300", br: "#ffe9ad" },
          ].map((c, i) => (
            <i
              key={i}
              style={
                {
                  left: c.l,
                  "--dur": c.dur,
                  "--d": c.d,
                  background: c.bg,
                  color: c.fg,
                  border: `2px solid ${c.br}`,
                } as React.CSSProperties
              }
            >
              $
            </i>
          ))}
        </div>
      ),
    },
  ];

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startX = useRef<number | null>(null);

  const go = useCallback(
    (next: number) => setIndex((next + scenes.length) % scenes.length),
    [scenes.length],
  );

  /** A deliberate interaction wins; auto-advance returns once they stop. */
  const takeOver = useCallback((next: number) => {
    setIndex((cur) => (next + 6) % 6);
    setPaused(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setPaused(false), RESUME_MS);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => go(index + 1), INTERVAL_MS);
    return () => clearInterval(id);
  }, [index, paused, go]);

  useEffect(
    () => () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    },
    [],
  );

  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
  }
  function onPointerUp(e: React.PointerEvent) {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) < SWIPE_PX) return;
    takeOver(index + (dx < 0 ? 1 : -1));
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label={t("label")}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (startX.current = null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") takeOver(index + 1);
          if (e.key === "ArrowLeft") takeOver(index - 1);
        }}
        /* touch-action keeps vertical page scrolling while we read the X axis */
        className="hx-stage relative h-[260px] touch-pan-y select-none overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-brand/5 via-white to-turquesa/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:h-[300px]"
      >
        {scenes.map((s, i) => (
          <div
            key={s.id}
            data-off={i !== index}
            aria-hidden={i !== index}
            className={`hx-slide absolute inset-0 grid place-items-center transition-opacity duration-500 ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            {s.node}
          </div>
        ))}

        <p className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-xs font-semibold text-navy/55">
          {scenes[index].label}
        </p>
      </div>

      <div className="mt-3 flex justify-center gap-2">
        {scenes.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => takeOver(i)}
            aria-label={s.label}
            aria-current={i === index}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-7 bg-brand" : "w-2 bg-gray-300 hover:bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
