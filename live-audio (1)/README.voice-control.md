# Voice Control Plugin ("Hey Prism")

This document outlines the functionality and integration of the wake-word-powered voice control plugin. It allows users to interact with checklists using natural language commands.

**Commit Message Suggestion:**
`feat: add voice-control plugin (wake-word 'Hey Prism') + demo & parser tests`

**CHANGELOG Entry:**
- **Added:** A new voice control plugin that listens for the wake word "Hey Prism" to open and fill checklists via voice commands.
- **Added:** A reusable React hook `useVoiceCommands` to encapsulate voice recognition logic.
- **Added:** A demo component `/src/components/VoiceControlDemo.jsx` to showcase the feature.
- **Added:** Unit tests for the command parser.

---

## 1. Running the Demo

To test the plugin locally:

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Integrate the demo (one-time setup):**
    You need to render the demo component within your application. For example, in your main application file (e.g., `src/main.jsx` or `src/App.jsx`), add:
    ```jsx
    import { VoiceControlDemo } from './components/VoiceControlDemo';

    // In your main component's return statement:
    return (
      <div>
        {/* Your existing app components */}
        <VoiceControlDemo />
      </div>
    );
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    ```
4.  Open your browser, navigate to the app, and grant microphone permissions when prompted.
5.  Press "Start Listening" and try the example utterances below.

## 2. How It Works

The plugin is powered by a reusable React hook, `useVoiceCommands`, which uses the browser's native **Web Speech API** for fast, local speech recognition.

- It continuously listens for the wake word **"Hey Prism"**.
- Once detected, it captures the following speech for up to 4 seconds to parse a command.
- It extracts an `action` ('open' or 'fill') and a `target` (the name of the checklist).

### Example Utterances

- "Hey Prism, fill the checklist for 12th main"
- "Hey Prism, open checklist for '12th Main Cafe'"
- "Hey Prism, let's populate the checklist for crown bakery"
- "Hey Prism show me the checklist for downtown"
- "Hey Prism complete the checklist for the new store"

## 3. Integrating with Your Checklist UI

To wire this into your real application, you will use the `useVoiceCommands` hook in your main checklist or dashboard component.

### Step 1: Use the Hook

In the component that manages your checklist's state, import and initialize the hook.

```jsx
import { useVoiceCommands } from './hooks/useVoiceCommands';
import { applyVoiceCommandToChecklist } from './components/VoiceControlAdapterExample';

function YourChecklistDashboard() {
  // Your existing state logic (e.g., useState, Redux, etc.)
  const { openChecklistByName, fillChecklistFields } = useYourChecklistStore();

  const handleCommand = (command) => {
    // Use the adapter to connect the command to your app's actions
    applyVoiceCommandToChecklist(command, {
      openChecklistByName,
      fillChecklistFields,
    });
  };

  const { start, stop, isListening } = useVoiceCommands({
    onCommand: handleCommand
  });

  // You can now use start(), stop(), and isListening to control the UI
  // ...
}
```

### Step 2: Connect to Actions

The `applyVoiceCommandToChecklist` function (in `src/components/VoiceControlAdapterExample.js`) shows a clear pattern for this. You pass it the `command` object from the hook and an `actions` object containing your app's specific functions for opening and filling checklists.

## 4. Fallback: Server-Side Transcription

The Web Speech API is not supported in all browsers (e.g., Firefox by default). The `useVoiceCommands` hook exposes an `isSupported` flag.

For unsupported browsers, you can implement a fallback that records audio and sends it to a server for transcription.

### How to Implement the Fallback

1.  **Check for support:** Use the `isSupported` flag from the hook to render a different UI or trigger the recording logic.
2.  **Record Audio:** Use the `MediaRecorder` API to capture a short audio clip.
3.  **Implement `transcribeWithServer`:** The hook contains a placeholder function `transcribeWithServer(blob)`. You need to implement its body to send the audio blob to your backend.

**Example Server Endpoint:**
Your server should expose an endpoint that accepts audio data.

- **Endpoint:** `POST /transcribe`
- **Auth:** Use an API key in the `Authorization` header.
- **Body:** `multipart/form-data` with an `audio` field containing the audio file.

**Example `curl` request:**
```bash
curl -X POST "https://your-server.com/transcribe" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -F "audio=@/path/to/audio.webm"
```

**Expected JSON Response:**
```json
{
  "text": "open the checklist for 12th main"
}
```

Once you receive the transcribed text, you can pass it to the `parseCommand` function (exported from the hook) to get a structured command object.

## 5. Security & Privacy Notice

- **Local Processing:** By default, this plugin uses the browser's Web Speech API. In browsers like Chrome, this processing happens on-device or on Google's servers, governed by the browser's privacy policy. No audio is sent to *your* servers.
- **Server Fallback:** If you implement the server-side transcription fallback, you will be sending user voice data to your own backend and potentially to a third-party transcription service (e.g., OpenAI, Google Cloud Speech-to-Text).
- **WARNING:** Be aware that this audio may contain sensitive information. Ensure your privacy policy is updated accordingly and that you handle the data securely. **Do not hardcode API keys in the frontend code; use environment variables.**

## 6. Next Steps & Improvements

- **Advanced Entity Extraction:** For commands like "fill checklist... AM name is John", use a lightweight NLP library or an LLM call to extract structured field data (`{ am_name: 'John' }`) from the raw transcript.
- **Synonym Mapping:** Create a mapping on the client or server to handle different names for the same location (e.g., "12th main" and "Twelfth Main Street Cafe" both point to the same checklist).
- **UI Feedback:** Provide richer visual and audio feedback to the user when commands are successfully executed.
