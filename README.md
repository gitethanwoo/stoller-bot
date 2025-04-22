# Stoller Bot

A Next.js application that provides a conversational AI chatbot interface to answer questions about the Stoller Report using RAG (Retrieval Augmented Generation) technology.

## Overview

Stoller Bot is designed to provide insights and information from the Stoller Report through a conversational interface. The application includes:

- A user-facing chatbot interface to ask questions about the Stoller Report
- An admin interface for knowledge management (uploading, vectorizing, and managing documents)
- Vector-based semantic search capabilities to retrieve relevant information from documents
- OpenAI integration for embedding generation and chat completion

## Features

- **Conversational AI**: Chat interface powered by OpenAI's GPT models
- **RAG (Retrieval Augmented Generation)**: Enhances AI responses with information retrieved from a knowledge base
- **Document Management**: Upload, process, and manage knowledge base documents
- **Vector Search**: Semantic search capability using embeddings stored in Upstash Vector
- **Authentication**: Secure admin interface for knowledge management

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Frontend**: React, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes, OpenAI API
- **Database**: Upstash Redis (document storage), Upstash Vector (vector database)
- **AI**: OpenAI embeddings and completions
- **State Management**: React Query, nuqs
- **Document Processing**: PDF/Document parsing and chunking

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key
- Upstash Redis and Vector accounts

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/stoller-bot.git
cd stoller-bot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory with the following environment variables:

```
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Upstash Redis
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# Upstash Vector
UPSTASH_VECTOR_REST_URL=your_upstash_vector_url
UPSTASH_VECTOR_REST_TOKEN=your_upstash_vector_token

# Admin Authentication
ENRICH_PASSWORD=your_admin_password

# Optional KV Storage (if used)
KV_REST_API_URL=your_kv_url
KV_REST_API_TOKEN=your_kv_token
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

### User Interface

The main page at `/` provides a chat interface where users can:
- Ask questions about the Stoller Report
- View AI-generated responses with information from the knowledge base
- Select from example questions to get started

### Admin Interface

The admin interface at `/manage` allows authorized users to:
- Upload new documents to the knowledge base
- Vectorize documents for semantic search
- Edit document content
- Delete documents and their associated vectors
- Test vector search functionality
- Try the chatbot with the current knowledge base

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for embeddings and completions | Yes |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST API URL | Yes |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST API token | Yes |
| `UPSTASH_VECTOR_REST_URL` | Upstash Vector REST API URL | Yes |
| `UPSTASH_VECTOR_REST_TOKEN` | Upstash Vector REST API token | Yes |
| `ENRICH_PASSWORD` | Password for the admin interface | Yes |
| `KV_REST_API_URL` | KV storage REST API URL (if used) | No |
| `KV_REST_API_TOKEN` | KV storage REST API token (if used) | No |

## How It Works

1. **Document Processing**:
   - Documents are uploaded and parsed into text
   - Text is chunked into smaller segments with overlap
   - Each chunk is embedded using OpenAI's text-embedding-3-small model
   - Embeddings are stored in Upstash Vector with metadata

2. **Chat Interface**:
   - User questions are processed through the `/api/chat-web` endpoint
   - The system uses a multistep approach:
     1. User query is embedded
     2. Relevant document chunks are retrieved from Upstash Vector
     3. Retrieved content is used as context for OpenAI's completion
     4. Model generates a response based on the retrieved information

3. **Knowledge Management**:
   - Admin interface allows uploading, editing, and managing documents
   - Documents are stored in Upstash Redis
   - Document chunks are embedded and stored in Upstash Vector
   - Admin can test search and chat functionality

## License

[Your License Information]

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [OpenAI](https://openai.com/)
- [Upstash](https://upstash.com/)
- [Shadcn UI](https://ui.shadcn.com/)
