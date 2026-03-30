# CodeDuel ⚔️

A real-time multiplayer competitive coding platform inspired by Scribble.io. A host creates a room, sets a coding challenge, and players race to solve it live. Points are awarded based on correctness and speed. A live leaderboard updates after each round.

🔗 **Live Demo**: https://codeduel-three.vercel.app

---

## ⚠️ Notes

- Backend may take 30–60 seconds to wake (free-tier hosting)
- Code execution service is limited due to cloud constraints

---

## Features

- JWT-based authentication (register/login)
- Create and join rooms with unique room codes
- Host sets up coding challenges with custom test cases and time limits
- Real-time participant updates via WebSocket
- Monaco Editor (VS Code) for writing code in the browser
- Code execution via [Piston API](https://github.com/engineer-man/piston) — supports Python, Java, C, C++
- Score formula based on correctness and speed
- Live leaderboard after each round
- Multi-round support in the same room

---

## Tech Stack

### Backend

| Technology              | Purpose                             |
| ----------------------- | ----------------------------------- |
| Java 25 + Spring Boot 3 | Core backend framework              |
| Spring Security + JWT   | Authentication and route protection |
| Spring Data JPA         | Database ORM                        |
| WebSocket (STOMP)       | Real-time communication             |
| PostgreSQL              | Primary database                    |
| Piston API              | Sandboxed code execution            |

### Frontend

| Technology              | Purpose                |
| ----------------------- | ---------------------- |
| React + TypeScript      | UI framework           |
| Vite                    | Build tool             |
| Tailwind CSS v4         | Styling                |
| shadcn/ui               | Component library      |
| Axios                   | HTTP client            |
| @stomp/stompjs + SockJS | WebSocket client       |
| Monaco Editor           | In-browser code editor |
| React Router DOM        | Client-side routing    |

---

## Architecture

Monolithic Spring Boot backend with a layered architecture:

```
com.codeduel.backend/
├── config/          # App config, security, WebSocket, CORS
├── controller/      # REST endpoints
├── service/         # Business logic
├── repository/      # Database access
├── entity/          # JPA entities
├── dto/             # Request/Response objects
├── exception/       # Custom exceptions + global handler
├── security/        # JWT filter, auth service
└── util/            # Piston client, room code generator
```

---

## API Reference

### Auth

| Method | Endpoint             | Description           | Auth |
| ------ | -------------------- | --------------------- | ---- |
| POST   | `/api/auth/register` | Register a new user   | ❌   |
| POST   | `/api/auth/login`    | Login and receive JWT | ❌   |

### Rooms

| Method | Endpoint                        | Description             | Auth |
| ------ | ------------------------------- | ----------------------- | ---- |
| POST   | `/api/rooms`                    | Create a new room       | ✅   |
| POST   | `/api/rooms/{code}/join`        | Join a room by code     | ✅   |
| GET    | `/api/rooms/{code}`             | Get room details        | ✅   |
| GET    | `/api/rooms/current`            | Get user's current room | ✅   |
| DELETE | `/api/rooms/{code}/leave`       | Leave a room            | ✅   |
| GET    | `/api/rooms/{code}/leaderboard` | Get room leaderboard    | ✅   |

### Rounds

| Method | Endpoint                              | Description                | Auth |
| ------ | ------------------------------------- | -------------------------- | ---- |
| POST   | `/api/rooms/{code}/rounds`            | Create a round (host only) | ✅   |
| POST   | `/api/rooms/{code}/rounds/{id}/start` | Start a round (host only)  | ✅   |
| GET    | `/api/rooms/{code}/rounds`            | Get all rounds in a room   | ✅   |

### Submissions

| Method | Endpoint                               | Description             | Auth |
| ------ | -------------------------------------- | ----------------------- | ---- |
| POST   | `/api/rooms/{code}/rounds/{id}/submit` | Submit code for a round | ✅   |

---

## WebSocket Events

**Endpoint**: `/websocket` (STOMP over SockJS)

| Topic                                | Trigger             | Payload                          |
| ------------------------------------ | ------------------- | -------------------------------- |
| `/topic/rooms/{code}/participants`   | Player joins room   | `RoomResponse`                   |
| `/topic/rooms/{code}/round-started`  | Host starts round   | `RoundResponse`                  |
| `/topic/rooms/{code}/round-finished` | Round timer expires | `RoundResponse`                  |
| `/topic/rooms/{code}/leaderboard`    | Round finishes      | `List<LeaderboardEntryResponse>` |

---

## Scoring Formula

```
speedMultiplier = max(0.5, 1.0 - (timeTaken / timeLimit) * 0.5)
pointsEarned = (testCasesPassed / totalTestCases) * 100 * speedMultiplier
```

- Full score for passing all test cases quickly
- Minimum 50% speed multiplier even if submitted at the last second
- Best submission per player is used if multiple submissions are made

---
