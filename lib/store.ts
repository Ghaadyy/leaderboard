// Simple client-side store using localStorage
import type {
  Challenge,
  Team,
  SolvedChallenge,
  LeaderboardEntry,
  ChallengeStats,
  TeamSubmissionStats,
} from "@/types/types";
import {
  getTeams as getTeamsAction,
  getChallenges as getChallengesAction,
  getLeaderboardData as getLeaderboardDataAction,
  getChallengeStats as getChallengeStatsAction,
  getSubmissionStats as getSubmissionStatsAction,
  addTeam as addTeamAction,
  updateTeam as updateTeamAction,
  deleteTeam as deleteTeamAction,
  addChallenge as addChallengeAction,
  updateChallenge as updateChallengeAction,
  deleteChallenge as deleteChallengeAction,
  addSubmission as addSubmissionAction,
  markNonInteractiveSolved as markNonInteractiveSolvedAction,
  markCheckpointsSolved as markCheckpointsSolvedAction,
} from "@/app/api/actions";

// Cache for client-side data
let teamsCache: Team[] | null = null;
let challengesCache: Challenge[] | null = null;
let leaderboardDataCache: LeaderboardEntry[] | null = null;
let challengeStatsCache: ChallengeStats[] | null = null;
let submissionStatsCache: TeamSubmissionStats[] | null = null;

// Clear all caches
const clearCaches = () => {
  teamsCache = null;
  challengesCache = null;
  leaderboardDataCache = null;
  challengeStatsCache = null;
  submissionStatsCache = null;
};

// Get teams from API
export const getTeams = async (): Promise<Team[]> => {
  if (teamsCache) return teamsCache;

  try {
    const teams = await getTeamsAction();
    teamsCache = teams;
    return teams;
  } catch (error) {
    console.error("Error fetching teams:", error);
    return [];
  }
};

// Get challenges from API
export const getChallenges = async (): Promise<Challenge[]> => {
  if (challengesCache) return challengesCache;

  try {
    const challenges = await getChallengesAction();
    challengesCache = challenges;
    return challenges;
  } catch (error) {
    console.error("Error fetching challenges:", error);
    return [];
  }
};

// Get leaderboard data from API
export const getLeaderboardData = async (): Promise<LeaderboardEntry[]> => {
  if (leaderboardDataCache) return leaderboardDataCache;

  try {
    const data = await getLeaderboardDataAction();
    leaderboardDataCache = data;
    return data;
  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
    return [];
  }
};

// Get challenge statistics from API
export const getChallengeStats = async (): Promise<ChallengeStats[]> => {
  if (challengeStatsCache) return challengeStatsCache;

  try {
    const stats = await getChallengeStatsAction();
    challengeStatsCache = stats;
    return stats;
  } catch (error) {
    console.error("Error fetching challenge stats:", error);
    return [];
  }
};

// Get submission statistics from API
export const getSubmissionStats = async (): Promise<TeamSubmissionStats[]> => {
  if (submissionStatsCache) return submissionStatsCache;

  try {
    const stats = await getSubmissionStatsAction();
    submissionStatsCache = stats;
    return stats;
  } catch (error) {
    console.error("Error fetching submission stats:", error);
    return [];
  }
};

// Add a new team
export const addTeam = async (name: string): Promise<Team | null> => {
  try {
    const formData = new FormData();
    formData.append("name", name);

    const result = await addTeamAction(formData);

    if (result.success) {
      clearCaches();
      return result.team;
    }

    throw new Error(result.error || "Failed to add team");
  } catch (error) {
    console.error("Error adding team:", error);
    return null;
  }
};

// Update a team
export const updateTeam = async (
  teamId: string,
  name: string
): Promise<boolean> => {
  try {
    const formData = new FormData();
    formData.append("name", name);

    const result = await updateTeamAction(teamId, formData);

    if (result.success) {
      clearCaches();
      return true;
    }

    throw new Error(result.error || "Failed to update team");
  } catch (error) {
    console.error("Error updating team:", error);
    return false;
  }
};

// Delete a team
export const deleteTeam = async (teamId: string): Promise<boolean> => {
  try {
    const result = await deleteTeamAction(teamId);

    if (result.success) {
      clearCaches();
      return true;
    }

    throw new Error(result.error || "Failed to delete team");
  } catch (error) {
    console.error("Error deleting team:", error);
    return false;
  }
};

// Add a new challenge
export const addChallenge = async (
  name: string,
  description: string,
  type: "interactive" | "non-interactive",
  points: number,
  penaltyPoints: number,
  checkpoints?: { name: string; points: number }[]
): Promise<boolean> => {
  try {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("type", type);
    formData.append("points", points.toString());
    formData.append("penaltyPoints", penaltyPoints.toString());

    if (type === "interactive" && checkpoints) {
      formData.append("checkpointsCount", checkpoints.length.toString());

      checkpoints.forEach((checkpoint, index) => {
        formData.append(`checkpoint_${index}_name`, checkpoint.name);
        formData.append(
          `checkpoint_${index}_points`,
          checkpoint.points.toString()
        );
      });
    }

    const result = await addChallengeAction(formData);

    if (result.success) {
      clearCaches();
      return true;
    }

    throw new Error(result.error || "Failed to add challenge");
  } catch (error) {
    console.error("Error adding challenge:", error);
    return false;
  }
};

// Update a challenge
export const updateChallenge = async (
  challengeId: string,
  name: string,
  description: string,
  type: "interactive" | "non-interactive",
  points: number,
  penaltyPoints: number,
  checkpoints?: { name: string; points: number }[]
): Promise<boolean> => {
  try {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("type", type);
    formData.append("points", points.toString());
    formData.append("penaltyPoints", penaltyPoints.toString());

    if (type === "interactive" && checkpoints) {
      formData.append("checkpointsCount", checkpoints.length.toString());

      checkpoints.forEach((checkpoint, index) => {
        formData.append(`checkpoint_${index}_name`, checkpoint.name);
        formData.append(
          `checkpoint_${index}_points`,
          checkpoint.points.toString()
        );
      });
    }

    const result = await updateChallengeAction(challengeId, formData);

    if (result.success) {
      clearCaches();
      return true;
    }

    throw new Error(result.error || "Failed to update challenge");
  } catch (error) {
    console.error("Error updating challenge:", error);
    return false;
  }
};

// Delete a challenge
export const deleteChallenge = async (
  challengeId: string
): Promise<boolean> => {
  try {
    const result = await deleteChallengeAction(challengeId);

    if (result.success) {
      clearCaches();
      return true;
    }

    throw new Error(result.error || "Failed to delete challenge");
  } catch (error) {
    console.error("Error deleting challenge:", error);
    return false;
  }
};

// Add a submission
export const addSubmission = async (
  teamId: string,
  challengeId: string,
  isCorrect: boolean
): Promise<boolean> => {
  try {
    const result = await addSubmissionAction(teamId, challengeId, isCorrect);

    if (result.success) {
      clearCaches();
      return true;
    }

    throw new Error(result.error || "Failed to add submission");
  } catch (error) {
    console.error("Error adding submission:", error);
    return false;
  }
};

// Mark a non-interactive challenge as solved
export const markNonInteractiveSolved = async (
  teamId: string,
  challengeId: string
): Promise<boolean> => {
  try {
    const result = await markNonInteractiveSolvedAction(teamId, challengeId);

    if (result.success) {
      clearCaches();
      return true;
    }

    throw new Error(result.error || "Failed to mark challenge as solved");
  } catch (error) {
    console.error("Error marking challenge as solved:", error);
    return false;
  }
};

// Mark checkpoints as solved for a team
export const markCheckpointsSolved = async (
  teamId: string,
  challengeId: string,
  checkpointIds: string[]
): Promise<boolean> => {
  try {
    const result = await markCheckpointsSolvedAction(
      teamId,
      challengeId,
      checkpointIds
    );

    if (result.success) {
      clearCaches();
      return true;
    }

    throw new Error(result.error || "Failed to mark checkpoints as solved");
  } catch (error) {
    console.error("Error marking checkpoints as solved:", error);
    return false;
  }
};

// Calculate points for a solved challenge
export const calculateChallengePoints = (
  solvedChallenge: SolvedChallenge,
  challenge: Challenge
): number => {
  if (challenge.type === "non-interactive") {
    return challenge.points;
  } else if (
    challenge.type === "interactive" &&
    solvedChallenge.solvedCheckpointIds &&
    challenge.checkpoints
  ) {
    // Sum the points from all solved checkpoints
    return solvedChallenge.solvedCheckpointIds.reduce((total, checkpointId) => {
      const checkpoint = challenge.checkpoints?.find(
        (cp) => cp.id === checkpointId
      );
      return total + (checkpoint?.points || 0);
    }, 0);
  }
  return 0;
};

// Calculate team score based on solved challenges
export const calculateTeamScore = (
  team: Team,
  challenges: Challenge[]
): number => {
  return team.solvedChallenges.reduce((total, solvedChallenge) => {
    const challenge = challenges.find(
      (c) => c.id === solvedChallenge.challengeId
    );
    if (!challenge) return total;

    return total + calculateChallengePoints(solvedChallenge, challenge);
  }, 0);
};

// Calculate number of challenges solved
export const calculateChallengesSolved = (team: Team): number => {
  return team.solvedChallenges.length;
};

// Calculate total points for a challenge
export const calculateTotalChallengePoints = (challenge: Challenge): number => {
  if (challenge.type === "non-interactive") {
    return challenge.points;
  } else if (challenge.checkpoints) {
    return challenge.checkpoints.reduce(
      (total, checkpoint) => total + checkpoint.points,
      0
    );
  }
  return 0;
};
