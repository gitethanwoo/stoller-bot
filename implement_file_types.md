# Plan for Implementing Additional File Type Support (DOCX, XLSX, PPTX)

## 1. Project Context & Goal

*   **Project:** Create a chatbot assistant to provide insights from a collection of documents, often sourced from a disorganized Google Drive.
*   **Core Requirement:** Extend the existing PDF processing to handle `.docx`, `.xlsx`, and `.pptx` files.
*   **Key Feature:** Preserve the **original filename** during processing so the chatbot can reference the specific source document when answering user questions, helping users locate the file in their drive.

## 2. Overall Strategy

*   **Processing Location:** Server-side API route (`app/api/enrich/route.ts`) to handle dependencies and potentially large files.
*   **File Type Detection:** Use `file.type` (MIME type) or the file extension (`file.name.split('.').pop()`) within the API route to determine how to process the uploaded file.
*   **Extraction Methods (Server-Side):**
    *   `.pdf`, `.pptx`: Convert pages/slides to images using server-side libraries (`pdfjs-dist`, `canvas`, and a PPTX-to-image solution), then use an LLM (e.g., GPT-4o Vision via `openai` SDK) for robust text and content extraction from each image.
    *   `.docx`: Use a dedicated library like `mammoth.js` for direct text/markdown extraction, preserving structure where possible.
    *   `.xlsx`: Use a dedicated library like `xlsx` (SheetJS Community Edition) to parse sheets and extract data as text (e.g., CSV or plain text format per sheet).
*   **Consistent Output Structure from API:** Define a standard interface for the data returned by the API endpoint:
    ```typescript
    // In app/api/enrich/route.ts
    interface ProcessedFileData {
      text: string;           // Extracted text content
      title: string;          // The original filename (used as the title)
      originalFilename: string; // The original name of the uploaded file
      redisKey: string;       // The key used for storage in Redis
    }
    ```
*   **Frontend Integration:** Update the frontend file upload mechanism (e.g., `hooks/useFileUpload.ts`, potentially `components/pdf-converter.tsx` needs refactoring or replacement) to accept the new types and handle the `ProcessedFileData` returned from the API.

## 3. Specific File Type Plans (Server-Side Logic in `app/api/enrich/route.ts`)

### `.pdf`
*   **Method:** Server-side use of `pdfjs-dist` + `canvas` to render pages to images, then `openai('gpt-4o')` (`processPage` function or similar) for LLM-based OCR/text extraction per page.
*   **Process:**
    1.  Receive `File`, get buffer, capture `originalFilename = file.name`.
    2.  Convert PDF pages to PNG images using `pdfjs-dist` and `canvas`.
    3.  For each page image, call LLM vision function (`processPage`).
    4.  Concatenate the text results from all pages.
    5.  Set `title = originalFilename`.
*   **Output:** `{ text: string }` (to be combined with `originalFilename` in the main `POST` handler).

### `.pptx`
*   **Method:** Server-side conversion of slides to images, then use LLM for extraction.
*   **Process:**
    1.  Receive `File`, get buffer, capture `originalFilename = file.name`.
    2.  **Convert PPTX Slides to Images:** (Requires Node.js library like `pptx2png`, server tooling like `libreoffice`, or an external API - investigate feasibility).
    3.  Once slide images are obtained, iterate through them.
    4.  For each slide image, use an LLM vision function (similar to `processPage`) for text/content extraction.
    5.  Concatenate the extracted text, potentially adding slide separators.
    6.  Set `title = originalFilename`.
*   **Output:** `{ text: string }`

### `.docx`
*   **Method:** Use the `mammoth.js` library.
*   **Process:**
    1.  Receive `File`, get buffer, capture `originalFilename = file.name`.
    2.  Use `mammoth.extractRawText({ buffer })` or `mammoth.convertToMarkdown({ buffer })`. Prefer Markdown if structure is useful.
    3.  Set `title = originalFilename`.
*   **Output:** `{ text: string }`

### `.xlsx`
*   **Method:** Use the `xlsx` (SheetJS Community Edition) library.
*   **Process:**
    1.  Receive `File`, get buffer, capture `originalFilename = file.name`.
    2.  Parse the workbook: `const workbook = xlsx.read(buffer);`
    3.  Iterate through sheet names.
    4.  For each sheet, convert it to text (e.g., CSV or TXT format).
    5.  Concatenate the text from all sheets, including sheet names as headers.
    6.  Set `title = originalFilename`.
*   **Output:** `{ text: string }`

## 4. API Implementation Checklist (`app/api/enrich/route.ts`)

**Context:** Refactoring the API to handle raw file uploads (`File` objects) and perform all processing server-side, supporting multiple file types.

-   [ ] **1. Install Dependencies:**
    -   [x] `mammoth`
    -   [x] `xlsx`
    -   [x] `pdfjs-dist` (confirm version compatibility for Node.js)
    -   [x] `canvas` (native dependency, ensure build tools are available on deployment environment if needed)
    -   Explanation: Add necessary libraries for server-side parsing.

-   [ ] **2. Add Imports in `app/api/enrich/route.ts`:**
    -   [ ] Import `mammoth` from 'mammoth'.
    -   [ ] Import `* as xlsx` from 'xlsx'.
    -   [ ] Import necessary PDF modules: `getDocument`, `GlobalWorkerOptions` from `pdfjs-dist/...` (find correct Node.js path), `PDFDocumentProxy`.
    -   [ ] Import `createCanvas`, `NodeCanvasRenderingContext2D` from `canvas`.
    -   [ ] Import `path` from 'path'.
    -   [ ] Initialize `GlobalWorkerOptions.workerSrc` for `pdfjs-dist`.
    -   Explanation: Make the required functions and objects available.

-   [ ] **3. Update `ProcessedDocument` Interface in `app/api/enrich/route.ts`:**
    -   [ ] Add `originalFilename: string`.
    -   [ ] Add `redisKey: string`.
    -   [ ] Ensure `title: string` remains (will hold `originalFilename`).
    -   Explanation: Define the final structure to be stored in Redis and potentially returned (partially) via SSE.

-   [ ] **4. Create/Update Server-Side Processing Functions in `app/api/enrich/route.ts`:**
    -   [ ] **`processDocx(buffer: ArrayBuffer): Promise<{ text: string }>`:** Implement using `mammoth`.
    -   [ ] **`processXlsx(buffer: ArrayBuffer): Promise<{ text: string }>`:** Implement using `xlsx`.
    -   [ ] **`processPptx(file: File, sendProgress: Function): Promise<{ text: string }>`:** Stub this function. Requires PPTX-to-image implementation (defer).
    -   [ ] **`processPDFServerSide(file: File, sendProgress: Function): Promise<{ text: string }>`:** Create this new function.
        -   Get buffer: `await file.arrayBuffer()`.
        -   Use `getDocument({ data: buffer })`.
        -   Loop through pages, render each to `canvas` (`pdfPage.render(...)`).
        -   Convert canvas to image data (`canvas.toDataURL` or buffer).
        -   Call `processPage` (existing LLM vision function) for each image.
        -   Concatenate text results.
    -   [ ] **`processPage(pageData: { pageNum: number; image: string }): Promise<string>`:** Keep this existing function for LLM vision processing (used by PDF/PPTX).
    -   Explanation: Create modular functions for server-side parsing logic for each file type.

-   [ ] **5. Refactor `POST` Handler in `app/api/enrich/route.ts`:**
    -   [ ] **Input:** Modify `req.formData()` handling to expect a single `file` object.
        -   `const file = formData.get('file') as File | null;`
        -   Validate `file`.
    -   [ ] **Filename:** Extract `const originalFilename = file.name;`.
    -   [ ] **File Type Detection:** Implement logic using `file.type` or extension.
    -   [ ] **Routing Logic:** Use a `switch` statement based on detected type to:
        -   Call `processDocx(await file.arrayBuffer())`.
        -   Call `processXlsx(await file.arrayBuffer())`.
        -   Call `processPDFServerSide(file, sendProgress)`.
        -   Call `processPptx(file, sendProgress)` (will initially hit stub).
    -   [ ] **Result Handling:**
        -   Receive the `{ text }` object from the processing function.
        -   Define `const title = originalFilename;`.
    -   [ ] **Redis Key Generation:** Generate `redisKey` based on `originalFilename` (e.g., using `getUniqueFileName` or a simpler sanitizer).
        -   `const redisKey = \`docs:${sanitizeFilename(originalFilename)}\`;` (Need `sanitizeFilename` helper).
    -   [ ] **Redis Storage:** Construct the `ProcessedDocument` object `{ title, text, originalFilename, redisKey }` and store it in Redis: `await redis.set(redisKey, JSON.stringify(docToStore));`.
    -   [ ] **SSE Response:** Update the `'complete'` message data structure. Decide what info the client needs (e.g., `title`, `originalFilename`, `redisKey`, maybe a snippet of `text`?).
    -   [ ] **Error Handling:** Enhance `try...catch` blocks for each processing path.
    -   Explanation: Adapt the main API endpoint to handle various file types via direct upload, orchestrate server-side processing, store results, and communicate via SSE.

-   [ ] **6. Helper Functions in `app/api/enrich/route.ts`:**
    -   [ ] Review/update `getUniqueFileName` to accept `originalFilename` and ensure it generates safe keys. Or replace with a simpler `sanitizeFilename` function if Redis existence checks are not strictly needed before setting.
    -   Explanation: Ensure utility functions support the new workflow.

-   [ ] **7. Client-Side Refactoring (e.g., `components/pdf-converter.tsx`, `hooks/useFileUpload.ts`):**
    -   **Modify Upload Logic:** Change the client to send the raw `File` object in `FormData` under the key `file` to `/api/enrich`, instead of sending pre-processed page images.
    -   **Remove Client-Side PDF Processing:** Delete the code in the client that uses `pdfjs-dist` and `canvas` to convert PDF pages to images.
    -   **Update State/UI:** Adjust `FileData` interface in `useFileUpload.ts` and UI components to handle the `ProcessedFileData` structure returned via SSE from the refactored API. Accept `.docx`, `.xlsx`, `.pptx` file types in the input element.
    -   Explanation: The client becomes simpler, primarily responsible for file selection, upload, and displaying progress/results received from the server. (This step happens *after* the API is refactored). 