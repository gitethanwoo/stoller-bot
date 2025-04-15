import Link from 'next/link';
import React, { memo, useRef, useState, useEffect } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const TableWrapper = ({ children }: { children: React.ReactNode }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showButtons, setShowButtons] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (el) {
      const canScrollL = el.scrollLeft > 0;
      const canScrollR = el.scrollLeft < el.scrollWidth - el.clientWidth;
      const needsScroll = el.scrollWidth > el.clientWidth;

      setShowButtons(needsScroll);
      setCanScrollLeft(canScrollL);
      setCanScrollRight(canScrollR);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (el) {
      const amount = direction === 'left' ? -200 : 200;
      el.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <div className="my-6 w-full overflow-hidden">
      <div className="relative">
        {showButtons && (
          <>
            <button
              onClick={() => scroll('left')}
              className={cn(
                "absolute left-1 bottom-0 z-10 h-8 w-8 -translate-y-1/2 rounded-full bg-background/80 p-1.5 backdrop-blur-sm shadow-md transition-all",
                "hover:bg-background hover:shadow-md",
                "disabled:opacity-0",
                !canScrollLeft && "opacity-0"
              )}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-full w-full" />
            </button>
            <button
              onClick={() => scroll('right')}
              className={cn(
                "absolute right-1 bottom-0 z-10 h-8 w-8 -translate-y-1/2 rounded-full bg-background/80 p-1.5 backdrop-blur-sm shadow-md transition-all",
                "hover:bg-background hover:shadow-md",
                "disabled:opacity-0",
                !canScrollRight && "opacity-0"
              )}
              disabled={!canScrollRight}
              aria-label="Scroll right"
            >
              <ChevronRight className="h-full w-full" />
            </button>
          </>
        )}
        <div 
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="max-w-full overflow-auto rounded-lg border border-border shadow-md"
        >
          <div className="min-w-max">
            {children}
          </div>
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-border/10 to-transparent" />
        </div>
      </div>
    </div>
  );
};

const components: Partial<Components> = {
  code: ({ children, ...props }) => (
    <code
      className="bg-gray-200 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono"
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ children }) => <>{children}</>,
  p: ({ children, ...props }) => (
    <p className="leading-relaxed" {...props}>
      {children}
    </p>
  ),
  ol: ({ children, ...props }) => (
    <ol className="list-decimal list-outside ml-4 mb-4 space-y-1" {...props}>
      {children}
    </ol>
  ),
  ul: ({ children, ...props }) => (
    <ul className="list-disc list-outside ml-4 mb-4 space-y-1" {...props}>
      {children}
    </ul>
  ),
  li: ({ children, ...props }) => (
    <li className="py-1" {...props}>
      {children}
    </li>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),
  a: ({ href = '#', children, ...props }) => (
    <Link
      href={href}
      className="text-blue-600 hover:text-blue-800 underline break-words"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </Link>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-4 border-gray-300 dark:border-gray-700 pl-4 my-4 italic text-gray-700 dark:text-gray-300"
      {...props}
    >
      {children}
    </blockquote>
  ),
  h1: ({ children, ...props }) => (
    <h1 className="text-3xl font-bold mt-6 mb-4" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="text-2xl font-bold mt-5 mb-3" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="text-xl font-bold mt-4 mb-2" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 className="text-lg font-bold mt-4 mb-2" {...props}>
      {children}
    </h4>
  ),
  h5: ({ children, ...props }) => (
    <h5 className="text-base font-bold mt-4 mb-2" {...props}>
      {children}
    </h5>
  ),
  h6: ({ children, ...props }) => (
    <h6 className="text-sm font-bold mt-4 mb-2" {...props}>
      {children}
    </h6>
  ),
  table: ({ children, ...props }) => (
    <TableWrapper>
      <table className="w-full border-collapse bg-background text-sm" {...props}>
        {children}
      </table>
    </TableWrapper>
  ),
  thead: ({ children, ...props }) => (
    <thead className="border-b border-border bg-muted/50" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => (
    <tbody className="divide-y divide-border" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }) => (
    <tr className="m-0 p-0 even:bg-muted/30 hover:bg-muted/50 transition-colors" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th className="border-r border-border px-4 py-3 text-left font-medium last:border-r-0" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="border-r border-border px-4 py-3 text-left last:border-r-0" {...props}>
      {children}
    </td>
  ),
  hr: () => (
    <hr className="border-t border-gray-200 my-6" />
  ),
};

const remarkPlugins = [remarkGfm];

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
      {children}
    </ReactMarkdown>
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);
