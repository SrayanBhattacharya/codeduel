export const RoomStatus = {
  WAITING: "WAITING",
  IN_PROGRESS: "IN_PROGRESS",
  FINISHED: "FINISHED",
} as const
export type RoomStatus = (typeof RoomStatus)[keyof typeof RoomStatus]

export const RoundStatus = {
  WAITING: "WAITING",
  ACTIVE: "ACTIVE",
  FINISHED: "FINISHED",
} as const
export type RoundStatus = (typeof RoundStatus)[keyof typeof RoundStatus]

export const ParticipantRole = {
  HOST: "ROLE_HOST",
  PLAYER: "ROLE_PLAYER",
} as const
export type ParticipantRole =
  (typeof ParticipantRole)[keyof typeof ParticipantRole]

export interface User {
  id: number
  username: string
}

export interface Participant {
  username: string
  totalScore: number
  role: ParticipantRole
}

export interface Room {
  id: number
  roomCode: string
  hostUsername: string
  maxPlayers: number
  status: RoomStatus
  participants: Participant[]
}

export interface TestCase {
  id: number
  input: string
  expectedOutput: string
}

export interface Round {
  id: number
  roundNumber: number
  problemTitle: string
  problemDescription: string
  timeLimitSeconds: number
  status: RoundStatus
  testCases: TestCase[]
}

export interface Submission {
  id: number
  testCasesPassed: number
  totalTestCases: number
  pointsEarned: number
  timeTakenSeconds: number
}

export interface LeaderboardEntry {
  username: string
  totalScore: number
}
