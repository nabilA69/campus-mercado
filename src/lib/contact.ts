/**
 * Turns a seller's contact details into a link a phone can act on:
 * WhatsApp chat, dialer, or email — with the listing already referenced so the
 * buyer doesn't have to explain which ad they're writing about.
 */

/**
 * Normalises a Cuban number to the international digits WhatsApp expects
 * (no +, no spaces). Cuban mobiles are 8 digits starting with 5; country code 53.
 * Returns null when it clearly isn't a phone number.
 */
export function normalizeCubanPhone(input: string): string | null {
  let digits = (input || "").replace(/\D/g, "");
  if (!digits) return null;

  // international prefix typed as 00
  if (digits.startsWith("00")) digits = digits.slice(2);

  // bare Cuban mobile (8 digits, starts with 5) -> add country code
  if (digits.length === 8 && digits.startsWith("5")) return `53${digits}`;
  // already has the Cuban country code
  if (digits.length === 10 && digits.startsWith("53")) return digits;
  // Cuban landline typed with area code but no country code
  if (digits.length === 8 || digits.length === 7) return `53${digits}`;

  // anything else: accept if it's a plausible international number
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

export type ContactMethod = "whatsapp" | "phone" | "email";

export type ContactLink = {
  href: string;
  kind: ContactMethod;
  /** what to show on the button */
  display: string;
};

/**
 * Builds the tap-to-contact link.
 * `message` is pre-filled for WhatsApp; `subject` for email.
 */
export function buildContactLink(opts: {
  method: string;
  value: string;
  message: string;
  subject: string;
}): ContactLink | null {
  const value = (opts.value || "").trim();
  if (!value) return null;

  if (opts.method === "email") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return null;
    return {
      kind: "email",
      display: value,
      href: `mailto:${value}?subject=${encodeURIComponent(opts.subject)}`,
    };
  }

  const phone = normalizeCubanPhone(value);
  if (!phone) return null;

  if (opts.method === "whatsapp") {
    return {
      kind: "whatsapp",
      display: value,
      href: `https://wa.me/${phone}?text=${encodeURIComponent(opts.message)}`,
    };
  }

  return { kind: "phone", display: value, href: `tel:+${phone}` };
}
