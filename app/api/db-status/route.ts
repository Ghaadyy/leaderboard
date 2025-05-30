import { NextResponse } from "next/server"
import { pool, ensureDatabaseInitialized } from "@/lib/db"

export async function GET() {
  let client

  try {
    // Ensure database is initialized
    const isInitialized = await ensureDatabaseInitialized()

    // Get a client from the pool
    client = await pool.connect()

    // Get database stats
    let teamsCount = 0
    let challengesCount = 0
    let checkpointsCount = 0

    try {
      const teamsResult = await client.query("SELECT COUNT(*) as count FROM teams")
      teamsCount = Number.parseInt(teamsResult.rows[0].count)

      const challengesResult = await client.query("SELECT COUNT(*) as count FROM challenges")
      challengesCount = Number.parseInt(challengesResult.rows[0].count)

      const checkpointsResult = await client.query("SELECT COUNT(*) as count FROM checkpoints")
      checkpointsCount = Number.parseInt(checkpointsResult.rows[0].count)
    } catch (error) {
      console.error("Error getting database stats:", error)
    }

    return NextResponse.json({
      status: "ok",
      database: "PostgreSQL",
      isInitialized,
      stats: {
        teams: teamsCount,
        challenges: challengesCount,
        checkpoints: checkpointsCount,
      },
      environment: {
        vercel: process.env.VERCEL === "1",
        nodeEnv: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? "Set" : "Not set",
      },
    })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Database error: " + (error instanceof Error ? error.message : String(error)),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  } finally {
    if (client) {
      client.release()
    }
  }
}
