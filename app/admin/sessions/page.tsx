import { db } from "@/app/db/index";
import { session, user } from "@/app/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/app/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ClientSessions } from "@/app/admin/sessions/client-sessions";

export default async function Sessions() {
    const authRequest = await auth.api.getSession({
        headers: await headers()
    });

    if (!authRequest || authRequest.user.role !== "ADMIN") {
        redirect("/signin");
    }

    const allSessions = await db
        .select({
            id: session.id,
            expiresAt: session.expiresAt,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
            userName: user.name,
            userEmail: user.email,
        })
        .from(session)
        .leftJoin(user, eq(session.userId, user.id))
        .orderBy(desc(session.createdAt));
    return <ClientSessions allSessions={allSessions} />;
}