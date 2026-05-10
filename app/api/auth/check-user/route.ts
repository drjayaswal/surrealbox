import { db } from "@/app/db";
import { user } from "@/app/db/schema";
import { eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, username } = await req.json();

    if (!email && !username) {
      return NextResponse.json({ exists: false });
    }
    
    const existingUser = await db.query.user.findFirst({
      where: or(
        email ? eq(user.email, email) : undefined,
        username ? eq(user.username, username) : undefined
      ),
    });
    return NextResponse.json({ exists: !!existingUser });
  } catch (error) {
    return NextResponse.json({ exists: false, error: "Internal server error" }, { status: 500 });
  }
}
