import { QueryObserverResult } from '@tanstack/react-query';

export interface StoredDocument {
  title: string;
  text: string;
  redisKey?: string;
  vectorized?: boolean;
  vectorizedAt?: string;
  vectorChunks?: number;
}

export interface EnrichedResult {
  fileName: string;
  document: StoredDocument;
}

export interface DocumentContextType {
  documents: StoredDocument[];
  isLoading: boolean;
  error: Error | null;
  mutate: () => Promise<QueryObserverResult<StoredDocument[], Error>>;
}

export interface BenefitsContextType {
  benefits: StoredDocument[];
  isLoading: boolean;
  error: Error | null;
  mutate: () => Promise<QueryObserverResult<StoredDocument[], Error>>;
}

// Type for the chat API
export interface ChatDocument {
  documentTitle: string;
  documentContext: string;
} 