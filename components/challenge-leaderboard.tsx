import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, Users } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import type { ChallengeStats } from "@/types/types"

interface ChallengeLeaderboardProps {
  data: ChallengeStats[]
}

export function ChallengeLeaderboard({ data }: ChallengeLeaderboardProps) {
  // Sort challenges by completion percentage (highest first)
  const sortedData = [...data].sort((a, b) => b.completionPercentage - a.completionPercentage)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Challenge Completion</CardTitle>
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="h-4 w-4 mr-1" />
          <span>Total Teams: {data.length > 0 ? data[0].totalTeams : 0}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Column Headers */}
          <div className="flex items-center justify-between px-3 pb-2 border-b">
            <div className="font-medium">Challenge</div>
            <div className="flex items-center gap-4">
              <div className="text-right min-w-16">
                <div className="text-sm font-medium">Solved By</div>
              </div>
              <div className="text-right min-w-20">
                <div className="text-sm font-medium">Completion</div>
              </div>
            </div>
          </div>

          {/* Challenge Entries */}
          {sortedData.map((challenge) => (
            <div key={challenge.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 flex-1 max-w-[50%]">
                <Award
                  className={`h-5 w-5 ${challenge.completionPercentage >= 75 ? "text-yellow-500" : challenge.completionPercentage >= 50 ? "text-blue-500" : "text-muted-foreground"}`}
                />
                <div>
                  <div className="font-medium truncate">{challenge.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {challenge.type === "interactive" ? "Interactive" : "Non-Interactive"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-right min-w-16">
                        <div className="font-medium">{challenge.solvedCount}</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {challenge.solvedCount} of {challenge.totalTeams} teams
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="min-w-[120px]">
                  <div className="flex items-center gap-2">
                    <Progress value={challenge.completionPercentage} className="h-2" />
                    <span className="text-sm font-medium w-10">{challenge.completionPercentage}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {data.length === 0 && <div className="text-center py-6 text-muted-foreground">No challenges available</div>}
        </div>
      </CardContent>
    </Card>
  )
}
