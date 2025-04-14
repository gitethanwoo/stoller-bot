'use client'

import { ThemeLogo } from "@/components/theme-logo";

export function ChatHeader() {
  return (
    <header className="sticky py-2 top-0 w-full bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-50">
      <div className="max-w-[1280px] mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center py-2 gap-2">
            <ThemeLogo />
          </div>
          {/* Navigation links commented out
          <nav className="hidden md:flex items-center gap-6">
            <a 
              href="#chat" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Chat
            </a>
            <a 
              href="#objective" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Objective
            </a>
            <a 
              href="#research" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Research
            </a>
            <a 
              href="#deliverables" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Deliverables
            </a>
          </nav>
          */}
        </div>
      </div>
    </header>
  );
} 