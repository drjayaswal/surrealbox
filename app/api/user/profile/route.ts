import { auth } from "@/app/lib/auth";
import { user as userTable } from "@/app/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/app/db";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = await db.query.user.findFirst({
      where: eq(userTable.id, session.user.id),
    });

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(userData);
  } catch (err: any) {
    console.error("[GET /api/user/profile]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
