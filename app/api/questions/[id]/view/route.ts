import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { db } from "@/app/db/index";
import { questions, questionViews } from "@/app/db/schema";
import { headers } from "next/headers";
import { eq, and, sql } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: questionId } = await params;

    const existing = await db.query.questionViews.findFirst({
      where: (v, { and, eq }) => and(eq(v.userId, session.user.id), eq(v.questionId, questionId)),
    });

    if (existing) return NextResponse.json({ alreadyViewed: true });

    await db.insert(questionViews).values({ userId: session.user.id, questionId });

    await db
      .update(questions)
      .set({ viewCount: sql`${questions.viewCount} + 1` })
      .where(eq(questions.id, questionId));

    return NextResponse.json({ success: true, alreadyViewed: false });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to record view" }, { status: 500 });
  }
}
