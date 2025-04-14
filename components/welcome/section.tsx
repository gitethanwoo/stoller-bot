import { cn } from "@/lib/utils"

interface SectionProps {
  id: string;
  title: string;
  heading: string;
  children: React.ReactNode;
  showArrow?: boolean;
  className?: string;
}

// Map of current section to next section
const NEXT_SECTION: Record<string, string> = {
  'chat': 'objective',
  'objective': 'research',
  'research': 'deliverables',
}

export function Section({ 
  id, 
  title, 
  heading, 
  children, 
  showArrow = false,
  className 
}: SectionProps) {
  const nextSectionId = NEXT_SECTION[id];

  return (
    <section id={id} className={cn("relative lg:min-h-screen", className)}>
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 lg:py-16">
        <div className="text-xl uppercase tracking-wider text-muted-foreground mt-8 lg:mt-56 mb-4">
          {title}
        </div>

        <h2 className="text-4xl md:text-4xl font-bold mb-8 leading-tight">
          {heading}
        </h2>

        {children}

        {showArrow && nextSectionId && (
          <div className="mt-8 lg:mt-12">
            <a 
              href={`#${nextSectionId}`}
              className="group inline-block"
            >
              <div className="rounded-full bg-primary/10 p-3 md:p-4 w-12 md:w-16 h-12 md:h-16 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <svg 
                  className="w-6 md:w-8 h-6 md:h-8 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </div>
            </a>
          </div>
        )}
      </div>
    </section>
  )
} 