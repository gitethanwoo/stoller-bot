import { generateObject, streamObject } from "ai"
import { z } from "zod"
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import { createCanvas, CanvasRenderingContext2D as NodeCanvasRenderingContext2D } from 'canvas';
import { openai } from '@ai-sdk/openai';
import path from 'path';

// Initialize PDF.js worker
GlobalWorkerOptions.workerSrc = path.join(process.cwd(), 'node_modules/pdfjs-dist/build/pdf.worker.js');

async function pdfToImages(buffer: ArrayBuffer): Promise<string[]> {
  // Load the PDF document
  const pdf = await getDocument({ data: buffer }).promise;
  const pageCount = pdf.numPages;
  
  // Convert each page to a PNG image
  const pageImages: string[] = [];
  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for better quality
    
    // Create canvas using node-canvas
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d') as NodeCanvasRenderingContext2D;
    
    // Render PDF page to canvas
    await page.render({
      canvasContext: context as unknown as CanvasRenderingContext2D,
      viewport,
    }).promise;
    
    // Convert canvas to PNG base64
    const imageUrl = canvas.toDataURL('image/png');
    pageImages.push(imageUrl);
  }
  
  return pageImages;
}


export async function extractPageContent(pageImage: string): Promise<string> {
  
  const contentSchema = z.object({
    content: z.string().describe('The extracted text content from the page')
  });
  
  const result = await streamObject({
    model: openai('gpt-4o'),
    schema: contentSchema,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract all text from this PDF page image, preserving formatting and structure. For tables, format them as markdown tables. For images or diagrams, provide a brief description in brackets. Return ONLY the extracted content."
          },
          {
            type: 'image',
            image: pageImage.split(',')[1] // Remove data URL prefix
          }
        ]
      }
    ]
  });

  return (await result.object).content;
}

export async function processPDFContent(file: File): Promise<{
  text: string;
  title: string;
}> {
  const buffer = await file.arrayBuffer();
  const pageImages = await pdfToImages(buffer);
  
  const pageContents = await Promise.all(
    pageImages.map(async (image) => {
      const content = await extractPageContent(image);
      return content;
    })
  );

  const fullText = pageContents.join('\n');
  
  const metadataSchema = z.object({
    title: z.string().describe('A clear, specific title for the document'),
  });
  
  const result = await generateObject({
    model: openai('gpt-4o'),
    schema: metadataSchema,
    messages: [
      {
        role: "user",
        content: `Based on the following document content, provide a clear and specific title:\n\n${fullText}`
      }
    ]
  });

  return {
    text: fullText,
    title: (await result.object).title
  };
}