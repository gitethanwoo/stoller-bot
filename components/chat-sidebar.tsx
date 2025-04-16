"use client";

import { useChat } from "ai/react";
import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { ChatInput } from "@/components/ui/chat-input";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { FileData } from "@/types/file-data";
import { StoredDocument } from "@/app/manage/types";


interface ChatSidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    selectedDocuments?: FileData[];
    showFileInput?: boolean;
    benefitsData: StoredDocument[];
}

const markdownComponents: Components = {
    a: (props) => (
        <a
            {...props}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
        />
    ),
    code: ({ className, children, ...props }) => (
        <code
            className={`${className} ${
                !className?.includes("language-")
                    ? "bg-gray-200 px-1 py-0.5 rounded"
                    : "block bg-gray-800 text-white p-4 rounded"
            }`}
            {...props}
        >
            {children}
        </code>
    ),
};

export function ChatSidebar({
    isOpen,
    setIsOpen,
    benefitsData = [],
}: ChatSidebarProps) {
    const [files, setFiles] = useState<FileList | undefined>(undefined);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        api: "/api/chat-web",
        maxSteps: 2, // Enable multi-step for RAG pipeline
    });

    useEffect(() => {
        // Scroll to bottom when messages change
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    }, [messages]);

    const handleFormSubmit = (e: React.FormEvent) => {
        handleSubmit(e, {
            experimental_attachments: files,
        });

        // Reset file input after submission
        setFiles(undefined);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleFileChange = (newFiles: FileList | undefined) => {
        setFiles(newFiles);
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetContent side="right" className="w-full sm:min-w-[560px] p-0">
                <SheetHeader className="px-5 py-4 border-b">
                    <SheetTitle>StollerBot</SheetTitle>
                </SheetHeader>
                
                <div className="flex flex-col h-[calc(100vh-6rem)]">
                    <div 
                        ref={scrollAreaRef}
                        className="flex-1 overflow-y-auto p-4 space-y-4"
                    >
                        {messages.map((message) => (
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
                                                ? "bg-blue-100 px-5 py-2.5 rounded-3xl max-w-[70%] my-1"
                                                : "rounded-lg w-full py-1"
                                        )}
                                    >
                                        {message.content.length > 0 ? (
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={markdownComponents}
                                            >
                                                {message.content}
                                            </ReactMarkdown>
                                        ) : message.toolInvocations && message.toolInvocations.length > 0 ? (
                                            <div className="text-sm text-gray-500 italic">
                                                Searching knowledge base...
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {/* Show loading state */}
                        {isLoading && (
                            <div className="flex justify-start items-start">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 shadow-inner">
                                    <span role="img" aria-label="robot" className="text-xl">
                                        🤖
                                    </span>
                                </div>
                                <div className="rounded-lg w-full py-1">
                                    <div className="text-sm text-gray-500 italic animate-pulse">
                                        {messages.length > 0 && 
                                         messages[messages.length - 1].toolInvocations ? 
                                         "Processing search results..." : "Thinking..."}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="border-t px-4 pt-6">
                        <ChatInput
                            value={input}
                            onChange={handleInputChange}
                            onSubmit={handleFormSubmit}
                            placeholder="Ask me anything..."
                            disabled={isLoading}
                            onFileChange={handleFileChange}
                            files={files}
                        />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
