import { useState } from 'react'

interface FileData {
  id: string;
  name: string;
  size: string;
  type: string;
  file: File;
  title: string | null;
  text: string | null;
  redisKey: string | null;
  error?: string;
}

export function useFileUpload() {
  const [files, setFiles] = useState<FileData[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const clearFiles = () => {
    setFiles([])
    setIsProcessing(false)
  }

  return {
    files,
    setFiles,
    isProcessing,
    setIsProcessing,
    clearFiles
  }
}

