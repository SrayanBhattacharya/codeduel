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
  const [generating, setGenerating] = useState(false)
  const [difficulty, setDifficulty] = useState("medium")

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

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    try {
      const response = await axiosInstance.post(
        `/api/rooms/${code}/rounds/generate?difficulty=${difficulty}`
      )
      setProblemTitle(response.data.title)
      setProblemDescription(response.data.description)
      setTestCases(
        response.data.testCases.map(
          (tc: { input: string; output: string }) => ({
            input: tc.input,
            expectedOutput: tc.output,
          })
        )
      )
    } catch {
      setError("Failed to generate question. Please try again.")
    } finally {
      setGenerating(false)
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
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="hacker-grid" />

      {/* Navbar */}
      <div className="relative z-10 flex items-center justify-between border-b border-border bg-card/50 px-6 py-4 backdrop-blur-sm">
        <h1 className="text-xl font-bold tracking-tight text-primary">
          CodeDuel
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-sm tracking-widest text-muted-foreground">
            $ room_code:
          </span>
          <span
            className="cursor-pointer bg-primary/10 px-3 py-1 font-mono font-bold tracking-widest text-primary transition hover:bg-primary/20"
            onClick={() => navigator.clipboard.writeText(code!)}
            title="Click to copy"
          >
            {code}
          </span>
        </div>
      </div>

      <div className="relative z-10 mx-auto flex max-w-5xl gap-6 px-4 py-8">
        {/* Left — Participants */}
        <div className="w-64 flex-shrink-0">
          <div className="hacker-panel">
            {[
              "top-[-1px] left-[-1px] border-t border-l",
              "top-[-1px] right-[-1px] border-t border-r",
              "bottom-[-1px] left-[-1px] border-b border-l",
              "bottom-[-1px] right-[-1px] border-b border-r",
            ].map((cls, i) => (
              <div key={i} className={`hacker-corner ${cls}`} />
            ))}
            <h2 className="mb-4 text-sm font-semibold tracking-widest text-muted-foreground">
              $ PLAYERS ({room?.participants.length}/{room?.maxPlayers})
            </h2>
            <ul className="flex flex-col gap-2">
              {room?.participants.map((p) => (
                <li
                  key={p.username}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm font-medium text-foreground">
                    {p.username}
                  </span>
                  {p.role === "ROLE_HOST" && (
                    <span className="border border-primary px-2 py-0.5 text-xs text-primary">
                      HOST
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
            <div className="hacker-panel flex flex-col gap-6">
              {[
                "top-[-1px] left-[-1px] border-t border-l",
                "top-[-1px] right-[-1px] border-t border-r",
                "bottom-[-1px] left-[-1px] border-b border-l",
                "bottom-[-1px] right-[-1px] border-b border-r",
              ].map((cls, i) => (
                <div key={i} className={`hacker-corner ${cls}`} />
              ))}
              <h2 className="text-lg font-semibold tracking-wide text-primary">
                SET_UP_ROUND
              </h2>

              <div className="flex items-center gap-3">
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="rounded-sm border border-border bg-input px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="easy">easy</option>
                  <option value="medium">medium</option>
                  <option value="hard">hard</option>
                </select>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="hacker-btn-secondary flex-1"
                >
                  {generating ? "GENERATING..." : "⚡ GENERATE_WITH_AI"}
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-muted-foreground">
                  $ problem_title
                </label>
                <input
                  type="text"
                  value={problemTitle}
                  onChange={(e) => setProblemTitle(e.target.value)}
                  className="rounded-sm border border-border bg-input px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                  placeholder="e.g. Two Sum"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-muted-foreground">
                  $ problem_description
                </label>
                <textarea
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  className="min-h-32 resize-y rounded-sm border border-border bg-input px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                  placeholder="Describe the problem..."
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-muted-foreground">
                  $ time_limit
                </label>
                <select
                  value={timeLimitSeconds}
                  onChange={(e) => setTimeLimitSeconds(Number(e.target.value))}
                  className="rounded-sm border border-border bg-input px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
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
                  <label className="text-sm font-medium text-muted-foreground">
                    $ test_cases
                  </label>
                  <button
                    onClick={addTestCase}
                    className="text-xs font-bold tracking-widest text-primary hover:underline"
                  >
                    + ADD_CASE
                  </button>
                </div>

                {testCases.map((tc, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 rounded-sm border border-border bg-input/50 p-3"
                  >
                    <div className="flex flex-1 flex-col gap-2">
                      <input
                        type="text"
                        value={tc.input}
                        onChange={(e) =>
                          updateTestCase(index, "input", e.target.value)
                        }
                        className="rounded-sm border border-border bg-input px-3 py-1.5 font-mono text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                        placeholder="INPUT"
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
                        className="rounded-sm border border-border bg-input px-3 py-1.5 font-mono text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                        placeholder="EXPECTED_OUTPUT"
                      />
                    </div>
                    {testCases.length > 1 && (
                      <button
                        onClick={() => removeTestCase(index)}
                        className="mt-1 text-sm text-destructive hover:opacity-70"
                      >
                        [X]
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <button
                onClick={handleStart}
                disabled={starting}
                className="hacker-btn-primary mt-4"
              >
                {starting ? "INITIALIZING..." : "START_GAME"}
              </button>
            </div>
          ) : (
            <div className="hacker-panel flex h-full items-center justify-center">
              {[
                "top-[-1px] left-[-1px] border-t border-l",
                "top-[-1px] right-[-1px] border-t border-r",
                "bottom-[-1px] left-[-1px] border-b border-l",
                "bottom-[-1px] right-[-1px] border-b border-r",
              ].map((cls, i) => (
                <div key={i} className={`hacker-corner ${cls}`} />
              ))}
              <div className="text-center">
                <p className="animate-pulse text-lg font-bold tracking-widest text-primary">
                  <span className="text-muted-foreground">&gt;</span>{" "}
                  WAITING_FOR_HOST...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
