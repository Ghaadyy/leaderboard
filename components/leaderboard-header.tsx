import { Medal } from "lucide-react"

export function LeaderboardHeader() {
  return (
    <div className="flex flex-col items-center justify-center text-center mb-8">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
        <Medal className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Team Leaderboard</h1>
      <p className="text-muted-foreground max-w-md">
        Track top teams by score and challenges solved. Add your team to see where you rank!
      </p>
    </div>
  )
}
