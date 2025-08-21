// src/services/DataService.ts
// src/services/DataService.ts
import type { BabyEntry, NewBabyEntry } from '../interfaces'
import { LogError } from './logging.service';

const STORAGE_KEY: string = 'babyEntries'
class DataService {

  // Load all entries
  async loadEntries(): Promise<BabyEntry[]> {
    try {
      // For localStorage implementation

      return new Promise<BabyEntry[]>((resolve) => {
        setTimeout(() => {
          const savedEntries = localStorage.getItem(STORAGE_KEY)
          resolve(savedEntries ? JSON.parse(savedEntries) : [])
        }, 1500);
      }); 
      
      // For Cosmos DB implementation (replace the above with):
      // const response = await fetch('/api/entries')
      // if (!response.ok) throw new Error('Failed to load entries')
      // return await response.json()
    } catch (error) {
      LogError("Error loading entries:", error);
      //console.error('Error loading entries:', error);
      return []
    }
  }

  // Save a new entry
  async saveEntry(entry: NewBabyEntry): Promise<BabyEntry> {
    try {
      const entryWithMetadata: BabyEntry = {
        ...entry,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      }

      // For localStorage implementation
      const existingEntries = await this.loadEntries()
      const updatedEntries = [...existingEntries, entryWithMetadata]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries))
      return entryWithMetadata

      // For Cosmos DB implementation (replace the above with):
      // const response = await fetch('/api/entries', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entryWithMetadata)
      // })
      // if (!response.ok) throw new Error('Failed to save entry')
      // return await response.json()
    } catch (error) {
      console.error('Error saving entry:', error)
      throw error
    }
  }

  // Update an existing entry
  async updateEntry(entryId: string, updatedData: Partial<NewBabyEntry>): Promise<BabyEntry> {
    try {
      // For localStorage implementation
      const entries = await this.loadEntries()
      const entryIndex = entries.findIndex(entry => entry.id === entryId)
      
      if (entryIndex === -1) {
        throw new Error('Entry not found')
      }

      const updatedEntry: BabyEntry = {
        ...entries[entryIndex],
        ...updatedData,
        updatedAt: new Date().toISOString()
      }

      const updatedEntries = [...entries]
      updatedEntries[entryIndex] = updatedEntry
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries))
      return updatedEntry

      // For Cosmos DB implementation (replace the above with):
      // const response = await fetch(`/api/entries/${entryId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({...updatedData, updatedAt: new Date().toISOString()})
      // })
      // if (!response.ok) throw new Error('Failed to update entry')
      // return await response.json()
    } catch (error) {
      console.error('Error updating entry:', error)
      throw error
    }
  }

  // Delete an entry
  async deleteEntry(entryId: string): Promise<boolean> {
    try {
      // For localStorage implementation
      const entries = await this.loadEntries()
      const filteredEntries = entries.filter(entry => entry.id !== entryId)
      
      if (filteredEntries.length === entries.length) {
        throw new Error('Entry not found')
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredEntries))
      return true

      // For Cosmos DB implementation (replace the above with):
      // const response = await fetch(`/api/entries/${entryId}`, {
      //   method: 'DELETE'
      // })
      // if (!response.ok) throw new Error('Failed to delete entry')
      // return response.ok
    } catch (error) {
      console.error('Error deleting entry:', error)
      throw error
    }
  }

  // Get entries for a specific date
  async getEntriesByDate(date: string): Promise<BabyEntry[]> {
    try {
      const entries = await this.loadEntries()
      return entries.filter(entry => entry.date === date)

      // For Cosmos DB implementation (replace the above with):
      // const response = await fetch(`/api/entries?date=${encodeURIComponent(date)}`)
      // if (!response.ok) throw new Error('Failed to load entries by date')
      // return await response.json()
    } catch (error) {
      console.error('Error loading entries by date:', error)
      return []
    }
  }

  // Get entries within a date range
  async getEntriesByDateRange(startDate: string, endDate: string): Promise<BabyEntry[]> {
    try {
      const entries = await this.loadEntries()
      return entries.filter(entry => 
        entry.date >= startDate && entry.date <= endDate
      )

      // For Cosmos DB implementation (replace the above with):
      // const response = await fetch(`/api/entries?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`)
      // if (!response.ok) throw new Error('Failed to load entries by date range')
      // return await response.json()
    } catch (error) {
      console.error('Error loading entries by date range:', error)
      return []
    }
  }
}

// Create and export a singleton instance
export const dataService = new DataService()