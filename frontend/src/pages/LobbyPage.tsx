// src/pages/LobbyPage.tsx

import axiosInstance from "@/api/axiosInstance"
import { useAuth } from "@/context/AuthContext"
import axios from "axios"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

export default function LobbyPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [maxPlayers, setMaxPlayers] = useState(2)
  const [roomCode, setRoomCode] = useState("")
  const [createError, setCreateError] = useState<string | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [createLoading, setCreateLoading] = useState(false)
  const [joinLoading, setJoinLoading] = useState(false)

  useEffect(() => {
    const leaveCurrentRoom = async () => {
      try {
        const response = await axiosInstance.get("/api/rooms/current")
        if (response.status === 200 && response.data.roomCode) {
          await axiosInstance.delete(
            `/api/rooms/${response.data.roomCode}/leave`
          )
        }
      } catch {
        // no active room, ignore
      }
    }
    leaveCurrentRoom()
  }, [])

  const handleCreate = async () => {
    setCreateError(null)
    setCreateLoading(true)
    try {
      const response = await axiosInstance.post("/api/rooms", { maxPlayers })
      navigate(`/room/${response.data.roomCode}`)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        setCreateError("Invalid room settings")
      } else {
        setCreateError("Something went wrong. Please try again.")
      }
    } finally {
      setCreateLoading(false)
    }
  }

  const handleJoin = async () => {
    setJoinError(null)
    setJoinLoading(true)
    try {
      await axiosInstance.post(`/api/rooms/${roomCode}/join`)
      navigate(`/room/${roomCode}`)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) setJoinError("Room not found")
        else if (err.response?.status === 409)
          setJoinError(err.response.data.message)
        else setJoinError("Something went wrong. Please try again.")
      }
    } finally {
      setJoinLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h1 className="text-xl font-bold">CodeDuel</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Welcome,{" "}
            <span className="font-medium text-foreground">
              {user?.username}
            </span>
          </span>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-border px-3 py-1.5 text-sm transition hover:bg-accent"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-col items-center justify-center gap-6 px-4 py-16">
        <h2 className="text-3xl font-bold">Ready to duel?</h2>
        <p className="text-muted-foreground">
          Create a room or join an existing one
        </p>

        <div className="flex w-full max-w-2xl gap-4">
          {/* Create Room */}
          <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Create Room</h3>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Max Players</label>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="rounded-lg border border-border bg-background px-3 py-2 focus:ring-2 focus:ring-ring focus:outline-none"
              >
                {[2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} players
                  </option>
                ))}
              </select>
            </div>

            {createError && (
              <p className="text-sm text-destructive">{createError}</p>
            )}

            <button
              onClick={handleCreate}
              disabled={createLoading}
              className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {createLoading ? "Creating..." : "Create Room"}
            </button>
          </div>

          {/* Join Room */}
          <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Join Room</h3>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Room Code</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="rounded-lg border border-border bg-background px-3 py-2 focus:ring-2 focus:ring-ring focus:outline-none"
                placeholder="Enter room code"
              />
            </div>

            {joinError && (
              <p className="text-sm text-destructive">{joinError}</p>
            )}

            <button
              onClick={handleJoin}
              disabled={joinLoading || roomCode.trim() === ""}
              className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {joinLoading ? "Joining..." : "Join Room"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
