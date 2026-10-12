import { connection } from "next/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import EditListingForm from "@/components/EditListingForm";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  await connection();
  setRequestLocale(locale);
  const t = await getTranslations("editListing");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  // Owners only. Admins have their own editor under /admin/listings.
  if (!listing || listing.sellerId !== user!.id) {
    redirect(`/${locale}/account/listings`);
  }

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Link
        href="/account/listings"
        className="text-sm text-gray-500 hover:text-brand"
      >
        ← {t("back")}
      </Link>
      <h1 className="mb-6 mt-2 text-xl font-bold">{t("title")}</h1>

      <EditListingForm
        listing={{
          id: listing!.id,
          title: listing!.title,
          description: listing!.description,
          priceAmount: listing!.priceAmount,
          currency: listing!.currency,
          categoryId: listing!.categoryId,
          province: listing!.province,
          campus: listing!.campus,
          contactMethod: listing!.contactMethod,
          contactValue: listing!.contactValue,
          images: listing!.images.map((i) => ({ id: i.id, url: i.url })),
        }}
        categories={categories.map((c) => ({
          id: c.id,
          name: locale === "es" ? c.nameEs : c.nameEn,
        }))}
      />
    </div>
  );
}
