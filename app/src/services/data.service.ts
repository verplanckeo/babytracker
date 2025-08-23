/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/DataService.ts
import type { BabyEntry, NewBabyEntry } from '../interfaces'
import { LogError } from './logging.service';
import { api } from './axios.service';

// GraphQL queries and mutations using your actual schema
const QUERIES = {
  GET_ALL_ENTRIES: `
    query GetBabyEntries {
      babyEntries {
        id
        date
        time
        feedType
        startingBreast
        temperature
        didPee
        didPoo
        didThrowUp
        created
        updatedAt
      }
    }
  `,
  
  GET_ENTRIES_BY_DATE: `
    query GetBabyEntriesByDate($date: String!) {
      babyEntriesByDate(date: $date) {
        id
        date
        time
        feedType
        startingBreast
        temperature
        didPee
        didPoo
        didThrowUp
        created
        updatedAt
      }
    }
  `,
  
  GET_ENTRIES_BY_DATE_RANGE: `
    query GetBabyEntriesByDateRange($startDate: String!, $endDate: String!) {
      babyEntriesByDateRange(startDate: $startDate, endDate: $endDate) {
        id
        date
        time
        feedType
        startingBreast
        temperature
        didPee
        didPoo
        didThrowUp
        created
        updatedAt
      }
    }
  `,
  
  GET_ENTRY_BY_ID: `
    query GetBabyEntry($id: String!) {
      babyEntry(id: $id) {
        id
        date
        time
        feedType
        startingBreast
        temperature
        didPee
        didPoo
        didThrowUp
        created
        updatedAt
      }
    }
  `
};

const MUTATIONS = {
  CREATE_ENTRY: `
    mutation CreateBabyEntry($input: NewBabyEntryInputTypeInput!) {
      createBabyEntry(input: $input) {
        id
        date
        time
        feedType
        startingBreast
        temperature
        didPee
        didPoo
        didThrowUp
        created
        updatedAt
      }
    }
  `,
  
  UPDATE_ENTRY: `
    mutation UpdateBabyEntry($entryId: String!, $input: UpdateBabyEntryInputTypeInput!) {
      updateBabyEntry(entryId: $entryId, input: $input) {
        id
        date
        time
        feedType
        startingBreast
        temperature
        didPee
        didPoo
        didThrowUp
        created
        updatedAt
      }
    }
  `,
  
  DELETE_ENTRY: `
    mutation DeleteBabyEntry($id: String!) {
      deleteBabyEntry(id: $id)
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

class DataService {
  
  // Make GraphQL request using your axios service
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

      // Use your axios service with optional custom scopes
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
  private transformGraphQLEntry(gqlEntry: any): BabyEntry {
    return {
      id: gqlEntry.id,
      date: gqlEntry.date,
      time: gqlEntry.time,
      feedType: gqlEntry.feedType,
      startingBreast: gqlEntry.startingBreast,
      temperature: gqlEntry.temperature,
      didPee: gqlEntry.didPee,
      didPoo: gqlEntry.didPoo,
      didThrowUp: gqlEntry.didThrowUp,
      timestamp: gqlEntry.created, // Map created to timestamp for compatibility
      updatedAt: gqlEntry.updatedAt
    };
  }

  // Transform NewBabyEntry to GraphQL input format
  private transformToGraphQLInput(entry: NewBabyEntry): any {
    return {
      date: entry.date,
      time: entry.time,
      feedType: entry.feedType,
      startingBreast: entry.startingBreast,
      temperature: entry.temperature,
      didPee: entry.didPee,
      didPoo: entry.didPoo,
      didThrowUp: entry.didThrowUp
    };
  }

  // Load all entries
  async loadEntries(): Promise<BabyEntry[]> {
    try {
      const response = await this.makeGraphQLRequest<{ babyEntries: any[] }>(
        QUERIES.GET_ALL_ENTRIES
      );
      
      const transformedEntries = response.babyEntries.map(entry => 
        this.transformGraphQLEntry(entry)
      );
      
      // Cache to localStorage for offline access
      //await this.saveEntriesToLocalStorage(transformedEntries);
      
      return transformedEntries;
    } catch (error) {
      LogError('Error loading entries from GraphQL, falling back to localStorage:', error);
      throw error; // Rethrow to handle in the calling code
    }
  }

  // Save a new entry
  async saveEntry(entry: NewBabyEntry): Promise<BabyEntry> {
    try {
      const input = this.transformToGraphQLInput(entry);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await this.makeGraphQLRequest<{ createBabyEntry: any }>(
        MUTATIONS.CREATE_ENTRY,
        { input }
      );

      const savedEntry = this.transformGraphQLEntry(response.createBabyEntry);
      
      // Update localStorage cache
      try {
        //const existingEntries = await this.loadEntriesFromLocalStorage();
        //const updatedEntries = [...existingEntries, savedEntry];
        //await this.saveEntriesToLocalStorage(updatedEntries);
      } catch (localStorageError) {
        LogError('Failed to update localStorage cache:', localStorageError);
      }

      return savedEntry;
    } catch (error) {
      LogError('Error saving entry via GraphQL:', error);
      
      // Fallback to localStorage
      const entryWithMetadata: BabyEntry = {
        ...entry,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return entryWithMetadata;
    }
  }

  // Update an existing entry
  async updateEntry(entryId: string, updatedData: Partial<NewBabyEntry>): Promise<BabyEntry> {
    try {
      const input: any = {};
      
      // Only include fields that are provided in updatedData
      if (updatedData.date !== undefined) input.date = updatedData.date;
      if (updatedData.time !== undefined) input.time = updatedData.time;
      if (updatedData.feedType !== undefined) input.feedType = updatedData.feedType;
      if (updatedData.startingBreast !== undefined) input.startingBreast = updatedData.startingBreast;
      if (updatedData.temperature !== undefined) input.temperature = updatedData.temperature;
      if (updatedData.didPee !== undefined) input.didPee = updatedData.didPee;
      if (updatedData.didPoo !== undefined) input.didPoo = updatedData.didPoo;
      if (updatedData.didThrowUp !== undefined) input.didThrowUp = updatedData.didThrowUp;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await this.makeGraphQLRequest<{ updateBabyEntry: any }>(
        MUTATIONS.UPDATE_ENTRY,
        { entryId, input }
      );

      const updatedEntry = this.transformGraphQLEntry(response.updateBabyEntry);

      return updatedEntry;
    } catch (error) {
      LogError('Error updating entry via GraphQL:', error);
      throw error; // Rethrow to handle in the calling code
    }
  }

  // Delete an entry
  async deleteEntry(entryId: string): Promise<boolean> {
    try {
      const response = await this.makeGraphQLRequest<{ deleteBabyEntry: boolean }>(
        MUTATIONS.DELETE_ENTRY,
        { id: entryId }
      );

      return response.deleteBabyEntry;
    } catch (error) {
      LogError('Error deleting entry via GraphQL:', error);
      return false;
    }
  }

  // Get entries for a specific date
  async getEntriesByDate(date: string): Promise<BabyEntry[]> {
    try {
      const response = await this.makeGraphQLRequest<{ babyEntriesByDate: any[] }>(
        QUERIES.GET_ENTRIES_BY_DATE,
        { date }
      );

      return response.babyEntriesByDate.map(entry => this.transformGraphQLEntry(entry));
    } catch (error) {
      LogError('Error loading entries by date from GraphQL:', error);
      throw error; // Rethrow to handle in the calling code
    }
  }

  // Get entries within a date range
  async getEntriesByDateRange(startDate: string, endDate: string): Promise<BabyEntry[]> {
    try {
      const response = await this.makeGraphQLRequest<{ babyEntriesByDateRange: any[] }>(
        QUERIES.GET_ENTRIES_BY_DATE_RANGE,
        { startDate, endDate }
      );

      return response.babyEntriesByDateRange.map(entry => this.transformGraphQLEntry(entry));
    } catch (error) {
      LogError('Error loading entries by date range from GraphQL:', error);
      throw error; // Rethrow to handle in the calling code
    }
  }

  // Get a single entry by ID (new method to utilize the GraphQL query)
  async getEntryById(id: string): Promise<BabyEntry | null> {
    try {
      const response = await this.makeGraphQLRequest<{ babyEntry: any }>(
        QUERIES.GET_ENTRY_BY_ID,
        { id }
      );

      return response.babyEntry ? this.transformGraphQLEntry(response.babyEntry) : null;
    } catch (error) {
      LogError('Error loading entry by ID from GraphQL:', error);
      throw error; // Rethrow to handle in the calling code
    }
  }

  // Method to use custom API scopes for specific operations (if needed)
  async loadEntriesWithCustomScopes(customScopes: string[]): Promise<BabyEntry[]> {
    try {
      const response = await this.makeGraphQLRequest<{ babyEntries: any[] }>(
        QUERIES.GET_ALL_ENTRIES,
        {},
        customScopes
      );
      
      const transformedEntries = response.babyEntries.map(entry => 
        this.transformGraphQLEntry(entry)
      );

      return transformedEntries;
    } catch (error) {
      LogError('Error loading entries with custom scopes:', error);
      throw error; // Rethrow to handle in the calling code
    }
  }
}

// Create and export a singleton instance
export const dataService = new DataService()