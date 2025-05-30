"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface AddTeamFormProps {
  onAddTeam: (name: string) => Promise<boolean>
}

export function AddTeamForm({ onAddTeam }: AddTeamFormProps) {
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate inputs
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a team name",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Add the team
      const success = await onAddTeam(name)

      if (success) {
        // Reset form
        setName("")

        // Show success message
        toast({
          title: "Team added",
          description: `Added ${name} to the leaderboard`,
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Team</CardTitle>
        <CardDescription>Enter a team name to add to the leaderboard</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Team Name</Label>
            <Input id="name" placeholder="Enter team name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Team"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
