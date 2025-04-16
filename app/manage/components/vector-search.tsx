import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";
import { searchVectorDatabase } from "../utils/vector-search";

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

interface VectorSearchProps {
  authToken?: string;
}

export function VectorSearch({ authToken }: VectorSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VectorSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      const response = await searchVectorDatabase(query, 5, authToken);
      
      if (response.success) {
        setResults(response.results);
      } else {
        setError(response.message || "Search failed");
        setResults([]);
      }
    } catch (err) {
      console.error("Vector search error:", err);
      setError("An error occurred during search");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vector Search</CardTitle>
        <CardDescription>
          Test semantic search using vectorized documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2">
          <Input
            placeholder="Search knowledge base..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button 
            onClick={handleSearch} 
            disabled={isSearching || !query.trim()}
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Search
          </Button>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-md">
            {error}
          </div>
        )}
        
        {results.length > 0 && (
          <div className="mt-4 space-y-4">
            <h3 className="text-lg font-medium">Search Results</h3>
            {results.map((result) => (
              <Card key={result.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm">
                      {result.metadata.title} (Chunk {result.metadata.chunkIndex})
                    </h4>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      Score: {(result.score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap text-gray-700">
                    {result.metadata.text}
                  </p>
                  <div className="mt-2 text-xs text-gray-500">
                    Source: {result.metadata.source}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-gray-500">
        Searches are performed using OpenAI embeddings and Upstash Vector
      </CardFooter>
    </Card>
  );
} 