import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import PostgresAdapter from '@auth/pg-adapter'
import { getPool } from './db'

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PostgresAdapter(getPool()!),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        // @ts-ignore
        session.user.role = user.role ?? 'user'
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
})
