import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";

export const {
  auth,
  signIn,
  signOut,
  handlers: { GET, POST },
} = NextAuth({
  session: { strategy: "jwt" },
  ...authConfig,
  providers: [
    Credentials({
      name: "FlowAuth",
      credentials: {
        addr: {},
      },
      // @ts-ignore
      async authorize(credentials) {
        if (credentials.addr) {
          const user = await fetch(
            `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/users/${credentials.addr}/public`
          ).then((res) => res.json());
          // const user = {
          //   addr: credentials.addr,
          // };
          return { ...user, addr: credentials.addr };
        }
        return null;
      },
    }),
  ],
});
