import { auth } from "@/server/auth";
import { NextResponse } from "next/server";
import type { UserRole } from "@/lib/generated/prisma/enums";

const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  "/dashboard": ["admin", "head", "closer", "sdr", "operational"],
  "/reports": ["admin", "head", "closer", "sdr"],
  "/rankings": ["admin", "head", "closer", "sdr", "operational"],
  "/tools": ["admin", "head", "closer", "sdr", "operational"],
  "/management/goals": ["admin", "head"],
  "/management/products": ["admin"],
  "/management/users": ["admin"],
  "/clients": ["admin", "head", "operational"],
};

function matchRoute(pathname: string): UserRole[] | null {
  // Exact match first
  for (const [route, roles] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname === route || pathname.startsWith(route + "/")) {
      return roles;
    }
  }
  return null;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Rotas públicas — deixar passar
  if (pathname.startsWith("/login") || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Não autenticado → login
  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar permissão de rota
  const allowedRoles = matchRoute(pathname);
  if (allowedRoles) {
    const userRole = session.user.role as UserRole;
    if (!allowedRoles.includes(userRole)) {
      const unauthorizedUrl = new URL("/unauthorized", req.url);
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
