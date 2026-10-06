import { Router } from "express";
import { parsePhoneNumber } from "libphonenumber-js";
import { z } from "zod";
import { pool } from "../db.js";
import { createSession } from "../sessions.js";
import { createHash } from "node:crypto";
import { hashPassword, verifyPassword } from "../password.js";

type LoginUserRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile_number: string;
  password_hash: string;
  created_at: Date;
};

const router = Router();

const signupSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name.").max(80),
  lastName: z.string().trim().min(1, "Enter your last name.").max(80),
  email: z.string().trim().email("Enter a valid email address.").max(254),
  mobileNumber: z.string().trim().min(2).max(40),
  password: z.string().min(12, "Use at least 12 characters.").max(128),
});

router.post("/signup", async (request, response) => {
  const parsed = signupSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      error: "Check the signup details and try again.",
      details: parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  const { firstName, lastName, email, mobileNumber, password } = parsed.data;

  // Require an international number, such as +91 followed by the number.
  const phone = parsePhoneNumber(mobileNumber, { extract: false });

  if (!phone || !phone.isPossible()) {
    return response.status(400).json({
      error: "Enter a possible mobile number with its country code, such as +91…",
    });
  }

  try {
    const passwordHash = await hashPassword(password);

    const result = await pool.query<{
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      mobile_number: string;
      created_at: Date;
    }>(
      `INSERT INTO public.users
         (first_name, last_name, email, mobile_number, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, first_name, last_name, email, mobile_number, created_at`,
      [
        firstName,
        lastName,
        email.toLowerCase(),
        phone.number,
        passwordHash,
      ],
    );

    const user = result.rows[0];
if (!user) {
  throw new Error("Signup insert did not return the new user.");
}
    return response.status(201).json({
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        mobileNumber: user.mobile_number,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    if (isUniqueConstraintViolation(error)) {
      return response.status(409).json({
        error: "That email address or mobile number is already registered.",
      });
    }

    console.error("Signup failed:", error);

    return response.status(500).json({
      error: "Could not create the account.",
    });
  }
});

const loginSchema = z.object({
  identifier: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(128),
});

router.post("/login", async (request, response) => {
  const parsed = loginSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      error: "Enter your email or mobile number and password.",
    });
  }

  const { identifier, password } = parsed.data;

  try {
    let user: LoginUserRow | undefined;

    if (identifier.includes("@")) {
      const emailIsValid = z.string().email().safeParse(identifier).success;

      if (!emailIsValid) {
        return response.status(400).json({
          error: "Enter a valid email address.",
        });
      }

      const result = await pool.query<LoginUserRow>(
        `SELECT id, first_name, last_name, email, mobile_number,
                password_hash, created_at
         FROM public.users
         WHERE lower(email) = lower($1)
         LIMIT 1`,
        [identifier],
      );

      user = result.rows[0];
    } else {
      const phone = parsePhoneNumber(identifier, { extract: false });

      if (!phone || !phone.isPossible()) {
        return response.status(400).json({
          error: "Enter a possible mobile number with its country code.",
        });
      }

      const result = await pool.query<LoginUserRow>(
        `SELECT id, first_name, last_name, email, mobile_number,
                password_hash, created_at
         FROM public.users
         WHERE mobile_number = $1
         LIMIT 1`,
        [phone.number],
      );

      user = result.rows[0];
    }

    if (!user) {
      return response.status(401).json({
        error: "Email/mobile number or password is incorrect.",
      });
    }

    const passwordMatches = await verifyPassword(
      user.password_hash,
      password,
    );

    if (!passwordMatches) {
      return response.status(401).json({
        error: "Email/mobile number or password is incorrect.",
      });
    }

    const session = await createSession(user.id);

const publicUser = {
  id: user.id,
  firstName: user.first_name,
  lastName: user.last_name,
  email: user.email,
  mobileNumber: user.mobile_number,
  createdAt: user.created_at,
};

// The mobile app asks for a bearer token. The web app gets a cookie.
if (request.get("X-Client-Type") === "mobile") {
  return response.status(200).json({
    tokenType: "Bearer",
    sessionToken: session.token,
    expiresAt: session.expiresAt,
    user: publicUser,
  });
}

const cookieName =
  process.env.NODE_ENV === "production" ? "__Host-session" : "session";

return response
  .status(200)
  .cookie(cookieName, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(0, session.expiresAt.getTime() - Date.now()),
  })
  .json({
    expiresAt: session.expiresAt,
    user: publicUser,
  });
  } catch (error) {
    console.error("Login failed:", error);

    return response.status(500).json({
      error: "Could not log in.",
    });
  }
});

router.get("/me", async (request, response) => {
  const bearerToken = request
    .get("Authorization")
    ?.match(/^Bearer\s+(.+)$/i)?.[1];

  const cookieName =
    process.env.NODE_ENV === "production" ? "__Host-session" : "session";

  const token = bearerToken ?? request.cookies?.[cookieName];

  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    return response.status(401).json({
      error: "You are not signed in, or your session has expired.",
    });
  }

  try {
    const tokenHash = createHash("sha256").update(token).digest("hex");

    const result = await pool.query<{
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      mobile_number: string;
      created_at: Date;
    }>(
      `SELECT u.id, u.first_name, u.last_name, u.email,
              u.mobile_number, u.created_at
       FROM public.user_sessions AS s
       JOIN public.users AS u ON u.id = s.user_id
       WHERE s.token_hash = $1
         AND s.expires_at > NOW()
         AND s.revoked_at IS NULL
       LIMIT 1`,
      [tokenHash],
    );

    const user = result.rows[0];

    if (!user) {
      return response.status(401).json({
        error: "You are not signed in, or your session has expired.",
      });
    }

    return response.status(200).json({
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        mobileNumber: user.mobile_number,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error("Session lookup failed:", error);

    return response.status(500).json({
      error: "Could not check the session.",
    });
  }
});
router.post("/logout", async (request, response) => {
  const cookieName =
    process.env.NODE_ENV === "production" ? "__Host-session" : "session";

  const token = request.cookies?.[cookieName];

  try {
    if (token && /^[A-Za-z0-9_-]{43}$/.test(token)) {
      const tokenHash = createHash("sha256").update(token).digest("hex");

      await pool.query(
        `UPDATE public.user_sessions
         SET revoked_at = NOW()
         WHERE token_hash = $1
           AND revoked_at IS NULL`,
        [tokenHash],
      );
    }

    return response
      .clearCookie(cookieName, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      })
      .status(204)
      .end();
  } catch (error) {
    console.error("Logout failed:", error);

    return response.status(500).json({
      error: "Could not sign out.",
    });
  }
});
function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export default router;