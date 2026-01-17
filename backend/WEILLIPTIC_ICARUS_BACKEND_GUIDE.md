# Weilliptic & Icarus Backend Integration Guide

This backend is designed to work efficiently with the Weilliptic SDK for privacy and the Icarus System for workflow tracking, powered by a free LLM (Gemini) for natural language command parsing.

## Components

### 1. LLM Service (`backend/services/llmService.js`)
- Uses **Google Gemini 1.5 Flash** (Free Tier).
- Parses natural language commands into structured workflow IDs and parameters.
- Features a regex-based fallback if no API key is provided.

### 2. Icarus Service (`backend/services/icarusService.js`)
- Tracks the lifecycle of every workflow execution.
- Manages real-time step logging.
- Generates Mermaid diagram definitions for workflow visualization.
- Maintains execution history and metrics.

### 3. Weilliptic SDK (`weilliptic/sdk.js`)
- Provides privacy-preserving hashing (SHA-256) for student IDs.
- Handles data encryption (AES-256-CBC).
- Generates cryptographic execution proofs (Merkle-root based).
- Formats execution data for the Icarus visualization.

## Setup

1. **Install Dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Environment Variables**:
   Update `backend/.env` with your keys:
   ```env
   PORT=3002
   SUPABASE_URL=...
   SUPABASE_ANON_KEY=...
   GEMINI_API_KEY=your_free_gemini_api_key
   TWILIO_ACCOUNT_SID=...
   TWILIO_AUTH_TOKEN=...
   TWILIO_WHATSAPP_FROM=...
   ```

3. **Get a Free Gemini API Key**:
   Visit [Google AI Studio](https://aistudio.google.com/) to get a free API key for the Gemini API.

## API Endpoints

- `POST /api/workflow/run`: Parse command and execute workflow.
- `GET /api/workflow/execution/:executionId`: Get status of a specific execution.
- `GET /api/workflow/executions/active`: Get currently running workflows.
- `GET /api/workflow/executions/history`: Get past execution details.
- `GET /api/workflow/list`: List available workflows.
- `GET /api/workflow/metrics`: Get system-wide Icarus metrics.

## Example Command
> "Check attendance for students below 70% and notify them via WhatsApp"

The LLM will parse this to:
```json
{
  "workflowId": "attendance_low_75",
  "params": { "threshold": 70 },
  "confidence": 0.98
}
```

## Security & Privacy
- **Hashing**: Student names and IDs are hashed before being stored in blockchain logs.
- **Proofs**: Each workflow generates a cryptographic proof of completion, ensuring auditability without exposing sensitive data.
- **Tracking**: Icarus provides a transparent view of every automated action taken by the agent.
