"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
} from "@/lib/auth";
import { parseDobInput } from "@/lib/ci";

export type AuthState = { error?: string };

const registerSchema = z.object({
  name: z.string().min(2, "nameShort"),
  email: z.string().email("emailInvalid"),
  password: z.string().min(8, "passwordShort"),
  dob: z.string().min(1, "dobRequired"),
});

const loginSchema = z.object({
  email: z.string().email("emailInvalid"),
  password: z.string().min(1, "required"),
});

export async function registerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = (formData.get("locale") as string) || "es";
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    dob: formData.get("dob"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const dateOfBirth = parseDobInput(parsed.data.dob);
  if (!dateOfBirth) return { error: "dobInvalid" };

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "emailTaken" };

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name.trim(),
      email,
      passwordHash: await hashPassword(parsed.data.password),
      dateOfBirth,
      locale,
    },
  });

  await createSession(user.id);
  redirect(`/${locale}/verify`);
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = (formData.get("locale") as string) || "es";
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "invalidCredentials" };

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "invalidCredentials" };
  }

  await createSession(user.id);
  redirect(user.role === "admin" ? `/${locale}/admin` : `/${locale}/account`);
}

export async function logoutAction(formData: FormData) {
  const locale = (formData.get("locale") as string) || "es";
  await destroySession();
  redirect(`/${locale}`);
}
