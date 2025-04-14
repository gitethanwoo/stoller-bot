'use client';

import * as pdfjsLib from 'pdfjs-dist';
import { toast } from 'sonner';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url,
  ).toString();
}

interface FileProcessorOptions {
  file: File;
  onComplete: (redisKey: string, title: string) => void;
  onError: (error: string) => void;
  onProgress: (message: string) => void;
  authToken: string;
}

export class FileProcessor {
  private file: File;
  private onComplete: (redisKey: string, title: string) => void;
  private onError: (error: string) => void;
  private onProgress: (message: string) => void;
  private authToken: string;

  constructor(options: FileProcessorOptions) {
    this.file = options.file;
    this.onComplete = options.onComplete;
    this.onError = options.onError;
    this.onProgress = options.onProgress;
    this.authToken = options.authToken;
  }

  async process() {
    try {
      const isPdf = this.file.type === 'application/pdf' || this.file.name.toLowerCase().endsWith('.pdf');
      const formData = new FormData();
      const originalFilename = this.file.name;

      if (isPdf) {
        this.onProgress(`Loading PDF ${originalFilename}...`);
        const pdfData = await this.file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(pdfData).promise;
        const pageCount = pdf.numPages;
        this.onProgress(`Converting ${pageCount} PDF pages to images...`);

        const pagePromises = [];
        for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
            pagePromises.push((async () => {
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 1.5 });

                const canvas = document.createElement('canvas');
                canvas.width = Math.floor(viewport.width);
                canvas.height = Math.floor(viewport.height);
                const context = canvas.getContext('2d');

                if (!context) {
                    throw new Error(`Could not get canvas context for page ${pageNum}`);
                }

                await page.render({ canvasContext: context, viewport: viewport }).promise;
                page.cleanup();

                const dataUrl = canvas.toDataURL('image/jpeg');
                return { 
                    pageNum: pageNum,
                    image: dataUrl.split(',')[1],
                    originalFilename: originalFilename
                };
            })());
        }
        
        const pageImagesData = await Promise.all(pagePromises);
        this.onProgress('Uploading page images for text extraction...');

        pageImagesData.forEach(pageData => {
            formData.append('pages', JSON.stringify(pageData));
        });

      } else {
        this.onProgress(`Preparing to upload ${originalFilename}...`);
        formData.append('file', this.file);
      }

      this.onProgress(`Sending ${isPdf ? 'page data' : originalFilename} to server...`);

      const response = await fetch('/api/enrich', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        },
        body: formData
      });

      if (!response.ok || !response.body) {
        const errorText = await response.text();
        throw new Error(`Server processing failed: ${response.status} ${errorText || response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalRedisKey = '';
      let finalTitle = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
            if (buffer.trim()) {
                console.warn('Stream ended with unprocessed data:', buffer);
                try {
                    const lines = buffer.split('\n').filter(Boolean);
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = JSON.parse(line.substring(6));
                            if (data.type === 'complete') { 
                                const result = data.enrichedResults?.[0];
                                if (result?.success) {
                                    finalRedisKey = result.redisKey;
                                    finalTitle = result.originalFilename || result.title || 'Untitled Document';
                                    this.onProgress(result.message || 'Processing complete!');
                                }
                            }
                        }
                    }
                } catch (parseError) {
                    console.error('Error parsing trailing stream data:', parseError);
                }
            }
            break; 
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(line.substring(6));
            
            if (data.type === 'progress') {
              this.onProgress(data.message);
            } else if (data.type === 'complete') {
              const result = data.enrichedResults?.[0];
              if (result?.success) {
                finalRedisKey = result.redisKey;
                finalTitle = result.originalFilename || result.title || 'Untitled Document';
                
                this.onProgress(result.message || 'Processing complete!');
              } else {
                const errorMessage = result?.error || data.message || 'Unknown processing error in completion message';
                this.onError(errorMessage);
                toast.error(errorMessage);
                return;
              }
            } else if (data.type === 'error') {
              this.onError(data.message);
              toast.error(data.message);
              return;
            }
          } catch (parseError) {
              console.error('Error parsing SSE line:', line, parseError);
          }
        }
      }
      
      if (finalRedisKey && finalTitle) {
          this.onComplete(finalRedisKey, finalTitle);
      } else {
          this.onError('Processing finished but no completion data was received.');
          toast.error('Processing finished but no completion data was received.');
      }

    } catch (error) {
      console.error('File processing error:', error);
      const message = error instanceof Error ? error.message : 'Failed to process file';
      this.onError(message);
      toast.error(message);
    }
  }
} 