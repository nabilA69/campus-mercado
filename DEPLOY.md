# Deploying CampusMercado

This guide takes the app from local dev (SQLite + local files) to a live public site.
The app is already **production-ready**: it builds with zero type errors and the code
switches between local and cloud storage/DB via environment variables — no code changes needed.

There are two things this app needs that your laptop provided for free and a host does not:

1. **A PostgreSQL database** (we used SQLite locally).
2. **Cloud file storage** for uploaded images (ID cards, listing photos, ad banners) —
   serverless hosts have a temporary disk that wipes on every deploy.

You will need to create a few **free accounts** yourself (I can't log in for you). Each step below says exactly what to click.

---

## Recommended stack (all have free tiers)

| Piece | Service | Why |
|-------|---------|-----|
| Hosting | **Vercel** | Native Next.js host, one-click from GitHub |
| Database | **Neon** (Postgres) | Serverless Postgres, generous free tier |
| File storage | **Cloudflare R2** | S3-compatible, **no egress fees** (good for images + Cuba traffic) |

> Prefer one platform? See **Alternative: Railway** at the bottom — app + Postgres + a persistent
> disk in one place, so you can keep `STORAGE_DRIVER=local`.

---

## Step 1 — Create the Postgres database (Neon)

1. Sign up at **neon.tech** → **New Project**.
2. Copy the **connection string** (looks like `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`).
3. Keep it handy — it's your `DATABASE_URL`.

## Step 2 — Create the storage bucket (Cloudflare R2)

1. Sign up at **cloudflare.com** → **R2** → **Create bucket** (e.g. `campusmercado`).
2. Under the bucket → **Settings** → enable **Public access** (or connect a custom domain) and copy the **public URL**.
3. **R2 → Manage API Tokens → Create API Token** (Object Read & Write). Copy the **Access Key ID** and **Secret Access Key**.
4. Note your **Account ID** (R2 endpoint is `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`).

> ⚠️ **Privacy note — student ID cards.** ID-card images are sensitive personal data. For the pilot
> the app stores every upload with a public (random, unguessable) URL. Before you scale, move ID
> images to a **private** bucket with signed URLs. I've isolated all storage in `src/lib/storage.ts`,
> so this is a contained change when you're ready.

## Step 3 — Switch the schema to Postgres

In `prisma/schema.prisma`, change the datasource provider:

```prisma
datasource db {
  provider = "postgresql"   // was "sqlite"
  url      = env("DATABASE_URL")
}
```

Commit this change.

## Step 4 — Push the code to GitHub

```bash
cd /Users/nabil/Desktop/campus-mercado
git init
git add -A
git commit -m "CampusMercado initial"
```

Create an empty repo on github.com, then:

```bash
git remote add origin https://github.com/<you>/campus-mercado.git
git push -u origin main
```

> `.env` and `/public/uploads` are already git-ignored — your secrets and dev data won't be pushed.

## Step 5 — Initialize the production database (run once, from your laptop)

Point Prisma at the live DB and create the tables + admin user:

```bash
# temporarily export the production values in your shell
export DATABASE_URL="postgresql://...your neon string..."
export ADMIN_EMAIL="you@youruni.cu"
export ADMIN_PASSWORD="a-strong-password"

npm run db:push     # creates all tables in Postgres
npm run db:seed     # seeds the 9 categories + your admin account
```

## Step 6 — Deploy to Vercel

1. Sign up at **vercel.com** → **Add New → Project** → import your GitHub repo.
2. Framework is auto-detected (Next.js). Before deploying, add **Environment Variables**
   (copy names from `.env.example`):

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | your Neon string |
   | `AUTH_SECRET` | run `openssl rand -base64 32` and paste the output |
   | `ADMIN_EMAIL` / `ADMIN_PASSWORD` | your admin login |
   | `STORAGE_DRIVER` | `s3` |
   | `S3_BUCKET` | `campusmercado` |
   | `S3_REGION` | `auto` |
   | `S3_ENDPOINT` | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
   | `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | from R2 |
   | `S3_PUBLIC_URL` | your bucket's public URL |
   | `TRANSFERMOVIL_ACCOUNT` | your card/account number |
   | `TRANSFERMOVIL_QR_URL` | (optional) your real exported merchant QR image URL |

3. Click **Deploy**. When it finishes you get a `https://campus-mercado.vercel.app` URL.

## Step 7 — Post-deploy checklist

- [ ] Visit the site → it loads in Spanish, `EN` toggle works.
- [ ] `https://<your-site>/api/health` returns `{"ok":true,"db":"up"}`.
- [ ] Log in as admin (`/es/login`) and confirm `/es/admin` works.
- [ ] Register a test student → upload an ID → approve it in the admin queue → the image loads (proves R2 works).
- [ ] Post a listing with a photo → it appears on the home page.
- [ ] Boost a listing → the Transfermóvil QR renders on `/pay/...`.
- [ ] **Change the admin password** if you seeded a placeholder.
- [ ] Add your real **Transfermóvil merchant QR** (`TRANSFERMOVIL_QR_URL`) once you have it.

## Custom domain (optional)

Vercel → Project → **Settings → Domains** → add your domain and follow the DNS instructions.

---

## Alternative: Railway (single platform, keep local storage)

If you'd rather not use separate services:

1. **railway.app** → New Project → **Deploy from GitHub repo**.
2. Add a **PostgreSQL** plugin — Railway injects `DATABASE_URL` automatically.
3. Add a **Volume** mounted at `/app/public/uploads` so uploaded files persist across deploys.
   Keep `STORAGE_DRIVER=local`.
4. Set the same `AUTH_SECRET`, `ADMIN_*`, and `TRANSFERMOVIL_*` variables.
5. Still switch the Prisma provider to `postgresql` (Step 3) and run `db:push` + `db:seed` (Step 5)
   against Railway's `DATABASE_URL`.

Railway runs one always-on instance, so the disk-based storage driver works with the mounted volume —
no R2 needed for the pilot.

---

## Troubleshooting

- **Build fails on Prisma** → the host must run `prisma generate`; it's wired into `postinstall` and
  `build`, so a clean deploy handles it.
- **`AUTH_SECRET must be set in production`** → you didn't set `AUTH_SECRET`; add it and redeploy.
- **Uploaded images 404** → on Vercel you must use `STORAGE_DRIVER=s3` (the disk is ephemeral); check
  the R2 variables and that the bucket is public.
- **DB connection errors** → confirm `DATABASE_URL` ends with `?sslmode=require` (Neon) and the
  schema provider is `postgresql`.
