import { db } from "@/app/db";
import { user } from "@/app/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const createAccountSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores"),
  gender: z.string(),
  bio: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = createAccountSchema.parse(body);

    const existingUsername = await db.query.user.findFirst({
      where: and(
        eq(user.username, validatedData.username),
        ne(user.email, validatedData.email)
      ),
    });

    if (existingUsername) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
    }

    const updatedUser = await db.update(user)
      .set({
        name: validatedData.name,
        username: validatedData.username,
        gender: validatedData.gender,
        bio: validatedData.bio || "",
        updatedAt: new Date(),
      })
      .where(eq(user.email, validatedData.email))
      .returning();

    if (!updatedUser.length) {
      return NextResponse.json({ error: "User not found. Please verify your email first." }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updatedUser[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Create account error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
