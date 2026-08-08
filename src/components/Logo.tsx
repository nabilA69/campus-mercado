/**
 * CampusMercado identity — a geometric "CM" monogram built from the brand name itself.
 * The C is an open ring that cradles the M, suggesting a campus community enclosing
 * its marketplace. Drawn as pure vector paths (no font dependency), inline so it
 * costs zero extra requests — important on slow Cuban connections.
 */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      role="img"
      aria-label="CampusMercado"
    >
      <rect width="40" height="40" rx="11" fill="var(--brand, #0d7d5a)" />
      {/* C — open ring */}
      <path
        d="M20.5 12.2A9 9 0 1 0 20.5 27.8"
        fill="none"
        stroke="#fff"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      {/* M — nested in the C's opening */}
      <path
        d="M23 27.5V14l5 7 5-7v13.5"
        fill="none"
        stroke="#fff"
        strokeWidth="3.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Logo lockup. The wordmark appears when there's room for it:
 *  - phone in portrait  -> monogram only ("CM")
 *  - phone in landscape -> monogram + "CampusMercado"
 *  - tablets / desktop  -> monogram + "CampusMercado"
 */
export default function Logo() {
  return (
    <span className="flex items-center gap-2 min-w-0">
      <LogoMark className="h-8 w-8 shrink-0" />
      <span className="hidden landscape:inline sm:inline font-extrabold text-lg text-brand whitespace-nowrap">
        Campus<span className="text-foreground">Mercado</span>
      </span>
    </span>
  );
}
