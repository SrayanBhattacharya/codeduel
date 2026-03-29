// src/pages/LeaderboardPage.tsx

import axiosInstance from "@/api/axiosInstance"
import { useAuth } from "@/context/AuthContext"
import type { LeaderboardEntry } from "@/types"
import { Client } from "@stomp/stompjs"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import SockJS from "sockjs-client"

export default function LeaderboardPage() {
  const { code } = useParams<{ code: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axiosInstance.get(
          `/api/rooms/${code}/leaderboard`
        )
        setLeaderboard(response.data)
      } catch {
        setError("Failed to load leaderboard")
      } finally {
        setLoading(false)
      }
    }
    fetchLeaderboard()
  }, [code])

  // WebSocket — update leaderboard live
  useEffect(() => {
    const token = localStorage.getItem("token")
    const client = new Client({
      webSocketFactory: () =>
        new SockJS(`${import.meta.env.VITE_API_BASE_URL}/websocket`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        client.subscribe(`/topic/rooms/${code}/leaderboard`, (message) => {
          const updated: LeaderboardEntry[] = JSON.parse(message.body)
          setLeaderboard(updated)
        })
      },
    })
    client.activate()
    return () => {
      client.deactivate()
    }
  }, [code])

  const getRankEmoji = (index: number) => {
    if (index === 0) return "🥇"
    if (index === 1) return "🥈"
    if (index === 2) return "🥉"
    return `#${index + 1}`
  }

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading leaderboard...</p>
      </div>
    )

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h1 className="text-xl font-bold">CodeDuel</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Room:</span>
          <span className="font-mono font-bold">{code}</span>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-12">
        <h2 className="mb-2 text-center text-3xl font-bold">Leaderboard</h2>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Round finished — final scores
        </p>

        {error && (
          <p className="mb-4 text-center text-sm text-destructive">{error}</p>
        )}

        <div className="flex flex-col gap-3">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.username}
              className={`flex items-center justify-between rounded-2xl border px-6 py-4 shadow-sm transition ${entry.username === user?.username ? "border-primary bg-primary/5" : "border-border bg-card"} ${index === 0 ? "scale-105" : ""} `}
            >
              <div className="flex items-center gap-4">
                <span className="w-8 text-center text-xl">
                  {getRankEmoji(index)}
                </span>
                <span className="font-medium">
                  {entry.username}
                  {entry.username === user?.username && (
                    <span className="ml-2 text-xs text-primary">(you)</span>
                  )}
                </span>
              </div>
              <span className="font-mono text-lg font-bold">
                {entry.totalScore} pts
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate("/lobby")}
            className="rounded-lg bg-primary px-8 py-2.5 font-medium text-primary-foreground transition hover:opacity-90"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    </div>
  )
}
