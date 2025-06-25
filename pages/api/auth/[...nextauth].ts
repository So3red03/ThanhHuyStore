import NextAuth, { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '../../../src/app/libs/prismadb';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import { getAdminSessionConfig } from '../../../src/app/libs/auth/getAdminSessionConfig';

// Tạo mật khẩu mặc định
const generateHashedPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

//Sử dụng Prisma Client từ prismadb.ts để lưu trữ và quản lý dữ liệu xác thực, cấu hình NextAuth để sử dụng với Google và Credential Providers.
export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: {
          label: 'email',
          type: 'text'
        },
        password: {
          label: 'password',
          type: 'password'
        }
      },
      async authorize(credentials) {
        // Verify that password been retrieved from Login form
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email hoặc mật khẩu không chính xác');
        }
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });
        // Verify the exsisting in db
        if (!user || !user.hashedPassword) {
          throw new Error('Email hoặc mật khẩu không chính xác');
        }
        // Comparing the password user entered and hashed password in db
        const isCorrectPassword = await bcrypt.compare(credentials.password, user.hashedPassword);
        if (!isCorrectPassword) {
          throw new Error('Email hoặc mật khẩu không chính xác');
        }

        // Update lastLogin
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() }
        });

        return user;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Get fresh config from DB
      const config = await getAdminSessionConfig();
      const now = Math.floor(Date.now() / 1000);

      if (user && account) {
        // First login - set initial expiration
        token.exp = now + config.sessionMaxAge;
        console.log('JWT - First login, setting exp:', token.exp, 'timeout:', config.sessionMaxAge);
      } else {
        // Subsequent requests - check if we need to update expiration based on current settings
        const timeRemaining = (token.exp as number) - now;

        // If token expires in less than 5 minutes, refresh it with current settings
        if (timeRemaining < 5 * 60) {
          token.exp = now + config.sessionMaxAge;
          console.log('JWT - Refreshing token, new exp:', token.exp, 'timeout:', config.sessionMaxAge);
        }
      }

      return token;
    },

    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && user.email) {
        const existingAccount = await prisma.account.findFirst({
          where: {
            providerAccountId: account.providerAccountId,
            provider: 'google'
          }
        });
        // Trường hợp đã có tài khoản (đã đăng nhập trước đó)
        // Kiểm tra account google đã có trc đó chưa nếu đã có thì link và cập nhật dữ liệu
        if (existingAccount) {
          await prisma.account.update({
            where: {
              id: existingAccount.id
            },
            data: {
              // Update fields as needed
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state
            }
          });

          // Update lastLogin for existing user
          await prisma.user.update({
            where: { email: user.email },
            data: { lastLogin: new Date() }
          });
        } else {
          // Trường hợp chưa có tài khoản (link với user đã tạo thủ công để tạo tk)
          // Kiểm tra xem email đã được tạo trước khi đăng nhập bằng GG bên user chưa
          // nếu có thì sẽ tạo account mới và link với id của user
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email }
          });

          if (existingUser) {
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state
              }
            });
          } else {
            // Trường hợp chưa có tài khoản trong user và account
            // Tạo user mới với các thông tin từ profile Google
            const newUser = await prisma.user.create({
              data: {
                name: profile?.name || null,
                email: user.email,
                image: profile?.image || null,
                hashedPassword: await generateHashedPassword('default-password')
              }
            });

            // Sau đó tạo account với userId của newUser
            await prisma.account.create({
              data: {
                userId: newUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state
              }
            });
          }
        }
      }
      return true;
    },

    async session({ session, token }) {
      // NextAuth will automatically check token.exp to logout if expired
      if (token.exp && typeof token.exp === 'number') {
        session.expires = new Date(token.exp * 1000).toISOString();
      }
      return session;
    }
  },
  pages: {
    signIn: '/login'
  },
  debug: process.env.NODE_ENV === 'development',

  // Token đc next-auth mặc định lưu vào cookie
  session: {
    strategy: 'jwt',
    maxAge: 3 * 24 * 60 * 60, // 30 minutes default (will be overridden by admin settings),
    updateAge: 24 * 60 * 60 // 10 minutes default (will be overridden by admin settings)
  },
  jwt: {
    maxAge: 3 * 24 * 60 * 60 // 30 minutes default (will be overridden by admin settings)
  },
  secret: process.env.NEXTAUTH_SECRET
};

export default NextAuth(authOptions);
