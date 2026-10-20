import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth/admin";
import { buildResponsesCsv } from "@/lib/surveys/export";

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  const csv = await buildResponsesCsv(slug);
  if (csv === null) return NextResponse.json({ error: "Unknown survey" }, { status: 404 });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-responses.csv"`,
    },
  });
}
