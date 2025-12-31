# AI Integration Map - Prism Dashboard

This document provides a technical map of all AI services, models, and integration points used within the Prism application.

## 1. 📂 Core AI Service (GitHub Models / GPT-4o)
Used for data analysis, sentiment extraction, and operational insights.

- **Primary Model**: `gpt-4o-mini`
- **Proxy Endpoint**: `/api/analyze` (Serverless Function)
- **Configuration**: `VITE_GITHUB_TOKEN` (Environment Variable)
- **Integration Points**:
  - `aiInsightsService.ts`: Analyzes HR Connect remarks for sentiment and root causes.
  - `fourPAnalysisService.ts`: Maps qualitative feedback to the 4P (People, Process, Product, Place) framework.
  - `commentAnalysisService.ts`: Summarizes specific question responses.

## 2. 🎤 Real-Time Audio (Google Gemini)
Used for the interactive 3D audio-visual dialog interface.

- **Primary Model**: `gemini-2.5-flash-preview-native-audio-dialog`
- **Library**: `@google/genai`
- **Configuration**: `GEMINI_API_KEY` (Environment Variable)
- **Integration Points**:
  - `live-audio (1)/index.tsx`: Handles PCM audio capture, real-time streaming, and Orus voice synthesis.

## 3. 📝 Voice-to-Command (OpenAI)
Used for interpreting auditor voice transcripts into structured data.

- **Primary Model**: `gpt-4o-mini`
- **Backend Endpoint**: `/api/interpret` (Node.js Server)
- **Configuration**: `OPENAI_API_KEY` (Environment Variable)
- **Integration Points**:
  - `server/index.js`: Interprets raw transcripts to automatically toggle checklist items (Yes/No/NA) via wake-word ("Hey Prism").

## 4. 🧠 Adaptive Behavioral "AI" (Edge Logic)
Local browser-based intelligence used for assessment integrity.

- **Features**:
  - **Skin-Tone Face Detection**: Real-time pixel analysis for candidate presence.
  - **Sustained Noise Detection**: Analyzes audio amplitude to detect background speech.
  - **Focus-Loss Intelligence**: Monitors tab-switching and window focus.
- **Integration Points**:
  - `components/checklists/CampusHiringChecklist.tsx`: The behavioral proctoring engine.

---
*Note: AI features can be toggled via the Admin Configuration panel under "System Features".*
