import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { FileUpload } from "./file-upload";
import { useFileUpload } from "@/hooks/useFileUpload";
import { FileProcessor } from "@/components/file-processor";
import { useEffect, useCallback, useState } from "react";
import { useBenefits } from '@/providers/benefits-provider';

interface UploadCardProps {
  authToken: string;
}

export function UploadCard({ authToken }: UploadCardProps) {
  const { files, setFiles, isProcessing, clearFiles, setIsProcessing } = useFileUpload();
  const [progressMessages, setProgressMessages] = useState<string[]>([]);
  const { mutate } = useBenefits();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files && files.length > 0) {
      setIsProcessing(true);
      setProgressMessages([]); // Clear previous messages
    }
  };

  const handleProcessingComplete = useCallback((redisKey: string, title: string, fileId: string) => {
    setFiles(prevFiles => 
      prevFiles.map(file => 
        file.id === fileId 
          ? { ...file, redisKey, title } 
          : file
      )
    );
    mutate();
  }, [setFiles, mutate]);

  const handleProcessingError = useCallback((error: string, fileId: string) => {
    setFiles(prevFiles => 
      prevFiles.map(file => 
        file.id === fileId 
          ? { ...file, error } 
          : file
      )
    );
    setIsProcessing(false);
  }, [setFiles, setIsProcessing]);

  const handleProgress = useCallback((message: string) => {
    setProgressMessages(prev => [...prev, message]);
  }, []);

  useEffect(() => {
    if (isProcessing && files && files.length > 0) {
      let allDone = true;
      files.forEach(file => {
        if (file.redisKey || file.error) return;

        allDone = false;
        const processor = new FileProcessor({
          file: file.file,
          authToken,
          onComplete: (redisKey, title) => handleProcessingComplete(redisKey, title, file.id),
          onError: (error) => handleProcessingError(error, file.id),
          onProgress: handleProgress
        });
        processor.process();
      });

      if (allDone) {
        setIsProcessing(false);
      }
    }
  }, [isProcessing, files, authToken, handleProcessingComplete, handleProcessingError, handleProgress, setIsProcessing]);

  return (
    <Card className="basis-1/2">
      <CardHeader>
        <CardTitle>Upload Documents</CardTitle>
        <CardDescription>
          Select one or more documents (.pdf, .xlsx) to process
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <FileUpload
                files={files}
                setFiles={setFiles}
                disabled={isProcessing}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              size="lg"
              disabled={!files || files.length === 0 || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing {files?.length} file
                  {files?.length !== 1 ? "s" : ""}...
                </>
              ) : (
                "Process Files"
              )}
            </Button>

            {files && files.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={clearFiles}
                disabled={isProcessing}
              >
                Clear Files
              </Button>
            )}
          </div>
        </form>

        {isProcessing && progressMessages.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-medium">Processing Log:</h3>
            {progressMessages.map((message, index) => (
              <p key={index} className="text-sm text-muted-foreground">
                {message}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 