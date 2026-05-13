import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const rows = await sql`
            SELECT id, name, email, role, department, password_hash
            FROM users
            WHERE email = ${credentials.email as string}
            LIMIT 1
          `;
          const user = rows[0];
          if (!user) return null;

          const valid = await bcrypt.compare(
            credentials.password as string,
            user.password_hash as string
          );
          if (!valid) return null;

          return {
            id: user.id as string,
            email: user.email as string,
            name: user.name as string,
            role: user.role as string,
            department: user.department as string,
          };
        } catch (err) {
          console.error("[auth] authorize error:", err);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
        token.department = (user as { department: string }).department;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
        (session.user as { department: string }).department =
          token.department as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
