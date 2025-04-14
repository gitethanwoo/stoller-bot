import { StoredDocument } from "../types";

export function searchDocuments(
  documents: Record<string, StoredDocument>,
  searchTerm: string
): Record<string, StoredDocument> {
  if (!searchTerm.trim()) return documents;
  
  const normalizedSearch = searchTerm.toLowerCase().trim();
  
  return Object.entries(documents).reduce((acc, [key, doc]) => {
    const searchableContent = [
      doc.title,
      doc.text,
    ].join(' ').toLowerCase();

    if (searchableContent.includes(normalizedSearch)) {
      acc[key] = doc;
    }
    
    return acc;
  }, {} as Record<string, StoredDocument>);
} 