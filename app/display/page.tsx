"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Medal } from "lucide-react"
import { getLeaderboardData, getChallengeStats } from "@/lib/store"
import type { LeaderboardEntry, ChallengeStats } from "@/types/types"

export default function DisplayMode() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [challengeStats, setChallengeStats] = useState<ChallengeStats[]>([])
  const [showTeamLeaderboard, setShowTeamLeaderboard] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [loading, setLoading] = useState(true)

  // Load data on component mount and every 30 seconds
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [leaderboardData, challengeStats] = await Promise.all([getLeaderboardData(), getChallengeStats()])

        setLeaderboardData(leaderboardData)
        setChallengeStats(challengeStats)
        setCurrentTime(new Date())
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData() // Initial load

    // Refresh data every 30 seconds
    const dataInterval = setInterval(loadData, 30000)
    return () => clearInterval(dataInterval)
  }, [])

  // Toggle between leaderboards every 20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setShowTeamLeaderboard((prev) => !prev)
    }, 20000)

    return () => clearInterval(interval)
  }, [])

  // Format time as HH:MM:SS
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="bg-white text-gray-900 min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Medal className="h-10 w-10" />
            <h1 className="text-4xl font-bold tracking-tight">CTF Leaderboard</h1>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-3xl font-mono">{formatTime(currentTime)}</div>
            <div className="text-sm opacity-80">Last updated: {currentTime.toLocaleTimeString()}</div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto py-8 px-4 flex flex-col">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-800">
            {showTeamLeaderboard ? "Team Rankings" : "Challenge Statistics"}
          </h2>
          <Button asChild variant="outline" size="sm">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Exit Display Mode
            </Link>
          </Button>
        </div>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : showTeamLeaderboard ? (
            <DisplayTeamLeaderboard data={leaderboardData} />
          ) : (
            <DisplayChallengeLeaderboard data={challengeStats} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-center">
        <div className="text-sm opacity-80">
          Press <kbd className="px-2 py-1 bg-white/30 rounded">ESC</kbd> to exit display mode
        </div>
      </footer>
    </div>
  )
}

function DisplayTeamLeaderboard({ data }: { data: LeaderboardEntry[] }) {
  return (
    <div className="space-y-4">
      {/* Column Headers */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-100 rounded-lg text-lg">
        <div className="flex items-center gap-6">
          <div className="w-12 text-center">#</div>
          <div className="font-medium">Team</div>
        </div>
        <div className="flex items-center gap-12">
          <div className="text-right min-w-24">
            <div className="font-medium">Challenges</div>
          </div>
          <div className="text-right min-w-32">
            <div className="font-medium">Score</div>
          </div>
        </div>
      </div>

      {/* Leaderboard Entries */}
      <div className="space-y-3">
        {data.map((entry, index) => (
          <div
            key={entry.id}
            className={`flex items-center justify-between p-6 rounded-lg ${
              index === 0
                ? "bg-yellow-100 border border-yellow-300"
                : index === 1
                  ? "bg-gray-100 border border-gray-300"
                  : index === 2
                    ? "bg-amber-100 border border-amber-300"
                    : "bg-gray-50 border border-gray-200"
            }`}
          >
            <div className="flex items-center gap-6">
              <div className="flex items-center justify-center w-12 h-12 text-2xl font-bold">
                {index === 0 ? (
                  <span className="text-yellow-600">1</span>
                ) : index === 1 ? (
                  <span className="text-gray-600">2</span>
                ) : index === 2 ? (
                  <span className="text-amber-800">3</span>
                ) : (
                  <span className="text-gray-600">{index + 1}</span>
                )}
              </div>
              <div className="font-medium text-2xl">{entry.name}</div>
            </div>
            <div className="flex items-center gap-12">
              <div className="text-right min-w-24">
                <div className="font-medium text-xl">{entry.challengesSolved}</div>
              </div>
              <div className="text-right min-w-32">
                <div className="font-bold text-2xl">{entry.score.toLocaleString()}</div>
              </div>
            </div>
          </div>
        ))}

        {data.length === 0 && <div className="text-center py-12 text-gray-400 text-2xl">No scores yet</div>}
      </div>
    </div>
  )
}

function DisplayChallengeLeaderboard({ data }: { data: ChallengeStats[] }) {
  // Sort challenges by completion percentage (highest first)
  const sortedData = [...data].sort((a, b) => b.completionPercentage - a.completionPercentage)

  return (
    <div className="space-y-4">
      {/* Column Headers */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-100 rounded-lg text-lg">
        <div className="font-medium flex-1">Challenge</div>
        <div className="flex items-center gap-12">
          <div className="text-right min-w-24">
            <div className="font-medium">Solved By</div>
          </div>
          <div className="text-right min-w-32">
            <div className="font-medium">Completion</div>
          </div>
        </div>
      </div>

      {/* Challenge Entries */}
      <div className="space-y-3">
        {sortedData.map((challenge) => (
          <div
            key={challenge.id}
            className="flex items-center justify-between p-6 rounded-lg bg-gray-50 border border-gray-200"
          >
            <div className="flex items-center gap-3 flex-1">
              <div
                className={`w-3 h-12 rounded-full ${
                  challenge.completionPercentage >= 75
                    ? "bg-green-500"
                    : challenge.completionPercentage >= 50
                      ? "bg-blue-500"
                      : challenge.completionPercentage >= 25
                        ? "bg-yellow-500"
                        : "bg-red-500"
                }`}
              />
              <div>
                <div className="font-medium text-2xl">{challenge.name}</div>
                <div className="text-sm text-gray-500">
                  {challenge.type === "interactive" ? "Interactive" : "Non-Interactive"} • {challenge.points} points
                </div>
              </div>
            </div>
            <div className="flex items-center gap-12">
              <div className="text-right min-w-24">
                <div className="font-medium text-xl">
                  {challenge.solvedCount} / {challenge.totalTeams}
                </div>
              </div>
              <div className="min-w-32">
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full ${
                        challenge.completionPercentage >= 75
                          ? "bg-green-500"
                          : challenge.completionPercentage >= 50
                            ? "bg-blue-500"
                            : challenge.completionPercentage >= 25
                              ? "bg-yellow-500"
                              : "bg-red-500"
                      }`}
                      style={{ width: `${challenge.completionPercentage}%` }}
                    />
                  </div>
                  <span className="text-xl font-medium">{challenge.completionPercentage}%</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {data.length === 0 && <div className="text-center py-12 text-gray-400 text-2xl">No challenges available</div>}
      </div>
    </div>
  )
}
