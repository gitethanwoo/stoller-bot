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
import { Button } from "@/components/ui/button";
import { EnrichedResult } from "../types";

interface ProcessingResultsProps {
  isLoading: boolean;
  progressMessages?: string[];
  enrichedResults: EnrichedResult[];
  onUploadToDatabase: (result: EnrichedResult) => void;
}

export function ProcessingResults({ 
  isLoading, 
  progressMessages = [], 
  enrichedResults,
  onUploadToDatabase
}: ProcessingResultsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Processing Results</CardTitle>
        <CardDescription>
          {isLoading ? "Processing documents..." : "Ready to add to database"}
        </CardDescription>
      </CardHeader>
      {isLoading ? (
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {progressMessages.map((message, index) => (
              <p key={index} className="text-sm text-muted-foreground">
                {message}
              </p>
            ))}
          </div>
        </CardContent>
      ) : enrichedResults.length > 0 ? (
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Title</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrichedResults.map((result, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {result?.document?.title || "Untitled Document"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={() => onUploadToDatabase(result)}
                        variant="outline"
                        size="sm"
                      >
                        Add to Database
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        ) : null}
    </Card>
  );
} 