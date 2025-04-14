import Image from "next/image";
import { ThemeLogo } from "@/components/theme-logo";
import { ChatInput } from "@/components/ui/chat-input";
import { useEffect, useRef } from "react";

interface WelcomeScreenProps {
  input: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onFileChange?: (files: FileList | undefined) => void;
  files?: FileList;
  isLoading?: boolean;
}

export function WelcomeScreen({ 
  input, 
  onChange, 
  onSubmit,
  onFileChange,
  files,
  isLoading 
}: WelcomeScreenProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the input on mount
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2 flex flex-col items-center">
          <div className="flex items-center gap-4">
            <ThemeLogo />
            <span className="text-lg mt-1.5 text-foreground">✕</span>
            <div className="pt-2">
              <Image 
                src="/stoller-logo.svg" 
                alt="Stoller Plus Logo" 
                width={120} 
                height={120}
                priority
              />
            </div>
          </div>
        </h1>
        <p className="text-lg text-muted-foreground text-balance mb-4">
          A helpful chatbot equipped to answer questions about the Stoller Report. 
        </p>
      </div>

      <div className="w-full max-w-2xl mx-auto">
        <ChatInput
          ref={inputRef}
          value={input}
          onChange={onChange}
          onSubmit={onSubmit}
          placeholder="Ask me anything..."
          onFileChange={onFileChange}
          files={files}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground text-center mt-2">
          Stoller Bot can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
} 