import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { db } from "@/app/db/index";
import { user as userTable } from "@/app/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  const { id: userId } = await params;

  if (!session?.user || session.user.id !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, gender, image, bio } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (gender !== undefined) updateData.gender = gender;
    if (image !== undefined) updateData.image = image;
    if (bio !== undefined) updateData.bio = bio;

    updateData.updatedAt = new Date();

    await db.update(userTable).set(updateData).where(eq(userTable.id, userId));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update profile" }, { status: 500 });
  }
}
