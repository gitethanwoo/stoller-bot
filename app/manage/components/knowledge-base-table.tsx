import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Database } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchDocuments } from '../utils/search';
import { useDebounce } from '@/hooks/use-debounce';
import { StoredDocument } from "../types";
import { toast } from "sonner";

interface KnowledgeBaseTableProps {
  documents: Record<string, StoredDocument>;
  onEdit: (key: string, document: StoredDocument) => void;
  onDelete: (key: string, title: string) => void;
  authToken?: string;
}

export function KnowledgeBaseTable({ 
  documents, 
  onEdit, 
  onDelete,
  authToken
}: KnowledgeBaseTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [vectorizing, setVectorizing] = useState<string | null>(null);
  const debouncedSearch = useDebounce(searchTerm, 300);

  const filteredDocuments = searchDocuments(documents, debouncedSearch);

  const handleVectorize = async (key: string, title: string) => {
    try {
      setVectorizing(key);
      
      const response = await fetch("/api/vectorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({ key }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success(`Vectorized ${title} with ${data.successful} chunks`);
      } else {
        toast.error(`Failed to vectorize: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error vectorizing document:', error);
      toast.error('Failed to vectorize document');
    } finally {
      setVectorizing(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Current Knowledge Base</CardTitle>
            <CardDescription>
              All documents currently available to StollerBot
            </CardDescription>
          </div>
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[250px]"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document Title</TableHead>
              <TableHead className="w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(filteredDocuments).map(([key, doc]) => (
              <TableRow 
                key={key}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onEdit(key, doc)}
              >
                <TableCell className="font-medium">
                  {doc.title} 
                  {doc.vectorized && (
                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      Vectorized
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={vectorizing === key}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVectorize(key, doc.title);
                      }}
                    >
                      <Database className="h-4 w-4 mr-1" />
                      {vectorizing === key ? 'Processing...' : 'Vectorize'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(key, doc.title);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 