"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clearAdminSessionCookie, isAdminAuthenticated } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { students } from "@/lib/db/schema";

export async function logoutAction() {
  await clearAdminSessionCookie();
  redirect("/admin/login");
}

export async function uploadRosterAction(_prevState: { error?: string; count?: number } | undefined, formData: FormData) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const raw = String(formData.get("roster") ?? "");
  const codes = Array.from(
    new Set(
      raw
        .split(/\r?\n|,/)
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );

  if (codes.length === 0) {
    return { error: "Paste at least one student researcher ID" };
  }

  await db.transaction(async (tx) => {
    await tx.delete(students);
    await tx.insert(students).values(codes.map((studentCode) => ({ studentCode })));
  });

  revalidatePath("/admin");
  return { count: codes.length };
}

export async function clearRosterAction() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  await db.delete(students);
  revalidatePath("/admin");
}
