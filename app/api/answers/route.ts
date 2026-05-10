import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { db } from "@/app/db/index";
import { answers, questions, votes } from "@/app/db/schema";
import { headers } from "next/headers";
import { eq, desc, sql } from "drizzle-orm";
import { checkContent } from "@/lib/moderator";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const questionId = searchParams.get("questionId")?.trim();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") || "5")));
  const offset = (page - 1) * limit;

  try {
    if (!questionId) {
      return NextResponse.json(
        { error: "questionId query parameter is required" },
        { status: 400 }
      );
    }

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      console.warn(`[ANSWERS_GET] Unauthenticated request for questionId=${questionId}`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const list = await db.query.answers.findMany({
      where: (answers, { eq }) => eq(answers.questionId, questionId),
      with: {
        author: true,
      },
      orderBy: [desc(answers.isAccepted), desc(answers.createdAt)],
      limit: limit + 1,
      offset,
    });

    const hasNextPage = list.length > limit;
    const items = hasNextPage ? list.slice(0, limit) : list;

    let userVoteMap: Record<string, "up" | "down"> = {};
    if (items.length > 0) {
      const answerIds = items.map((a) => a.id);
      const userVotes = await db.query.votes.findMany({
        where: (v, { and, eq, inArray }) =>
          and(eq(v.userId, session.user.id), inArray(v.votableId, answerIds)),
      });
      for (const v of userVotes) {
        userVoteMap[v.votableId] = v.direction as "up" | "down";
      }
    }

    const itemsWithVotes = items.map((a) => ({
      ...a,
      userVote: userVoteMap[a.id] ?? null,
    }));

    console.info(
      `[ANSWERS_GET] questionId=${questionId} page=${page} returned=${items.length} hasNext=${hasNextPage} user=${session.user.id}`
    );

    return NextResponse.json({ items: itemsWithVotes, nextPage: hasNextPage ? page + 1 : null });
  } catch (error: any) {
    console.error("[ANSWERS_GET] Unhandled error:", {
      message: error.message,
      stack: error.stack,
      questionId,
      page,
    });
    return NextResponse.json(
      { error: "Failed to fetch answers. Please try again later." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  let sessionData: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;

  try {
    sessionData = await auth.api.getSession({ headers: await headers() });

    if (!sessionData?.user) {
      console.warn("[ANSWERS_POST] Unauthenticated attempt to post answer");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { questionId, body: answerBody } = body;

    // Content Moderation
    const modResult = await checkContent(answerBody || "");
    if (!modResult.isAppropriate) {
      return NextResponse.json({
        error: "Inappropriate content detected",
        details: modResult.message,
        confidence: modResult.confidence
      }, { status: 400 });
    }

    if (!questionId?.trim()) {
      return NextResponse.json({ error: "questionId is required" }, { status: 400 });
    }

    if (!answerBody?.trim()) {
      return NextResponse.json({ error: "Answer body cannot be empty" }, { status: 400 });
    }

    const question = await db.query.questions.findFirst({
      where: eq(questions.id, questionId),
    });

    if (!question) {
      console.warn(`[ANSWERS_POST] Question not found id=${questionId}`);
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    if (question.authorId === sessionData.user.id) {
      console.warn(
        `[ANSWERS_POST] User=${sessionData.user.id} attempted to answer own question id=${questionId}`
      );
      return NextResponse.json(
        { error: "You cannot answer your own question" },
        { status: 403 }
      );
    }

    const [newAnswer] = await db
      .insert(answers)
      .values({
        questionId,
        body: answerBody.trim(),
        authorId: sessionData.user.id,
      })
      .returning();

    await db
      .update(questions)
      .set({ answerCount: sql`${questions.answerCount} + 1` })
      .where(eq(questions.id, questionId));

    const fullAnswer = await db.query.answers.findFirst({
      where: eq(answers.id, newAnswer.id),
      with: { author: true },
    });

    if (!fullAnswer) {
      console.error("[ANSWERS_POST] Failed to re-fetch answer after insert:", newAnswer.id);
      return NextResponse.json(
        { error: "Answer created but could not be retrieved. Please refresh." },
        { status: 500 }
      );
    }

    console.info(
      `[ANSWERS_POST] New answer id=${fullAnswer.id} for question=${questionId} by user=${sessionData.user.id}`
    );

    return NextResponse.json({ ...fullAnswer, commentCount: 0 }, { status: 201 });
  } catch (error: any) {
    console.error("[ANSWERS_POST] Unhandled error:", {
      message: error.message,
      stack: error.stack,
      userId: sessionData?.user?.id ?? "unknown",
    });
    return NextResponse.json(
      { error: "Failed to post answer. Please try again later." },
      { status: 500 }
    );
  }
}
