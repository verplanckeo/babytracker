import type { BabyEntry } from "./babyentry.interface"

export interface DayStats {
  totalFeedings: number
  bottleFeeds: number
  breastFeeds: number
  leftBreastFeeds: number
  rightBreastFeeds: number
  totalPees: number
  totalPoos: number
  totalThrowUps: number
  avgTemperature: string | null
  entries: BabyEntry[]
}