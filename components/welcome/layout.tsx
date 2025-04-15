"use client";


import React from "react";
import { Message } from "ai";
import { ChatMessages } from "@/components/chat-messages";
import { ChatInput } from "@/components/ui/chat-input";
import { ChatHeader } from "@/components/chat-header";

interface SectionProps {
  id: string;
  children?: React.ReactNode;
  className?: string;
}

interface WelcomeLayoutProps {
  children: React.ReactNode;
  hasInteracted: boolean;
  messages: Message[];
  input: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  onMinimize?: () => void;
}

export function WelcomeLayout({ 
  children, 
  hasInteracted,
  messages,
  input,
  onChange,
  onSubmit,
  isLoading,
  onMinimize
}: WelcomeLayoutProps) {
  if (hasInteracted) {
    return (
      <div className="fixed inset-0 bg-background z-50 animate-in fade-in duration-300">
        <div className="flex flex-col h-screen">
          <div onClick={onMinimize} className="cursor-pointer">
            <ChatHeader />
          </div>
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto w-full">
                <ChatMessages messages={messages} isLoading={isLoading} />
              </div>
            </div>
            <div className="flex-shrink-0 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="max-w-2xl mx-auto w-full px-4 py-4">
                <ChatInput
                  value={input}
                  onChange={onChange}
                  onSubmit={onSubmit}
                  placeholder="Ask me anything..."
                  disabled={isLoading}
                  hideFileUpload
                />
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Stoller Bot can make mistakes. Check important info.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Split children into chat section and other sections
  const childrenArray = React.Children.toArray(children) as React.ReactElement<SectionProps>[];
  const chatSection = childrenArray.find((child) => child.props.id === "chat");

  return (
    <>
      <ChatHeader />
      <div className="relative">
        {/* Chat Section */}
        {chatSection}
        
      </div>
    </>
  );
} 