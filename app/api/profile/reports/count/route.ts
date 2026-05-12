import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { db } from "@/app/db/index";
import { reports, questions, answers, comments } from "@/app/db/schema";
import { headers } from "next/headers";
import { eq, or, and, count, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const qReports = await db
      .select({ value: count() })
      .from(reports)
      .innerJoin(questions, eq(sql`${reports.referenceId}::uuid`, questions.id))
      .where(and(eq(questions.authorId, userId), eq(reports.reportReferenceType, "question")));

    const aReports = await db
      .select({ value: count() })
      .from(reports)
      .innerJoin(answers, eq(sql`${reports.referenceId}::uuid`, answers.id))
      .where(and(eq(answers.authorId, userId), eq(reports.reportReferenceType, "answer")));

    const cReports = await db
      .select({ value: count() })
      .from(reports)
      .innerJoin(comments, eq(sql`${reports.referenceId}::uuid`, comments.id))
      .where(and(eq(comments.authorId, userId), or(eq(reports.reportReferenceType, "comment"), eq(reports.reportReferenceType, "reply"))));

    const totalReports = (qReports[0]?.value || 0) + (aReports[0]?.value || 0) + (cReports[0]?.value || 0);

    return NextResponse.json({ count: totalReports });
  } catch (error) {
    console.error("[REPORTS_COUNT_GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch report count" }, { status: 500 });
  }
}
