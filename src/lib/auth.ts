import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { authConfig } from "@/lib/auth.config";
import { db } from "@/lib/db";
import { getImpersonationTargetId } from "@/lib/impersonation";
import type { User } from "@/generated/prisma/client";

// The jwt/session callbacks run on every auth() call (layout, page, and each
// API request). Without caching, each of those is a database round trip,
// which dominates page load time when the DB is remote. A short TTL keeps
// role/org changes propagating within a minute without a re-login.
const USER_CACHE_TTL_MS = 60_000;
const userCache = new Map<string, { user: User | null; expiresAt: number }>();

async function getCachedUser(
  key: "email" | "id",
  value: string,
  { fresh = false }: { fresh?: boolean } = {},
): Promise<User | null> {
  const cacheKey = `${key}:${value}`;
  const cached = userCache.get(cacheKey);
  if (!fresh && cached && cached.expiresAt > Date.now()) {
    return cached.user;
  }

  const user = await db.user.findUnique({
    where: key === "email" ? { email: value } : { id: value },
  });

  if (userCache.size > 1000) userCache.clear();
  userCache.set(cacheKey, { user, expiresAt: Date.now() + USER_CACHE_TTL_MS });
  return user;
}

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

        await db.user.update({
          where: { id: dbUser.id },
          data: {
            lastLoginAt: new Date(),
            ...(user.image && user.image !== dbUser.image
              ? { image: user.image }
              : {}),
          },
        });

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
        // Fresh sign-ins bypass the cache so new roles/orgs apply immediately.
        const dbUser = await getCachedUser("email", email, {
          fresh: Boolean(user || account),
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.organizationId = dbUser.organizationId;
          token.name = dbUser.name;
          token.email = email;
        } else if (user || account) {
          token.id = undefined;
          token.role = undefined;
          token.organizationId = undefined;
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
        session.user.organizationId =
          (token.organizationId as string | null | undefined) ?? null;
        session.user.impersonatedBy = null;
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;

        // Super admins can view the app as another user. The cookie is only
        // honored when the real JWT role is SUPER_ADMIN.
        if (token.role === "SUPER_ADMIN") {
          const targetId = await getImpersonationTargetId();
          if (targetId && targetId !== token.id) {
            try {
              const target = await getCachedUser("id", targetId);
              if (target && target.role !== "SUPER_ADMIN") {
                session.user.id = target.id;
                session.user.role = target.role;
                session.user.organizationId = target.organizationId;
                session.user.name = target.name;
                session.user.email = target.email;
                session.user.image = target.image;
                session.user.impersonatedBy = (token.email as string) ?? "";
              }
            } catch (error) {
              console.error("[auth] impersonation lookup failed:", error);
            }
          }
        }
      }
      return session;
    },
  },
});
