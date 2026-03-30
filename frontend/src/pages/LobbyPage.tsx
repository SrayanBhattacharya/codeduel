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
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="hacker-grid" />
      
      {/* Navbar */}
      <div className="relative z-10 flex items-center justify-between border-b border-border bg-card/50 px-6 py-4 backdrop-blur-sm">
        <h1 className="text-xl font-bold tracking-tight text-primary">CodeDuel</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm tracking-widest text-muted-foreground">
            <span className="text-foreground">~/{user?.username}</span> $
          </span>
          <button
            onClick={handleLogout}
            className="hacker-btn-secondary py-1.5 px-4 text-xs"
          >
            LOGOUT
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-6 px-4 py-16">
        <div className="text-center">
          <p className="mb-2 text-sm tracking-widest text-primary">
            <span className="text-muted-foreground">~/codeduel $</span> ./start.sh
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">SELECT_MODE</h2>
        </div>

        <div className="flex w-full max-w-2xl gap-4">
          {/* Create Room */}
          <div className="hacker-panel flex flex-1 flex-col gap-4">
            {[
              "top-[-1px] left-[-1px] border-t border-l",
              "top-[-1px] right-[-1px] border-t border-r",
              "bottom-[-1px] left-[-1px] border-b border-l",
              "bottom-[-1px] right-[-1px] border-b border-r",
            ].map((cls, i) => (
              <div key={i} className={`hacker-corner ${cls}`} />
            ))}
            <h3 className="text-lg font-semibold tracking-wide text-foreground">CREATE ROOM</h3>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-muted-foreground">$ max_players</label>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="rounded-sm border border-border bg-input px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
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
              className="hacker-btn-primary mt-auto"
            >
              {createLoading ? "CREATING..." : "CREATE"}
            </button>
          </div>

          {/* Join Room */}
          <div className="hacker-panel flex flex-1 flex-col gap-4">
            {[
              "top-[-1px] left-[-1px] border-t border-l",
              "top-[-1px] right-[-1px] border-t border-r",
              "bottom-[-1px] left-[-1px] border-b border-l",
              "bottom-[-1px] right-[-1px] border-b border-r",
            ].map((cls, i) => (
              <div key={i} className={`hacker-corner ${cls}`} />
            ))}
            <h3 className="text-lg font-semibold tracking-wide text-foreground">JOIN ROOM</h3>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-muted-foreground">$ room_code</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="rounded-sm border border-border bg-input px-3 py-2 font-mono text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                placeholder="Enter room code"
              />
            </div>

            {joinError && (
              <p className="text-sm text-destructive">{joinError}</p>
            )}

            <button
              onClick={handleJoin}
              disabled={joinLoading || roomCode.trim() === ""}
              className="hacker-btn-primary mt-auto"
            >
              {joinLoading ? "JOINING..." : "JOIN"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
