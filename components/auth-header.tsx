"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LogOut, User } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"

export function AuthHeader() {
  const { user, logout, loading } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  if (loading) {
    return <div className="w-20 h-8 bg-muted animate-pulse rounded" />
  }

  if (!user) {
    return (
      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/login">Sign In</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/register">Sign Up</Link>
        </Button>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <User className="mr-2 h-4 w-4" />
          {user.username}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled>
          <div className="flex flex-col">
            <span className="font-medium">{user.username}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
            <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
