import QRCode from "qrcode";

export type PayInfo = {
  account: string;
  amount: number;
  currency: string;
  ref: string;
};

// The exact Transfermóvil merchant-QR / deep-link format depends on the payee's
// bank / ETECSA payment-gateway contract. So both are TEMPLATED via env vars:
//   TRANSFERMOVIL_QR_URL      -> if set, an image URL of the payee's real exported QR (used directly)
//   TRANSFERMOVIL_QR_PAYLOAD  -> template string encoded into a generated QR ({account}/{amount}/{currency}/{ref})
//   TRANSFERMOVIL_DEEPLINK    -> template URI to open the app ({account}/{amount}/{ref})
// With none set we still generate a readable QR containing the account+amount+ref.

function fill(tpl: string, p: PayInfo): string {
  return tpl
    .replaceAll("{account}", p.account)
    .replaceAll("{amount}", String(p.amount))
    .replaceAll("{currency}", p.currency)
    .replaceAll("{ref}", p.ref);
}

export function buildQrPayload(p: PayInfo): string {
  const tpl = process.env.TRANSFERMOVIL_QR_PAYLOAD;
  if (tpl) return fill(tpl, p);
  return `Transfermovil\nCuenta: ${p.account}\nMonto: ${p.amount} ${p.currency}\nRef: ${p.ref}`;
}

/** Returns the QR to show: the payee's real exported QR image if configured, else a generated data-URL QR. */
export async function resolveQrImage(p: PayInfo): Promise<string> {
  const realQr = process.env.TRANSFERMOVIL_QR_URL;
  if (realQr) return realQr;
  return QRCode.toDataURL(buildQrPayload(p), { margin: 1, width: 240 });
}

export function transfermovilDeepLink(p: PayInfo): string | null {
  const tpl = process.env.TRANSFERMOVIL_DEEPLINK;
  if (!tpl) return null;
  return fill(tpl, p);
}
