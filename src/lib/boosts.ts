// Paid "bump-to-top" boost tiers. Prices in CUP (platform fee paid via Transfermóvil).
export const BOOST_CURRENCY = "CUP";

export const BOOST_TIERS = {
  standard: { days: 7, price: 200, labelEs: "Estándar", labelEn: "Standard" },
  premium: { days: 30, price: 500, labelEs: "Premium", labelEn: "Premium" },
} as const;

export type BoostTier = keyof typeof BOOST_TIERS;

export function isBoostTier(v: string): v is BoostTier {
  return v === "standard" || v === "premium";
}
