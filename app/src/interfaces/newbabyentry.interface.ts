export interface NewBabyEntry {
  date: string
  time: string
  feedType: 'bottle' | 'breast'
  startingBreast?: 'left' | 'right' | null
  temperature?: number | null
  didPee: boolean
  didPoo: boolean
  didThrowUp: boolean
}