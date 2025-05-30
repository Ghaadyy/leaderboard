import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromCookies } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("session")?.value
    const user = await getCurrentUserFromCookies(sessionId)

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
