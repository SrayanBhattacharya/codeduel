// src/pages/GamePage.tsx

import axiosInstance from "@/api/axiosInstance"
import { useAuth } from "@/context/AuthContext"
import type { Round, Submission } from "@/types"
import Editor from "@monaco-editor/react"
import { Client } from "@stomp/stompjs"
import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import SockJS from "sockjs-client"

const SUPPORTED_LANGUAGES = [
  { label: "Python", value: "python" },
  { label: "Java", value: "java" },
  { label: "C", value: "c" },
  { label: "C++", value: "cpp" },
]

export default function GamePage() {
  const { code } = useParams<{ code: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [round, setRound] = useState<Round | null>(
    location.state?.round ?? null
  )
  const [language, setLanguage] = useState("python")
  const [editorCode, setEditorCode] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Fetch round if not passed via state (e.g. page refresh)
  useEffect(() => {
    if (round) {
      if (round.startedAt) {
        const elapsed = Math.floor(
          (Date.now() - new Date(round.startedAt).getTime()) / 1000
        )
        const remaining = Math.max(0, round.timeLimitSeconds - elapsed)
        setTimeLeft(remaining)
      } else {
        setTimeLeft(round.timeLimitSeconds)
      }
      return
    }
    const fetchRound = async () => {
      try {
        const response = await axiosInstance.get(`/api/rooms/${code}/rounds`)
        const rounds: Round[] = response.data
        const activeRound = rounds.find((r) => r.status === "ACTIVE")
        if (activeRound) {
          setRound(activeRound)
          if (activeRound.startedAt) {
            const elapsed = Math.floor(
              (Date.now() - new Date(activeRound.startedAt).getTime()) / 1000
            )
            const remaining = Math.max(
              0,
              activeRound.timeLimitSeconds - elapsed
            )
            setTimeLeft(remaining)
          } else {
            setTimeLeft(activeRound.timeLimitSeconds)
          }
        }
      } catch {
        setError("Failed to load round")
      }
    }
    fetchRound()
  }, [code, round])

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null) return
    if (timeLeft <= 0) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : null))
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [timeLeft])

  // WebSocket
  useEffect(() => {
    const token = localStorage.getItem("token")
    const client = new Client({
      webSocketFactory: () =>
        new SockJS(`${import.meta.env.VITE_API_BASE_URL}/websocket`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        client.subscribe(`/topic/rooms/${code}/round-finished`, () => {
          navigate(`/leaderboard/${code}`)
        })
      },
    })
    client.activate()
    return () => {
      client.deactivate()
    }
  }, [code, navigate])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0")
    const s = (seconds % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }

  const handleSubmit = async () => {
    if (!editorCode.trim()) {
      setError("Please write some code before submitting")
      return
    }
    if (!round) return

    setSubmitting(true)
    setError(null)
    setSubmission(null)

    try {
      const response = await axiosInstance.post(
        `/api/rooms/${code}/rounds/${round.id}/submit`,
        { language, code: editorCode }
      )
      setSubmission(response.data)
    } catch {
      setError("Submission failed. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (!round)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading round...</p>
      </div>
    )

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Navbar */}
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <h1 className="text-xl font-bold">CodeDuel</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {user?.username}
          </span>
          <div
            className={`font-mono text-lg font-bold ${timeLeft !== null && timeLeft <= 30 ? "text-destructive" : "text-foreground"}`}
          >
            {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — Problem */}
        <div className="w-96 flex-shrink-0 overflow-y-auto border-r border-border p-6">
          <h2 className="mb-2 text-xl font-bold">{round.problemTitle}</h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {round.problemDescription}
          </p>

          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold">Test Cases</h3>
            <div className="flex flex-col gap-3">
              {round.testCases.map((tc, index) => (
                <div
                  key={tc.id}
                  className="rounded-lg border border-border bg-card p-3"
                >
                  <p className="mb-1 text-xs text-muted-foreground">
                    Case {index + 1}
                  </p>
                  <p className="font-mono text-xs">
                    <span className="text-muted-foreground">Input:</span>{" "}
                    {tc.input}
                  </p>
                  <p className="font-mono text-xs">
                    <span className="text-muted-foreground">Expected:</span>{" "}
                    {tc.expectedOutput}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Submission result */}
          {submission && (
            <div
              className={`mt-6 rounded-lg border p-4 ${submission.testCasesPassed === submission.totalTestCases ? "border-green-500 bg-green-500/10" : "border-yellow-500 bg-yellow-500/10"}`}
            >
              <p className="font-semibold">
                {submission.testCasesPassed === submission.totalTestCases
                  ? "✅ All tests passed!"
                  : "⚠️ Partial pass"}
              </p>
              <p className="mt-1 text-sm">
                {submission.testCasesPassed}/{submission.totalTestCases} test
                cases passed
              </p>
              <p className="text-sm">+{submission.pointsEarned} points</p>
            </div>
          )}

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        </div>

        {/* Right — Editor */}
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>

            <button
              onClick={handleSubmit}
              disabled={submitting || timeLeft === 0}
              className="rounded-lg bg-primary px-6 py-1.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>

          <div className="flex-1">
            <Editor
              height="100%"
              language={language === "cpp" ? "cpp" : language}
              theme="vs-dark"
              value={editorCode}
              onChange={(value) => setEditorCode(value ?? "")}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
