import { Message } from "ai";
import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/markdown";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outline" size="sm" onClick={copy}>
      {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
}

function Loading({ toolName }: { toolName?: string }) {
  const message = toolName ? "Searching the Knowledge Base..." : "Thinking...";
  
  return (
    <div className="flex items-center space-x-2 text-gray-500 italic">
      <span className="animate-pulse">{message}</span>
    </div>
  );
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Get visible messages (filter out empty tool call messages)
  const visibleMessages = useMemo(() => {
    return messages.filter(message => {
      // Keep user messages
      if (message.role === "user") return true;
      
      // Keep assistant messages with content
      if (message.role === "assistant" && message.content.length > 0) return true;
      
      // Filter out tool invocation messages without content
      return false;
    });
  }, [messages]);

  // Get the current tool call if present
  const currentToolCall = useMemo(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && lastMessage?.toolInvocations && lastMessage.toolInvocations.length > 0) {
      return lastMessage.toolInvocations[0].toolName;
    }
    return undefined;
  }, [messages]);

  // Determine if we're waiting for a response
  const waitingForResponse = useMemo(() => {
    if (!isLoading) return false;
    
    const lastMessage = messages[messages.length - 1];
    return lastMessage?.role === 'user';
  }, [isLoading, messages]);

  // Scroll handling
  const handleScroll = useCallback(() => {
    if (messagesEndRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesEndRef.current;
      const isNearBottom = scrollHeight - (scrollTop + clientHeight) <= 1;
      setShowScrollButton(!isNearBottom);
    }
  }, []);

  useEffect(() => {
    handleScroll();
  }, [handleScroll, messages.length, isLoading]);

  useEffect(() => {
    if (messagesEndRef.current && !showScrollButton) {
      messagesEndRef.current.scrollTo({
        top: messagesEndRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages.length, showScrollButton]);

  useEffect(() => {
    const messageContainer = messagesEndRef.current;
    if (messageContainer) {
      messageContainer.addEventListener('scroll', handleScroll);
      return () => messageContainer.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  return (
    <div className="relative h-full">
      <div
        ref={messagesEndRef}
        className="h-full overflow-y-auto overflow-x-hidden"
      >
        <div className="max-w-2xl mx-auto w-full px-4 py-4 space-y-6">
          {visibleMessages.map((message, index) => (
            <div key={message.id}>
              {/* Show attachments above message for user messages */}
              {message.role === "user" &&
                message?.experimental_attachments?.some((attachment) =>
                  attachment?.contentType?.startsWith("image/")
                ) && (
                  <div className="flex justify-end mb-1">
                    <div className="flex gap-1">
                      {message.experimental_attachments
                        .filter((attachment) =>
                          attachment?.contentType?.startsWith("image/")
                        )
                        .map((attachment, i) => (
                          <div
                            key={`${message.id}-attachment-${i}`}
                            className="w-32 h-32 border rounded-lg border-gray-400 relative shadow-sm overflow-hidden"
                          >
                            <Image
                              src={attachment.url}
                              fill
                              alt={attachment.name ?? `attachment-${i}`}
                              className="object-cover"
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              <div
                className={`flex ${
                  message.role === "user"
                    ? "justify-end"
                    : "justify-start items-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 shadow-inner">
                    <span role="img" aria-label="robot" className="text-xl">
                      🤖
                    </span>
                  </div>
                )}
                <div
                  className={cn(
                    message.role === "user"
                      ? "bg-blue-100 text-black dark:text-white dark:bg-blue-500 px-5 py-2.5 rounded-3xl max-w-[70%] my-1"
                      : "rounded-lg w-full py-1 max-w-full overflow-hidden",
                    isLoading &&
                      index === visibleMessages.length - 1 &&
                      message.role === "assistant" &&
                      "animate-fade-in opacity-0"
                  )}
                >
                  <div className="overflow-x-hidden max-w-full">
                    <Markdown>{message.content}</Markdown>
                    {message.role === "assistant" && (
                      <div className="flex justify-start mt-2">
                        <CopyButton text={message.content} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Loading State - Only show if we're waiting for a response or during tool calls */}
          {isLoading && (waitingForResponse || currentToolCall) && (
            <div className="flex justify-start items-start mt-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 shadow-inner">
                <span role="img" aria-label="robot" className="text-xl">
                  🤖
                </span>
              </div>
              <div className="rounded-lg w-full py-1">
                <Loading toolName={currentToolCall} />
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Scroll to bottom button */}
      {showScrollButton && (
         <Button
           variant="outline"
           size="sm"
           className="absolute bottom-4 right-4 z-10"
           onClick={() => messagesEndRef.current?.scrollTo({ top: messagesEndRef.current.scrollHeight, behavior: 'smooth' })}
         >
           Scroll to bottom
         </Button>
       )}
    </div>
  );
} 