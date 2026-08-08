// CampusMercado logo: a graduation cap sitting on a shopping bag — "students + marketplace".
// Inline SVG so it costs zero extra requests and stays crisp on every screen (good for
// low-bandwidth connections in Cuba).
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      role="img"
      aria-label="CampusMercado"
    >
      <rect width="40" height="40" rx="11" fill="var(--brand, #0d7d5a)" />
      {/* shopping bag */}
      <path
        d="M12 19h16l-1.5 11.5a2 2 0 0 1-2 1.7H15.5a2 2 0 0 1-2-1.7L12 19Z"
        fill="#fff"
        fillOpacity="0.95"
      />
      {/* bag handle */}
      <path
        d="M16.6 19v-1.4a3.4 3.4 0 0 1 6.8 0V19"
        fill="none"
        stroke="#fff"
        strokeWidth="1.7"
        strokeLinecap="round"
        opacity="0.9"
      />
      {/* graduation cap */}
      <path d="M20 6.5 30.5 11 20 15.5 9.5 11 20 6.5Z" fill="#fff" />
      <path
        d="M25.8 13.1v3.3c0 1.2-2.6 2.2-5.8 2.2s-5.8-1-5.8-2.2v-3.3"
        fill="none"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M30.5 11v4.6"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Full lockup: mark + wordmark. The wordmark truncates gracefully on tiny screens. */
export default function Logo() {
  return (
    <span className="flex items-center gap-2 min-w-0">
      <LogoMark className="h-8 w-8 shrink-0" />
      <span className="font-extrabold text-lg text-brand truncate">
        Campus<span className="text-foreground">Mercado</span>
      </span>
    </span>
  );
}
