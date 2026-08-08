/* eslint-disable @next/next/no-img-element */

/**
 * Brand artwork lives in /public/brand:
 *   logo-mark.png     -> the "CM" monogram (cap + C + M + cart badge)
 *   logo-wordmark.png -> the full "Campusmercado" lockup
 * Replace those two files to change the logo everywhere — no code edits needed.
 */
export const LOGO_MARK_SRC = "/brand/logo-mark.png";
export const LOGO_WORDMARK_SRC = "/brand/logo-wordmark.png";

export function LogoMark({ className = "h-9 w-auto" }: { className?: string }) {
  return (
    <img
      src={LOGO_MARK_SRC}
      alt="CampusMercado"
      className={className}
      // eager: it's above the fold and tiny; avoids a flash of empty header
      loading="eager"
      decoding="async"
    />
  );
}

/**
 * Responsive lockup:
 *  - phone portrait      -> CM monogram only
 *  - landscape / >=640px -> full "Campusmercado" wordmark
 */
export default function Logo() {
  return (
    <span className="flex items-center min-w-0">
      <img
        src={LOGO_MARK_SRC}
        alt="CampusMercado"
        className="h-9 w-auto shrink-0 landscape:hidden sm:hidden"
        loading="eager"
        decoding="async"
      />
      <img
        src={LOGO_WORDMARK_SRC}
        alt="CampusMercado"
        className="hidden landscape:block sm:block h-9 w-auto max-w-[240px] object-contain object-left"
        loading="eager"
        decoding="async"
      />
    </span>
  );
}
