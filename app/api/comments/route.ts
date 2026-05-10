import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { db } from "@/app/db/index";
import { comments, answers, questions } from "@/app/db/schema";
import { headers } from "next/headers";
import { eq, desc, and, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parentId = searchParams.get("parentId")?.trim();
  const parentType = searchParams.get("parentType")?.trim();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));
  const offset = (page - 1) * limit;

  try {
    if (!parentId || !parentType) {
      return NextResponse.json(
        { error: "parentId and parentType query parameters are required" },
        { status: 400 }
      );
    }

    if (!["question", "answer"].includes(parentType)) {
      return NextResponse.json(
        { error: "parentType must be 'question' or 'answer'" },
        { status: 400 }
      );
    }

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      console.warn(
        `[COMMENTS_GET] Unauthenticated request for parentId=${parentId} parentType=${parentType}`
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const list = await db.query.comments.findMany({
      where: (comments, { eq, and }) =>
        and(
          eq(comments.parentId, parentId),
          eq(comments.parentType, parentType)
        ),
      with: { author: true },
      orderBy: [desc(comments.createdAt)],
      limit: limit + 1,
      offset,
    });

    const hasNextPage = list.length > limit;
    const items = hasNextPage ? list.slice(0, limit) : list;

    console.info(
      `[COMMENTS_GET] parentId=${parentId} parentType=${parentType} page=${page} returned=${items.length} hasNext=${hasNextPage} user=${session.user.id}`
    );

    return NextResponse.json({ items, nextPage: hasNextPage ? page + 1 : null });
  } catch (error: any) {
    console.error("[COMMENTS_GET] Unhandled error:", {
      message: error.message,
      stack: error.stack,
      parentId,
      parentType,
      page,
    });
    return NextResponse.json(
      { error: "Failed to fetch comments. Please try again later." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  let sessionData: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;

  try {
    sessionData = await auth.api.getSession({ headers: await headers() });

    if (!sessionData?.user) {
      console.warn("[COMMENTS_POST] Unauthenticated attempt to post comment");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { parentId, parentType, content } = body;

    if (!parentId?.trim() || !parentType?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: "parentId, parentType, and content are required" },
        { status: 400 }
      );
    }

    if (!["question", "answer"].includes(parentType)) {
      return NextResponse.json(
        { error: "parentType must be 'question' or 'answer'" },
        { status: 400 }
      );
    }

    if (parentType === "question") {
      const question = await db.query.questions.findFirst({
        where: eq(questions.id, parentId),
      });
      if (!question) {
        return NextResponse.json({ error: "Question not found" }, { status: 404 });
      }
    } else if (parentType === "answer") {
      const answer = await db.query.answers.findFirst({
        where: eq(answers.id, parentId),
      });
      if (!answer) {
        return NextResponse.json({ error: "Answer not found" }, { status: 404 });
      }
      if (answer.authorId === sessionData.user.id) {
        console.warn(
          `[COMMENTS_POST] User=${sessionData.user.id} attempted to comment on own answer id=${parentId}`
        );
        return NextResponse.json(
          { error: "You cannot comment on your own answer" },
          { status: 403 }
        );
      }
    }

    const [newComment] = await db
      .insert(comments)
      .values({
        parentId,
        parentType,
        content: content.trim(),
        authorId: sessionData.user.id,
      })
      .returning();

    if (parentType === "question") {
      await db
        .update(questions)
        .set({ commentCount: sql`${questions.commentCount} + 1` })
        .where(eq(questions.id, parentId));
    } else {
      await db
        .update(answers)
        .set({ commentCount: sql`${answers.commentCount} + 1` })
        .where(eq(answers.id, parentId));
    }

    const fullComment = await db.query.comments.findFirst({
      where: eq(comments.id, newComment.id),
      with: { author: true },
    });

    if (!fullComment) {
      console.error("[COMMENTS_POST] Failed to re-fetch comment after insert:", newComment.id);
      return NextResponse.json(
        { error: "Comment created but could not be retrieved. Please refresh." },
        { status: 500 }
      );
    }

    console.info(
      `[COMMENTS_POST] New comment id=${fullComment.id} on ${parentType}=${parentId} by user=${sessionData.user.id}`
    );

    return NextResponse.json(fullComment, { status: 201 });
  } catch (error: any) {
    console.error("[COMMENTS_POST] Unhandled error:", {
      message: error.message,
      stack: error.stack,
      userId: sessionData?.user?.id ?? "unknown",
    });
    return NextResponse.json(
      { error: "Failed to post comment. Please try again later." },
      { status: 500 }
    );
  }
}
