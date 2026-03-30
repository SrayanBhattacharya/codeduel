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
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="hacker-grid" />

      {/* Navbar */}
      <div className="relative z-10 flex items-center justify-between border-b border-border bg-card/50 px-6 py-4 backdrop-blur-sm">
        <h1 className="text-xl font-bold tracking-tight text-primary">CodeDuel</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm tracking-widest text-muted-foreground">$ room:</span>
          <span className="font-mono font-bold text-foreground">{code}</span>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-lg px-4 py-12">
        <h2 className="mb-2 text-center text-3xl font-bold tracking-tight text-foreground">&gt; VIEW_LEADERBOARD</h2>
        <p className="mb-8 text-center text-sm font-mono tracking-widest text-muted-foreground">
          // ROUND_FINISHED : FINAL_SCORES
        </p>

        {error && (
          <p className="mb-4 text-center text-sm text-destructive">{error}</p>
        )}

        <div className="flex flex-col gap-3">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.username}
              className={`flex items-center justify-between rounded-sm border px-6 py-4 transition ${entry.username === user?.username ? "border-primary bg-primary/10" : "border-border bg-input/50"} ${index === 0 ? "scale-105 shadow-[0_0_15px_rgba(0,255,136,0.1)]" : ""} `}
            >
              <div className="flex items-center gap-4">
                <span className="w-8 text-center font-mono text-xl text-primary">
                  {getRankEmoji(index)}
                </span>
                <span className="font-medium font-mono text-foreground">
                  {entry.username}
                  {entry.username === user?.username && (
                    <span className="ml-2 text-xs tracking-widest text-primary">(YOU)</span>
                  )}
                </span>
              </div>
              <span className="font-mono text-lg font-bold text-foreground">
                {entry.totalScore} pts
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 hidden justify-center">
          {/* Kept hidden just in case it was used for single button layout */}
          <button
            onClick={() => navigate(`/room/${code}`)}
            className="hacker-btn-primary"
          >
            NEXT_ROUND
          </button>
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => navigate("/lobby")}
            className="hacker-btn-secondary"
          >
            &lt; LOBBY
          </button>
          <button
            onClick={() => navigate(`/room/${code}`)}
            className="hacker-btn-primary"
          >
            NEXT_ROUND &gt;
          </button>
        </div>
      </div>
    </div>
  )
}
