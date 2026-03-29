// src/pages/RoomPage.tsx

import axiosInstance from "@/api/axiosInstance"
import { useAuth } from "@/context/AuthContext"
import type { Room, Round } from "@/types"
import { Client } from "@stomp/stompjs"
import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import SockJS from "sockjs-client"

export default function RoomPage() {
  const { code } = useParams<{ code: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [problemTitle, setProblemTitle] = useState("")
  const [problemDescription, setProblemDescription] = useState("")
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(300)
  const [testCases, setTestCases] = useState([
    { input: "", expectedOutput: "" },
  ])

  const isHostRef = useRef(false)

  const isHost = room?.participants.some(
    (p) => p.username === user?.username && p.role === "ROLE_HOST"
  )

  useEffect(() => {
    isHostRef.current = isHost ?? false
  }, [isHost])

  // Fetch room on load
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await axiosInstance.get(`/api/rooms/${code}`)
        setRoom(response.data)
      } catch {
        setError("Room not found")
      } finally {
        setLoading(false)
      }
    }
    fetchRoom()
  }, [code])

  // WebSocket
  useEffect(() => {
    const token = localStorage.getItem("token")
    const client = new Client({
      webSocketFactory: () =>
        new SockJS(`${import.meta.env.VITE_API_BASE_URL}/websocket`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        // Live participant updates
        client.subscribe(`/topic/rooms/${code}/participants`, (message) => {
          const updatedRoom: Room = JSON.parse(message.body)
          setRoom(updatedRoom)
        })

        // Round started
        client.subscribe(`/topic/rooms/${code}/round-started`, (message) => {
          const round: Round = JSON.parse(message.body)
          if (isHostRef.current) {
            navigate(`/leaderboard/${code}`)
          } else {
            navigate(`/game/${code}`, { state: { round } })
          }
        })
      },
    })

    client.activate()
    return () => {
      client.deactivate()
    }
  }, [code, navigate])

  // Test case helpers
  const addTestCase = () => {
    setTestCases([...testCases, { input: "", expectedOutput: "" }])
  }

  const removeTestCase = (index: number) => {
    setTestCases(testCases.filter((_, i) => i !== index))
  }

  const updateTestCase = (
    index: number,
    field: "input" | "expectedOutput",
    value: string
  ) => {
    const updated = [...testCases]
    updated[index][field] = value
    setTestCases(updated)
  }

  // Start game
  const handleStart = async () => {
    if (
      !problemTitle ||
      !problemDescription ||
      testCases.some((tc) => !tc.input || !tc.expectedOutput)
    ) {
      setError("Please fill in all fields and test cases")
      return
    }

    setStarting(true)
    setError(null)

    try {
      const roundResponse = await axiosInstance.post(
        `/api/rooms/${code}/rounds`,
        {
          problemTitle,
          problemDescription,
          timeLimitSeconds,
          testCases,
        }
      )
      await axiosInstance.post(
        `/api/rooms/${code}/rounds/${roundResponse.data.id}/start`
      )
    } catch {
      setError("Failed to start the game. Please try again.")
      setStarting(false)
    }
  }

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading room...</p>
      </div>
    )

  if (error && !room)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-destructive">{error}</p>
      </div>
    )

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h1 className="text-xl font-bold">CodeDuel</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Room Code:</span>
          <span
            className="cursor-pointer rounded-lg bg-accent px-3 py-1 font-mono font-bold tracking-widest transition hover:opacity-80"
            onClick={() => navigator.clipboard.writeText(code!)}
            title="Click to copy"
          >
            {code}
          </span>
        </div>
      </div>

      <div className="mx-auto flex max-w-5xl gap-6 px-4 py-8">
        {/* Left — Participants */}
        <div className="w-64 flex-shrink-0">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h2 className="mb-4 font-semibold">
              Players ({room?.participants.length}/{room?.maxPlayers})
            </h2>
            <ul className="flex flex-col gap-2">
              {room?.participants.map((p) => (
                <li
                  key={p.username}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm font-medium">{p.username}</span>
                  {p.role === "ROLE_HOST" && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      Host
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right — Host form or waiting message */}
        <div className="flex-1">
          {isHost ? (
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Set Up Round</h2>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Problem Title</label>
                <input
                  type="text"
                  value={problemTitle}
                  onChange={(e) => setProblemTitle(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2 focus:ring-2 focus:ring-ring focus:outline-none"
                  placeholder="e.g. Two Sum"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">
                  Problem Description
                </label>
                <textarea
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  className="min-h-32 resize-y rounded-lg border border-border bg-background px-3 py-2 focus:ring-2 focus:ring-ring focus:outline-none"
                  placeholder="Describe the problem..."
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Time Limit</label>
                <select
                  value={timeLimitSeconds}
                  onChange={(e) => setTimeLimitSeconds(Number(e.target.value))}
                  className="rounded-lg border border-border bg-background px-3 py-2 focus:ring-2 focus:ring-ring focus:outline-none"
                >
                  {[60, 120, 180, 300, 600].map((t) => (
                    <option key={t} value={t}>
                      {t / 60} {t < 120 ? "minute" : "minutes"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Test Cases */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Test Cases</label>
                  <button
                    onClick={addTestCase}
                    className="text-xs text-primary hover:underline"
                  >
                    + Add Test Case
                  </button>
                </div>

                {testCases.map((tc, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 rounded-lg border border-border p-3"
                  >
                    <div className="flex flex-1 flex-col gap-2">
                      <input
                        type="text"
                        value={tc.input}
                        onChange={(e) =>
                          updateTestCase(index, "input", e.target.value)
                        }
                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                        placeholder="Input"
                      />
                      <input
                        type="text"
                        value={tc.expectedOutput}
                        onChange={(e) =>
                          updateTestCase(
                            index,
                            "expectedOutput",
                            e.target.value
                          )
                        }
                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                        placeholder="Expected Output"
                      />
                    </div>
                    {testCases.length > 1 && (
                      <button
                        onClick={() => removeTestCase(index)}
                        className="text-sm text-destructive hover:opacity-70"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <button
                onClick={handleStart}
                disabled={starting}
                className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {starting ? "Starting..." : "Start Game"}
              </button>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="text-center">
                <p className="text-lg font-medium">
                  Waiting for host to start the game...
                </p>
                <p className="mt-2 text-sm text-muted-foreground">Sit tight!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
