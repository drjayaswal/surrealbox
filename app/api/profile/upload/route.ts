import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { db } from "@/app/db/index";
import { user as userTable } from "@/app/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { uploadToSupabase } from "@/app/lib/upload";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const isProfileImage = formData.get("isProfileImage") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const publicUrl = await uploadToSupabase(buffer, userId, {
      isProfileImage,
      fileName: file.name,
      contentType: file.type,
    });

    if (isProfileImage) {
      await db
        .update(userTable)
        .set({ image: publicUrl, updatedAt: new Date() })
        .where(eq(userTable.id, userId));
    }

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
