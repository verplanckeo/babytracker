/* eslint-disable @typescript-eslint/no-explicit-any */

import { LogError } from './logging.service';
import { api } from './axios.service';
import type { SleepEntry } from '../interfaces/sleepentry.interface';
import type { NewSleepEntry } from '../interfaces/newsleepentry.interface';

// GraphQL queries and mutations for sleep tracking
const SLEEP_QUERIES = {
  GET_ALL_SLEEP_ENTRIES: `
    query GetSleepEntries {
      sleepEntries {
        id
        date
        startTime
        endTime
        duration
        isActive
        created
        updatedAt
        comment
      }
    }
  `,
  
  GET_SLEEP_ENTRIES_BY_DATE: `
    query GetSleepEntriesByDate($date: String!) {
      sleepEntriesByDate(date: $date) {
        id
        date
        startTime
        endTime
        duration
        isActive
        created
        updatedAt
        comment
      }
    }
  `,
  
  GET_SLEEP_ENTRIES_BY_DATE_RANGE: `
    query GetSleepEntriesByDateRange($startDate: String!, $endDate: String!) {
      sleepEntriesByDateRange(startDate: $startDate, endDate: $endDate) {
        id
        date
        startTime
        endTime
        duration
        isActive
        created
        updatedAt
        comment
      }
    }
  `,
  
  GET_ACTIVE_SLEEP: `
    query GetActiveSleep {
      activeSleep {
        id
        date
        startTime
        endTime
        duration
        isActive
        created
        updatedAt
        comment
      }
    }
  `,
  
  GET_SLEEP_ENTRY_BY_ID: `
    query GetSleepEntry($id: String!) {
      sleepEntry(id: $id) {
        id
        date
        startTime
        endTime
        duration
        isActive
        created
        updatedAt
        comment
      }
    }
  `
};

const SLEEP_MUTATIONS = {
  CREATE_SLEEP_ENTRY: `
    mutation CreateSleepEntry($input: NewSleepEntryInputTypeInput!) {
      createSleepEntry(input: $input) {
        id
        date
        startTime
        endTime
        duration
        isActive
        created
        updatedAt
        comment
      }
    }
  `,
  
  UPDATE_SLEEP_ENTRY: `
    mutation UpdateSleepEntry($entryId: String!, $input: UpdateSleepEntryInputTypeInput!) {
      updateSleepEntry(entryId: $entryId, input: $input) {
        id
        date
        startTime
        endTime
        duration
        isActive
        created
        updatedAt
        comment
      }
    }
  `,
  
  DELETE_SLEEP_ENTRY: `
    mutation DeleteSleepEntry($id: String!) {
      deleteSleepEntry(id: $id)
    }
  `,
  
  STOP_SLEEP: `
    mutation StopSleep($sleepId: String!, $endTime: String!, $duration: Int!) {
      stopSleep(sleepId: $sleepId, endTime: $endTime, duration: $duration) {
        id
        date
        startTime
        endTime
        duration
        isActive
        created
        updatedAt
        comment
      }
    }
  `
};

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

interface GraphQLRequest {
  query: string;
  variables?: Record<string, any>;
}

export class SleepDataService {
  
    // Make GraphQL request using axios service
    private async makeGraphQLRequest<T>(
        query: string,
        variables?: Record<string, any>,
        customScopes?: string[]
    ): Promise<T> {
        try {
            const requestBody: GraphQLRequest = {
                query,
                variables: variables || {}
            };

            const config = customScopes ? { scopes: customScopes } : undefined;
            const response: GraphQLResponse<T> = await api.post('graphql/', requestBody, config);

            if (response.errors && response.errors.length > 0) {
                throw new Error(`GraphQL error: ${response.errors[0].message}`);
            }

            if (!response.data) {
                throw new Error('No data returned from GraphQL query');
            }

            return response.data;
        } catch (error) {
            LogError('GraphQL request failed:', error);
            throw error;
        }
    }

    // Transform GraphQL response to match interface expectations
    private transformGraphQLSleepEntry(gqlEntry: any): SleepEntry {
        return {
            id: gqlEntry.id,
            date: gqlEntry.date,
            startTime: gqlEntry.startTime,
            endTime: gqlEntry.endTime,
            duration: gqlEntry.duration,
            isActive: gqlEntry.isActive,
            timestamp: gqlEntry.created,
            updatedAt: gqlEntry.updatedAt,
            comment: gqlEntry.comment
        };
    }

    // Transform NewSleepEntry to GraphQL input format
    private transformToGraphQLSleepInput(entry: NewSleepEntry): any {
        return {
            date: entry.date,
            startTime: entry.startTime,
            endTime: entry.endTime,
            duration: entry.duration,
            isActive: entry.isActive,
            comment: entry.comment
        };
    }

    // Load all sleep entries
    async loadSleepEntries(): Promise<SleepEntry[]> {
        try {
            const response = await this.makeGraphQLRequest<{ sleepEntries: any[] }>(
                SLEEP_QUERIES.GET_ALL_SLEEP_ENTRIES
            );
      
            const transformedEntries = response.sleepEntries.map(entry =>
                this.transformGraphQLSleepEntry(entry)
            );
      
            return transformedEntries.sort((a, b) => {
                // Sort by date descending, then by start time descending
                const dateCompare = b.date.localeCompare(a.date);
                if (dateCompare !== 0) return dateCompare;
                return b.startTime.localeCompare(a.startTime);
            });
        } catch (error) {
            LogError('Failed to delete sleep entry:', error);
            throw new Error('Failed to delete sleep entry');
        }
    }

    // Get sleep entry by ID
    async getSleepEntryById(entryId: string): Promise<SleepEntry | null> {
        try {
            const response = await this.makeGraphQLRequest<{ sleepEntry: any }>(
                SLEEP_QUERIES.GET_SLEEP_ENTRY_BY_ID,
                { id: entryId }
            );
      
            return response.sleepEntry ? this.transformGraphQLSleepEntry(response.sleepEntry) : null;
        } catch (error) {
            LogError('Failed to get sleep entry by ID:', error);
            throw new Error('Failed to get sleep entry by ID');
        }
    }

    // Stop active sleep (convenience method)
    async stopSleep(sleepId: string, endTime: string, duration: number): Promise<SleepEntry> {
        try {
            const response = await this.makeGraphQLRequest<{ stopSleep: any }>(
                SLEEP_MUTATIONS.STOP_SLEEP,
                { sleepId, endTime, duration }
            );
      
            return this.transformGraphQLSleepEntry(response.stopSleep);
        } catch (error) {
            LogError('Failed to stop sleep:', error);
            // Fallback to regular update if stop mutation doesn't exist
            return this.updateSleepEntry(sleepId, {
                endTime,
                duration,
                isActive: false
            });
        }
    }

    // Load sleep entries by date
    async loadSleepEntriesByDate(date: string): Promise<SleepEntry[]> {
        try {
            const response = await this.makeGraphQLRequest<{ sleepEntriesByDate: any[] }>(
                SLEEP_QUERIES.GET_SLEEP_ENTRIES_BY_DATE,
                { date }
            );
      
            return response.sleepEntriesByDate.map(entry =>
                this.transformGraphQLSleepEntry(entry)
            );
        } catch (error) {
            LogError('Failed to load sleep entries by date:', error);
            throw new Error('Failed to load sleep entries by date');
        }
    }

    // Load sleep entries by date range
    async loadSleepEntriesByDateRange(startDate: string, endDate: string): Promise<SleepEntry[]> {
        try {
            const response = await this.makeGraphQLRequest<{ sleepEntriesByDateRange: any[] }>(
                SLEEP_QUERIES.GET_SLEEP_ENTRIES_BY_DATE_RANGE,
                { startDate, endDate }
            );
      
            return response.sleepEntriesByDateRange.map(entry =>
                this.transformGraphQLSleepEntry(entry)
            );
        } catch (error) {
            LogError('Failed to load sleep entries by date range:', error);
            throw new Error('Failed to load sleep entries by date range');
        }
    }

    // Get active sleep session
    async getActiveSleep(): Promise<SleepEntry | null> {
        try {
            const response = await this.makeGraphQLRequest<{ activeSleep: any }>(
                SLEEP_QUERIES.GET_ACTIVE_SLEEP
            );
      
            return response.activeSleep ? this.transformGraphQLSleepEntry(response.activeSleep) : null;
        } catch (error) {
            LogError('Failed to get active sleep:', error);
            throw new Error('Failed to get active sleep');
        }
    }

    // Create sleep entry
    async createSleepEntry(entry: NewSleepEntry): Promise<SleepEntry> {
        try {
            const input = this.transformToGraphQLSleepInput(entry);
            const response = await this.makeGraphQLRequest<{ createSleepEntry: any }>(
                SLEEP_MUTATIONS.CREATE_SLEEP_ENTRY,
                { input }
            );
      
            return this.transformGraphQLSleepEntry(response.createSleepEntry);
        } catch (error) {
            LogError('Failed to create sleep entry:', error);
            throw new Error('Failed to create sleep entry');
        }
    }

    // Update sleep entry
    async updateSleepEntry(entryId: string, updatedData: Partial<NewSleepEntry>): Promise<SleepEntry> {
        try {
            const input = this.transformToGraphQLSleepInput(updatedData as NewSleepEntry);
            const response = await this.makeGraphQLRequest<{ updateSleepEntry: any }>(
                SLEEP_MUTATIONS.UPDATE_SLEEP_ENTRY,
                { entryId, input }
            );
      
            return this.transformGraphQLSleepEntry(response.updateSleepEntry);
        } catch (error) {
            LogError('Failed to update sleep entry:', error);
            throw new Error('Failed to update sleep entry');
        }
    }

    // Delete sleep entry
    async deleteSleepEntry(entryId: string): Promise<boolean> {
        try {
            const response = await this.makeGraphQLRequest<{ deleteSleepEntry: boolean }>(
                SLEEP_MUTATIONS.DELETE_SLEEP_ENTRY,
                { id: entryId }
            );
      
            return response.deleteSleepEntry;
        } catch (error) {
            LogError('Failed to load sleep entries:', error);
            throw new Error('Failed to load sleep entries');
        }
    }
}