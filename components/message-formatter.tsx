import { useMemo } from 'react';

interface MessageFormatterProps {
  content: string;
}

export function MessageFormatter({ content }: MessageFormatterProps) {
  const formattedContent = useMemo(() => {
    // Convert markdown-style links <url|text> to HTML links
    const linkRegex = /<(https?:\/\/[^|>]+)(?:\|([^>]+))?>/g;
    
    return content.split('\n').map((line, i) => {
      // Replace links
      const formattedLine = line.replace(linkRegex, (_, url, text) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${text || url}</a>`;
      });
      
      return (
        <div 
          key={i} 
          dangerouslySetInnerHTML={{ __html: formattedLine }}
          className="min-h-[1.2em]"
        />
      );
    });
  }, [content]);

  return <>{formattedContent}</>;
} 