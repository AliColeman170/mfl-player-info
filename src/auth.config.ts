import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [], // Add providers with an empty array for now
  callbacks: {
    async signIn() {
      return true;
    },
    // async redirect(url, baseUrl) { return baseUrl },
    session({ session, token }) {
      session.user = token.user;
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
      }
      return token;
    },
  },
} satisfies NextAuthConfig;
