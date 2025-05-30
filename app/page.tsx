"use client"

import { useState, useEffect } from "react"
import { Leaderboard } from "@/components/leaderboard"
import { ChallengeLeaderboard } from "@/components/challenge-leaderboard"
import { LeaderboardHeader } from "@/components/leaderboard-header"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Shield, Monitor } from "lucide-react"
import { getLeaderboardData, getChallengeStats } from "@/lib/store"
import type { LeaderboardEntry, ChallengeStats } from "@/types/types"
import { AuthHeader } from "@/components/auth-header"

export default function Home() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [challengeStats, setChallengeStats] = useState<ChallengeStats[]>([])
  const [showTeamLeaderboard, setShowTeamLeaderboard] = useState(true)
  const [loading, setLoading] = useState(true)

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [leaderboardData, challengeStats] = await Promise.all([getLeaderboardData(), getChallengeStats()])

        setLeaderboardData(leaderboardData)
        setChallengeStats(challengeStats)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Set up periodic refresh
    const refreshInterval = setInterval(loadData, 30000)
    return () => clearInterval(refreshInterval)
  }, [])

  // Toggle between leaderboards every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setShowTeamLeaderboard((prev) => !prev)
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end gap-2 mb-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/display">
              <Monitor className="mr-2 h-4 w-4" />
              Display Mode
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin">
              <Shield className="mr-2 h-4 w-4" />
              Admin Panel
            </Link>
          </Button>
          <AuthHeader />
        </div>

        <LeaderboardHeader />

        <div className="grid gap-8">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : showTeamLeaderboard ? (
            <Leaderboard data={leaderboardData} />
          ) : (
            <ChallengeLeaderboard data={challengeStats} />
          )}
        </div>
      </div>
    </main>
  )
}
