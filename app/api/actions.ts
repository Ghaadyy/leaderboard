"use server"

import { pool, ensureDatabaseInitialized } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { Challenge, Team, LeaderboardEntry, ChallengeStats, Submission, TeamSubmissionStats } from "@/types/types"

// Schema validation
const teamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
})

const challengeSchema = z.object({
  name: z.string().min(1, "Challenge name is required"),
  description: z.string(),
  type: z.enum(["interactive", "non-interactive"]),
  points: z.number().positive("Points must be positive"),
  penaltyPoints: z.number().min(0, "Penalty points must be non-negative"),
})

const checkpointSchema = z.object({
  name: z.string().min(1, "Checkpoint name is required"),
  points: z.number().positive("Points must be positive"),
})

const submissionSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
  challengeId: z.string().min(1, "Challenge ID is required"),
  submissionText: z.string().min(1, "Submission text is required"),
  isCorrect: z.boolean(),
})

// Get all teams
export async function getTeams(): Promise<Team[]> {
  const client = await pool.connect()

  try {
    // Ensure database is initialized
    await ensureDatabaseInitialized()

    // Get teams with their solved challenges
    const teamsResult = await client.query("SELECT id, name FROM teams ORDER BY name")
    const teams: Team[] = []

    for (const teamRow of teamsResult.rows) {
      // Get solved challenges for this team
      const solvedChallengesResult = await client.query(
        "SELECT challenge_id FROM solved_challenges WHERE team_id = $1",
        [teamRow.id],
      )

      const solvedChallenges = []

      for (const solvedRow of solvedChallengesResult.rows) {
        // Get solved checkpoints for this challenge
        const solvedCheckpointsResult = await client.query(
          `
          SELECT checkpoint_id 
          FROM solved_checkpoints 
          WHERE team_id = $1 AND checkpoint_id IN (
            SELECT id FROM checkpoints WHERE challenge_id = $2
          )
        `,
          [teamRow.id, solvedRow.challenge_id],
        )

        const solvedCheckpointIds = solvedCheckpointsResult.rows.map((row) => row.checkpoint_id)

        solvedChallenges.push({
          challengeId: solvedRow.challenge_id,
          solvedCheckpointIds: solvedCheckpointIds.length > 0 ? solvedCheckpointIds : undefined,
        })
      }

      teams.push({
        id: teamRow.id,
        name: teamRow.name,
        solvedChallenges,
      })
    }

    return teams
  } catch (error) {
    console.error("Error getting teams:", error)
    throw new Error("Failed to get teams")
  } finally {
    client.release()
  }
}

// Get all challenges with checkpoints
export async function getChallenges(): Promise<Challenge[]> {
  const client = await pool.connect()

  try {
    // Ensure database is initialized
    await ensureDatabaseInitialized()

    const challengesResult = await client.query(`
      SELECT id, name, description, type, points, penalty_points 
      FROM challenges 
      ORDER BY name
    `)

    const challenges: Challenge[] = []

    for (const challengeRow of challengesResult.rows) {
      // Get checkpoints for this challenge
      const checkpointsResult = await client.query(
        "SELECT id, name, points FROM checkpoints WHERE challenge_id = $1 ORDER BY id",
        [challengeRow.id],
      )

      challenges.push({
        id: challengeRow.id,
        name: challengeRow.name,
        description: challengeRow.description,
        type: challengeRow.type,
        points: challengeRow.points,
        penaltyPoints: challengeRow.penalty_points || 0,
        checkpoints: checkpointsResult.rows.length > 0 ? checkpointsResult.rows : undefined,
      })
    }

    return challenges
  } catch (error) {
    console.error("Error getting challenges:", error)
    throw new Error("Failed to get challenges")
  } finally {
    client.release()
  }
}

// Add a new team
export async function addTeam(formData: FormData) {
  const client = await pool.connect()

  try {
    // Ensure database is initialized
    await ensureDatabaseInitialized()

    const name = formData.get("name") as string
    const validation = teamSchema.safeParse({ name })

    if (!validation.success) {
      return { success: false, error: validation.error.errors[0].message }
    }

    const id = Date.now().toString()

    await client.query("INSERT INTO teams (id, name) VALUES ($1, $2)", [id, name])

    revalidatePath("/")
    revalidatePath("/admin")

    return { success: true, team: { id, name, solvedChallenges: [] } }
  } catch (error) {
    console.error("Error adding team:", error)
    return { success: false, error: "Failed to add team" }
  } finally {
    client.release()
  }
}

// Update a team
export async function updateTeam(teamId: string, formData: FormData) {
  const client = await pool.connect()

  try {
    // Ensure database is initialized
    await ensureDatabaseInitialized()

    const name = formData.get("name") as string
    const validation = teamSchema.safeParse({ name })

    if (!validation.success) {
      return { success: false, error: validation.error.errors[0].message }
    }

    const result = await client.query("UPDATE teams SET name = $1 WHERE id = $2", [name, teamId])

    if (result.rowCount === 0) {
      return { success: false, error: "Team not found" }
    }

    revalidatePath("/")
    revalidatePath("/admin")

    return { success: true }
  } catch (error) {
    console.error("Error updating team:", error)
    return { success: false, error: "Failed to update team" }
  } finally {
    client.release()
  }
}

// Delete a team
export async function deleteTeam(teamId: string) {
  const client = await pool.connect()

  try {
    // Ensure database is initialized
    await ensureDatabaseInitialized()

    // Begin transaction
    await client.query("BEGIN")

    try {
      // Delete related records first (due to foreign key constraints)
      await client.query("DELETE FROM solved_checkpoints WHERE team_id = $1", [teamId])
      await client.query("DELETE FROM solved_challenges WHERE team_id = $1", [teamId])
      await client.query("DELETE FROM submissions WHERE team_id = $1", [teamId])

      // Delete the team
      const result = await client.query("DELETE FROM teams WHERE id = $1", [teamId])

      if (result.rowCount === 0) {
        throw new Error("Team not found")
      }

      // Commit transaction
      await client.query("COMMIT")
    } catch (error) {
      // Rollback on error
      await client.query("ROLLBACK")
      throw error
    }

    revalidatePath("/")
    revalidatePath("/admin")

    return { success: true }
  } catch (error) {
    console.error("Error deleting team:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete team" }
  } finally {
    client.release()
  }
}

// Add a new challenge
export async function addChallenge(formData: FormData) {
  const client = await pool.connect()

  try {
    // Ensure database is initialized
    await ensureDatabaseInitialized()

    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const type = formData.get("type") as "interactive" | "non-interactive"
    const points = Number.parseInt(formData.get("points") as string)
    const penaltyPoints = Number.parseInt(formData.get("penaltyPoints") as string) || 0

    const validation = challengeSchema.safeParse({ name, description, type, points, penaltyPoints })

    if (!validation.success) {
      return { success: false, error: validation.error.errors[0].message }
    }

    const id = Date.now().toString()

    // Begin transaction
    await client.query("BEGIN")

    try {
      // Insert challenge
      await client.query(
        "INSERT INTO challenges (id, name, description, type, points, penalty_points) VALUES ($1, $2, $3, $4, $5, $6)",
        [id, name, description, type, points, penaltyPoints],
      )

      // If interactive, add checkpoints
      if (type === "interactive") {
        const checkpointsCount = Number.parseInt(formData.get("checkpointsCount") as string)

        for (let i = 0; i < checkpointsCount; i++) {
          const checkpointName = formData.get(`checkpoint_${i}_name`) as string
          const checkpointPoints = Number.parseInt(formData.get(`checkpoint_${i}_points`) as string)

          const checkpointValidation = checkpointSchema.safeParse({
            name: checkpointName,
            points: checkpointPoints,
          })

          if (!checkpointValidation.success) {
            throw new Error(checkpointValidation.error.errors[0].message)
          }

          const checkpointId = `${id}-${i + 1}`

          await client.query("INSERT INTO checkpoints (id, challenge_id, name, points) VALUES ($1, $2, $3, $4)", [
            checkpointId,
            id,
            checkpointName,
            checkpointPoints,
          ])
        }
      }

      // Commit transaction
      await client.query("COMMIT")
    } catch (error) {
      // Rollback on error
      await client.query("ROLLBACK")
      throw error
    }

    revalidatePath("/")
    revalidatePath("/admin")

    return { success: true }
  } catch (error) {
    console.error("Error adding challenge:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to add challenge" }
  } finally {
    client.release()
  }
}

// Update a challenge
export async function updateChallenge(challengeId: string, formData: FormData) {
  const client = await pool.connect()

  try {
    // Ensure database is initialized
    await ensureDatabaseInitialized()

    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const type = formData.get("type") as "interactive" | "non-interactive"
    const points = Number.parseInt(formData.get("points") as string)
    const penaltyPoints = Number.parseInt(formData.get("penaltyPoints") as string) || 0

    const validation = challengeSchema.safeParse({ name, description, type, points, penaltyPoints })

    if (!validation.success) {
      return { success: false, error: validation.error.errors[0].message }
    }

    // Begin transaction
    await client.query("BEGIN")

    try {
      // Update challenge
      const result = await client.query(
        "UPDATE challenges SET name = $1, description = $2, type = $3, points = $4, penalty_points = $5 WHERE id = $6",
        [name, description, type, points, penaltyPoints, challengeId],
      )

      if (result.rowCount === 0) {
        throw new Error("Challenge not found")
      }

      // Delete existing checkpoints
      await client.query("DELETE FROM checkpoints WHERE challenge_id = $1", [challengeId])

      // If interactive, add new checkpoints
      if (type === "interactive") {
        const checkpointsCount = Number.parseInt(formData.get("checkpointsCount") as string)

        for (let i = 0; i < checkpointsCount; i++) {
          const checkpointName = formData.get(`checkpoint_${i}_name`) as string
          const checkpointPoints = Number.parseInt(formData.get(`checkpoint_${i}_points`) as string)

          const checkpointValidation = checkpointSchema.safeParse({
            name: checkpointName,
            points: checkpointPoints,
          })

          if (!checkpointValidation.success) {
            throw new Error(checkpointValidation.error.errors[0].message)
          }

          const checkpointId = `${challengeId}-${i + 1}`

          await client.query("INSERT INTO checkpoints (id, challenge_id, name, points) VALUES ($1, $2, $3, $4)", [
            checkpointId,
            challengeId,
            checkpointName,
            checkpointPoints,
          ])
        }
      }

      // Commit transaction
      await client.query("COMMIT")
    } catch (error) {
      // Rollback on error
      await client.query("ROLLBACK")
      throw error
    }

    revalidatePath("/")
    revalidatePath("/admin")

    return { success: true }
  } catch (error) {
    console.error("Error updating challenge:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to update challenge" }
  } finally {
    client.release()
  }
}

// Delete a challenge
export async function deleteChallenge(challengeId: string) {
  const client = await pool.connect()

  try {
    // Ensure database is initialized
    await ensureDatabaseInitialized()

    // Begin transaction
    await client.query("BEGIN")

    try {
      // Delete related records first (due to foreign key constraints)
      await client.query(
        "DELETE FROM solved_checkpoints WHERE checkpoint_id IN (SELECT id FROM checkpoints WHERE challenge_id = $1)",
        [challengeId],
      )
      await client.query("DELETE FROM checkpoints WHERE challenge_id = $1", [challengeId])
      await client.query("DELETE FROM solved_challenges WHERE challenge_id = $1", [challengeId])
      await client.query("DELETE FROM submissions WHERE challenge_id = $1", [challengeId])

      // Delete the challenge
      const result = await client.query("DELETE FROM challenges WHERE id = $1", [challengeId])

      if (result.rowCount === 0) {
        throw new Error("Challenge not found")
      }

      // Commit transaction
      await client.query("COMMIT")
    } catch (error) {
      // Rollback on error
      await client.query("ROLLBACK")
      throw error
    }

    revalidatePath("/")
    revalidatePath("/admin")

    return { success: true }
  } catch (error) {
    console.error("Error deleting challenge:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete challenge" }
  } finally {
    client.release()
  }
}

// Add a submission
export async function addSubmission(teamId: string, challengeId: string, submissionText: string, isCorrect: boolean) {
  const client = await pool.connect()

  try {
    // Ensure database is initialized
    await ensureDatabaseInitialized()

    const validation = submissionSchema.safeParse({ teamId, challengeId, submissionText, isCorrect })

    if (!validation.success) {
      return { success: false, error: validation.error.errors[0].message }
    }

    // Begin transaction
    await client.query("BEGIN")

    try {
      // Insert the submission
      await client.query(
        "INSERT INTO submissions (team_id, challenge_id, submission_text, is_correct) VALUES ($1, $2, $3, $4)",
        [teamId, challengeId, submissionText, isCorrect],
      )

      // If correct, mark challenge as solved
      if (isCorrect) {
        // Check if already solved
        const existingResult = await client.query(
          "SELECT * FROM solved_challenges WHERE team_id = $1 AND challenge_id = $2",
          [teamId, challengeId],
        )

        if (existingResult.rows.length === 0) {
          await client.query("INSERT INTO solved_challenges (team_id, challenge_id) VALUES ($1, $2)", [
            teamId,
            challengeId,
          ])
        }
      }

      // Commit transaction
      await client.query("COMMIT")
    } catch (error) {
      // Rollback on error
      await client.query("ROLLBACK")
      throw error
    }

    revalidatePath("/")
    revalidatePath("/admin")

    return { success: true }
  } catch (error) {
    console.error("Error adding submission:", error)
    return { success: false, error: "Failed to add submission" }
  } finally {
    client.release()
  }
}

// Mark a non-interactive challenge as solved
export async function markNonInteractiveSolved(teamId: string, challengeId: string) {
  const client = await pool.connect()

  try {
    // Ensure database is initialized
    await ensureDatabaseInitialized()

    // Check if already solved
    const existingResult = await client.query(
      "SELECT * FROM solved_challenges WHERE team_id = $1 AND challenge_id = $2",
      [teamId, challengeId],
    )

    if (existingResult.rows.length > 0) {
      return { success: false, error: "Challenge already solved by this team" }
    }

    await client.query("INSERT INTO solved_challenges (team_id, challenge_id) VALUES ($1, $2)", [teamId, challengeId])

    revalidatePath("/")
    revalidatePath("/admin")

    return { success: true }
  } catch (error) {
    console.error("Error marking challenge as solved:", error)
    return { success: false, error: "Failed to mark challenge as solved" }
  } finally {
    client.release()
  }
}

// Mark checkpoints as solved for a team
export async function markCheckpointsSolved(teamId: string, challengeId: string, checkpointIds: string[]) {
  const client = await pool.connect()

  try {
    // Ensure database is initialized
    await ensureDatabaseInitialized()

    // Begin transaction
    await client.query("BEGIN")

    try {
      // Ensure the challenge is marked as solved
      const existingSolvedChallengeResult = await client.query(
        "SELECT * FROM solved_challenges WHERE team_id = $1 AND challenge_id = $2",
        [teamId, challengeId],
      )

      if (existingSolvedChallengeResult.rows.length === 0) {
        await client.query("INSERT INTO solved_challenges (team_id, challenge_id) VALUES ($1, $2)", [
          teamId,
          challengeId,
        ])
      }

      // Get currently solved checkpoints
      const solvedCheckpointsResult = await client.query(
        `
        SELECT checkpoint_id FROM solved_checkpoints
        WHERE team_id = $1 AND checkpoint_id IN (
          SELECT id FROM checkpoints WHERE challenge_id = $2
        )
      `,
        [teamId, challengeId],
      )

      const currentlySolvedIds = solvedCheckpointsResult.rows.map((row) => row.checkpoint_id)

      // Remove checkpoints that are no longer selected
      for (const checkpointId of currentlySolvedIds) {
        if (!checkpointIds.includes(checkpointId)) {
          await client.query("DELETE FROM solved_checkpoints WHERE team_id = $1 AND checkpoint_id = $2", [
            teamId,
            checkpointId,
          ])
        }
      }

      // Add newly selected checkpoints
      for (const checkpointId of checkpointIds) {
        if (!currentlySolvedIds.includes(checkpointId)) {
          await client.query("INSERT INTO solved_checkpoints (team_id, checkpoint_id) VALUES ($1, $2)", [
            teamId,
            checkpointId,
          ])
        }
      }

      // Commit transaction
      await client.query("COMMIT")
    } catch (error) {
      // Rollback on error
      await client.query("ROLLBACK")
      throw error
    }

    revalidatePath("/")
    revalidatePath("/admin")

    return { success: true }
  } catch (error) {
    console.error("Error marking checkpoints as solved:", error)
    return { success: false, error: "Failed to mark checkpoints as solved" }
  } finally {
    client.release()
  }
}

// Get submissions for a specific team and challenge
export async function getSubmissions(teamId?: string, challengeId?: string): Promise<Submission[]> {
  const client = await pool.connect()

  try {
    // Ensure database is initialized
    await ensureDatabaseInitialized()

    let query = "SELECT id, team_id, challenge_id, submission_text, is_correct, submitted_at FROM submissions"
    const params: string[] = []
    const conditions: string[] = []

    if (teamId) {
      conditions.push(`team_id = $${params.length + 1}`)
      params.push(teamId)
    }

    if (challengeId) {
      conditions.push(`challenge_id = $${params.length + 1}`)
      params.push(challengeId)
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`
    }

    query += " ORDER BY submitted_at DESC"

    const result = await client.query(query, params)

    return result.rows.map((row) => ({
      id: row.id,
      teamId: row.team_id,
      challengeId: row.challenge_id,
      submissionText: row.submission_text,
      isCorrect: row.is_correct,
      submittedAt: new Date(row.submitted_at),
    }))
  } catch (error) {
    console.error("Error getting submissions:", error)
    throw new Error("Failed to get submissions")
  } finally {
    client.release()
  }
}

// Get submission statistics for all teams and challenges
export async function getSubmissionStats(): Promise<TeamSubmissionStats[]> {
  const client = await pool.connect()

  try {
    // Ensure database is initialized
    await ensureDatabaseInitialized()

    const result = await client.query(`
  SELECT 
    t.id as team_id,
    t.name as team_name,
    c.id as challenge_id,
    c.name as challenge_name,
    c.penalty_points,
    COUNT(s.id) as total_submissions,
    COUNT(CASE WHEN s.is_correct = false THEN 1 END) as wrong_submissions,
    CASE WHEN sc.team_id IS NOT NULL THEN true ELSE false END as is_solved
  FROM teams t
  CROSS JOIN challenges c
  LEFT JOIN submissions s ON t.id = s.team_id AND c.id = s.challenge_id
  LEFT JOIN solved_challenges sc ON t.id = sc.team_id AND c.id = sc.challenge_id
  WHERE c.type = 'non-interactive'
  GROUP BY t.id, t.name, c.id, c.name, c.penalty_points, sc.team_id
  HAVING COUNT(s.id) > 0
  ORDER BY t.name, c.name
`)

    const stats: TeamSubmissionStats[] = []

    for (const row of result.rows) {
      // Get detailed submissions for this team/challenge
      const submissions = await getSubmissions(row.team_id, row.challenge_id)

      const penaltyPoints = row.is_solved ? row.wrong_submissions * row.penalty_points : 0

      stats.push({
        teamId: row.team_id,
        teamName: row.team_name,
        challengeId: row.challenge_id,
        challengeName: row.challenge_name,
        totalSubmissions: Number.parseInt(row.total_submissions),
        wrongSubmissions: Number.parseInt(row.wrong_submissions),
        isSolved: row.is_solved,
        penaltyPoints,
        submissions,
      })
    }

    return stats
  } catch (error) {
    console.error("Error getting submission stats:", error)
    throw new Error("Failed to get submission stats")
  } finally {
    client.release()
  }
}

// Calculate penalty points for a team
export async function calculateTeamPenaltyPoints(teamId: string): Promise<number> {
  const client = await pool.connect()

  try {
    // Ensure database is initialized
    await ensureDatabaseInitialized()

    const result = await client.query(
      `
      SELECT 
        c.penalty_points,
        COUNT(CASE WHEN s.is_correct = false THEN 1 END) as wrong_submissions
      FROM challenges c
      INNER JOIN solved_challenges sc ON c.id = sc.challenge_id AND sc.team_id = $1
      LEFT JOIN submissions s ON c.id = s.challenge_id AND s.team_id = $1
      WHERE c.type = 'non-interactive' AND c.penalty_points > 0
      GROUP BY c.id, c.penalty_points
    `,
      [teamId],
    )

    let totalPenalty = 0
    for (const row of result.rows) {
      totalPenalty += row.penalty_points * Number.parseInt(row.wrong_submissions)
    }

    return totalPenalty
  } catch (error) {
    console.error("Error calculating penalty points:", error)
    return 0
  } finally {
    client.release()
  }
}

// Get leaderboard data
export async function getLeaderboardData(): Promise<LeaderboardEntry[]> {
  try {
    // Ensure database is initialized
    await ensureDatabaseInitialized()

    const teams = await getTeams()
    const challenges = await getChallenges()

    const leaderboardEntries: LeaderboardEntry[] = []

    for (const team of teams) {
      // Calculate score
      let score = 0
      let challengesSolved = 0

      for (const solvedChallenge of team.solvedChallenges) {
        const challenge = challenges.find((c) => c.id === solvedChallenge.challengeId)
        if (!challenge) continue

        challengesSolved++

        if (challenge.type === "non-interactive") {
          score += challenge.points
        } else if (challenge.type === "interactive" && solvedChallenge.solvedCheckpointIds && challenge.checkpoints) {
          // Sum the points from all solved checkpoints
          score += solvedChallenge.solvedCheckpointIds.reduce((total, checkpointId) => {
            const checkpoint = challenge.checkpoints?.find((cp) => cp.id === checkpointId)
            return total + (checkpoint?.points || 0)
          }, 0)
        }
      }

      // Subtract penalty points
      const penaltyPoints = await calculateTeamPenaltyPoints(team.id)
      score -= penaltyPoints

      leaderboardEntries.push({
        id: team.id,
        name: team.name,
        score,
        challengesSolved,
      })
    }

    return leaderboardEntries.sort((a, b) => b.score - a.score)
  } catch (error) {
    console.error("Error getting leaderboard data:", error)
    throw new Error("Failed to get leaderboard data")
  }
}

// Get challenge statistics
export async function getChallengeStats(): Promise<ChallengeStats[]> {
  try {
    // Ensure database is initialized
    await ensureDatabaseInitialized()

    const teams = await getTeams()
    const challenges = await getChallenges()
    const totalTeams = teams.length

    return challenges.map((challenge) => {
      // Count how many teams have solved this challenge
      let solvedCount = 0

      teams.forEach((team) => {
        const solvedChallenge = team.solvedChallenges.find((sc) => sc.challengeId === challenge.id)

        if (solvedChallenge) {
          if (challenge.type === "non-interactive") {
            solvedCount++
          } else if (challenge.type === "interactive" && solvedChallenge.solvedCheckpointIds) {
            // For interactive challenges, count as solved if at least one checkpoint is solved
            if (solvedChallenge.solvedCheckpointIds.length > 0) {
              solvedCount++
            }
          }
        }
      })

      const completionPercentage = totalTeams > 0 ? Math.round((solvedCount / totalTeams) * 100) : 0

      return {
        id: challenge.id,
        name: challenge.name,
        type: challenge.type,
        solvedCount,
        totalTeams,
        completionPercentage,
        points: challenge.points,
      }
    })
  } catch (error) {
    console.error("Error getting challenge stats:", error)
    throw new Error("Failed to get challenge stats")
  }
}
