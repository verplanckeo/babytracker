export interface BabyEntry {
  id: string
  date: string // YYYY-MM-DD format
  time: string // HH:mm format
  feedType: 'bottle' | 'breast'
  startingBreast?: 'left' | 'right' | null
  temperature?: number | null
  didPee: boolean
  didPoo: boolean
  didThrowUp: boolean
  timestamp: string // ISO string
  updatedAt?: string // ISO string
}