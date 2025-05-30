"use client"

import { useState, useEffect } from "react"
import { AdminPanel } from "@/components/admin-panel"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import {
  getChallenges,
  getTeams,
  addChallenge,
  updateChallenge,
  deleteChallenge,
  addTeam,
  updateTeam,
  deleteTeam,
  addSubmission,
  markNonInteractiveSolved,
  markCheckpointsSolved,
} from "@/lib/store"
import type { Challenge, Team, Checkpoint } from "@/types/types"
import { AuthGuard } from "@/components/auth-guard"

export default function AdminPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [loadedChallenges, loadedTeams] = await Promise.all([getChallenges(), getTeams()])

        setChallenges(loadedChallenges)
        setTeams(loadedTeams)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Refresh data helper
  const refreshData = async () => {
    const [loadedChallenges, loadedTeams] = await Promise.all([getChallenges(), getTeams()])
    setChallenges(loadedChallenges)
    setTeams(loadedTeams)
  }

  // Mark checkpoints as solved for a team
  const handleMarkCheckpointsSolved = async (teamId: string, challengeId: string, checkpointIds: string[]) => {
    const success = await markCheckpointsSolved(teamId, challengeId, checkpointIds)

    if (success) {
      await refreshData()
    }

    return success
  }

  // Mark a non-interactive challenge as solved
  const handleMarkNonInteractiveSolved = async (teamId: string, challengeId: string) => {
    const success = await markNonInteractiveSolved(teamId, challengeId)

    if (success) {
      await refreshData()
    }

    return success
  }

  // Add a new challenge
  const handleAddChallenge = async (
    name: string,
    description: string,
    type: "interactive" | "non-interactive",
    points: number,
    penaltyPoints: number,
    checkpoints?: Checkpoint[],
  ) => {
    const success = await addChallenge(
      name,
      description,
      type,
      points,
      penaltyPoints,
      checkpoints?.map((cp) => ({ name: cp.name, points: cp.points })),
    )

    if (success) {
      await refreshData()
    }

    return success
  }

  // Update a challenge
  const handleUpdateChallenge = async (
    challengeId: string,
    name: string,
    description: string,
    type: "interactive" | "non-interactive",
    points: number,
    penaltyPoints: number,
    checkpoints?: Checkpoint[],
  ) => {
    const success = await updateChallenge(
      challengeId,
      name,
      description,
      type,
      points,
      penaltyPoints,
      checkpoints?.map((cp) => ({ name: cp.name, points: cp.points })),
    )

    if (success) {
      await refreshData()
    }

    return success
  }

  // Delete a challenge
  const handleDeleteChallenge = async (challengeId: string) => {
    const success = await deleteChallenge(challengeId)

    if (success) {
      await refreshData()
    }

    return success
  }

  // Add a new team
  const handleAddTeam = async (name: string) => {
    const newTeam = await addTeam(name)

    if (newTeam) {
      await refreshData()
    }

    return !!newTeam
  }

  // Update a team
  const handleUpdateTeam = async (teamId: string, name: string) => {
    const success = await updateTeam(teamId, name)

    if (success) {
      await refreshData()
    }

    return success
  }

  // Delete a team
  const handleDeleteTeam = async (teamId: string) => {
    const success = await deleteTeam(teamId)

    if (success) {
      await refreshData()
    }

    return success
  }

  // Add a submission
  const handleAddSubmission = async (
    teamId: string,
    challengeId: string,
    submissionText: string,
    isCorrect: boolean,
  ) => {
    const success = await addSubmission(teamId, challengeId, submissionText, isCorrect)

    if (success) {
      await refreshData()
    }

    return success
  }

  if (loading) {
    return (
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </main>
    )
  }

  return (
    <AuthGuard requireAdmin>
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <Button asChild variant="outline" size="sm">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Leaderboard
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>

          <AdminPanel
            teams={teams}
            challenges={challenges}
            onMarkNonInteractiveSolved={handleMarkNonInteractiveSolved}
            onMarkCheckpointsSolved={handleMarkCheckpointsSolved}
            onAddChallenge={handleAddChallenge}
            onUpdateChallenge={handleUpdateChallenge}
            onDeleteChallenge={handleDeleteChallenge}
            onAddTeam={handleAddTeam}
            onUpdateTeam={handleUpdateTeam}
            onDeleteTeam={handleDeleteTeam}
            onAddSubmission={handleAddSubmission}
          />
        </div>
      </main>
    </AuthGuard>
  )
}
