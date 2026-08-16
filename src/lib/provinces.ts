/**
 * Cuba's 15 provinces plus the special municipality Isla de la Juventud,
 * in the usual west-to-east order. Slugs are stored on listings and used in URLs.
 */
export const PROVINCES = [
  { slug: "pinar-del-rio", name: "Pinar del Río" },
  { slug: "artemisa", name: "Artemisa" },
  { slug: "la-habana", name: "La Habana" },
  { slug: "mayabeque", name: "Mayabeque" },
  { slug: "matanzas", name: "Matanzas" },
  { slug: "cienfuegos", name: "Cienfuegos" },
  { slug: "villa-clara", name: "Villa Clara" },
  { slug: "sancti-spiritus", name: "Sancti Spíritus" },
  { slug: "ciego-de-avila", name: "Ciego de Ávila" },
  { slug: "camaguey", name: "Camagüey" },
  { slug: "las-tunas", name: "Las Tunas" },
  { slug: "holguin", name: "Holguín" },
  { slug: "granma", name: "Granma" },
  { slug: "santiago-de-cuba", name: "Santiago de Cuba" },
  { slug: "guantanamo", name: "Guantánamo" },
  { slug: "isla-de-la-juventud", name: "Isla de la Juventud" },
] as const;

export type ProvinceSlug = (typeof PROVINCES)[number]["slug"];

const SLUGS = new Set(PROVINCES.map((p) => p.slug));

export function isProvinceSlug(v: string | null | undefined): v is ProvinceSlug {
  return !!v && SLUGS.has(v as ProvinceSlug);
}

export function provinceName(slug: string | null | undefined): string | null {
  return PROVINCES.find((p) => p.slug === slug)?.name ?? null;
}
