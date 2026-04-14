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
        const response = await axiosInstance.get(`/rooms/${code}/rounds`)
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
        `/rooms/${code}/rounds/${round.id}/submit`,
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
    <div className="relative flex h-screen flex-col overflow-hidden bg-background">
      <div className="hacker-grid" />

      {/* Navbar */}
      <div className="relative z-10 flex items-center justify-between border-b border-border bg-card/50 px-6 py-3 backdrop-blur-sm">
        <h1 className="text-xl font-bold tracking-tight text-primary">
          CodeDuel
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm tracking-widest text-muted-foreground">
            ~/<span className="text-foreground">{user?.username}</span> $
          </span>
          <div
            className={`font-mono text-lg font-bold tracking-widest ${timeLeft !== null && timeLeft <= 30 ? "animate-pulse text-destructive" : "text-primary"}`}
          >
            {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* Left — Problem */}
        <div className="hacker-panel flex w-96 flex-shrink-0 flex-col overflow-y-auto rounded-none border-t-0 border-r border-b-0 border-l-0 border-border p-6 shadow-none">
          <h2 className="mb-2 text-xl font-bold tracking-wide text-foreground">
            &gt; {round.problemTitle}
          </h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {round.problemDescription}
          </p>

          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold tracking-widest text-muted-foreground">
              $ TEST_CASES
            </h3>
            <div className="flex flex-col gap-3">
              {round.testCases.map((tc, index) => (
                <div
                  key={tc.id}
                  className="rounded-sm border border-border bg-input/50 p-3"
                >
                  <p className="mb-1 text-xs font-bold tracking-widest text-muted-foreground">
                    CASE_0{index + 1}
                  </p>
                  <p className="font-mono text-xs text-foreground">
                    <span className="text-muted-foreground">INPUT: </span>{" "}
                    {tc.input}
                  </p>
                  <p className="mt-1 font-mono text-xs text-foreground">
                    <span className="text-muted-foreground">EXPECTED: </span>{" "}
                    {tc.expectedOutput}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Submission result */}
          {submission && (
            <div
              className={`mt-6 rounded-sm border p-4 ${submission.testCasesPassed === submission.totalTestCases ? "border-primary bg-primary/10 text-primary" : "border-destructive bg-destructive/10 text-destructive"}`}
            >
              <p className="font-bold tracking-widest">
                {submission.testCasesPassed === submission.totalTestCases
                  ? "[+] ALL_TESTS_PASSED"
                  : "[-] PARTIAL_PASS"}
              </p>
              <p className="mt-1 font-mono text-sm">
                &gt; {submission.testCasesPassed}/{submission.totalTestCases}{" "}
                cases passed
              </p>
              <p className="mt-1 font-mono text-sm">
                &gt; +{submission.pointsEarned} pts
              </p>
            </div>
          )}

          {error && (
            <p className="mt-4 text-sm font-bold tracking-widest text-destructive">
              [-] {error}
            </p>
          )}
        </div>

        {/* Right — Editor */}
        <div className="flex flex-1 flex-col bg-[#0a0a0a]">
          <div className="flex items-center justify-between border-b border-border bg-card/30 px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-widest text-muted-foreground">
                $ lang
              </span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-sm border border-border bg-input px-3 py-1.5 font-mono text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || timeLeft === 0}
              className="hacker-btn-primary rounded-sm px-6 py-1.5 text-xs"
            >
              {submitting ? "SUBMITTING..." : "EXECUTE"}
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
