import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getCurrentUserFromCookies, type User } from "@/lib/auth"

// Get current user from session (server components only)
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = cookies()
  const sessionId = cookieStore.get("session")?.value

  return await getCurrentUserFromCookies(sessionId)
}

// Require authentication (server components only)
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return user
}

// Require admin role (server components only)
export async function requireAdmin(): Promise<User> {
  const user = await requireAuth()

  if (user.role !== "admin") {
    redirect("/")
  }

  return user
}
