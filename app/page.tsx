"use client"

import { Suspense } from "react"
import { ChatSection } from "@/components/welcome/chat"
import { WelcomeLayout } from "@/components/welcome/layout"
import { useChat } from "ai/react"
import { useState } from "react"

function Loading() {
  return <div>Loading...</div>
}

function WelcomePage() {
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat-web",
    maxSteps: 2, // Enable multi-step for RAG knowledge base search
    onError: (error) => {
      console.error("Chat error:", error);
    }
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasInteracted(true);
    setIsChatMinimized(false);
    handleSubmit(e);
  };

  const handleMinimize = () => {
    setIsChatMinimized(true);
  };

  const handleMaximize = () => {
    setIsChatMinimized(false);
    setHasInteracted(true);
  };

  return (
    <>
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-200 text-red-800 px-4 py-2 rounded shadow z-50">
          Error: {error.message}
        </div>
      )}
      <WelcomeLayout 
        hasInteracted={hasInteracted && !isChatMinimized}
        messages={messages}
        input={input}
        onChange={handleInputChange}
        onSubmit={handleFormSubmit}
        isLoading={isLoading}
        onMinimize={handleMinimize}
      >
        <div id="chat">
          <ChatSection 
            input={input}
            onChange={handleInputChange}
            onSubmit={handleFormSubmit}
            isLoading={isLoading}
          />
        </div>
      </WelcomeLayout>

      {/* Floating chat button */}
      {isChatMinimized && (
        <button
          onClick={handleMaximize}
          className="fixed bottom-6 right-6 bg-blue-300 text-3xl rounded-full size-16 shadow-lg hover:bg-blue-200 transition-colors"
        >
          🤖
        </button>
      )}
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <WelcomePage />
    </Suspense>
  )
}