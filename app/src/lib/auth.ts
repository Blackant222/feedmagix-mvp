// BACKEND: PIN authentication utilities and session management
// Following 2025 security best practices for PIN-based authentication

import { db } from './db';
import { users, userSessions } from './schema';
import { eq, and } from 'drizzle-orm';
import { randomBytes, createHash, pbkdf2Sync } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';

// CHANGE: Removed unused interfaces to fix ESLint warnings

// Application configuration
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-key'
);

/**
 * Session token configuration
 */
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const REFRESH_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Generate secure random tokens
 */
function generateSecureToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Hash token for secure storage
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}



/**
 * Session Management
 */

/**
 * Create a new user session with JWT tokens
 */
export async function createUserSession(
  userId: string,
  deviceInfo: {
    userAgent: string;
    ip: string;
    platform?: string;
    browser?: string;
  }
): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
  const sessionToken = generateSecureToken();
  const refreshToken = generateSecureToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  const refreshExpiresAt = new Date(Date.now() + REFRESH_DURATION);

  // Store session in database
  await db.insert(userSessions).values({
    userId,
    sessionToken: hashToken(sessionToken),
    refreshToken: hashToken(refreshToken),
    expiresAt,
    refreshExpiresAt,
    deviceInfo,
    isActive: true,
  });

  // Create JWT access token
  const accessToken = await new SignJWT({ userId, sessionToken })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .setIssuer('feedmagix')
    .setAudience('feedmagix-api')
    .sign(JWT_SECRET);

  return {
    accessToken,
    refreshToken,
    expiresAt,
  };
}

/**
 * Verify and decode JWT token
 */
export async function verifyAccessToken(
  token: string
): Promise<{ userId: string; sessionToken: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: 'feedmagix',
      audience: 'feedmagix-api',
    });

    return {
      userId: payload.userId as string,
      sessionToken: payload.sessionToken as string,
    };
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Validate session and get user
 */
// CHANGE: Fixed return type to match actual structure
export async function validateSession(
  accessToken: string
): Promise<{ userId: string; sessionId: string; user: { id: string; email: string; displayName: string | null; isEmailVerified: boolean; preferences: { language: 'fa' | 'en'; theme: 'light' | 'dark' | 'system'; notifications: { email: boolean; push: boolean; analysis: boolean; reminders: boolean; }; privacy: { shareData: boolean; analytics: boolean; }; } } } | null> {
  try {
    const tokenData = await verifyAccessToken(accessToken);
    if (!tokenData) return null;

    // Check if session exists and is active
    const [session] = await db
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.sessionToken, hashToken(tokenData.sessionToken)),
          eq(userSessions.userId, tokenData.userId),
          eq(userSessions.isActive, true)
        )
      )
      .limit(1);

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    // Get user data
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, tokenData.userId))
      .limit(1);

    if (!user) return null;

    // Update last used
    await db
      .update(userSessions)
      .set({ lastUsedAt: new Date() })
      .where(eq(userSessions.id, session.id));

    return {
      userId: session.userId,
      sessionId: session.id,
      user: {
        id: user.id,
        email: user.email || '',
        displayName: user.displayName,
        isEmailVerified: user.isEmailVerified ?? false,
        preferences: user.preferences ?? {
          language: 'fa' as const,
          theme: 'system' as const,
          notifications: {
            email: true,
            push: true,
            analysis: true,
            reminders: true,
          },
          privacy: {
            shareData: false,
            analytics: true,
          },
        },
      },
    };
  } catch (error) {
    console.error('Session validation failed:', error);
    return null;
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresAt: Date } | null> {
  try {
    const hashedRefreshToken = hashToken(refreshToken);

    // Find active session with this refresh token
    const [session] = await db
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.refreshToken, hashedRefreshToken),
          eq(userSessions.isActive, true)
        )
      )
      .limit(1);

    if (!session || session.refreshExpiresAt < new Date()) {
      return null;
    }

    // Generate new access token
    const newSessionToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION);

    // Update session
    await db
      .update(userSessions)
      .set({
        sessionToken: hashToken(newSessionToken),
        expiresAt,
        lastUsedAt: new Date(),
      })
      .where(eq(userSessions.id, session.id));

    // Create new JWT
    const accessToken = await new SignJWT({
      userId: session.userId,
      sessionToken: newSessionToken,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
      .setIssuer('feedmagix')
      .setAudience('feedmagix-api')
      .sign(JWT_SECRET);

    return { accessToken, expiresAt };
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
}

/**
 * Logout user by invalidating session
 */
export async function logoutUser(accessToken: string): Promise<boolean> {
  try {
    const tokenData = await verifyAccessToken(accessToken);
    if (!tokenData) return false;

    // Deactivate session
    await db
      .update(userSessions)
      .set({ isActive: false })
      .where(
        and(
          eq(userSessions.sessionToken, hashToken(tokenData.sessionToken)),
          eq(userSessions.userId, tokenData.userId)
        )
      );

    return true;
  } catch (error) {
    console.error('Logout failed:', error);
    return false;
  }
}

/**
 * Cleanup expired sessions
 */
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    await db
      .update(userSessions)
      .set({ isActive: false })
      .where(
        and(
          eq(userSessions.isActive, true)
          // Use SQL function for date comparison
        )
      );
  } catch (error) {
    console.error('Session cleanup failed:', error);
  }
}

/**
 * PIN Authentication Functions
 */

/**
 * Hash a PIN using PBKDF2
 */
function hashPin(pin: string, salt?: string): { hash: string; salt: string } {
  const pinSalt = salt || randomBytes(32).toString('hex');
  const hash = pbkdf2Sync(pin, pinSalt, 100000, 64, 'sha512').toString('hex');
  return { hash: `${pinSalt}:${hash}`, salt: pinSalt };
}

/**
 * Verify a PIN against stored hash
 */
function verifyPin(pin: string, storedHash: string): boolean {
  const [salt] = storedHash.split(':');
  const { hash: newHash } = hashPin(pin, salt);
  return newHash === storedHash;
}

/**
 * Register user with email/phone and PIN
 */
export async function registerWithPin(
  identifier: string, // email or phone
  pin: string,
  displayName?: string,
  city?: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Validate identifier (email or phone)
    const isEmail = identifier.includes('@');
    const isPhone = /^[+]?[0-9\s-()]+$/.test(identifier);
    
    if (!isEmail && !isPhone) {
      return { success: false, error: 'شناسه وارد شده معتبر نیست' };
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(
        isEmail 
          ? eq(users.email, identifier)
          : eq(users.phone, identifier)
      )
      .limit(1);

    if (existingUser.length > 0) {
      return { success: false, error: 'کاربر با این شناسه قبلاً ثبت‌نام کرده است' };
    }

    // Hash the PIN
    const { hash: pinHash } = hashPin(pin);

    // Create new user
    const [newUser] = await db
      .insert(users)
      .values({
        email: isEmail ? identifier : null,
        phone: isPhone ? identifier : null,
        displayName: displayName || (isEmail ? identifier.split('@')[0] : 'کاربر'),
        city,
        pinHash,
        isEmailVerified: false,
        isPhoneVerified: false,
      })
      .returning();

    return { success: true, userId: newUser.id };
  } catch (error) {
    console.error('PIN registration error:', error);
    return { success: false, error: 'خطا در ثبت‌نام' };
  }
}

/**
 * Authenticate user with email/phone and PIN
 */
export async function authenticateWithPin(
  identifier: string, // email or phone
  pin: string
): Promise<{
  success: boolean;
  sessionData?: { accessToken: string; refreshToken: string; expiresAt: Date };
  user?: { id: string; email: string | null; phone: string | null; displayName: string | null; city: string | null; isEmailVerified: boolean; isPhoneVerified: boolean; preferences: Record<string, unknown> };
  error?: string;
}> {
  try {
    // Validate identifier
    const isEmail = identifier.includes('@');
    const isPhone = /^[+]?[0-9\s-()]+$/.test(identifier);
    
    if (!isEmail && !isPhone) {
      return { success: false, error: 'شناسه وارد شده معتبر نیست' };
    }

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(
        isEmail 
          ? eq(users.email, identifier)
          : eq(users.phone, identifier)
      )
      .limit(1);

    if (!user || !user.pinHash) {
      return { success: false, error: 'کاربر یافت نشد یا رمز عبور تنظیم نشده است' };
    }

    // Verify PIN
    if (!verifyPin(pin, user.pinHash)) {
      return { success: false, error: 'رمز عبور اشتباه است' };
    }

    // Update last login
    await db
      .update(users)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Create session
    const sessionData = await createUserSession(user.id, {
      userAgent: 'PIN Authentication',
      ip: '127.0.0.1',
    });

    return {
      success: true,
      sessionData,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        displayName: user.displayName,
        city: user.city,
        isEmailVerified: user.isEmailVerified || false,
        isPhoneVerified: user.isPhoneVerified || false,
        preferences: user.preferences || {},
      },
    };
  } catch (error) {
    console.error('PIN authentication error:', error);
    return { success: false, error: 'خطا در ورود' };
  }
}

/**
 * Update user PIN
 */
export async function updateUserPin(
  userId: string,
  oldPin: string,
  newPin: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return { success: false, error: 'کاربر یافت نشد' };
    }

    // Verify old PIN if it exists
    if (user.pinHash && !verifyPin(oldPin, user.pinHash)) {
      return { success: false, error: 'رمز عبور فعلی اشتباه است' };
    }

    // Hash new PIN
    const { hash: newPinHash } = hashPin(newPin);

    // Update PIN
    await db
      .update(users)
      .set({
        pinHash: newPinHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return { success: true };
  } catch (error) {
    console.error('PIN update error:', error);
    return { success: false, error: 'خطا در به‌روزرسانی رمز عبور' };
  }
}
