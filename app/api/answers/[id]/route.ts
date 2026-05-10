import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { db } from "@/app/db/index";
import { answers } from "@/app/db/schema";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let sessionData: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;

  try {
    sessionData = await auth.api.getSession({ headers: await headers() });

    if (!sessionData?.user) {
      console.warn("[ANSWERS_PATCH] Unauthenticated attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => null);

    if (!body?.body?.trim()) {
      return NextResponse.json({ error: "Answer body cannot be empty" }, { status: 400 });
    }

    const answer = await db.query.answers.findFirst({
      where: eq(answers.id, id),
    });

    if (!answer) {
      console.warn(`[ANSWERS_PATCH] Answer not found id=${id}`);
      return NextResponse.json({ error: "Answer not found" }, { status: 404 });
    }

    if (answer.authorId !== sessionData.user.id) {
      console.warn(
        `[ANSWERS_PATCH] Unauthorized edit attempt: user=${sessionData.user.id} on answer=${id}`
      );
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [updatedAnswer] = await db
      .update(answers)
      .set({ body: body.body.trim() })
      .where(eq(answers.id, id))
      .returning();

    console.info(`[ANSWERS_PATCH] Answer updated id=${id} by user=${sessionData.user.id}`);

    return NextResponse.json(updatedAnswer);
  } catch (error: any) {
    console.error("[ANSWERS_PATCH] Unhandled error:", {
      message: error.message,
      stack: error.stack,
      userId: sessionData?.user?.id ?? "unknown",
    });
    return NextResponse.json(
      { error: "Failed to update answer. Please try again later." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let sessionData: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;

  try {
    sessionData = await auth.api.getSession({ headers: await headers() });

    if (!sessionData?.user) {
      console.warn("[ANSWERS_DELETE] Unauthenticated attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const answer = await db.query.answers.findFirst({
      where: eq(answers.id, id),
    });

    if (!answer) {
      console.warn(`[ANSWERS_DELETE] Answer not found id=${id}`);
      return NextResponse.json({ error: "Answer not found" }, { status: 404 });
    }

    if (answer.authorId !== sessionData.user.id) {
      console.warn(
        `[ANSWERS_DELETE] Unauthorized delete attempt: user=${sessionData.user.id} on answer=${id}`
      );
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.delete(answers).where(eq(answers.id, id));

    console.info(`[ANSWERS_DELETE] Answer deleted id=${id} by user=${sessionData.user.id}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[ANSWERS_DELETE] Unhandled error:", {
      message: error.message,
      stack: error.stack,
      userId: sessionData?.user?.id ?? "unknown",
    });
    return NextResponse.json(
      { error: "Failed to delete answer. Please try again later." },
      { status: 500 }
    );
  }
}
