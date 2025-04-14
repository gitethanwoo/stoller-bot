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
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchDocuments } from '../utils/search';
import { useDebounce } from '@/hooks/use-debounce';
import { StoredDocument } from "../types";

interface KnowledgeBaseTableProps {
  documents: Record<string, StoredDocument>;
  onEdit: (key: string, document: StoredDocument) => void;
  onDelete: (key: string, title: string) => void;
}

export function KnowledgeBaseTable({ 
  documents, 
  onEdit, 
  onDelete 
}: KnowledgeBaseTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const filteredDocuments = searchDocuments(documents, debouncedSearch);

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
              <TableHead className="w-[50px]"></TableHead>
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
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
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