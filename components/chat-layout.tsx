import { cn } from "@/lib/utils";

interface ChatLayoutProps {
  children: React.ReactNode;
  hasInteracted: boolean;
}

export function ChatLayout({ children, hasInteracted }: ChatLayoutProps) {
  return (
    <div className={cn(
      "flex flex-col min-h-screen w-full transition-all duration-500",
      hasInteracted 
        ? "bg-background" 
        : "bg-background"
    )}>
      {children}
    </div>
  );
} 