import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { db } from "./db";
import { passwordResetCodes, users } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { sendPasswordResetEmail } from "./email";

const SALT_ROUNDS = 12;

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Register with email and password
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || typeof email !== "string" || !email.includes("@")) {
        return res.status(400).json({ message: "Valid email required" });
      }
      
      if (!password || typeof password !== "string" || password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (existingUser) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Create user
      const userId = crypto.randomUUID();
      await db.insert(users).values({
        id: userId,
        email: normalizedEmail,
        passwordHash,
        authMethod: "email",
      });

      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

      // Create session
      const sessionUser = {
        claims: {
          sub: user.id,
          email: user.email,
        },
        expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      };

      req.login(sessionUser, (err) => {
        if (err) {
          console.error("Error creating session:", err);
          return res.status(500).json({ message: "Failed to create session" });
        }
        const { passwordHash, ...safeUser } = user;
        res.json({ message: "Registration successful", user: safeUser });
      });
    } catch (error) {
      console.error("Error in registration:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login with email and password
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Find user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Create session
      const sessionUser = {
        claims: {
          sub: user.id,
          email: user.email,
        },
        expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      };

      req.login(sessionUser, (err) => {
        if (err) {
          console.error("Error creating session:", err);
          return res.status(500).json({ message: "Failed to create session" });
        }
        const { passwordHash, ...safeUser } = user;
        res.json({ message: "Login successful", user: safeUser });
      });
    } catch (error) {
      console.error("Error in login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Rate limiting for password reset requests
  const resetRateLimits = new Map<string, { count: number; resetAt: number }>();
  const MAX_RESET_REQUESTS_PER_HOUR = 3;

  // Request password reset
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== "string" || !email.includes("@")) {
        return res.status(400).json({ message: "Valid email required" });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Rate limiting
      const now = Date.now();
      const rateLimit = resetRateLimits.get(normalizedEmail);
      
      if (rateLimit) {
        if (now < rateLimit.resetAt && rateLimit.count >= MAX_RESET_REQUESTS_PER_HOUR) {
          return res.status(429).json({ message: "Too many requests. Please try again later." });
        }
        if (now >= rateLimit.resetAt) {
          resetRateLimits.set(normalizedEmail, { count: 1, resetAt: now + 60 * 60 * 1000 });
        } else {
          rateLimit.count++;
        }
      } else {
        resetRateLimits.set(normalizedEmail, { count: 1, resetAt: now + 60 * 60 * 1000 });
      }

      // Check if user exists (but don't reveal this to the user for security)
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({ message: "If an account exists, a reset code will be sent" });
      }

      // Invalidate existing codes
      await db
        .update(passwordResetCodes)
        .set({ used: true })
        .where(
          and(
            eq(passwordResetCodes.email, normalizedEmail),
            eq(passwordResetCodes.used, false)
          )
        );

      // Generate code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Store hashed code
      const hashedCode = crypto.createHash("sha256").update(code).digest("hex");
      await db.insert(passwordResetCodes).values({
        email: normalizedEmail,
        code: hashedCode,
        expiresAt,
      });

      // Send email
      await sendPasswordResetEmail(normalizedEmail, code);

      res.json({ message: "If an account exists, a reset code will be sent" });
    } catch (error) {
      console.error("Error in forgot password:", error);
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  // Rate limiting for reset attempts
  const verifyResetLimits = new Map<string, { count: number; resetAt: number }>();
  const MAX_RESET_ATTEMPTS = 5;

  // Reset password with code
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;
      
      if (!email || !code || !newPassword) {
        return res.status(400).json({ message: "Email, code, and new password required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Rate limiting
      const now = Date.now();
      const limit = verifyResetLimits.get(normalizedEmail);
      
      if (limit) {
        if (now < limit.resetAt && limit.count >= MAX_RESET_ATTEMPTS) {
          return res.status(429).json({ message: "Too many attempts. Please request a new code." });
        }
        if (now >= limit.resetAt) {
          verifyResetLimits.set(normalizedEmail, { count: 1, resetAt: now + 15 * 60 * 1000 });
        } else {
          limit.count++;
        }
      } else {
        verifyResetLimits.set(normalizedEmail, { count: 1, resetAt: now + 15 * 60 * 1000 });
      }

      // Verify code
      const hashedCode = crypto.createHash("sha256").update(code).digest("hex");
      const nowDate = new Date();

      const [resetCode] = await db
        .select()
        .from(passwordResetCodes)
        .where(
          and(
            eq(passwordResetCodes.email, normalizedEmail),
            eq(passwordResetCodes.code, hashedCode),
            eq(passwordResetCodes.used, false),
            gt(passwordResetCodes.expiresAt, nowDate)
          )
        )
        .limit(1);

      if (!resetCode) {
        return res.status(400).json({ message: "Invalid or expired code" });
      }

      // Mark code as used
      await db
        .update(passwordResetCodes)
        .set({ used: true })
        .where(eq(passwordResetCodes.id, resetCode.id));

      // Update password
      const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
      await db
        .update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.email, normalizedEmail));

      res.json({ message: "Password reset successful. You can now log in." });
    } catch (error) {
      console.error("Error in reset password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Logout
  app.post("/api/logout", (req, res) => {
    req.logout(() => {
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
        }
        res.json({ success: true, redirectUrl: "/" });
      });
    });
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
        }
        res.redirect("/");
      });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  // Session expired
  return res.status(401).json({ message: "Session expired" });
};

export const isAdmin: RequestHandler = async (req, res, next) => {
  const user = req.user as any;
  if (!user?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const dbUser = await storage.getUser(user.claims.sub);
  if (!dbUser?.isAdmin) {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  
  return next();
};
