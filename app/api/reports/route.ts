import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { db } from "@/app/db/index";
import { reports } from "@/app/db/schema";
import { headers } from "next/headers";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { referenceId, referenceType, reportedUserId, reason } = body;

    if (!referenceId || !referenceType || !reportedUserId || !reason) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const reportId = nanoid();
    
    await db.insert(reports).values({
      id: reportId,
      userId: session.user.id,
      reportedUserId,
      referenceId,
      reportReferenceType: referenceType,
      reason,
      createdAt: new Date(),
      status: "pending",
    });

    return NextResponse.json({ success: true, id: reportId });
  } catch (error: any) {
    console.error("[REPORTS_POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    );
  }
}
