"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { getSubmissionStats, getTeams, getChallenges } from "@/lib/store";
import type { TeamSubmissionStats, Team, Challenge } from "@/types/types";

export function SubmissionTracker() {
  const [submissionStats, setSubmissionStats] = useState<TeamSubmissionStats[]>(
    []
  );
  const [teams, setTeams] = useState<Team[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [selectedChallenge, setSelectedChallenge] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [stats, teamsData, challengesData] = await Promise.all([
          getSubmissionStats(),
          getTeams(),
          getChallenges(),
        ]);

        setSubmissionStats(stats);
        setTeams(teamsData);
        setChallenges(
          challengesData.filter((c) => c.type === "non-interactive")
        );
      } catch (error) {
        console.error("Error loading submission data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredStats = submissionStats.filter((stat) => {
    if (selectedTeam !== "all" && stat.teamId !== selectedTeam) return false;
    if (selectedChallenge !== "all" && stat.challengeId !== selectedChallenge)
      return false;
    return true;
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Submission Tracker</CardTitle>
          <CardDescription>
            Track team submissions for non-interactive challenges. Penalties are
            only applied if the team eventually solves the challenge.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="team-filter">Filter by Team</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger id="team-filter" className="w-48">
                  <SelectValue placeholder="All teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="challenge-filter">Filter by Challenge</Label>
              <Select
                value={selectedChallenge}
                onValueChange={setSelectedChallenge}
              >
                <SelectTrigger id="challenge-filter" className="w-48">
                  <SelectValue placeholder="All challenges" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Challenges</SelectItem>
                  {challenges.map((challenge) => (
                    <SelectItem key={challenge.id} value={challenge.id}>
                      {challenge.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No submissions found for the selected filters
              </div>
            ) : (
              filteredStats.map((stat) => (
                <Card
                  key={`${stat.teamId}-${stat.challengeId}`}
                  className="border-l-4 border-l-primary"
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {stat.teamName}
                        </CardTitle>
                        <CardDescription>{stat.challengeName}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {stat.isSolved ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Solved
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="w-3 h-3 mr-1" />
                            Unsolved
                          </Badge>
                        )}
                        {stat.penaltyPoints > 0 && (
                          <Badge variant="destructive">
                            <AlertTriangle className="w-3 h-3 mr-1" />-
                            {stat.penaltyPoints} pts
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <span className="font-medium">Total Submissions:</span>{" "}
                        {stat.totalSubmissions}
                      </div>
                      <div>
                        <span className="font-medium">Wrong Submissions:</span>{" "}
                        {stat.wrongSubmissions}
                      </div>
                      <div>
                        <span className="font-medium">Success Rate:</span>{" "}
                        {stat.totalSubmissions > 0
                          ? Math.round(
                              ((stat.totalSubmissions - stat.wrongSubmissions) /
                                stat.totalSubmissions) *
                                100
                            )
                          : 0}
                        %
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">
                        Submission History:
                      </h4>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {stat.submissions.map((submission) => (
                          <div
                            key={submission.id}
                            className={`flex items-center justify-between p-2 rounded text-xs ${
                              submission.isCorrect
                                ? "bg-green-50 border border-green-200"
                                : "bg-red-50 border border-red-200"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {submission.isCorrect ? (
                                <CheckCircle className="w-3 h-3 text-green-600" />
                              ) : (
                                <XCircle className="w-3 h-3 text-red-600" />
                              )}
                              <span className="font-mono">test</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {formatDate(submission.submittedAt)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
