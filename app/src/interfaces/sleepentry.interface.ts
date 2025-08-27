export interface SleepEntry {
  id: string
  date: string // YYYY-MM-DD format
  startTime: string // HH:mm format
  endTime?: string // HH:mm format - null if still sleeping
  duration?: number // Duration in minutes, calculated when sleep ends
  isActive: boolean // True if currently sleeping
  timestamp: string // ISO string
  updatedAt?: string // ISO string
  comment?: string // Optional notes
}
