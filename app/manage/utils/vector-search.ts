interface VectorSearchResult {
  id: string;
  score: number;
  metadata: {
    text: string;
    source: string;
    title: string;
    chunkIndex: number;
  };
}

interface VectorSearchResponse {
  success: boolean;
  results: VectorSearchResult[];
  message?: string;
}

export async function searchVectorDatabase(
  query: string,
  limit: number = 5,
  authToken?: string
): Promise<VectorSearchResponse> {
  try {
    if (!query.trim()) {
      return { success: false, results: [], message: 'Query is empty' };
    }

    const params = new URLSearchParams({
      query,
      limit: limit.toString(),
    });

    const response = await fetch(`/api/vectorize?${params.toString()}`, {
      method: 'GET',
      headers: authToken 
        ? { Authorization: `Bearer ${authToken}` }
        : undefined,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching vector database:', error);
    return {
      success: false,
      results: [],
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
} 