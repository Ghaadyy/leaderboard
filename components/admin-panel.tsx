"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { calculateTotalChallengePoints } from "@/lib/store"
import { AddTeamForm } from "@/components/add-team-form"
import { SubmissionTracker } from "@/components/submission-tracker"
import type { Challenge, Team, ChallengeType, Checkpoint } from "@/types/types"

interface AdminPanelProps {
  teams: Team[]
  challenges: Challenge[]
  onMarkNonInteractiveSolved: (teamId: string, challengeId: string) => Promise<boolean>
  onMarkCheckpointsSolved: (teamId: string, challengeId: string, checkpointIds: string[]) => Promise<boolean>
  onAddChallenge: (
    name: string,
    description: string,
    type: ChallengeType,
    points: number,
    penaltyPoints: number,
    checkpoints?: Checkpoint[],
  ) => Promise<boolean>
  onAddTeam: (name: string) => Promise<boolean>
  onAddSubmission: (teamId: string, challengeId: string, submissionText: string, isCorrect: boolean) => Promise<boolean>
}

export function AdminPanel({
  teams,
  challenges,
  onMarkNonInteractiveSolved,
  onMarkCheckpointsSolved,
  onAddChallenge,
  onAddTeam,
  onAddSubmission,
}: AdminPanelProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>("")
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>("")
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
  const [selectedCheckpoints, setSelectedCheckpoints] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Submission form state
  const [submissionTeamId, setSubmissionTeamId] = useState<string>("")
  const [submissionChallengeId, setSubmissionChallengeId] = useState<string>("")
  const [submissionText, setSubmissionText] = useState("")
  const [submissionIsCorrect, setSubmissionIsCorrect] = useState(false)

  // New challenge form state
  const [challengeName, setChallengeName] = useState("")
  const [challengeDescription, setChallengeDescription] = useState("")
  const [challengeType, setChallengeType] = useState<ChallengeType>("non-interactive")
  const [challengePoints, setChallengePoints] = useState("")
  const [challengePenaltyPoints, setChallengePenaltyPoints] = useState("")
  const [checkpointsCount, setCheckpointsCount] = useState("3")
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([
    { id: "new-1", name: "Checkpoint 1", points: 100 },
    { id: "new-2", name: "Checkpoint 2", points: 200 },
    { id: "new-3", name: "Checkpoint 3", points: 300 },
  ])

  const { toast } = useToast()

  // Update selected challenge when challenge ID changes
  useEffect(() => {
    if (selectedChallengeId) {
      const challenge = challenges.find((c) => c.id === selectedChallengeId) || null
      setSelectedChallenge(challenge)

      // Reset selected checkpoints
      setSelectedCheckpoints([])

      // If team is selected, pre-select solved checkpoints
      if (selectedTeamId && challenge?.type === "interactive") {
        const team = teams.find((t) => t.id === selectedTeamId)
        const solvedChallenge = team?.solvedChallenges.find((sc) => sc.challengeId === selectedChallengeId)
        if (solvedChallenge?.solvedCheckpointIds) {
          setSelectedCheckpoints(solvedChallenge.solvedCheckpointIds)
        }
      }
    } else {
      setSelectedChallenge(null)
    }
  }, [selectedChallengeId, selectedTeamId, challenges, teams])

  // Update checkpoints when count changes
  useEffect(() => {
    const count = Number.parseInt(checkpointsCount) || 3
    if (count > 0) {
      // Create or update checkpoints array
      const newCheckpoints: Checkpoint[] = []
      for (let i = 0; i < count; i++) {
        // Keep existing checkpoint data if available
        if (i < checkpoints.length) {
          newCheckpoints.push(checkpoints[i])
        } else {
          newCheckpoints.push({
            id: `new-${i + 1}`,
            name: `Checkpoint ${i + 1}`,
            points: 100,
          })
        }
      }
      setCheckpoints(newCheckpoints)
    }
  }, [checkpointsCount])

  const handleCheckpointChange = (index: number, field: keyof Checkpoint, value: string | number) => {
    const updatedCheckpoints = [...checkpoints]
    updatedCheckpoints[index] = {
      ...updatedCheckpoints[index],
      [field]: value,
    }
    setCheckpoints(updatedCheckpoints)
  }

  const handleMarkSolved = async () => {
    if (!selectedTeamId || !selectedChallengeId) {
      toast({
        title: "Error",
        description: "Please select both a team and a challenge",
        variant: "destructive",
      })
      return
    }

    const team = teams.find((t) => t.id === selectedTeamId)
    const teamName = team?.name || "Unknown team"
    const challengeName = selectedChallenge?.name || "Unknown challenge"

    setIsSubmitting(true)

    try {
      if (selectedChallenge?.type === "non-interactive") {
        // Check if already solved
        const alreadySolved = team?.solvedChallenges.some((sc) => sc.challengeId === selectedChallengeId)
        if (alreadySolved) {
          toast({
            title: "Already solved",
            description: `${teamName} has already solved this challenge`,
            variant: "destructive",
          })
          return
        }

        const success = await onMarkNonInteractiveSolved(selectedTeamId, selectedChallengeId)

        if (success) {
          toast({
            title: "Challenge marked as solved",
            description: `${teamName} has solved ${challengeName}`,
          })
        } else {
          toast({
            title: "Error",
            description: "Failed to mark challenge as solved",
            variant: "destructive",
          })
        }
      } else if (selectedChallenge?.type === "interactive") {
        if (selectedCheckpoints.length === 0) {
          toast({
            title: "No checkpoints selected",
            description: "Please select at least one checkpoint",
            variant: "destructive",
          })
          return
        }

        const success = await onMarkCheckpointsSolved(selectedTeamId, selectedChallengeId, selectedCheckpoints)

        if (success) {
          // Calculate points earned
          let pointsEarned = 0
          if (selectedChallenge.checkpoints) {
            pointsEarned = selectedChallenge.checkpoints
              .filter((cp) => selectedCheckpoints.includes(cp.id))
              .reduce((sum, cp) => sum + cp.points, 0)
          }

          toast({
            title: "Checkpoints marked as solved",
            description: `${teamName} has earned ${pointsEarned} points for ${challengeName}`,
          })
        } else {
          toast({
            title: "Error",
            description: "Failed to mark checkpoints as solved",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error marking challenge as solved:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddSubmission = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!submissionTeamId || !submissionChallengeId || !submissionText.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const success = await onAddSubmission(
        submissionTeamId,
        submissionChallengeId,
        submissionText,
        submissionIsCorrect,
      )

      if (success) {
        // Reset form
        setSubmissionTeamId("")
        setSubmissionChallengeId("")
        setSubmissionText("")
        setSubmissionIsCorrect(false)

        toast({
          title: "Submission added",
          description: `Submission recorded for ${teams.find((t) => t.id === submissionTeamId)?.name}`,
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to add submission",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding submission:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddChallenge = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!challengeName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a challenge name",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      let success = false

      if (challengeType === "non-interactive") {
        const points = Number.parseInt(challengePoints)
        const penaltyPoints = Number.parseInt(challengePenaltyPoints) || 0

        if (isNaN(points) || points <= 0) {
          toast({
            title: "Error",
            description: "Please enter valid points",
            variant: "destructive",
          })
          return
        }

        success = await onAddChallenge(challengeName, challengeDescription, challengeType, points, penaltyPoints)
      } else {
        // Validate checkpoints
        if (checkpoints.length === 0) {
          toast({
            title: "Error",
            description: "Please add at least one checkpoint",
            variant: "destructive",
          })
          return
        }

        // Check if all checkpoints have names and valid points
        const invalidCheckpoint = checkpoints.find((cp) => !cp.name.trim() || isNaN(cp.points) || cp.points <= 0)

        if (invalidCheckpoint) {
          toast({
            title: "Error",
            description: "All checkpoints must have names and valid points",
            variant: "destructive",
          })
          return
        }

        const totalPoints = checkpoints.reduce((sum, cp) => sum + cp.points, 0)
        success = await onAddChallenge(challengeName, challengeDescription, challengeType, totalPoints, 0, checkpoints)
      }

      if (success) {
        // Reset form
        setChallengeName("")
        setChallengeDescription("")
        setChallengeType("non-interactive")
        setChallengePoints("")
        setChallengePenaltyPoints("")
        setCheckpointsCount("3")
        setCheckpoints([
          { id: "new-1", name: "Checkpoint 1", points: 100 },
          { id: "new-2", name: "Checkpoint 2", points: 200 },
          { id: "new-3", name: "Checkpoint 3", points: 300 },
        ])

        toast({
          title: "Challenge added",
          description: `Added ${challengeName}`,
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to add challenge",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding challenge:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle checkpoint selection
  const toggleCheckpoint = (checkpointId: string) => {
    setSelectedCheckpoints((prev) => {
      if (prev.includes(checkpointId)) {
        return prev.filter((id) => id !== checkpointId)
      } else {
        return [...prev, checkpointId]
      }
    })
  }

  // Calculate total points for selected checkpoints
  const calculateSelectedPoints = () => {
    if (!selectedChallenge?.checkpoints) return 0

    return selectedChallenge.checkpoints
      .filter((cp) => selectedCheckpoints.includes(cp.id))
      .reduce((sum, cp) => sum + cp.points, 0)
  }

  return (
    <div className="grid gap-6">
      <Tabs defaultValue="mark-solved">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="mark-solved">Interactive Challenges</TabsTrigger>
          <TabsTrigger value="add-submission">Challenge Submissions</TabsTrigger>
          <TabsTrigger value="submissions">View Submissions</TabsTrigger>
          <TabsTrigger value="add-challenge">Add Challenge</TabsTrigger>
          <TabsTrigger value="add-team">Add Team</TabsTrigger>
        </TabsList>

        <TabsContent value="mark-solved">
          <Card>
            <CardHeader>
              <CardTitle>Mark Interactive Challenge as Solved</CardTitle>
              <CardDescription>
                Select a team and an interactive challenge to mark checkpoints as solved
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team">Team</Label>
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
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
                <Select value={selectedChallengeId} onValueChange={setSelectedChallengeId}>
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

              {selectedChallenge?.type === "interactive" && selectedChallenge.checkpoints && (
                <div className="space-y-2 pt-2 border p-4 rounded-md">
                  <Label className="mb-2 block">Select completed checkpoints:</Label>
                  <div className="space-y-2">
                    {selectedChallenge.checkpoints.map((checkpoint) => (
                      <div key={checkpoint.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={checkpoint.id}
                          checked={selectedCheckpoints.includes(checkpoint.id)}
                          onCheckedChange={() => toggleCheckpoint(checkpoint.id)}
                        />
                        <Label htmlFor={checkpoint.id} className="flex-1">
                          {checkpoint.name}
                        </Label>
                        <span className="text-sm font-medium">{checkpoint.points} pts</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-sm">
                    <span className="font-medium">Total points selected:</span> {calculateSelectedPoints()} of{" "}
                    {calculateTotalChallengePoints(selectedChallenge)}
                  </div>
                </div>
              )}

              {selectedChallenge?.type === "non-interactive" && selectedChallenge && (
                <div className="pt-2">
                  <p className="text-sm mb-2">
                    <span className="font-medium">Challenge points:</span> {selectedChallenge.points}
                  </p>
                  {selectedChallenge.penaltyPoints > 0 && (
                    <p className="text-sm text-orange-600">
                      <span className="font-medium">Penalty per wrong submission:</span> -
                      {selectedChallenge.penaltyPoints} points
                    </p>
                  )}
                </div>
              )}

              <Button onClick={handleMarkSolved} className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Mark Checkpoints as Solved"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add-submission">
          <Card>
            <CardHeader>
              <CardTitle>Add Challenge Submission</CardTitle>
              <CardDescription>Record a team's submission for a non-interactive challenge</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddSubmission} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="submission-team">Team</Label>
                  <Select value={submissionTeamId} onValueChange={setSubmissionTeamId}>
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
                  <Select value={submissionChallengeId} onValueChange={setSubmissionChallengeId}>
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

                <div className="space-y-2">
                  <Label htmlFor="submission-text">Submission</Label>
                  <Textarea
                    id="submission-text"
                    placeholder="Enter the team's submission (e.g., flag{example})"
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="submission-correct"
                    checked={submissionIsCorrect}
                    onCheckedChange={(checked) => setSubmissionIsCorrect(checked as boolean)}
                  />
                  <Label htmlFor="submission-correct">This submission is correct</Label>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Submission"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions">
          <SubmissionTracker />
        </TabsContent>

        <TabsContent value="add-challenge">
          <Card>
            <CardHeader>
              <CardTitle>Add New Challenge</CardTitle>
              <CardDescription>Create a new challenge with points and penalty system</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddChallenge} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="challenge-name">Challenge Name</Label>
                  <Input
                    id="challenge-name"
                    value={challengeName}
                    onChange={(e) => setChallengeName(e.target.value)}
                    placeholder="Enter challenge name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="challenge-description">Description</Label>
                  <Input
                    id="challenge-description"
                    value={challengeDescription}
                    onChange={(e) => setChallengeDescription(e.target.value)}
                    placeholder="Enter challenge description"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Challenge Type</Label>
                  <RadioGroup
                    value={challengeType}
                    onValueChange={(value) => setChallengeType(value as ChallengeType)}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="non-interactive" id="non-interactive" />
                      <Label htmlFor="non-interactive">Non-Interactive</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="interactive" id="interactive" />
                      <Label htmlFor="interactive">Interactive</Label>
                    </div>
                  </RadioGroup>
                </div>

                {challengeType === "non-interactive" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="challenge-points">Points</Label>
                      <Input
                        id="challenge-points"
                        type="number"
                        value={challengePoints}
                        onChange={(e) => setChallengePoints(e.target.value)}
                        placeholder="Enter points value"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="challenge-penalty-points">Penalty Points per Wrong Submission</Label>
                      <Input
                        id="challenge-penalty-points"
                        type="number"
                        value={challengePenaltyPoints}
                        onChange={(e) => setChallengePenaltyPoints(e.target.value)}
                        placeholder="Enter penalty points (0 for no penalty)"
                      />
                      <p className="text-xs text-muted-foreground">
                        Penalty points are only deducted if the team eventually solves the challenge
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="checkpoints-count">Number of Checkpoints</Label>
                      <Input
                        id="checkpoints-count"
                        type="number"
                        min="1"
                        max="10"
                        value={checkpointsCount}
                        onChange={(e) => setCheckpointsCount(e.target.value)}
                        placeholder="Enter number of checkpoints"
                      />
                    </div>

                    <div className="space-y-4 border p-4 rounded-md">
                      <Label>Checkpoint Details</Label>
                      {checkpoints.map((checkpoint, index) => (
                        <div key={index} className="grid grid-cols-3 gap-2 items-center">
                          <Input
                            value={checkpoint.name}
                            onChange={(e) => handleCheckpointChange(index, "name", e.target.value)}
                            placeholder={`Checkpoint ${index + 1} name`}
                            className="col-span-2"
                          />
                          <div className="flex items-center">
                            <Input
                              type="number"
                              value={checkpoint.points}
                              onChange={(e) =>
                                handleCheckpointChange(index, "points", Number.parseInt(e.target.value) || 0)
                              }
                              placeholder="Points"
                              className="w-full"
                            />
                            <span className="ml-2">pts</span>
                          </div>
                        </div>
                      ))}
                      <div className="text-sm text-right font-medium">
                        Total: {checkpoints.reduce((sum, cp) => sum + cp.points, 0)} points
                      </div>
                    </div>
                  </>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : "Add Challenge"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add-team">
          <AddTeamForm onAddTeam={onAddTeam} />
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Challenge Overview</CardTitle>
          <CardDescription>All available challenges with penalty information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {challenges.map((challenge) => (
              <div key={challenge.id} className="p-3 rounded-lg bg-muted/50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{challenge.name}</h3>
                      <span className="text-xs bg-muted-foreground/20 px-2 py-0.5 rounded-full">
                        {challenge.type === "interactive" ? "Interactive" : "Non-Interactive"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{challenge.description}</p>
                    {challenge.type === "non-interactive" && challenge.penaltyPoints > 0 && (
                      <p className="text-xs text-orange-600 mt-1">
                        Penalty: -{challenge.penaltyPoints} points per wrong submission (if solved)
                      </p>
                    )}
                    {challenge.type === "interactive" && challenge.checkpoints && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">Checkpoints:</p>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          {challenge.checkpoints.map((checkpoint) => (
                            <div key={checkpoint.id} className="text-xs flex justify-between">
                              <span>{checkpoint.name}</span>
                              <span className="font-medium">{checkpoint.points} pts</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="font-semibold">{challenge.points} pts</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
