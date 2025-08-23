export interface NewBabyEntry {
  date: string
  time: string
  feedType: 'BOTTLE' | 'BREAST'
  startingBreast?: 'LEFT' | 'RIGHT' | null
  temperature?: number | null
  didPee: boolean
  didPoo: boolean
  didThrowUp: boolean
}