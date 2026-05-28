import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { authConfig } from "@/lib/auth.config";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.email) {
        console.error("[auth] signIn rejected: missing Google email");
        return false;
      }

      const email = user.email.toLowerCase();

      try {
        const dbUser = await db.user.findUnique({ where: { email } });

        if (!dbUser) {
          console.error(`[auth] signIn rejected: ${email} not in database`);
          return "/login?error=NotRegistered";
        }

        if (user.image && user.image !== dbUser.image) {
          await db.user.update({
            where: { id: dbUser.id },
            data: { image: user.image },
          });
        }

        console.info(`[auth] signIn allowed: ${email} (${dbUser.role})`);
        return true;
      } catch (error) {
        console.error("[auth] signIn database error:", error);
        return "/login?error=DatabaseError";
      }
    },
    async jwt({ token, user, account }) {
      const email = (user?.email ?? token.email)?.toLowerCase();
      if (!email) return token;

      try {
        const dbUser = await db.user.findUnique({ where: { email } });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.name = dbUser.name;
          token.email = email;
        } else if (user || account) {
          token.id = undefined;
          token.role = undefined;
        }
      } catch (error) {
        console.error("[auth] jwt database error:", error);
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;
      }
      return session;
    },
  },
});
