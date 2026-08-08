// Renders the CampusMercado 3D vector mark to PNG at several sizes.
//   node scripts/make-logo-png.mjs
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "public", "brand");

const DEFS = `
  <defs>
    <linearGradient id="n" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="#2b5290"/><stop offset="0.5" stop-color="#13315f"/><stop offset="1" stop-color="#0b1f3f"/>
    </linearGradient>
    <linearGradient id="g" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="#8fd13f"/><stop offset="0.5" stop-color="#6cb023"/><stop offset="1" stop-color="#4d8416"/>
    </linearGradient>
    <filter id="sh" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#0b1f3f" flood-opacity="0.28"/>
    </filter>
  </defs>`;

const MARK = `
  <g filter="url(#sh)">
    <g transform="translate(2.5,3)" opacity="0.35">
      <path d="M73.27 41.25 A34 34 0 1 0 73.27 86.75 L61.38 76.04 A18 18 0 1 1 61.38 51.96 Z" fill="#0b1f3f"/>
      <path d="M44 9 L84 24 L44 39 L4 24 Z" fill="#0b1f3f"/>
      <path d="M84 98 L84 58 L102 80 L120 58 L120 98" fill="none" stroke="#4d8416" stroke-width="17" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <path d="M44 9 L84 24 L44 39 L4 24 Z" fill="url(#n)"/>
    <path d="M10 27 L10 44" stroke="#13315f" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="10" cy="47" r="4" fill="#13315f"/>
    <path d="M10 50 q-3.5 6 0 11 q3.5-5 0-11 Z" fill="#13315f"/>
    <path d="M73.27 41.25 A34 34 0 1 0 73.27 86.75 L61.38 76.04 A18 18 0 1 1 61.38 51.96 Z" fill="url(#n)"/>
    <path d="M84 98 L84 58 L102 80 L120 58 L120 98" fill="none" stroke="url(#g)" stroke-width="17" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="120" cy="90" r="15" fill="url(#g)"/>
    <path d="M122 79 q7-6 12-2 q-4 6-12 2 Z" fill="#8fd13f"/>
    <path d="M112 85 h2.2 l2 8.4 h8.6 l2-6.2 h-11" stroke="#fff" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="117.4" cy="96.4" r="1.7" fill="#fff"/>
    <circle cx="123.4" cy="96.4" r="1.7" fill="#fff"/>
  </g>`;

const markSvg = (bg = "none") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 118">
  ${DEFS}${bg !== "none" ? `<rect width="140" height="118" fill="${bg}"/>` : ""}${MARK}
</svg>`;

const squareSvg = (bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
  ${DEFS}<rect width="160" height="160" rx="34" fill="${bg}"/>
  <g transform="translate(10,22)">${MARK}</g>
</svg>`;

const lockupSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 132">
  ${DEFS}
  <g transform="translate(6,8)">${MARK}</g>
  <text x="158" y="86" font-family="Helvetica,Arial,sans-serif" font-weight="bold" font-size="60" letter-spacing="-1">
    <tspan fill="#13315f">Campus</tspan><tspan fill="#6cb023">mercado</tspan>
  </text>
</svg>`;

const jobs = [
  ["logo-mark-3d.png", markSvg("none"), 1200],
  ["logo-mark-3d@512.png", markSvg("none"), 512],
  ["logo-square-3d.png", squareSvg("#ffffff"), 1024],
  ["logo-square-3d-navy.png", squareSvg("#13315f"), 1024],
  ["logo-lockup-3d.png", lockupSvg(), 1600],
];

await mkdir(OUT, { recursive: true });
for (const [name, svg, width] of jobs) {
  await sharp(Buffer.from(svg), { density: 400 })
    .resize({ width })
    .png()
    .toFile(path.join(OUT, name));
  console.log("wrote", name, `(${width}px wide)`);
}
await writeFile(path.join(OUT, "logo-mark.svg"), markSvg("none"));
console.log("wrote logo-mark.svg");
