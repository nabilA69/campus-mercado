import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import LocaleSwitcher from "./LocaleSwitcher";
import Logo from "./Logo";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";

export default async function Header() {
  const t = await getTranslations("nav");
  const locale = await getLocale();
  const user = await getCurrentUser();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
      {/* min-w-0 + shrink rules keep this on one line down to ~320px wide */}
      <div className="mx-auto max-w-5xl px-3 sm:px-4 h-14 flex items-center justify-between gap-2 sm:gap-4">
        <Link href="/" className="min-w-0 shrink">
          <Logo />
        </Link>

        {/* h-10 on every control = comfortable ~40px thumb targets on phones */}
        <nav className="flex items-center gap-1 sm:gap-3 text-sm shrink-0">
          <Link
            href="/post"
            className="hidden sm:inline-flex items-center h-10 px-2 text-gray-600 hover:text-brand"
          >
            {t("post")}
          </Link>

          {user ? (
            <>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="hidden sm:inline-flex items-center h-10 px-2 text-gray-600 hover:text-brand"
                >
                  {t("admin")}
                </Link>
              )}
              <Link
                href="/account"
                className="inline-flex items-center h-10 px-2 text-gray-600 hover:text-brand whitespace-nowrap"
              >
                {t("myAccount")}
              </Link>
              <form action={logoutAction} className="shrink-0">
                <input type="hidden" name="locale" value={locale} />
                <button className="inline-flex items-center h-10 px-2 text-gray-600 hover:text-brand">
                  {t("logout")}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center h-10 px-2 text-gray-600 hover:text-brand whitespace-nowrap"
              >
                {t("login")}
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center h-10 rounded-md bg-brand px-3 text-white font-medium hover:bg-brand-dark whitespace-nowrap"
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
