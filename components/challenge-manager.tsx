"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Plus, Trophy } from "lucide-react"
import type { Challenge, ChallengeType, Checkpoint } from "@/types/types"

interface ChallengeManagerProps {
  challenges: Challenge[]
  onAddChallenge: (
    name: string,
    description: string,
    type: ChallengeType,
    points: number,
    penaltyPoints: number,
    checkpoints?: Checkpoint[],
  ) => Promise<boolean>
  onUpdateChallenge: (
    challengeId: string,
    name: string,
    description: string,
    type: ChallengeType,
    points: number,
    penaltyPoints: number,
    checkpoints?: Checkpoint[],
  ) => Promise<boolean>
  onDeleteChallenge: (challengeId: string) => Promise<boolean>
}

export function ChallengeManager({
  challenges,
  onAddChallenge,
  onUpdateChallenge,
  onDeleteChallenge,
}: ChallengeManagerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  // Form state
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

  // Update checkpoints when count changes
  useEffect(() => {
    const count = Number.parseInt(checkpointsCount) || 3
    if (count > 0) {
      const newCheckpoints: Checkpoint[] = []
      for (let i = 0; i < count; i++) {
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

  const resetForm = () => {
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
  }

  const loadChallengeToForm = (challenge: Challenge) => {
    setChallengeName(challenge.name)
    setChallengeDescription(challenge.description)
    setChallengeType(challenge.type)
    setChallengePoints(challenge.points.toString())
    setChallengePenaltyPoints(challenge.penaltyPoints.toString())

    if (challenge.type === "interactive" && challenge.checkpoints) {
      setCheckpointsCount(challenge.checkpoints.length.toString())
      setCheckpoints(
        challenge.checkpoints.map((cp, index) => ({
          id: `edit-${index + 1}`,
          name: cp.name,
          points: cp.points,
        })),
      )
    }
  }

  const handleCheckpointChange = (index: number, field: keyof Checkpoint, value: string | number) => {
    const updatedCheckpoints = [...checkpoints]
    updatedCheckpoints[index] = {
      ...updatedCheckpoints[index],
      [field]: value,
    }
    setCheckpoints(updatedCheckpoints)
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
        if (checkpoints.length === 0) {
          toast({
            title: "Error",
            description: "Please add at least one checkpoint",
            variant: "destructive",
          })
          return
        }

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
        resetForm()
        setShowAddDialog(false)
        toast({
          title: "Challenge added",
          description: `Added ${challengeName} successfully`,
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

  const handleEditChallenge = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingChallenge || !challengeName.trim()) {
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

        success = await onUpdateChallenge(
          editingChallenge.id,
          challengeName,
          challengeDescription,
          challengeType,
          points,
          penaltyPoints,
        )
      } else {
        if (checkpoints.length === 0) {
          toast({
            title: "Error",
            description: "Please add at least one checkpoint",
            variant: "destructive",
          })
          return
        }

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
        success = await onUpdateChallenge(
          editingChallenge.id,
          challengeName,
          challengeDescription,
          challengeType,
          totalPoints,
          0,
          checkpoints,
        )
      }

      if (success) {
        setEditingChallenge(null)
        resetForm()
        setShowEditDialog(false)
        toast({
          title: "Challenge updated",
          description: `Updated ${editingChallenge.name} successfully`,
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to update challenge",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating challenge:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteChallenge = async (challenge: Challenge) => {
    setIsSubmitting(true)

    try {
      const success = await onDeleteChallenge(challenge.id)

      if (success) {
        toast({
          title: "Challenge deleted",
          description: `Deleted ${challenge.name} successfully`,
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to delete challenge",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting challenge:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (challenge: Challenge) => {
    setEditingChallenge(challenge)
    loadChallengeToForm(challenge)
    setShowEditDialog(true)
  }

  const openAddDialog = () => {
    resetForm()
    setShowAddDialog(true)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Challenge Management
              </CardTitle>
              <CardDescription>Add, edit, and delete challenges</CardDescription>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Challenge
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Challenge</DialogTitle>
                  <DialogDescription>Create a new challenge with points and penalty system</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddChallenge}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="add-challenge-name">Challenge Name</Label>
                      <Input
                        id="add-challenge-name"
                        value={challengeName}
                        onChange={(e) => setChallengeName(e.target.value)}
                        placeholder="Enter challenge name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="add-challenge-description">Description</Label>
                      <Input
                        id="add-challenge-description"
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
                          <RadioGroupItem value="non-interactive" id="add-non-interactive" />
                          <Label htmlFor="add-non-interactive">Non-Interactive</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="interactive" id="add-interactive" />
                          <Label htmlFor="add-interactive">Interactive</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {challengeType === "non-interactive" ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="add-challenge-points">Points</Label>
                          <Input
                            id="add-challenge-points"
                            type="number"
                            value={challengePoints}
                            onChange={(e) => setChallengePoints(e.target.value)}
                            placeholder="Enter points value"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="add-challenge-penalty-points">Penalty Points per Wrong Submission</Label>
                          <Input
                            id="add-challenge-penalty-points"
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
                          <Label htmlFor="add-checkpoints-count">Number of Checkpoints</Label>
                          <Input
                            id="add-checkpoints-count"
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
                  </div>
                  <DialogFooter className="mt-4">
                    <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Adding..." : "Add Challenge"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {challenges.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No challenges found. Add your first challenge to get started.
              </div>
            ) : (
              challenges.map((challenge) => (
                <div key={challenge.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{challenge.name}</h3>
                        <Badge variant={challenge.type === "interactive" ? "default" : "secondary"}>
                          {challenge.type === "interactive" ? "Interactive" : "Non-Interactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{challenge.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-medium">{challenge.points} points</span>
                        {challenge.type === "non-interactive" && challenge.penaltyPoints > 0 && (
                          <span className="text-orange-600">
                            -{challenge.penaltyPoints} penalty per wrong submission
                          </span>
                        )}
                      </div>
                      {challenge.type === "interactive" && challenge.checkpoints && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-1">Checkpoints:</p>
                          <div className="grid grid-cols-2 gap-1">
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
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(challenge)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Challenge</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{challenge.name}"? This will also delete all related
                              submissions and progress. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteChallenge(challenge)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Challenge</DialogTitle>
            <DialogDescription>Update the challenge details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditChallenge}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-challenge-name">Challenge Name</Label>
                <Input
                  id="edit-challenge-name"
                  value={challengeName}
                  onChange={(e) => setChallengeName(e.target.value)}
                  placeholder="Enter challenge name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-challenge-description">Description</Label>
                <Input
                  id="edit-challenge-description"
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
                    <RadioGroupItem value="non-interactive" id="edit-non-interactive" />
                    <Label htmlFor="edit-non-interactive">Non-Interactive</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="interactive" id="edit-interactive" />
                    <Label htmlFor="edit-interactive">Interactive</Label>
                  </div>
                </RadioGroup>
              </div>

              {challengeType === "non-interactive" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="edit-challenge-points">Points</Label>
                    <Input
                      id="edit-challenge-points"
                      type="number"
                      value={challengePoints}
                      onChange={(e) => setChallengePoints(e.target.value)}
                      placeholder="Enter points value"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-challenge-penalty-points">Penalty Points per Wrong Submission</Label>
                    <Input
                      id="edit-challenge-penalty-points"
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
                    <Label htmlFor="edit-checkpoints-count">Number of Checkpoints</Label>
                    <Input
                      id="edit-checkpoints-count"
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
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Challenge"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
