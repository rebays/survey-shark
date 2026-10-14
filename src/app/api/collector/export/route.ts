import { NextRequest, NextResponse } from "next/server";
import { buildResponsesCsv } from "@/lib/surveys/export";

// A student's own responses, same columns as the admin export. Gated only by the
// student code, matching the other /api/collector routes (see lib/collector/session.ts).
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  const studentCode = req.nextUrl.searchParams.get("studentCode");
  if (!slug || !studentCode) {
    return NextResponse.json({ error: "Missing slug or studentCode" }, { status: 400 });
  }

  const csv = await buildResponsesCsv(slug, studentCode);
  if (csv === null) return NextResponse.json({ error: "Unknown survey" }, { status: 404 });

  const safeCode = studentCode.replace(/[^A-Za-z0-9_-]/g, "_");
  // Leading BOM so Excel opens the file as UTF-8 (question labels contain dashes/quotes).
  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-${safeCode}-responses.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
