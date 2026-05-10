import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/app/lib/auth"; 

export async function proxy(request: NextRequest) {
    const session = await auth.api.getSession({
        headers: request.headers,
    });

    const { pathname } = request.nextUrl;
    const isAdminRoute = pathname.startsWith("/admin");
    const isAuthPage = pathname.startsWith("/signin") || pathname.startsWith("/signup");

    if (isAdminRoute) {
        if (!session) {
            return NextResponse.redirect(new URL("/signin", request.url));
        }
        if (session.user.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/", request.url));
        }
    }

    if (isAuthPage && session) {
        const dashboard = session.user.role === "ADMIN" ? "/admin" : "/";
        return NextResponse.redirect(new URL(dashboard, request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/admin/:path*", 
        "/signin", 
        "/signup"
    ],
};