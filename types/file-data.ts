export interface FileData {
  id: string;
  name: string;
  size: string;
  type: string;
  pages?: number;
  file: File;
  description: string[] | null;
  outline: string | null;
  title: string | null;
  googleFileId: string | null;
  googleFileUrl: string | null;
  googleDisplayName?: string;
  googleMimeType?: string;
}
