"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * A value the payer has to retype into Transfermóvil — card number, reference.
 * Typing 16 digits by hand is where payments go wrong, so make it one tap.
 */
export default function CopyField({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  const t = useTranslations("pay");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is blocked in some in-app browsers; the value stays visible
      // and selectable, so there is still a way through.
      setCopied(false);
    }
  }

  return (
    <div className="rounded-md border border-amber-200 bg-white p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <p
          className={`min-w-0 flex-1 break-all text-lg ${mono ? "font-mono" : ""}`}
        >
          {value}
        </p>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-md border border-brand px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand hover:text-white"
        >
          {copied ? t("copied") : t("copy")}
        </button>
      </div>
    </div>
  );
}
