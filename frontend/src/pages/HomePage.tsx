import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

const taglines = [
  "Who's afraid of O(n²)?",
  'printf("Fight me.\\n");',
  "Your git blame, my trophy.",
  "Leetcode was just practice.",
  "while(alive) { compete(); }",
  "99 bugs in the code, take one down, 127 left.",
  "Works on my machine.",
  "Turning coffee into questionable solutions.",
  "If it compiles, it's a feature.",
  "Semicolons save lives.",
]

export default function HomePage() {
  const navigate = useNavigate()
  const [displayed, setDisplayed] = useState("")
  const [current, setCurrent] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const [charIndex, setCharIndex] = useState(0)

  useEffect(() => {
    const text = taglines[current]
    let timeout: ReturnType<typeof setTimeout>

    if (!deleting) {
      if (charIndex < text.length) {
        timeout = setTimeout(() => {
          setDisplayed(text.slice(0, charIndex + 1))
          setCharIndex((i) => i + 1)
        }, 65)
      } else {
        timeout = setTimeout(() => setDeleting(true), 2200)
      }
    } else {
      if (charIndex > 0) {
        timeout = setTimeout(() => {
          setDisplayed(text.slice(0, charIndex - 1))
          setCharIndex((i) => i - 1)
        }, 35)
      } else {
        setDeleting(false)
        setCurrent((c) => (c + 1) % taglines.length)
      }
    }

    return () => clearTimeout(timeout)
  }, [charIndex, deleting, current])

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0a0a] font-mono">
      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Corner decorations */}
      {[
        "top-4 left-4 border-t border-l",
        "top-4 right-4 border-t border-r",
        "bottom-4 left-4 border-b border-l",
        "bottom-4 right-4 border-b border-r",
      ].map((cls, i) => (
        <div key={i} className={`absolute h-5 w-5 border-[#1a1a1a] ${cls}`} />
      ))}

      {/* Main content */}
      <div className="relative z-10 max-w-3xl px-6 text-center">
        <p className="animate-fade-in mb-6 text-sm tracking-widest text-[#00ff88]">
          <span className="text-[#555]">~/codeduel $</span> ./start.sh
        </p>

        <h1 className="mb-2 text-7xl font-bold tracking-tight">
          <span className="text-[#00ff88]">Code</span>
          <span className="text-white">Duel</span>
        </h1>

        <div className="mb-12 flex h-8 items-center justify-center">
          <span className="text-sm tracking-wide text-[#888]">{displayed}</span>
          <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-[#00ff88]" />
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => navigate("/register")}
            className="rounded-sm bg-[#00ff88] px-8 py-3 text-sm font-bold tracking-widest text-[#0a0a0a] transition-all hover:-translate-y-0.5 hover:bg-[#00cc6e]"
          >
            $ register
          </button>
          <button
            onClick={() => navigate("/login")}
            className="rounded-sm border border-[#00ff88] px-8 py-3 text-sm tracking-widest text-[#00ff88] transition-all hover:-translate-y-0.5 hover:bg-[#00ff88]/10"
          >
            $ login
          </button>
        </div>
      </div>

      {/* Bottom stats */}
      <div className="absolute bottom-8 flex gap-12">
        {[
          ["4", "languages"],
          ["∞", "rounds"],
          ["1", "winner"],
        ].map(([num, label]) => (
          <div key={label} className="text-center">
            <div className="text-xl font-bold text-[#00ff88]">{num}</div>
            <div className="mt-1 text-xs tracking-widest text-[#444] uppercase">
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
