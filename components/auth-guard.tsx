"use client"

import type React from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface AuthGuardProps {
  children: React.ReactNode
  requireAdmin?: boolean
  fallbackUrl?: string
}

export function AuthGuard({ children, requireAdmin = false, fallbackUrl = "/login" }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push(fallbackUrl)
      return
    }

    if (requireAdmin && user.role !== "admin") {
      router.push("/")
      return
    }
  }, [user, loading, router, requireAdmin, fallbackUrl])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (requireAdmin && user.role !== "admin") {
    return null
  }

  return <>{children}</>
}
