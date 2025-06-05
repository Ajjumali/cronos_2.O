// Third-party Imports
import CredentialProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { PrismaClient } from '@prisma/client'
import type { NextAuthOptions } from 'next-auth'
import type { Adapter } from 'next-auth/adapters'
import type { Session } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import { signOut } from 'next-auth/react'

// Custom types
interface User {
  id: string
  iUserId: number
  vFirstName: string
  vLastName: string
  vLoginName: string
  vEmailId: string | null
  role: string
  employeeNo: string
  userTypeId: number
  name?: string | null
  email?: string | null
  image?: string | null
  accessToken: string
  refreshToken: string
}

export interface CustomSession extends Session {
  accessToken?: string
  user: {
    userId: number
    firstName: string
    lastName: string
    loginName: string
    emailId: string | null
    role: string
    employeeNo: string
    userTypeId: number
  } & Session['user']
}

type SignInResponse = {
  status: string
  message: string
  result: {
    user: User
    token: string
    refreshToken: string
    refreshTokenExpiryTime: Date
  }
}

interface Token {
  accessToken?: string
  refreshToken?: string
  accessTokenExpires?: number
  user?: User
  error?: string
}

interface AuthResponse {
  accessToken: string
  refreshToken: string
  expiresAt: Date
}

const prisma = new PrismaClient()

// First, extend the JWT type
declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    accessTokenExpires?: number
    user?: User
    error?: string
    [key: string]: any  // Add index signature
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  pages: {
    signIn: '/login'
  },
  providers: [
    CredentialProvider({
      name: 'Credentials',
      type: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const { username, password } = credentials as { username: string; password: string }

        try {
          if (!process.env.API_URL) {
            throw new Error('Server configuration error')
          }

          const apiUrl = `${process.env.API_URL}/tokens/login`
          const res = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json'
            },
            body: JSON.stringify({ username, password })
          })

          const responseText = await res.text()
          if (!responseText) {
            throw new Error('Empty response from server')
          }

          if (!res.ok) {
            throw new Error('Invalid credentials')
          }

          const data: SignInResponse = JSON.parse(responseText)

          if (res.status === 200 && data.result) {
            return {
              ...data.result.user,
              accessToken: data.result.token,
              refreshToken: data.result.refreshToken
            }
          }

          throw new Error(data.message || 'Authentication failed')
        } catch (e: any) {
          console.error('Authentication Error:', e)
          throw new Error(e.message || 'Authentication failed')
        }
      }
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string
    })

    // ** ...add more providers here
  ],
  callbacks: {
    async jwt({ token, user, account }): Promise<JWT> {
      console.log('JWT Callback - Current token state:', {
        hasAccessToken: !!token.accessToken,
        hasRefreshToken: !!token.refreshToken,
        expiresAt: token.accessTokenExpires ? new Date(token.accessTokenExpires).toISOString() : 'none',
        currentTime: new Date().toISOString()
      });

      if (account && user) {
        console.log('Initial sign in - setting up new token');
        return {
          ...token,
          accessToken: (user as User).accessToken,
          refreshToken: (user as User).refreshToken,
          accessTokenExpires: Date.now() + 15 * 60 * 1000, // 2 minutes
          user
        } as JWT
      }

      // Check if token needs refresh
      // if (token.accessTokenExpires) {
      //   const shouldRefresh = Date.now() >= token.accessTokenExpires - 30 * 1000; // Refresh 30 seconds before expiry
      //   console.log('Token refresh check:', {
      //     currentTime: new Date().toISOString(),
      //     expiresAt: new Date(token.accessTokenExpires).toISOString(),
      //     shouldRefresh
      //   });

      //   if (shouldRefresh) {
      //     console.log('Token needs refresh - calling refreshAccessToken');
      //     return refreshAccessToken(token);
      //   }
      // }

      return token;
    },
    async session({ session, token }) {
      console.log('Session Callback - Token state:', {
        hasAccessToken: !!token.accessToken,
        hasRefreshToken: !!token.refreshToken,
        expiresAt: token.accessTokenExpires ? new Date(token.accessTokenExpires).toISOString() : 'none'
      });

      const customSession = session as CustomSession;
      
      if (token) {
        const user = token.user as User;
        customSession.user = {
          ...session.user,
          ...user,
          userId: user.iUserId,
          firstName: user.vFirstName,
          lastName: user.vLastName,
          loginName: user.vLoginName,
          emailId: user.vEmailId,
          role: user.role,
          employeeNo: user.employeeNo,
          userTypeId: user.userTypeId
        }
        customSession.accessToken = token.accessToken as string;
      }
      
      if (token.error === "RefreshAccessTokenError") {
        console.error('Refresh token error detected - signing out');
        await signOut();
        return customSession;
      }
      
      return customSession;
    }
  }
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    console.log('Starting token refresh process...', {
      currentTime: new Date().toISOString(),
      tokenExpiry: token.accessTokenExpires ? new Date(token.accessTokenExpires).toISOString() : 'none'
    });
    
    if (!token.refreshToken) {
      console.error('No refresh token available');
      throw new Error('No refresh token available');
    }

    const refreshUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/tokens/refresh`;
    console.log('Making refresh token request to:', refreshUrl);
    
    const response = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token.accessToken,
        refreshToken: token.refreshToken,
      }),
    });

    console.log('Refresh token response status:', response.status);
    const responseText = await response.text();
    console.log('Raw response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
      console.log('Parsed refresh token response:', data);
    } catch (e) {
      console.error('Failed to parse response:', e);
      throw new Error('Invalid response from server');
    }

    if (!response.ok) {
      console.error('Refresh token failed:', data.message);
      throw new Error(data.message || 'Failed to refresh token');
    }

    if (!data.result?.accessToken || !data.result?.refreshToken) {
      console.error('Invalid response format:', data);
      throw new Error('Invalid response format from server');
    }

    console.log('Token refresh successful, updating token...');
    const newToken = {
      ...token,
      accessToken: data.result.accessToken,
      refreshToken: data.result.refreshToken,
      accessTokenExpires: Date.now() + 15 * 60 * 1000, // 2 minutes
    };
    
    console.log('New token created:', {
      hasAccessToken: !!newToken.accessToken,
      hasRefreshToken: !!newToken.refreshToken,
      expiresAt: new Date(newToken.accessTokenExpires).toISOString()
    });
    
    return newToken;
  } catch (error) {
    console.error('Error in refreshAccessToken:', error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}
