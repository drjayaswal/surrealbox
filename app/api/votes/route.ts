import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { db } from "@/app/db/index";
import { votes, questions, answers, comments, user } from "@/app/db/schema";
import { headers } from "next/headers";
import { eq, and, sql } from "drizzle-orm";

async function adjustReputation(userId: string, delta: number) {
  if (!userId || delta === 0) return;
  await db.update(user).set({ reputation: sql`${user.reputation} + ${delta}` }).where(eq(user.id, userId));
}

export async function POST(req: NextRequest) {
  let sessionData: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;
  try {
    sessionData = await auth.api.getSession({ headers: await headers() });
    if (!sessionData?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

    const { votableId, votableType, direction } = body;
    if (!votableId || !["question", "answer", "comment"].includes(votableType) || !["up", "down"].includes(direction)) {
      return NextResponse.json({ error: "Invalid vote parameters" }, { status: 400 });
    }

    const voterId = sessionData.user.id;
    const isQuestion = votableType === "question";
    const isAnswer = votableType === "answer";
    const isComment = votableType === "comment";
    let targetAuthorId: string | null = null;

    if (isQuestion) {
      const question = await db.query.questions.findFirst({ where: eq(questions.id, votableId) });
      if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });
      if (question.authorId === voterId) return NextResponse.json({ error: "Cannot vote on your own content" }, { status: 403 });
      targetAuthorId = question.authorId;
    } else if (isAnswer) {
      const answer = await db.query.answers.findFirst({ where: eq(answers.id, votableId) });
      if (!answer) return NextResponse.json({ error: "Answer not found" }, { status: 404 });
      if (answer.authorId === voterId) return NextResponse.json({ error: "Cannot vote on your own content" }, { status: 403 });
      targetAuthorId = answer.authorId;
    } else if (isComment) {
      const comment = await db.query.comments.findFirst({ where: eq(comments.id, votableId) });
      if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 });
      if (comment.authorId === voterId) return NextResponse.json({ error: "Cannot vote on your own content" }, { status: 403 });
      targetAuthorId = comment.authorId;
    }

    const existingVote = await db.query.votes.findFirst({
      where: and(eq(votes.userId, voterId), eq(votes.votableId, votableId)),
    });

    let scoreDelta = 0;
    let newDirection: "up" | "down" | null = direction as "up" | "down";

    if (existingVote) {
      if (existingVote.direction === direction) {
        await db.delete(votes).where(and(eq(votes.userId, voterId), eq(votes.votableId, votableId)));
        scoreDelta = direction === "up" ? -1 : 1;
        newDirection = null;
        if (targetAuthorId && !isComment) {
          const rep = isQuestion ? (direction === "up" ? -5 : 2) : (direction === "up" ? -10 : 0);
          await adjustReputation(targetAuthorId, rep);
        }
        if (direction === "down" && !isComment) await adjustReputation(voterId, 1);
      } else {
        await db.update(votes).set({ direction }).where(and(eq(votes.userId, voterId), eq(votes.votableId, votableId)));
        scoreDelta = direction === "up" ? 2 : -2;
        newDirection = direction as "up" | "down";
        if (targetAuthorId && !isComment) {
          let rep = 0;
          if (isQuestion) rep = direction === "up" ? 7 : -7;
          else rep = direction === "up" ? 10 : -10;
          await adjustReputation(targetAuthorId, rep);
        }
        if (!isComment) {
          if (direction === "down") await adjustReputation(voterId, -1);
          else await adjustReputation(voterId, 1);
        }
      }
    } else {
      await db.insert(votes).values({ userId: voterId, votableId, votableType, direction });
      scoreDelta = direction === "up" ? 1 : -1;
      newDirection = direction as "up" | "down";
      if (targetAuthorId && !isComment) {
        const rep = isQuestion ? (direction === "up" ? 5 : -2) : (direction === "up" ? 10 : 0);
        await adjustReputation(targetAuthorId, rep);
      }
      if (direction === "down" && !isComment) await adjustReputation(voterId, -1);
    }

    if (isQuestion) {
      await db.update(questions).set({ score: sql`${questions.score} + ${scoreDelta}` }).where(eq(questions.id, votableId));
    } else if (isAnswer) {
      await db.update(answers).set({ score: sql`${answers.score} + ${scoreDelta}` }).where(eq(answers.id, votableId));
    } else if (isComment) {
      await db.update(comments).set({ score: sql`${comments.score} + ${scoreDelta}` }).where(eq(comments.id, votableId));
    }

    return NextResponse.json({ success: true, direction: newDirection, scoreDelta });
  } catch (error: any) {
    console.error("[VOTES_POST] Error:", error.message);
    return NextResponse.json({ error: "Failed to process vote" }, { status: 500 });
  }
}
