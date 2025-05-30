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
  addTeam,
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

  // Mark checkpoints as solved for a team
  const handleMarkCheckpointsSolved = async (teamId: string, challengeId: string, checkpointIds: string[]) => {
    const success = await markCheckpointsSolved(teamId, challengeId, checkpointIds)

    if (success) {
      // Refresh data
      const [loadedChallenges, loadedTeams] = await Promise.all([getChallenges(), getTeams()])

      setChallenges(loadedChallenges)
      setTeams(loadedTeams)
    }

    return success
  }

  // Mark a non-interactive challenge as solved
  const handleMarkNonInteractiveSolved = async (teamId: string, challengeId: string) => {
    const success = await markNonInteractiveSolved(teamId, challengeId)

    if (success) {
      // Refresh data
      const [loadedChallenges, loadedTeams] = await Promise.all([getChallenges(), getTeams()])

      setChallenges(loadedChallenges)
      setTeams(loadedTeams)
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
      // Refresh challenges
      const loadedChallenges = await getChallenges()
      setChallenges(loadedChallenges)
    }

    return success
  }

  // Add a new team
  const handleAddTeam = async (name: string) => {
    const newTeam = await addTeam(name)

    if (newTeam) {
      // Refresh teams
      const loadedTeams = await getTeams()
      setTeams(loadedTeams)
    }

    return !!newTeam
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
      // Refresh teams (to update solved challenges if correct)
      const loadedTeams = await getTeams()
      setTeams(loadedTeams)
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
        <div className="max-w-4xl mx-auto">
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
            onAddTeam={handleAddTeam}
            onAddSubmission={handleAddSubmission}
          />
        </div>
      </main>
    </AuthGuard>
  )
}
