"use client"

import type React from "react"

import { useState } from "react"
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
import { Edit, Trash2, Plus, Users } from "lucide-react"
import type { Team } from "@/types/types"

interface TeamManagerProps {
  teams: Team[]
  onAddTeam: (name: string) => Promise<boolean>
  onUpdateTeam: (teamId: string, name: string) => Promise<boolean>
  onDeleteTeam: (teamId: string) => Promise<boolean>
}

export function TeamManager({ teams, onAddTeam, onUpdateTeam, onDeleteTeam }: TeamManagerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [newTeamName, setNewTeamName] = useState("")
  const [editTeamName, setEditTeamName] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const { toast } = useToast()

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newTeamName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a team name",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const success = await onAddTeam(newTeamName)

      if (success) {
        setNewTeamName("")
        setShowAddDialog(false)
        toast({
          title: "Team added",
          description: `Added ${newTeamName} successfully`,
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to add team",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding team:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditTeam = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingTeam || !editTeamName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a team name",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const success = await onUpdateTeam(editingTeam.id, editTeamName)

      if (success) {
        setEditingTeam(null)
        setEditTeamName("")
        setShowEditDialog(false)
        toast({
          title: "Team updated",
          description: `Updated ${editingTeam.name} successfully`,
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to update team",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating team:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTeam = async (team: Team) => {
    setIsSubmitting(true)

    try {
      const success = await onDeleteTeam(team.id)

      if (success) {
        toast({
          title: "Team deleted",
          description: `Deleted ${team.name} successfully`,
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to delete team",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting team:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (team: Team) => {
    setEditingTeam(team)
    setEditTeamName(team.name)
    setShowEditDialog(true)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Management
              </CardTitle>
              <CardDescription>Add, edit, and delete teams</CardDescription>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Team
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Team</DialogTitle>
                  <DialogDescription>Enter the name for the new team</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddTeam}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-team-name">Team Name</Label>
                      <Input
                        id="new-team-name"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        placeholder="Enter team name"
                      />
                    </div>
                  </div>
                  <DialogFooter className="mt-4">
                    <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Adding..." : "Add Team"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teams.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No teams found. Add your first team to get started.
              </div>
            ) : (
              teams.map((team) => (
                <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{team.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {team.solvedChallenges.length} challenge{team.solvedChallenges.length !== 1 ? "s" : ""} solved
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(team)}>
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
                          <AlertDialogTitle>Delete Team</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{team.name}"? This will also delete all their submissions
                            and progress. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteTeam(team)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>Update the team name</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditTeam}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-team-name">Team Name</Label>
                <Input
                  id="edit-team-name"
                  value={editTeamName}
                  onChange={(e) => setEditTeamName(e.target.value)}
                  placeholder="Enter team name"
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Team"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
