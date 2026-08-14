import { getTranslations } from "next-intl/server";
import { buildContactLink } from "@/lib/contact";

function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35z" />
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.13h-.01a8.23 8.23 0 0 1-4.19-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.36c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.25 8.24z" />
    </svg>
  );
}

/**
 * Tap-to-contact. Opens a WhatsApp chat (message pre-filled with the listing),
 * the phone dialer, or an email draft — instead of making the buyer copy a number.
 */
export default async function ContactButton({
  method,
  value,
  listingTitle,
}: {
  method: string;
  value: string;
  listingTitle: string;
}) {
  const t = await getTranslations("listing");

  const link = buildContactLink({
    method,
    value,
    message: t("contactMessage", { title: listingTitle }),
    subject: t("contactSubject", { title: listingTitle }),
  });

  // Unparseable contact details: show them as plain text rather than a dead link.
  if (!link) {
    return <p className="text-lg font-mono break-all">{value}</p>;
  }

  const styles: Record<string, string> = {
    whatsapp: "bg-[#25D366] hover:bg-[#1da851] text-white",
    phone: "bg-brand hover:bg-brand-dark text-white",
    email: "bg-navy hover:bg-navy-dark text-white",
  };

  const labels: Record<string, string> = {
    whatsapp: t("openWhatsApp"),
    phone: t("callSeller"),
    email: t("emailSeller"),
  };

  return (
    <div>
      <a
        href={link.href}
        target={link.kind === "whatsapp" ? "_blank" : undefined}
        rel={link.kind === "whatsapp" ? "noopener noreferrer" : undefined}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-md px-4 h-12 font-semibold transition ${styles[link.kind]}`}
      >
        {link.kind === "whatsapp" ? (
          <WhatsAppIcon />
        ) : (
          <span aria-hidden>{link.kind === "email" ? "✉️" : "📞"}</span>
        )}
        {labels[link.kind]}
      </a>
      <p className="mt-2 text-center text-sm text-gray-500 font-mono break-all">
        {link.display}
      </p>
    </div>
  );
}
