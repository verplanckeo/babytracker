import type { SleepEntry } from "./sleepentry.interface"

export interface SleepStats {
  totalSleepSessions: number
  totalSleepTime: number // in minutes
  avgSleepDuration: number // in minutes
  longestSleep: number // in minutes
  shortestSleep: number // in minutes
  activeSleep?: SleepEntry // Currently active sleep session
  sleepSessions: SleepEntry[]
}