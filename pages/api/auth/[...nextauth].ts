import NextAuth, { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '../../../src/app/libs/prismadb';
import CredentialsProvider from 'next-auth/providers/credentials';
// Dynamic import bcrypt to avoid webpack issues
const bcrypt = require('bcrypt');
import { getAdminSessionConfig } from '../../../src/app/libs/auth/getAdminSessionConfig';
import { AuditLogger, AuditEventType, AuditSeverity } from '../../../src/app/utils/auditLogger';

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
      async authorize(credentials, req) {
        const clientIP = req?.headers?.['x-forwarded-for'] || req?.headers?.['x-real-ip'] || 'unknown';
        const userAgent = req?.headers?.['user-agent'] || 'unknown';

        // Verify that password been retrieved from Login form
        if (!credentials?.email || !credentials?.password) {
          // 🚨 AUDIT LOG: Missing Credentials
          await AuditLogger.log({
            eventType: AuditEventType.FAILED_LOGIN_ATTEMPT,
            severity: AuditSeverity.MEDIUM,
            userId: 'anonymous',
            userEmail: credentials?.email || 'unknown',
            userRole: 'UNKNOWN',
            ipAddress: clientIP,
            userAgent: userAgent,
            description: `Đăng nhập thất bại: thiếu thông tin đăng nhập`,
            details: {
              reason: 'missing_credentials',
              email: credentials?.email || null,
              hasPassword: !!credentials?.password,
              timestamp: new Date(),
              riskLevel: 'LOW'
            },
            resourceId: 'anonymous',
            resourceType: 'Authentication'
          });
          throw new Error('Email hoặc mật khẩu không chính xác');
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        // Verify the exsisting in db
        if (!user || !user.hashedPassword) {
          // 🚨 AUDIT LOG: User Not Found
          await AuditLogger.log({
            eventType: AuditEventType.FAILED_LOGIN_ATTEMPT,
            severity: AuditSeverity.HIGH, // HIGH because could be account enumeration attack
            userId: 'anonymous',
            userEmail: credentials.email,
            userRole: 'UNKNOWN',
            ipAddress: clientIP,
            userAgent: userAgent,
            description: `Đăng nhập thất bại: tài khoản không tồn tại`,
            details: {
              reason: 'user_not_found',
              email: credentials.email,
              userExists: !!user,
              hasHashedPassword: !!user?.hashedPassword,
              timestamp: new Date(),
              riskLevel: 'HIGH', // Potential account enumeration
              securityNote: 'Possible account enumeration attempt'
            },
            resourceId: 'anonymous',
            resourceType: 'Authentication'
          });
          throw new Error('Email hoặc mật khẩu không chính xác');
        }

        // Comparing the password user entered and hashed password in db
        const isCorrectPassword = await bcrypt.compare(credentials.password, user.hashedPassword);
        if (!isCorrectPassword) {
          // 🚨 AUDIT LOG: Wrong Password
          await AuditLogger.log({
            eventType: AuditEventType.FAILED_LOGIN_ATTEMPT,
            severity: AuditSeverity.HIGH, // HIGH because could be brute force attack
            userId: user.id,
            userEmail: user.email!,
            userRole: user.role || 'USER',
            ipAddress: clientIP,
            userAgent: userAgent,
            description: `Đăng nhập thất bại: mật khẩu sai`,
            details: {
              reason: 'wrong_password',
              email: user.email,
              userId: user.id,
              userName: user.name,
              userRole: user.role,
              lastLogin: user.lastLogin,
              timestamp: new Date(),
              riskLevel: 'HIGH', // Potential brute force
              securityNote: 'Monitor for repeated failed attempts from same IP/user'
            },
            resourceId: user.id,
            resourceType: 'User'
          });
          throw new Error('Email hoặc mật khẩu không chính xác');
        }

        // Check if email is verified
        if (!user.emailVerified) {
          // 🚨 AUDIT LOG: Email Not Verified
          await AuditLogger.log({
            eventType: AuditEventType.FAILED_LOGIN_ATTEMPT,
            severity: AuditSeverity.MEDIUM,
            userId: user.id,
            userEmail: user.email!,
            userRole: user.role || 'USER',
            ipAddress: clientIP,
            userAgent: userAgent,
            description: `Đăng nhập thất bại: email chưa được xác thực`,
            details: {
              reason: 'email_not_verified',
              email: user.email,
              userId: user.id,
              userName: user.name,
              userRole: user.role,
              emailVerified: user.emailVerified,
              timestamp: new Date(),
              riskLevel: 'MEDIUM',
              securityNote: 'User needs to verify email before login'
            },
            resourceId: user.id,
            resourceType: 'User'
          });
          throw new Error('EMAIL_NOT_VERIFIED');
        }

        // 🎯 AUDIT LOG: Successful Login
        await AuditLogger.log({
          eventType: AuditEventType.USER_LOGIN_SUCCESS,
          severity: AuditSeverity.LOW, // LOW for successful login
          userId: user.id,
          userEmail: user.email!,
          userRole: user.role || 'USER',
          ipAddress: clientIP,
          userAgent: userAgent,
          description: `Đăng nhập thành công`,
          details: {
            email: user.email,
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            lastLogin: user.lastLogin,
            timestamp: new Date(),
            loginMethod: 'credentials'
          },
          resourceId: user.id,
          resourceType: 'User'
        });

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

          // Update lastLogin for existing user and ensure email is verified for Google users
          await prisma.user.update({
            where: { email: user.email },
            data: {
              lastLogin: new Date(),
              emailVerified: true // Google users have verified emails
            }
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
                hashedPassword: await generateHashedPassword('default-password'),
                emailVerified: true // Google users have verified emails
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
