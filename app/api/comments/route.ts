import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { db } from "@/app/db/index";
import { comments, answers, questions } from "@/app/db/schema";
import { headers } from "next/headers";
import { eq, desc, sql } from "drizzle-orm";
import { checkContent } from "@/lib/moderator";

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

    if (!["question", "answer", "comment"].includes(parentType)) {
      return NextResponse.json(
        { error: "parentType must be 'question', 'answer', or 'comment'" },
        { status: 400 }
      );
    }

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const list = await db.query.comments.findMany({
      where: (c, { eq, and }) =>
        and(
          eq(c.parentId, parentId),
          eq(c.parentType, parentType)
        ),
      with: { author: true },
      orderBy: [desc(comments.createdAt)],
      limit: limit + 1,
      offset,
    });

    const hasNextPage = list.length > limit;
    const items = hasNextPage ? list.slice(0, limit) : list;

    let userVoteMap: Record<string, "up" | "down"> = {};
    if (items.length > 0 && session?.user) {
      const commentIds = items.map((c) => c.id);
      const { votes } = await import("@/app/db/schema");
      const userVotes = await db.query.votes.findMany({
        where: (v, { and, eq, inArray }) =>
          and(eq(v.userId, session.user.id), inArray(v.votableId, commentIds)),
      });
      for (const v of userVotes) {
        userVoteMap[v.votableId] = v.direction as "up" | "down";
      }
    }

    const itemsWithVotes = items.map((c) => ({
      ...c,
      score: c.score ?? 0,
      replyCount: c.replyCount ?? 0,
      replyToId: c.replyToId ?? null,
      userVote: userVoteMap[c.id] ?? null,
    }));

    return NextResponse.json({ items: itemsWithVotes, nextPage: hasNextPage ? page + 1 : null });
  } catch (error: any) {
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { parentId, parentType, content, replyToId } = body;

    const modResult = await checkContent(content || "");
    if (!modResult.isAppropriate) {
      return NextResponse.json({
        error: "Inappropriate content detected",
        details: modResult.message,
        confidence: modResult.confidence
      }, { status: 400 });
    }

    if (!parentId?.trim() || !parentType?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: "parentId, parentType, and content are required" },
        { status: 400 }
      );
    }

    if (!["question", "answer", "comment"].includes(parentType)) {
      return NextResponse.json(
        { error: "parentType must be 'question', 'answer', or 'comment'" },
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
        return NextResponse.json(
          { error: "You cannot comment on your own answer" },
          { status: 403 }
        );
      }
    } else if (parentType === "comment") {
      const parentComment = await db.query.comments.findFirst({
        where: eq(comments.id, parentId),
      });
      if (!parentComment) {
        return NextResponse.json({ error: "Comment not found" }, { status: 404 });
      }
    }

    const [newComment] = await db
      .insert(comments)
      .values({
        parentId,
        parentType,
        content: content.trim(),
        authorId: sessionData.user.id,
        replyToId: replyToId || null,
      })
      .returning();

    if (parentType === "question") {
      await db
        .update(questions)
        .set({ commentCount: sql`${questions.commentCount} + 1` })
        .where(eq(questions.id, parentId));
    } else if (parentType === "answer") {
      await db
        .update(answers)
        .set({ commentCount: sql`${answers.commentCount} + 1` })
        .where(eq(answers.id, parentId));
    } else if (parentType === "comment") {
      await db
        .update(comments)
        .set({ replyCount: sql`${comments.replyCount} + 1` })
        .where(eq(comments.id, parentId));
    }

    const fullComment = await db.query.comments.findFirst({
      where: eq(comments.id, newComment.id),
      with: { author: true },
    });

    if (!fullComment) {
      return NextResponse.json(
        { error: "Comment created but could not be retrieved. Please refresh." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...fullComment,
      score: fullComment.score ?? 0,
      replyCount: fullComment.replyCount ?? 0,
      replyToId: fullComment.replyToId ?? null,
      userVote: null,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to post comment. Please try again later." },
      { status: 500 }
    );
  }
}
