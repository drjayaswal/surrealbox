import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { db } from "@/app/db/index";
import { answers, questions, user } from "@/app/db/schema";
import { headers } from "next/headers";
import { eq, and, sql } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let sessionData: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;
  try {
    sessionData = await auth.api.getSession({ headers: await headers() });
    if (!sessionData?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: answerId } = await params;

    const answer = await db.query.answers.findFirst({ where: eq(answers.id, answerId) });
    if (!answer) return NextResponse.json({ error: "Answer not found" }, { status: 404 });

    const question = await db.query.questions.findFirst({ where: eq(questions.id, answer.questionId!) });
    if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });

    if (question.authorId !== sessionData.user.id) {
      return NextResponse.json({ error: "Only the question author can accept answers" }, { status: 403 });
    }

    if (answer.isAccepted) {
      await db.update(answers).set({ isAccepted: false }).where(eq(answers.id, answerId));
      if (answer.authorId) {
        await db.update(user).set({ reputation: sql`${user.reputation} - 15` }).where(eq(user.id, answer.authorId));
      }
      if (question.authorId) {
        await db.update(user).set({ reputation: sql`${user.reputation} - 2` }).where(eq(user.id, question.authorId));
      }
      return NextResponse.json({ success: true, isAccepted: false });
    }

    const previouslyAccepted = await db.query.answers.findFirst({
      where: and(eq(answers.questionId, question.id), eq(answers.isAccepted, true)),
    });

    if (previouslyAccepted && previouslyAccepted.id !== answerId) {
      await db.update(answers).set({ isAccepted: false }).where(eq(answers.id, previouslyAccepted.id));
      if (previouslyAccepted.authorId) {
        await db.update(user).set({ reputation: sql`${user.reputation} - 15` }).where(eq(user.id, previouslyAccepted.authorId));
      }
      if (question.authorId) {
        await db.update(user).set({ reputation: sql`${user.reputation} - 2` }).where(eq(user.id, question.authorId));
      }
    }

    await db.update(answers).set({ isAccepted: true }).where(eq(answers.id, answerId));

    if (answer.authorId) {
      await db.update(user).set({ reputation: sql`${user.reputation} + 15` }).where(eq(user.id, answer.authorId));
    }
    if (question.authorId) {
      await db.update(user).set({ reputation: sql`${user.reputation} + 2` }).where(eq(user.id, question.authorId));
    }

    return NextResponse.json({ success: true, isAccepted: true });
  } catch (error: any) {
    console.error("[ACCEPT_ANSWER] Error:", error.message);
    return NextResponse.json({ error: "Failed to accept answer" }, { status: 500 });
  }
}
