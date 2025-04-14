"use client";

import { Input } from "@/components/ui/input";
import { Paperclip, X, ArrowUp } from "lucide-react";
import { useRef, useState, forwardRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  onFileChange?: (files: FileList | undefined) => void;
  files?: FileList;
  hideFileUpload?: boolean;
}

export const ChatInput = forwardRef<HTMLInputElement, ChatInputProps>(({
  value,
  onChange,
  onSubmit,
  placeholder = "Message the bot",
  disabled = false,
  onFileChange,
  files,
  hideFileUpload = false,
}, ref) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileClick = () => {
    if (files && files.length >= 3) {
      alert("Maximum 3 images allowed");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!onFileChange) return;

    const newFiles = event.target.files;
    if (!newFiles) return;

    // If we already have files, combine them with new files
    if (files) {
      const dt = new DataTransfer();
      
      // Add existing files
      Array.from(files).forEach(file => dt.items.add(file));
      
      // Add new files up to limit of 3
      Array.from(newFiles).forEach(file => {
        if (dt.files.length < 3) {
          dt.items.add(file);
        }
      });

      onFileChange(dt.files.length > 0 ? dt.files : undefined);
    } else {
      // If no existing files, just take first 3 new files
      const dt = new DataTransfer();
      Array.from(newFiles).slice(0, 3).forEach(file => dt.items.add(file));
      onFileChange(dt.files.length > 0 ? dt.files : undefined);
    }
  };

  const handleClearFile = (indexToRemove: number, e: React.MouseEvent) => {
    console.log('Clear event fired:', {
      target: e.target,
      currentTarget: e.currentTarget,
      eventPhase: e.eventPhase
    });
    
    console.log('Before removal:', {
      filesLength: files?.length,
      indexToRemove,
      dtFiles: Array.from(files || []).map(f => f.name)
    });

    e.preventDefault();
    e.stopPropagation();
    
    if (files && onFileChange) {
      const dt = new DataTransfer();
      
      Array.from(files).forEach((file, i) => {
        if (i !== indexToRemove) {
          dt.items.add(file);
        }
      });
      
      console.log('After removal:', {
        newFilesLength: dt.files.length,
        remainingFiles: Array.from(dt.files).map((f: File) => f.name)
      });
      
      onFileChange(dt.files.length > 0 ? dt.files : undefined);
      
      if (dt.files.length === 0 && fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles || !onFileChange) return;

    // Filter for only image files
    const imageFiles = Array.from(droppedFiles).filter(file => 
      file.type.startsWith('image/')
    );

    if (imageFiles.length === 0) return;

    // Combine with existing files or create new FileList
    const dt = new DataTransfer();
    
    // Add existing files first
    if (files) {
      Array.from(files).forEach(file => {
        if (dt.files.length < 3) dt.items.add(file);
      });
    }
    
    // Add new files up to limit of 3
    imageFiles.forEach(file => {
      if (dt.files.length < 3) dt.items.add(file);
    });

    onFileChange(dt.files.length > 0 ? dt.files : undefined);
  };

  return (
    <div 
      className={cn(
        "flex w-full flex-col rounded-[26px] p-1.5 transition-colors",
        !hideFileUpload && isDragging ? "bg-blue-50 dark:bg-blue-950 ring-2 ring-blue-500" : "bg-secondary"
      )}
      {...(!hideFileUpload && {
        onDragOver: handleDragOver,
        onDragLeave: handleDragLeave,
        onDrop: handleDrop
      })}
    >
      {!hideFileUpload && files && files.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 py-2">
          {Array.from(files).map((file, index) => (
            <div key={index} className="relative group">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-lg overflow-hidden">
                  <Image
                    src={URL.createObjectURL(file)}
                    alt={`Upload ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  onClick={(e) => handleClearFile(index, e)}
                  className="absolute -top-2 -right-2 bg-foreground rounded-full p-1.5
                           hover:bg-foreground/80 transition-all opacity-0 group-hover:opacity-100
                           z-20 shadow-sm"
                  type="button"
                >
                  <X className="h-3 w-3 text-white dark:text-black" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex items-center gap-1.5 pl-2">
        {!hideFileUpload && (
          <div className="flex items-center">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              multiple
            />
            <button
              onClick={handleFileClick}
              aria-label="Attach files"
              className={cn(
                "flex items-center justify-center h-8 w-8 rounded-xl hover:bg-black/10 text-foreground focus-visible:outline-black dark:focus-visible:outline-white",
                files && files.length >= 3 && "opacity-50 cursor-not-allowed"
              )}
              type="button"
              disabled={files && files.length >= 3}
            >
              <Paperclip className="h-5 w-5" />
            </button>
          </div>
        )}

        <form onSubmit={onSubmit} className="flex flex-1 items-center">
          <Input
            ref={ref}
            value={value}
            onChange={onChange}
            className="min-h-[40px] w-full text-md resize-none border-0 bg-transparent px-0 py-2 placeholder:text-muted-foreground focus:ring-0 focus-visible:ring-0 shadow-none"
            placeholder={placeholder}
            disabled={disabled}
          />
          <div>
            <button
              type="submit"
              disabled={disabled || (!value.trim() && (!files || files.length === 0))}
              className={cn(
                "flex h-8 w-8 mr-1 items-center justify-center rounded-full transition-colors",
                "hover:opacity-90 focus-visible:outline-none focus-visible:outline-black",
                "dark:focus-visible:outline-white",
                "bg-blue-600 text-white dark:bg-white dark:text-black",
                "disabled:bg-[#D7D7D7] dark:disabled:opacity-50 disabled:text-[#f4f4f4]",
                "dark:disabled:bg-token-text-quaternary dark:disabled:text-token-main-surface-secondary"
              )}
              aria-label="Send message"
              data-testid="send-button"
            >
              <ArrowUp strokeWidth={2.75} className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

ChatInput.displayName = "ChatInput";
