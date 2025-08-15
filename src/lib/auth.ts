// src/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "./db";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const email = creds?.email?.toString() || "";
        const password = creds?.password?.toString() || "";

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // Returned object’s fields end up on JWT
        return { id: user.id, email: user.email };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // Persist id onto token when user logs in
      if (user) token.id = (user as any).id;
      return token;
    },
    async session({ session, token }) {
      // Ensure session.user.id exists
      if (session.user) {
        (session.user as any).id = (token as any)?.id || token.sub || null;
      }
      return session;
    },
  },
};

// Helper so server code can do: const session = await auth();
export function auth() {
  return getServerSession(authOptions);
}
