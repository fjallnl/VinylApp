import type { DefaultSession } from "next-auth";

type Role = "ADMIN" | "USER";
type ThemePreference = "dark" | "light" | "system";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      themePreference: ThemePreference;
    } & DefaultSession["user"];
  }

  interface User {
    role?: Role;
    themePreference?: ThemePreference;
  }

  interface JWT {
    theme?: ThemePreference;
  }
}
