import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CATEGORY_SEED = [
  { slug: "textbooks", nameEs: "Libros y apuntes", nameEn: "Textbooks & Notes" },
  { slug: "electronics", nameEs: "Electrónica", nameEn: "Electronics" },
  { slug: "housing", nameEs: "Vivienda estudiantil", nameEn: "Student Housing" },
  { slug: "services", nameEs: "Servicios y tutorías", nameEn: "Services & Tutoring" },
  { slug: "transport", nameEs: "Transporte", nameEn: "Transport" },
  { slug: "clothing", nameEs: "Ropa y accesorios", nameEn: "Clothing & Accessories" },
  { slug: "food", nameEs: "Comida", nameEn: "Food" },
  { slug: "gigs", nameEs: "Empleos y changas", nameEn: "Jobs & Gigs" },
  { slug: "other", nameEs: "Otros", nameEn: "Other" },
];

async function main() {
  // Categories
  for (let i = 0; i < CATEGORY_SEED.length; i++) {
    const c = CATEGORY_SEED[i];
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { nameEs: c.nameEs, nameEn: c.nameEn, sortOrder: i },
      create: { ...c, sortOrder: i },
    });
  }
  console.log(`Seeded ${CATEGORY_SEED.length} categories.`);

  // Admin user. No default credentials on purpose: a hardcoded password here
  // is a published password the moment the repo is public, and seeds get run
  // against production. Both values must be supplied explicitly.
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    console.log(
      "Skipping admin user: set ADMIN_EMAIL and ADMIN_PASSWORD to create one, e.g.\n" +
        '  ADMIN_EMAIL=you@example.com ADMIN_PASSWORD="$(openssl rand -base64 24)" npm run db:seed',
    );
    return;
  }
  if (adminPassword.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  }
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "admin", verificationStatus: "approved" },
    create: {
      email: adminEmail,
      passwordHash,
      name: "Administrador",
      role: "admin",
      verificationStatus: "approved",
    },
  });
  console.log(`Admin user ready: ${adminEmail}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
