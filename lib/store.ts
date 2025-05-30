// Simple client-side store using localStorage
import type {
  Challenge,
  Team,
  SolvedChallenge,
  LeaderboardEntry,
  ChallengeStats,
  TeamSubmissionStats,
} from "@/types/types"
import {
  getTeams as getTeamsAction,
  getChallenges as getChallengesAction,
  getLeaderboardData as getLeaderboardDataAction,
  getChallengeStats as getChallengeStatsAction,
  getSubmissionStats as getSubmissionStatsAction,
  addTeam as addTeamAction,
  addChallenge as addChallengeAction,
  addSubmission as addSubmissionAction,
  markNonInteractiveSolved as markNonInteractiveSolvedAction,
  markCheckpointsSolved as markCheckpointsSolvedAction,
} from "@/app/api/actions"

// Initial challenges
const initialChallenges: Challenge[] = [
  {
    id: "c1",
    name: "Web Exploitation",
    description: "Find and exploit a web vulnerability",
    type: "non-interactive",
    points: 500,
  },
  {
    id: "c2",
    name: "Cryptography",
    description: "Decrypt the hidden message",
    type: "non-interactive",
    points: 750,
  },
  {
    id: "c3",
    name: "Reverse Engineering",
    description: "Analyze and understand the binary",
    type: "interactive",
    points: 1000, // Total possible points
    checkpoints: [
      { id: "c3-1", name: "Identify the file format", points: 100 },
      { id: "c3-2", name: "Decompile the binary", points: 150 },
      { id: "c3-3", name: "Find the main function", points: 200 },
      { id: "c3-4", name: "Identify the encryption algorithm", points: 250 },
      { id: "c3-5", name: "Extract the hidden message", points: 300 },
    ],
  },
  {
    id: "c4",
    name: "Forensics",
    description: "Recover deleted data",
    type: "non-interactive",
    points: 800,
  },
  {
    id: "c5",
    name: "Binary Exploitation",
    description: "Exploit a buffer overflow",
    type: "interactive",
    points: 1200, // Total possible points
    checkpoints: [
      { id: "c5-1", name: "Identify the vulnerability", points: 150 },
      { id: "c5-2", name: "Craft the payload", points: 200 },
      { id: "c5-3", name: "Bypass ASLR", points: 250 },
      { id: "c5-4", name: "Achieve code execution", points: 300 },
      { id: "c5-5", name: "Escalate privileges", points: 300 },
    ],
  },
]

// Initial teams
const initialTeams: Team[] = [
  {
    id: "1",
    name: "Team Alpha",
    solvedChallenges: [
      { challengeId: "c1" },
      { challengeId: "c2" },
      { challengeId: "c3", solvedCheckpointIds: ["c3-1", "c3-2", "c3-3"] },
    ],
  },
  {
    id: "2",
    name: "Team Omega",
    solvedChallenges: [{ challengeId: "c1" }, { challengeId: "c2" }],
  },
  {
    id: "3",
    name: "Team Phoenix",
    solvedChallenges: [{ challengeId: "c1" }, { challengeId: "c4" }],
  },
  {
    id: "4",
    name: "Team Nexus",
    solvedChallenges: [
      { challengeId: "c2" },
      { challengeId: "c5", solvedCheckpointIds: ["c5-1", "c5-2", "c5-3", "c5-4"] },
    ],
  },
  {
    id: "5",
    name: "Team Quantum",
    solvedChallenges: [{ challengeId: "c3", solvedCheckpointIds: ["c3-1", "c3-2", "c3-3", "c3-4", "c3-5"] }],
  },
]

// Cache for client-side data
let teamsCache: Team[] | null = null
let challengesCache: Challenge[] | null = null
let leaderboardDataCache: LeaderboardEntry[] | null = null
let challengeStatsCache: ChallengeStats[] | null = null
let submissionStatsCache: TeamSubmissionStats[] | null = null

// Get teams from API
export const getTeams = async (): Promise<Team[]> => {
  if (teamsCache) return teamsCache

  try {
    const teams = await getTeamsAction()
    teamsCache = teams
    return teams
  } catch (error) {
    console.error("Error fetching teams:", error)
    return []
  }
}

// Get challenges from API
export const getChallenges = async (): Promise<Challenge[]> => {
  if (challengesCache) return challengesCache

  try {
    const challenges = await getChallengesAction()
    challengesCache = challenges
    return challenges
  } catch (error) {
    console.error("Error fetching challenges:", error)
    return []
  }
}

// Get leaderboard data from API
export const getLeaderboardData = async (): Promise<LeaderboardEntry[]> => {
  if (leaderboardDataCache) return leaderboardDataCache

  try {
    const data = await getLeaderboardDataAction()
    leaderboardDataCache = data
    return data
  } catch (error) {
    console.error("Error fetching leaderboard data:", error)
    return []
  }
}

// Get challenge statistics from API
export const getChallengeStats = async (): Promise<ChallengeStats[]> => {
  if (challengeStatsCache) return challengeStatsCache

  try {
    const stats = await getChallengeStatsAction()
    challengeStatsCache = stats
    return stats
  } catch (error) {
    console.error("Error fetching challenge stats:", error)
    return []
  }
}

// Get submission statistics from API
export const getSubmissionStats = async (): Promise<TeamSubmissionStats[]> => {
  if (submissionStatsCache) return submissionStatsCache

  try {
    const stats = await getSubmissionStatsAction()
    submissionStatsCache = stats
    return stats
  } catch (error) {
    console.error("Error fetching submission stats:", error)
    return []
  }
}

// Add a new team
export const addTeam = async (name: string): Promise<Team | null> => {
  try {
    const formData = new FormData()
    formData.append("name", name)

    const result = await addTeamAction(formData)

    if (result.success) {
      // Clear cache to force refresh
      teamsCache = null
      leaderboardDataCache = null
      return result.team
    }

    throw new Error(result.error || "Failed to add team")
  } catch (error) {
    console.error("Error adding team:", error)
    return null
  }
}

// Add a new challenge
export const addChallenge = async (
  name: string,
  description: string,
  type: "interactive" | "non-interactive",
  points: number,
  penaltyPoints: number,
  checkpoints?: { name: string; points: number }[],
): Promise<boolean> => {
  try {
    const formData = new FormData()
    formData.append("name", name)
    formData.append("description", description)
    formData.append("type", type)
    formData.append("points", points.toString())
    formData.append("penaltyPoints", penaltyPoints.toString())

    if (type === "interactive" && checkpoints) {
      formData.append("checkpointsCount", checkpoints.length.toString())

      checkpoints.forEach((checkpoint, index) => {
        formData.append(`checkpoint_${index}_name`, checkpoint.name)
        formData.append(`checkpoint_${index}_points`, checkpoint.points.toString())
      })
    }

    const result = await addChallengeAction(formData)

    if (result.success) {
      // Clear cache to force refresh
      challengesCache = null
      challengeStatsCache = null
      return true
    }

    throw new Error(result.error || "Failed to add challenge")
  } catch (error) {
    console.error("Error adding challenge:", error)
    return false
  }
}

// Add a submission
export const addSubmission = async (
  teamId: string,
  challengeId: string,
  submissionText: string,
  isCorrect: boolean,
): Promise<boolean> => {
  try {
    const result = await addSubmissionAction(teamId, challengeId, submissionText, isCorrect)

    if (result.success) {
      // Clear cache to force refresh
      teamsCache = null
      leaderboardDataCache = null
      challengeStatsCache = null
      submissionStatsCache = null
      return true
    }

    throw new Error(result.error || "Failed to add submission")
  } catch (error) {
    console.error("Error adding submission:", error)
    return false
  }
}

// Mark a non-interactive challenge as solved
export const markNonInteractiveSolved = async (teamId: string, challengeId: string): Promise<boolean> => {
  try {
    const result = await markNonInteractiveSolvedAction(teamId, challengeId)

    if (result.success) {
      // Clear cache to force refresh
      teamsCache = null
      leaderboardDataCache = null
      challengeStatsCache = null
      submissionStatsCache = null
      return true
    }

    throw new Error(result.error || "Failed to mark challenge as solved")
  } catch (error) {
    console.error("Error marking challenge as solved:", error)
    return false
  }
}

// Mark checkpoints as solved for a team
export const markCheckpointsSolved = async (
  teamId: string,
  challengeId: string,
  checkpointIds: string[],
): Promise<boolean> => {
  try {
    const result = await markCheckpointsSolvedAction(teamId, challengeId, checkpointIds)

    if (result.success) {
      // Clear cache to force refresh
      teamsCache = null
      leaderboardDataCache = null
      challengeStatsCache = null
      submissionStatsCache = null
      return true
    }

    throw new Error(result.error || "Failed to mark checkpoints as solved")
  } catch (error) {
    console.error("Error marking checkpoints as solved:", error)
    return false
  }
}

// Calculate points for a solved challenge
export const calculateChallengePoints = (solvedChallenge: SolvedChallenge, challenge: Challenge): number => {
  if (challenge.type === "non-interactive") {
    return challenge.points
  } else if (challenge.type === "interactive" && solvedChallenge.solvedCheckpointIds && challenge.checkpoints) {
    // Sum the points from all solved checkpoints
    return solvedChallenge.solvedCheckpointIds.reduce((total, checkpointId) => {
      const checkpoint = challenge.checkpoints?.find((cp) => cp.id === checkpointId)
      return total + (checkpoint?.points || 0)
    }, 0)
  }
  return 0
}

// Calculate team score based on solved challenges
export const calculateTeamScore = (team: Team, challenges: Challenge[]): number => {
  return team.solvedChallenges.reduce((total, solvedChallenge) => {
    const challenge = challenges.find((c) => c.id === solvedChallenge.challengeId)
    if (!challenge) return total

    return total + calculateChallengePoints(solvedChallenge, challenge)
  }, 0)
}

// Calculate number of challenges solved
export const calculateChallengesSolved = (team: Team): number => {
  return team.solvedChallenges.length
}

// Calculate total points for a challenge
export const calculateTotalChallengePoints = (challenge: Challenge): number => {
  if (challenge.type === "non-interactive") {
    return challenge.points
  } else if (challenge.checkpoints) {
    return challenge.checkpoints.reduce((total, checkpoint) => total + checkpoint.points, 0)
  }
  return 0
}
