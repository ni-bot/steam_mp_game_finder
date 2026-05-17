import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      id: "steam",
      name: "Steam",
      credentials: {
        steamId: { label: "Steam ID", type: "text" },
        name: { label: "Name", type: "text" },
        image: { label: "Image", type: "text" },
      },
      async authorize(credentials) {
        const steamId = credentials?.steamId;
        if (!steamId || typeof steamId !== "string") return null;

        return {
          id: steamId,
          name: (credentials.name as string) || "Steam User",
          image: (credentials.image as string) || undefined,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.steamId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.steamId = (token.steamId as string) ?? token.sub ?? "";
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  trustHost: true,
});
