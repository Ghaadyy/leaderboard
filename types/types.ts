// Type definitions for the application

// Challenge types
export type ChallengeType = "interactive" | "non-interactive"

export type Checkpoint = {
  id: string
  name: string
  points: number
}

export type Challenge = {
  id: string
  name: string
  description: string
  type: ChallengeType
  points: number // Total points for non-interactive challenges
  penaltyPoints: number // Points deducted per wrong submission (only if eventually solved)
  checkpoints?: Checkpoint[] // Array of checkpoints for interactive challenges
}

// Team solved challenge record
export type SolvedChallenge = {
  challengeId: string
  solvedCheckpointIds?: string[] // IDs of solved checkpoints for interactive challenges
}

export type Team = {
  id: string
  name: string
  solvedChallenges: SolvedChallenge[] // Changed from string[] to SolvedChallenge[]
}

export type LeaderboardEntry = {
  id: string
  name: string
  score: number
  challengesSolved: number
}

export type ChallengeStats = {
  id: string
  name: string
  type: ChallengeType
  solvedCount: number
  totalTeams: number
  completionPercentage: number
  points: number
}

export type Submission = {
  id: number
  teamId: string
  challengeId: string
  submissionText: string
  isCorrect: boolean
  submittedAt: Date
}

export type TeamSubmissionStats = {
  teamId: string
  teamName: string
  challengeId: string
  challengeName: string
  totalSubmissions: number
  wrongSubmissions: number
  isSolved: boolean
  penaltyPoints: number
  submissions: Submission[]
}
