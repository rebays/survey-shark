"use server";

import { redirect } from "next/navigation";
import { checkAdminPassword, setAdminSessionCookie } from "@/lib/auth/admin";

export async function loginAction(_prevState: { error?: string } | undefined, formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!password || !checkAdminPassword(password)) {
    return { error: "Incorrect password" };
  }
  await setAdminSessionCookie();
  redirect("/admin");
}
