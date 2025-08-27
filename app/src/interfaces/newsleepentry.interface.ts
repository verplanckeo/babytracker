export interface NewSleepEntry {
  date: string
  startTime: string
  endTime?: string | null
  duration?: number | null
  isActive: boolean
  comment?: string
}