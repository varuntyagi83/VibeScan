import type { NextAuthConfig } from "next-auth";

// Edge-safe auth config — no Node.js-only providers (no Nodemailer)
// Used by middleware which runs in the Edge runtime
export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublic =
        nextUrl.pathname === "/" ||
        nextUrl.pathname === "/login" ||
        nextUrl.pathname === "/demo" ||
        nextUrl.pathname.startsWith("/api/auth");

      if (isPublic) {
        if (isLoggedIn && nextUrl.pathname === "/login") {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      return isLoggedIn;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
