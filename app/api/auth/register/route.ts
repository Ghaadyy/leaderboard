import { type NextRequest, NextResponse } from "next/server"
import { createUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json()

    if (!username || !email || !password) {
      return NextResponse.json({ error: "Username, email, and password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    // Create user
    const user = await createUser(username, email, password)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error: any) {
    console.error("Registration error:", error)

    // Handle unique constraint violations
    if (error.code === "23505") {
      if (error.constraint?.includes("username")) {
        return NextResponse.json({ error: "Username already exists" }, { status: 409 })
      }
      if (error.constraint?.includes("email")) {
        return NextResponse.json({ error: "Email already exists" }, { status: 409 })
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
