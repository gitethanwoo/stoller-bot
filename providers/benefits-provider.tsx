"use client";

import { createContext, useContext, ReactNode } from 'react';
import { 
  QueryClient, 
  QueryClientProvider, 
  useQuery
} from '@tanstack/react-query';
import { StoredDocument, BenefitsContextType } from '@/app/manage/types';
import { usePathname } from 'next/navigation';


const BenefitsContext = createContext<BenefitsContextType | null>(null);

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // Consider data fresh for 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

// Single source of truth for fetching benefits
async function fetchBenefits(): Promise<StoredDocument[]> {
  console.log('Fetching benefits data');
  const response = await fetch('/api/benefits');
  if (!response.ok) throw new Error('Failed to fetch benefits');
  const data = await response.json();
  console.log('Fetched benefits data:', data.length, 'documents');
  return data;
}

function BenefitsProviderInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isTestground = pathname === '/testground';

  const { data, error, isLoading, refetch } = useQuery<StoredDocument[], Error>({
    queryKey: ['benefits'],
    queryFn: fetchBenefits,
    enabled: !isTestground, // Disable query for testground page

  });

  return (
    <BenefitsContext.Provider 
      value={{ 
        benefits: data || [], 
        isLoading, 
        error, 
        mutate: refetch 
      }}
    >
      {children}
    </BenefitsContext.Provider>
  );
}

export function BenefitsProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BenefitsProviderInner>{children}</BenefitsProviderInner>
    </QueryClientProvider>
  );
}

export function useBenefits() {
  const context = useContext(BenefitsContext);
  if (!context) {
    throw new Error('useBenefits must be used within a BenefitsProvider');
  }
  return context;
} 