"use client"

import { Suspense } from "react"
import { ChatSection } from "@/components/welcome/chat"
import { WelcomeLayout } from "@/components/welcome/layout"
import { useChat } from "ai/react"
import { useBenefits } from "@/providers/benefits-provider"
import { useState } from "react"

function Loading() {
  return <div>Loading...</div>
}

function WelcomePage() {
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const { benefits } = useBenefits();

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat-web",
    maxSteps: 2, // Enable multi-step for RAG knowledge base search
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