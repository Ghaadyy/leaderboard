import { pool } from "@/lib/db"
import bcrypt from "bcrypt"

export interface User {
  id: string
  username: string
  email: string
  role: string
}

export interface Session {
  id: string
  userId: string
  expiresAt: Date
}

// Generate a random session ID
function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Create a new session
export async function createSession(userId: string): Promise<string> {
  const client = await pool.connect()

  try {
    const sessionId = generateSessionId()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await client.query("INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)", [
      sessionId,
      userId,
      expiresAt,
    ])

    return sessionId
  } finally {
    client.release()
  }
}

// Get session by ID
export async function getSession(sessionId: string): Promise<Session | null> {
  const client = await pool.connect()

  try {
    const result = await client.query(
      "SELECT id, user_id, expires_at FROM sessions WHERE id = $1 AND expires_at > NOW()",
      [sessionId],
    )

    if (result.rows.length === 0) {
      return null
    }

    const row = result.rows[0]
    return {
      id: row.id,
      userId: row.user_id,
      expiresAt: new Date(row.expires_at),
    }
  } finally {
    client.release()
  }
}

// Get user by ID
export async function getUserById(userId: string): Promise<User | null> {
  const client = await pool.connect()

  try {
    const result = await client.query("SELECT id, username, email, role FROM users WHERE id = $1", [userId])

    if (result.rows.length === 0) {
      return null
    }

    const row = result.rows[0]
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role,
    }
  } finally {
    client.release()
  }
}

// Get user by username
export async function getUserByUsername(username: string): Promise<(User & { passwordHash: string }) | null> {
  const client = await pool.connect()

  try {
    const result = await client.query(
      "SELECT id, username, email, role, password_hash FROM users WHERE username = $1",
      [username],
    )

    if (result.rows.length === 0) {
      return null
    }

    const row = result.rows[0]
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role,
      passwordHash: row.password_hash,
    }
  } finally {
    client.release()
  }
}

// Create a new user
export async function createUser(username: string, email: string, password: string, role = "user"): Promise<User> {
  const client = await pool.connect()

  try {
    const id = Date.now().toString()
    const passwordHash = await bcrypt.hash(password, 10)

    await client.query("INSERT INTO users (id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)", [
      id,
      username,
      email,
      passwordHash,
      role,
    ])

    return {
      id,
      username,
      email,
      role,
    }
  } finally {
    client.release()
  }
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

// Delete session
export async function deleteSession(sessionId: string): Promise<void> {
  const client = await pool.connect()

  try {
    await client.query("DELETE FROM sessions WHERE id = $1", [sessionId])
  } finally {
    client.release()
  }
}

// Clean up expired sessions
export async function cleanupExpiredSessions(): Promise<void> {
  const client = await pool.connect()

  try {
    await client.query("DELETE FROM sessions WHERE expires_at <= NOW()")
  } finally {
    client.release()
  }
}

// Get current user from session (server-side only)
export async function getCurrentUserFromCookies(sessionCookie: string | undefined): Promise<User | null> {
  if (!sessionCookie) {
    return null
  }

  const session = await getSession(sessionCookie)
  if (!session) {
    return null
  }

  return await getUserById(session.userId)
}
