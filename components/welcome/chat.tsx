"use client";

import { ChatInput } from "@/components/ui/chat-input";
import { ThemeLogo } from "@/components/theme-logo";
import Image from "next/image";

export function ChatSection({
  input,
  onChange,
  onSubmit,
  isLoading,
}: {
  input: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
}) {
  const handleExampleClick = (question: string) => {
    // Create a synthetic change event
    const event = {
      target: { value: question },
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(event);
    
    // Create a synthetic form event
    const formEvent = {
      preventDefault: () => {},
    } as React.FormEvent;
    onSubmit(formEvent);
  };

  return (
    <section id="chat" className="relative min-h-screen bg-background flex items-center justify-center py-8">
      <div className="hidden lg:hidden relative w-full h-96">
        <Image
          src="/mobile-header.png"
          alt="Header illustration"
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 w-full">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex flex-col items-center justify-center w-full">
            <div className="flex items-center gap-2 mb-4">
              <ThemeLogo />
              <span className="text-xl md:text-2xl">×</span>
              <Image
                src="/stoller-logo.svg"
                alt="Stoller Logo"
                width={160}
                height={40}
                className="mt-2"
              />
            </div>

            <div className="flex flex-col items-center w-full">
              <h1 className="text-5xl md:text-6xl font-bold mb-4 md:mb-8 text-center text-balance">
                Ask me anything about the engagement
              </h1>
              <div className="space-y-8 max-w-2xl w-full">
                {/* Chat Input */}
                <div className="relative">
                  <ChatInput
                    value={input}
                    onChange={onChange}
                    onSubmit={onSubmit}
                    placeholder="Ask a question"
                    disabled={isLoading}
                    hideFileUpload
                  />
                </div>
                {/* Example Questions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleExampleClick("Tell me more about the recommended grant management system")}
                    className="text-left p-4 rounded-lg border bg-background/50 hover:bg-background/80 transition-colors"
                  >
                    Tell me more about the recommended grant management system
                  </button>
                  <button 
                    onClick={() => handleExampleClick("Tell me more about the project management office")}
                    className="text-left p-4 rounded-lg border bg-background/50 hover:bg-background/80 transition-colors"
                  >
                    Tell me more about the project management office
                  </button>
                  <button 
                    onClick={() => handleExampleClick("Tell me more about grantee solutions")}
                    className="text-left p-4 rounded-lg border bg-background/50 hover:bg-background/80 transition-colors"
                  >
                    Tell me more about grantee solutions
                  </button>
                  <button 
                    onClick={() => handleExampleClick("Which vendors were considered for the grant management system")}
                    className="text-left p-4 rounded-lg border bg-background/50 hover:bg-background/80 transition-colors"
                  >
                    Which vendors were considered for the grant management system
                  </button>
                </div>

                {/* Disclaimer */}
                <p className="text-sm text-muted-foreground text-center">
                  Stoller Bot can make mistakes. Verify important information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 