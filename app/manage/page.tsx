"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChatSidebar } from "@/components/chat-sidebar";
import { MessageCircle } from "lucide-react";
import { DeleteDialog, EditDialog } from "./components/document-dialogs";
import { KnowledgeBaseTable } from "./components/knowledge-base-table";
import { UploadCard } from "./components/upload-card";
import { ProcessingResults } from "./components/processing-results";
import { AuthCard } from "./components/auth-card";
import Link from "next/link";
import { useBenefits } from '@/providers/benefits-provider';
import { useFileUpload } from '@/hooks/useFileUpload';
import { toast } from "sonner";
import { StoredDocument, EnrichedResult } from './types';
import { VectorSearch } from "./components/vector-search";

export default function TestEnrich() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [enrichedResults, setEnrichedResults] = useState<EnrichedResult[]>([]);
  const { isProcessing } = useFileUpload();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{
    key: string;
    title: string;
  } | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState<{
    key: string;
    document: string;
  } | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const { benefits, mutate } = useBenefits();
  
  const currentDocs = useMemo(() => {
    return benefits.reduce((acc: Record<string, StoredDocument>, doc: StoredDocument, index: number) => {
      const key = doc.redisKey || `${doc.title}_${index}`;
      acc[key] = doc;
      return acc;
    }, {});
  }, [benefits]);

  const handleUploadToUpstash = async (enrichedResult: EnrichedResult) => {
    try {
      const response = await fetch("/api/benefits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(enrichedResult),
      });

      if (response.ok) {
        toast.success(`Added ${enrichedResult.fileName} to database`);
        setEnrichedResults(prev => 
          prev.filter(result => result.fileName !== enrichedResult.fileName)
        );
        await mutate();
      } else {
        const errorData = await response.json();
        toast.error(`Failed to upload: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error uploading to Upstash:", error);
      toast.error("Failed to upload document");
    }
  };

  const handleDelete = async (key: string) => {
    try {
      const response = await fetch("/api/benefits", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ key }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `Deleted document${data.vectorsDeleted ? ` and ${data.vectorsDeleted} facts` : ''}`
        );
        await mutate();
      } else {
        console.error('Delete failed:', data);
        toast.error(`Failed to delete: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error in handleDelete:', error);
      toast.error("Failed to delete document");
    } finally {
      setDeleteConfirmOpen(false);
      setDocumentToDelete(null);
    }
  };

  const handleEdit = async (key: string, document: StoredDocument) => {
    try {
      setEditError(null);
      setDocumentToEdit({
        key,
        document: JSON.stringify(document, null, 2),
      });
      setEditModalOpen(true);
    } catch (error) {
      console.error("Error preparing document for edit:", error);
    }
  };

  const handleSaveEdit = async () => {
    if (!documentToEdit) return;

    try {
      const parsedDocument = JSON.parse(documentToEdit.document);

      const response = await fetch("/api/benefits", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          key: documentToEdit.key,
          document: parsedDocument,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `Document updated${data.vectorCount ? ` with ${data.vectorCount} facts` : ''}`
        );
        await mutate();
        setEditModalOpen(false);
        setDocumentToEdit(null);
        setEditError(null);
      } else {
        console.error('Edit failed:', data);
        toast.error(`Failed to update: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error in handleSaveEdit:', error);
      setEditError(
        error instanceof Error ? error.message : "Invalid JSON format"
      );
      toast.error("Failed to update document");
    }
  };

  const handleDeleteRequest = (key: string, title: string) => {
    setDocumentToDelete({ key, title });
    setDeleteConfirmOpen(true);
  };

  const handleAuthenticate = (token: string) => {
    setIsAuthenticated(true);
    setAuthToken(token);
  };

  if (!isAuthenticated || !authToken) {
    return (
      <div className="container mx-auto p-4 max-w-6xl pt-8">
        <AuthCard onAuthenticate={handleAuthenticate} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl pt-8 space-y-6">
      <div className="fixed top-4 left-4 flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-lg text-muted-foreground hover:text-foreground hidden xl:flex items-center gap-2"
          asChild
        >
          <Link href="/">🏠</Link>
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🤖 Stoller Bot Knowledge Manager</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsChatOpen(true)}
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Test Bot
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              setIsAuthenticated(false);
              setAuthToken(null);
            }}
          >
            Logout
          </Button>
        </div>
      </div>

      <div className="">
        <UploadCard authToken={authToken} />
      </div>

      {enrichedResults.length > 0 && (
        <ProcessingResults
          isLoading={isProcessing}
          enrichedResults={enrichedResults}
          onUploadToDatabase={handleUploadToUpstash}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <KnowledgeBaseTable
            documents={currentDocs}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
            authToken={authToken}
          />
        </div>
        
        <VectorSearch authToken={authToken} />
      </div>

      <DeleteDialog
        isOpen={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        documentTitle={documentToDelete?.title ?? ""}
        onConfirm={() => documentToDelete && handleDelete(documentToDelete.key)}
      />

      <EditDialog
        isOpen={editModalOpen}
        onOpenChange={setEditModalOpen}
        documentJson={documentToEdit?.document ?? ""}
        error={editError}
        onSave={handleSaveEdit}
        onChange={(value) =>
          setDocumentToEdit((prev) =>
            prev ? { ...prev, document: value } : null
          )
        }
      />

      <ChatSidebar
        isOpen={isChatOpen}
        setIsOpen={setIsChatOpen}
        showFileInput={false}
        selectedDocuments={[]}
      />
    </div>
  );
}
