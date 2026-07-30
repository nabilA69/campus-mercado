import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import LocaleSwitcher from "./LocaleSwitcher";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";

export default async function Header() {
  const t = await getTranslations("nav");
  const locale = await getLocale();
  const user = await getCurrentUser();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="font-extrabold text-lg text-brand shrink-0">
          Campus<span className="text-foreground">Mercado</span>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-4 text-sm">
          <Link
            href="/post"
            className="hidden sm:inline text-gray-600 hover:text-brand"
          >
            {t("post")}
          </Link>

          {user ? (
            <>
              {user.role === "admin" && (
                <Link href="/admin" className="text-gray-600 hover:text-brand">
                  {t("admin")}
                </Link>
              )}
              <Link
                href="/account"
                className="text-gray-600 hover:text-brand"
              >
                {t("myAccount")}
              </Link>
              <form action={logoutAction}>
                <input type="hidden" name="locale" value={locale} />
                <button className="text-gray-600 hover:text-brand">
                  {t("logout")}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-brand">
                {t("login")}
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-brand px-3 py-1.5 text-white font-medium hover:bg-brand-dark"
              >
                {t("register")}
              </Link>
            </>
          )}

          <LocaleSwitcher />
        </nav>
      </div>
    </header>
  );
}
