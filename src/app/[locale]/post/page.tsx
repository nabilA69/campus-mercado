import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import PostListingForm from "@/components/PostListingForm";

// Only verified students can post (students-only gate on both sides).
export default async function PostPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tv = await getTranslations("verify");
  const ta = await getTranslations("account");
  const tp = await getTranslations("post");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  if (user!.verificationStatus !== "approved") {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center">
        <p className="text-gray-600 mb-4">
          {user!.verificationStatus === "pending"
            ? ta("verifyPendingMsg")
            : tv("intro")}
        </p>
        {user!.verificationStatus !== "pending" && (
          <Link
            href="/verify"
            className="inline-block rounded-md bg-brand px-5 py-2.5 text-white font-semibold hover:bg-brand-dark"
          >
            {ta("verifyCta")}
          </Link>
        )}
      </div>
    );
  }

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });
  const options = categories.map((c) => ({
    id: c.id,
    name: locale === "es" ? c.nameEs : c.nameEn,
  }));

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-xl font-bold mb-6">{tp("title")}</h1>
      <PostListingForm categories={options} />
    </div>
  );
}
