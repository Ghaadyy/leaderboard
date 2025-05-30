import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { LeaderboardEntry } from "@/types/types"

interface LeaderboardProps {
  data: LeaderboardEntry[]
}

export function Leaderboard({ data }: LeaderboardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Column Headers */}
          <div className="flex items-center justify-between px-3 pb-2 border-b">
            <div className="flex items-center gap-4">
              <div className="w-8"></div>
              <div className="font-medium">Team</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right min-w-16">
                <div className="text-sm font-medium">Challenges</div>
              </div>
              <div className="text-right min-w-20">
                <div className="text-sm font-medium">Score</div>
              </div>
            </div>
          </div>

          {/* Leaderboard Entries */}
          {data.map((entry, index) => (
            <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 text-sm font-medium">
                  {index === 0 ? (
                    <Trophy className="h-6 w-6 text-yellow-500" />
                  ) : index === 1 ? (
                    <Trophy className="h-6 w-6 text-gray-400" />
                  ) : index === 2 ? (
                    <Trophy className="h-6 w-6 text-amber-700" />
                  ) : (
                    <span className="text-muted-foreground">{index + 1}</span>
                  )}
                </div>
                <div className="font-medium">{entry.name}</div>
              </div>
              <div className="flex items-center gap-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-right min-w-16">
                        <div className="font-medium">{entry.challengesSolved}</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Challenges completed</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="text-right min-w-20">
                  <div className="font-semibold">{entry.score.toLocaleString()}</div>
                </div>
              </div>
            </div>
          ))}

          {data.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">No scores yet. Be the first to add one!</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
