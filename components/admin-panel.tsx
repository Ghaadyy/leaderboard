"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { calculateTotalChallengePoints } from "@/lib/store";
import { SubmissionTracker } from "@/components/submission-tracker";
import { TeamManager } from "@/components/team-manager";
import { ChallengeManager } from "@/components/challenge-manager";
import type { Challenge, Team, ChallengeType, Checkpoint } from "@/types/types";

interface AdminPanelProps {
  teams: Team[];
  challenges: Challenge[];
  onMarkNonInteractiveSolved: (
    teamId: string,
    challengeId: string
  ) => Promise<boolean>;
  onMarkCheckpointsSolved: (
    teamId: string,
    challengeId: string,
    checkpointIds: string[]
  ) => Promise<boolean>;
  onAddChallenge: (
    name: string,
    description: string,
    type: ChallengeType,
    points: number,
    penaltyPoints: number,
    checkpoints?: Checkpoint[]
  ) => Promise<boolean>;
  onUpdateChallenge: (
    challengeId: string,
    name: string,
    description: string,
    type: ChallengeType,
    points: number,
    penaltyPoints: number,
    checkpoints?: Checkpoint[]
  ) => Promise<boolean>;
  onDeleteChallenge: (challengeId: string) => Promise<boolean>;
  onAddTeam: (name: string) => Promise<boolean>;
  onUpdateTeam: (teamId: string, name: string) => Promise<boolean>;
  onDeleteTeam: (teamId: string) => Promise<boolean>;
  onAddSubmission: (
    teamId: string,
    challengeId: string,
    isCorrect: boolean
  ) => Promise<boolean>;
}

export function AdminPanel({
  teams,
  challenges,
  onMarkNonInteractiveSolved,
  onMarkCheckpointsSolved,
  onAddChallenge,
  onUpdateChallenge,
  onDeleteChallenge,
  onAddTeam,
  onUpdateTeam,
  onDeleteTeam,
  onAddSubmission,
}: AdminPanelProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>("");
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(
    null
  );
  const [selectedCheckpoints, setSelectedCheckpoints] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Submission form state
  const [submissionTeamId, setSubmissionTeamId] = useState<string>("");
  const [submissionChallengeId, setSubmissionChallengeId] =
    useState<string>("");
  const [submissionIsCorrect, setSubmissionIsCorrect] = useState(false);

  const { toast } = useToast();

  // Update selected challenge when challenge ID changes
  useEffect(() => {
    if (selectedChallengeId) {
      const challenge =
        challenges.find((c) => c.id === selectedChallengeId) || null;
      setSelectedChallenge(challenge);

      // Reset selected checkpoints
      setSelectedCheckpoints([]);

      // If team is selected, pre-select solved checkpoints
      if (selectedTeamId && challenge?.type === "interactive") {
        const team = teams.find((t) => t.id === selectedTeamId);
        const solvedChallenge = team?.solvedChallenges.find(
          (sc) => sc.challengeId === selectedChallengeId
        );
        if (solvedChallenge?.solvedCheckpointIds) {
          setSelectedCheckpoints(solvedChallenge.solvedCheckpointIds);
        }
      }
    } else {
      setSelectedChallenge(null);
    }
  }, [selectedChallengeId, selectedTeamId, challenges, teams]);

  const handleMarkSolved = async () => {
    if (!selectedTeamId || !selectedChallengeId) {
      toast({
        title: "Error",
        description: "Please select both a team and a challenge",
        variant: "destructive",
      });
      return;
    }

    const team = teams.find((t) => t.id === selectedTeamId);
    const teamName = team?.name || "Unknown team";
    const challengeName = selectedChallenge?.name || "Unknown challenge";

    setIsSubmitting(true);

    try {
      if (selectedChallenge?.type === "interactive") {
        if (selectedCheckpoints.length === 0) {
          toast({
            title: "No checkpoints selected",
            description: "Please select at least one checkpoint",
            variant: "destructive",
          });
          return;
        }

        const success = await onMarkCheckpointsSolved(
          selectedTeamId,
          selectedChallengeId,
          selectedCheckpoints
        );

        if (success) {
          // Calculate points earned
          let pointsEarned = 0;
          if (selectedChallenge.checkpoints) {
            pointsEarned = selectedChallenge.checkpoints
              .filter((cp) => selectedCheckpoints.includes(cp.id))
              .reduce((sum, cp) => sum + cp.points, 0);
          }

          toast({
            title: "Checkpoints marked as solved",
            description: `${teamName} has earned ${pointsEarned} points for ${challengeName}`,
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to mark checkpoints as solved",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error marking challenge as solved:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSubmission = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!submissionTeamId || !submissionChallengeId) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await onAddSubmission(
        submissionTeamId,
        submissionChallengeId,
        submissionIsCorrect
      );

      if (success) {
        // Reset form
        setSubmissionTeamId("");
        setSubmissionChallengeId("");
        setSubmissionIsCorrect(false);

        toast({
          title: "Submission added",
          description: `Submission recorded for ${
            teams.find((t) => t.id === submissionTeamId)?.name
          }`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add submission",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding submission:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle checkpoint selection
  const toggleCheckpoint = (checkpointId: string) => {
    setSelectedCheckpoints((prev) => {
      if (prev.includes(checkpointId)) {
        return prev.filter((id) => id !== checkpointId);
      } else {
        return [...prev, checkpointId];
      }
    });
  };

  // Calculate total points for selected checkpoints
  const calculateSelectedPoints = () => {
    if (!selectedChallenge?.checkpoints) return 0;

    return selectedChallenge.checkpoints
      .filter((cp) => selectedCheckpoints.includes(cp.id))
      .reduce((sum, cp) => sum + cp.points, 0);
  };

  return (
    <div className="grid gap-6">
      <Tabs defaultValue="interactive-challenges">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="interactive-challenges">Interactive</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="view-submissions">View Submissions</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
        </TabsList>

        <TabsContent value="interactive-challenges">
          <Card>
            <CardHeader>
              <CardTitle>Mark Interactive Challenge as Solved</CardTitle>
              <CardDescription>
                Select a team and an interactive challenge to mark checkpoints
                as solved
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team">Team</Label>
                <Select
                  value={selectedTeamId}
                  onValueChange={setSelectedTeamId}
                >
                  <SelectTrigger id="team">
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="challenge">Challenge</Label>
                <Select
                  value={selectedChallengeId}
                  onValueChange={setSelectedChallengeId}
                >
                  <SelectTrigger id="challenge">
                    <SelectValue placeholder="Select a challenge" />
                  </SelectTrigger>
                  <SelectContent>
                    {challenges
                      .filter((c) => c.type === "interactive")
                      .map((challenge) => (
                        <SelectItem key={challenge.id} value={challenge.id}>
                          {challenge.name} (Interactive)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedChallenge?.type === "interactive" &&
                selectedChallenge.checkpoints && (
                  <div className="space-y-2 pt-2 border p-4 rounded-md">
                    <Label className="mb-2 block">
                      Select completed checkpoints:
                    </Label>
                    <div className="space-y-2">
                      {selectedChallenge.checkpoints.map((checkpoint) => (
                        <div
                          key={checkpoint.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={checkpoint.id}
                            checked={selectedCheckpoints.includes(
                              checkpoint.id
                            )}
                            onCheckedChange={() =>
                              toggleCheckpoint(checkpoint.id)
                            }
                          />
                          <Label htmlFor={checkpoint.id} className="flex-1">
                            {checkpoint.name}
                          </Label>
                          <span className="text-sm font-medium">
                            {checkpoint.points} pts
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 text-sm">
                      <span className="font-medium">
                        Total points selected:
                      </span>{" "}
                      {calculateSelectedPoints()} of{" "}
                      {calculateTotalChallengePoints(selectedChallenge)}
                    </div>
                  </div>
                )}

              <Button
                onClick={handleMarkSolved}
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Mark Checkpoints as Solved"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions">
          <Card>
            <CardHeader>
              <CardTitle>Add Challenge Submission</CardTitle>
              <CardDescription>
                Record a team's submission for a non-interactive challenge
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddSubmission} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="submission-team">Team</Label>
                  <Select
                    value={submissionTeamId}
                    onValueChange={setSubmissionTeamId}
                  >
                    <SelectTrigger id="submission-team">
                      <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="submission-challenge">Challenge</Label>
                  <Select
                    value={submissionChallengeId}
                    onValueChange={setSubmissionChallengeId}
                  >
                    <SelectTrigger id="submission-challenge">
                      <SelectValue placeholder="Select a challenge" />
                    </SelectTrigger>
                    <SelectContent>
                      {challenges
                        .filter((c) => c.type === "non-interactive")
                        .map((challenge) => (
                          <SelectItem key={challenge.id} value={challenge.id}>
                            {challenge.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="submission-correct"
                    checked={submissionIsCorrect}
                    onCheckedChange={(checked) =>
                      setSubmissionIsCorrect(checked as boolean)
                    }
                  />
                  <Label htmlFor="submission-correct">
                    This submission is correct
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding..." : "Add Submission"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="view-submissions">
          <SubmissionTracker />
        </TabsContent>

        <TabsContent value="teams">
          <TeamManager
            teams={teams}
            onAddTeam={onAddTeam}
            onUpdateTeam={onUpdateTeam}
            onDeleteTeam={onDeleteTeam}
          />
        </TabsContent>

        <TabsContent value="challenges">
          <ChallengeManager
            challenges={challenges}
            onAddChallenge={onAddChallenge}
            onUpdateChallenge={onUpdateChallenge}
            onDeleteChallenge={onDeleteChallenge}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
