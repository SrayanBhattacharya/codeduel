import axiosInstance from "@/api/axiosInstance"
import { useAuth } from "@/context/AuthContext"
import axios from "axios"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await axiosInstance.post("/auth/login", {
        username,
        password,
      })

      login(response.data.token, {
        id: response.data.id,
        username: response.data.username,
      })
      navigate("/lobby")
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError("Invalid username or password")
      } else {
        setError("Something went wrong. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      <div className="hacker-grid" />

      <div className="hacker-panel w-full max-w-md">
        {[
          "top-[-1px] left-[-1px] border-t border-l",
          "top-[-1px] right-[-1px] border-t border-r",
          "bottom-[-1px] left-[-1px] border-b border-l",
          "bottom-[-1px] right-[-1px] border-b border-r",
        ].map((cls, i) => (
          <div key={i} className={`hacker-corner ${cls}`} />
        ))}

        <div className="mb-8 text-center">
          <p className="mb-2 text-sm tracking-widest text-primary">
            <span className="text-muted-foreground">~/codeduel $</span>{" "}
            ./login.sh
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Authenticate
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-muted-foreground">
              $ username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-sm border border-border bg-input px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-muted-foreground">
              $ password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-sm border border-border bg-input px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="hacker-btn-primary mt-4 w-full"
          >
            {loading ? "AUTHENTICATING..." : "LOGIN"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/register" className="text-primary hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}
