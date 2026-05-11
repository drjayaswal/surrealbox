import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { db } from "@/app/db/index";
import { answers, answerFlags } from "@/app/db/schema";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let sessionData: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;

  try {
    sessionData = await auth.api.getSession({ headers: await headers() });

    if (!sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const answer = await db.query.answers.findFirst({
      where: eq(answers.id, id),
    });

    if (!answer) {
      return NextResponse.json({ error: "Answer not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const reason = body?.reason?.trim() || null;

    await db.insert(answerFlags).values({
      answerId: id,
      reportedBy: sessionData.user.id,
      reason,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to flag answer" }, { status: 500 });
  }
}
