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

    // We need to count reports where the referenceId belongs to this user
    // 1. Get all question IDs by user
    // 2. Get all answer IDs by user
    // 3. Get all comment IDs by user
    
    // However, a more efficient way is to join reports with questions/answers/comments
    // or just fetch all reports and filter. But since we want a count:
    
    // Count reports on questions
    const qReports = await db
      .select({ value: count() })
      .from(reports)
      .innerJoin(questions, eq(sql`${reports.referenceId}::uuid`, questions.id))
      .where(and(eq(questions.authorId, userId), eq(reports.reportReferenceType, "question")));

    // Count reports on answers
    const aReports = await db
      .select({ value: count() })
      .from(reports)
      .innerJoin(answers, eq(sql`${reports.referenceId}::uuid`, answers.id))
      .where(and(eq(answers.authorId, userId), eq(reports.reportReferenceType, "answer")));

    // Count reports on comments/replies
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
