import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { students } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { timingSafeEqual } from "crypto";

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const accessCode: string | undefined = body?.accessCode;
  const studentCode: string | undefined = body?.studentCode?.trim();

  const expectedAccessCode = process.env.COLLECTOR_ACCESS_CODE;
  if (!expectedAccessCode) {
    return NextResponse.json({ error: "Server is not configured" }, { status: 500 });
  }
  if (!accessCode || !safeEqual(accessCode, expectedAccessCode)) {
    return NextResponse.json({ error: "Incorrect access code" }, { status: 401 });
  }
  if (!studentCode) {
    return NextResponse.json({ error: "Student researcher ID is required" }, { status: 400 });
  }

  // If a roster has been uploaded, require the ID to be on it. Otherwise accept any
  // non-empty ID — lets fieldwork start before the roster is finalised.
  const rosterCount = await db.$count(students);
  if (rosterCount > 0) {
    const [match] = await db.select().from(students).where(eq(students.studentCode, studentCode)).limit(1);
    if (!match) {
      return NextResponse.json({ error: "Student researcher ID not recognised. Check with your supervisor." }, { status: 401 });
    }
  }

  return NextResponse.json({ ok: true, studentCode });
}
