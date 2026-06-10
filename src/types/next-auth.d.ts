import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      organizationId: string | null;
      /** Real super admin email when this session is impersonating a user. */
      impersonatedBy?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    organizationId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    organizationId?: string | null;
  }
}
