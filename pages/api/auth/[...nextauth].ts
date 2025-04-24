import NextAuth, { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '../../../src/app/libs/prismadb';
import bcrypt from 'bcrypt';

const generateHashedPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
		clientId: process.env.FACEBOOK_CLIENT_ID!,
		clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
		authorization: {
		  params: {
			scope: 'email',  // Thêm quyền này vào
		  },
		},
	  }),	  
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email hoặc mật khẩu không chính xác');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.hashedPassword) {
          throw new Error('Email hoặc mật khẩu không chính xác');
        }

        const isValid = await bcrypt.compare(credentials.password, user.hashedPassword);
        if (!isValid) {
          throw new Error('Email hoặc mật khẩu không chính xác');
        }

        return user;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if ((account?.provider === 'google' || account?.provider === 'facebook') && user.email) {
        const existingAccount = await prisma.account.findFirst({
          where: {
            providerAccountId: account.providerAccountId,
            provider: account.provider,
          },
        });

        if (!existingAccount) {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          const image =
            account.provider === 'facebook'
              ? (profile as any)?.picture?.data?.url
              : (profile as any)?.picture || user.image;

          const userToUse = existingUser
            ? existingUser
            : await prisma.user.create({
                data: {
                  name: profile?.name || user.name,
                  email: user.email,
                  image,
                  hashedPassword: await generateHashedPassword('default-password'),
                },
              });

          await prisma.account.create({
            data: {
              userId: userToUse.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state,
            },
          });
        } else {
          await prisma.account.update({
            where: { id: existingAccount.id },
            data: {
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state,
            },
          });
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
