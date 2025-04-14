import { Message } from "ai";
import { useRef, useEffect, useCallback, useState } from "react";
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

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Update the scroll event handler to be more sensitive
  const handleScroll = useCallback(() => {
    if (messagesEndRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesEndRef.current;
      // Show button if we're more than 50px from bottom
      const isAtBottom = Math.abs((scrollTop + clientHeight) - scrollHeight) < 50;
      setShowScrollButton(!isAtBottom);
    }
  }, []);

  // Check scroll position when messages change
  useEffect(() => {
    handleScroll();
  }, [handleScroll, messages.length]);

  // Auto-scroll to bottom when new messages come in
  useEffect(() => {
    if (messagesEndRef.current && !showScrollButton) {
      messagesEndRef.current.scrollTo({
        top: messagesEndRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages.length, showScrollButton]);

  // Add scroll event listener
  useEffect(() => {
    const messageContainer = messagesEndRef.current;
    if (messageContainer) {
      messageContainer.addEventListener('scroll', handleScroll);
      return () => messageContainer.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  return (
    <div 
      ref={messagesEndRef}
      className="h-full overflow-y-auto"
    >
      <div className="max-w-2xl mx-auto w-full px-4 py-4 space-y-6">
        {messages.map((message, index) => (
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
                      .map((attachment, index) => (
                        <div
                          key={`${message.id}-${index}`}
                          className="w-32 h-32 border rounded-lg border-gray-400 relative shadow-sm overflow-hidden"
                        >
                          <Image
                            src={attachment.url}
                            fill
                            alt={attachment.name ?? `attachment-${index}`}
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
                    : "rounded-lg w-full py-1",
                  isLoading && 
                    index === messages.length - 1 && 
                    "animate-fade-in opacity-0"
                )}
              >
                <Markdown>{message.content}</Markdown>
                {message.role === "assistant" && (
                  <div className="flex justify-start mt-2">
                    <CopyButton text={message.content} />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
          <div className="flex justify-start items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 shadow-inner">
              <span role="img" aria-label="robot" className="text-xl">
                🤖
              </span>
            </div>
            <div className="rounded-lg w-full py-1">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 