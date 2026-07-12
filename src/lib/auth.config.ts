import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = nextUrl.pathname.startsWith("/login");
      const isRegisterPage = nextUrl.pathname.startsWith("/register");
      const isApiAuth = nextUrl.pathname.startsWith("/api/auth");
      const isApiRegister = nextUrl.pathname.startsWith("/api/register");
      if (isApiAuth || isApiRegister) return true;
      if (isLoginPage || isRegisterPage) {
        return isLoggedIn ? Response.redirect(new URL("/collection", nextUrl)) : true;
      }
      return isLoggedIn;
    },
  },
};
