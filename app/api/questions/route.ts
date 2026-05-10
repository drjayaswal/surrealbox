import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { db } from "@/app/db/index";
import { questions } from "@/app/db/schema";
import { headers } from "next/headers";
import { slugify } from "@/lib/utils";
import { eq, desc, and, ilike, or, count } from "drizzle-orm";
import { checkContent } from "@/lib/moderator";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));
  const query = searchParams.get("q")?.trim() || "";
  const sort = searchParams.get("sort") || "newest";
  const offset = (page - 1) * limit;

  try {
    const baseFilters: any[] = [];

    if (query) {
      baseFilters.push(
        or(
          ilike(questions.title, `%${query}%`),
          ilike(questions.body, `%${query}%`)
        )
      );
    }

    const whereClause = baseFilters.length > 0 ? and(...baseFilters) : undefined;

    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(questions)
      .where(whereClause);

    const orderBy =
      sort === "trending"
        ? [desc(questions.score), desc(questions.createdAt)]
        : [desc(questions.createdAt)];

    const list = await db.query.questions.findMany({
      where: whereClause,
      with: { author: true },
      orderBy,
      limit,
      offset,
    });

    const session = await auth.api.getSession({ headers: await headers() });

    let userVoteMap: Record<string, "up" | "down"> = {};
    if (session?.user && list.length > 0) {
      const questionIds = list.map((q) => q.id);
      const userVotes = await db.query.votes.findMany({
        where: (v, { and, eq, inArray }) =>
          and(eq(v.userId, session.user.id), inArray(v.votableId, questionIds)),
      });
      for (const v of userVotes) {
        userVoteMap[v.votableId] = v.direction as "up" | "down";
      }
    }

    const items = list.map((q) => ({
      ...q,
      userVote: userVoteMap[q.id] ?? null,
    }));


    const totalPages = Math.ceil(Number(totalCount) / limit);

    console.info(
      `[QUESTIONS_GET] page=${page} limit=${limit} sort=${sort} query="${query}" ` +
        `returned=${items.length} total=${totalCount}`
    );

    return NextResponse.json({
      items,
      totalItems: Number(totalCount),
      totalPages,
      currentPage: page,
      nextPage: page < totalPages ? page + 1 : null,
    });
  } catch (error: any) {
    console.error("[QUESTIONS_GET] Unhandled error:", {
      message: error.message,
      stack: error.stack,
      page,
      limit,
      sort,
      query,
    });
    return NextResponse.json(
      { error: "Failed to fetch questions. Please try again later." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  let sessionData: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;

  try {
    sessionData = await auth.api.getSession({ headers: await headers() });

    if (!sessionData?.user) {
      console.warn("[QUESTIONS_POST] Unauthenticated attempt to post question");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      console.warn("[QUESTIONS_POST] Malformed request body from user:", sessionData.user.id);
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { title, body: questionBody, tags } = body;

    // Content Moderation
    const [titleMod, bodyMod] = await Promise.all([
      checkContent(title || ""),
      checkContent(questionBody || "")
    ]);

    if (!titleMod.isAppropriate || !bodyMod.isAppropriate) {
      return NextResponse.json({
        error: "Inappropriate content detected",
        details: !titleMod.isAppropriate ? titleMod.message : bodyMod.message,
        confidence: !titleMod.isAppropriate ? titleMod.confidence : bodyMod.confidence
      }, { status: 400 });
    }

    if (!title?.trim() || !questionBody?.trim()) {
      return NextResponse.json(
        { error: "Title and body are required and cannot be empty" },
        { status: 400 }
      );
    }

    if (title.trim().length > 255) {
      return NextResponse.json(
        { error: "Title must not exceed 255 characters" },
        { status: 400 }
      );
    }

    const baseSlug = slugify(title.trim());
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

    const [newQuestion] = await db
      .insert(questions)
      .values({
        title: title.trim(),
        body: questionBody.trim(),
        tags: Array.isArray(tags) ? tags.filter((t: any) => typeof t === "string") : [],
        slug,
        authorId: sessionData.user.id,
      })
      .returning();

    const fullQuestion = await db.query.questions.findFirst({
      where: eq(questions.id, newQuestion.id),
      with: { author: true },
    });

    if (!fullQuestion) {
      console.error("[QUESTIONS_POST] Failed to re-fetch question after insert:", newQuestion.id);
      return NextResponse.json(
        { error: "Question created but could not be retrieved. Please refresh." },
        { status: 500 }
      );
    }

    console.info(
      `[QUESTIONS_POST] New question created id=${fullQuestion.id} by user=${sessionData.user.id}`
    );

    return NextResponse.json(
      {
        ...fullQuestion,
        answerCount: 0,
        commentCount: 0,
        userVote: null,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[QUESTIONS_POST] Unhandled error:", {
      message: error.message,
      stack: error.stack,
      userId: sessionData?.user?.id ?? "unknown",
    });
    return NextResponse.json(
      { error: "Failed to create question. Please try again later." },
      { status: 500 }
    );
  }
}
