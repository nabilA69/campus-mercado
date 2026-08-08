/**
 * CampusMercado brand mark — graduation cap over a navy "C", a green "M", and a
 * cart badge. Rendered as vector art with 3D depth (gradient shading, an offset
 * extrusion layer and a soft drop shadow) so it stays crisp at any size and costs
 * no extra network request — important on slow Cuban connections.
 */
export function LogoMark({ className = "h-9 w-auto" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 136 112"
      className={className}
      role="img"
      aria-label="CampusMercado"
    >
      <defs>
        <linearGradient id="cmNavy" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#2b5290" />
          <stop offset="0.5" stopColor="#13315f" />
          <stop offset="1" stopColor="#0b1f3f" />
        </linearGradient>
        <linearGradient id="cmGreen" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#8fd13f" />
          <stop offset="0.5" stopColor="#6cb023" />
          <stop offset="1" stopColor="#4d8416" />
        </linearGradient>
        <filter id="cmShadow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow
            dx="0"
            dy="3"
            stdDeviation="3"
            floodColor="#0b1f3f"
            floodOpacity="0.28"
          />
        </filter>
      </defs>

      <g filter="url(#cmShadow)">
        {/* extruded depth layer */}
        <g transform="translate(2.5,3)" opacity="0.35">
          <path
            d="M73.27 41.25 A34 34 0 1 0 73.27 86.75 L61.38 76.04 A18 18 0 1 1 61.38 51.96 Z"
            fill="#0b1f3f"
          />
          <path d="M44 9 L84 24 L44 39 L4 24 Z" fill="#0b1f3f" />
          <path
            d="M84 98 L84 58 L102 80 L120 58 L120 98"
            fill="none"
            stroke="#4d8416"
            strokeWidth="17"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* graduation cap + tassel */}
        <path d="M44 9 L84 24 L44 39 L4 24 Z" fill="url(#cmNavy)" />
        <path
          d="M10 27 L10 44"
          stroke="#13315f"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <circle cx="10" cy="47" r="4" fill="#13315f" />
        <path d="M10 50 q-3.5 6 0 11 q3.5-5 0-11 Z" fill="#13315f" />

        {/* C */}
        <path
          d="M73.27 41.25 A34 34 0 1 0 73.27 86.75 L61.38 76.04 A18 18 0 1 1 61.38 51.96 Z"
          fill="url(#cmNavy)"
        />

        {/* M */}
        <path
          d="M84 98 L84 58 L102 80 L120 58 L120 98"
          fill="none"
          stroke="url(#cmGreen)"
          strokeWidth="17"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* cart badge */}
        <circle cx="120" cy="90" r="15" fill="url(#cmGreen)" />
        <path d="M122 79 q7-6 12-2 q-4 6-12 2 Z" fill="#8fd13f" />
        <path
          d="M112 85 h2.2 l2 8.4 h8.6 l2-6.2 h-11"
          stroke="#fff"
          strokeWidth="1.7"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="117.4" cy="96.4" r="1.7" fill="#fff" />
        <circle cx="123.4" cy="96.4" r="1.7" fill="#fff" />
      </g>
    </svg>
  );
}

/**
 * Logo lockup. Wordmark shows when there's room:
 *  - phone portrait  -> mark only
 *  - landscape / >=640px -> mark + "Campusmercado"
 */
export default function Logo() {
  return (
    <span className="flex items-center gap-2 min-w-0">
      <LogoMark className="h-9 w-auto shrink-0" />
      <span className="hidden landscape:inline sm:inline font-extrabold text-lg tracking-tight whitespace-nowrap">
        <span className="text-navy">Campus</span>
        <span className="text-brand">mercado</span>
      </span>
    </span>
  );
}
