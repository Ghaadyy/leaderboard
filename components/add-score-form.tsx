"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface AddScoreFormProps {
  onAddTeam: (name: string) => void
}

export function AddScoreForm({ onAddTeam }: AddScoreFormProps) {
  const [name, setName] = useState("")
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
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

    // Add the team
    onAddTeam(name)

    // Reset form
    setName("")

    // Show success message
    toast({
      title: "Team added",
      description: `Added ${name} to the leaderboard`,
    })
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
          <Button type="submit" className="w-full">
            Add Team
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
