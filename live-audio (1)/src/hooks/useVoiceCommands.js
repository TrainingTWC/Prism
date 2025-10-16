import { useState, useEffect, useRef, useCallback } from 'react';

// A placeholder for server-side transcription.
// The developer should implement this to send the audio blob to their own backend.
async function transcribeWithServer(blob) {
  console.warn(
    'transcribeWithServer is not implemented. Please connect to your own transcription backend.'
  );
  // Example implementation:
  // const ASR_API_ENDPOINT = 'https://your-server.com/transcribe';
  // const ASR_API_KEY = process.env.ASR_API_KEY; // Use environment variables
  // const formData = new FormData();
  // formData.append('audio', blob, 'audio.webm');
  //
  // const response = await fetch(ASR_API_ENDPOINT, {
  //   method: 'POST',
  //   headers: { 'Authorization': `Bearer ${ASR_API_KEY}` },
  //   body: formData,
  // });
  // if (!response.ok) {
  //   throw new Error('Server transcription failed');
  // }
  // const data = await response.json();
  // return data.text || '';
  return Promise.resolve('');
}


/**
 * Parses a raw text transcript to identify a command and its target.
 * @param {string} text The transcript to parse.
 * @returns {{action: 'open'|'fill'|'unknown', target: string|null, raw: string}}
 */
export function parseCommand(text) {
    const raw = text.toLowerCase().trim();
    const result = { action: 'unknown', target: null, raw: text };

    const openPatterns = [
        /(?:open|show|view|start)\s+(?:the\s+)?checklist\s+for\s+((?:"[^"]+")|(?:\w+\s*)+)/,
    ];

    const fillPatterns = [
        /(?:fill|complete|populate)\s+(?:the\s+)?checklist\s+for\s+((?:"[^"]+")|(?:\w+\s*)+)/,
    ];

    for (const pattern of openPatterns) {
        const match = raw.match(pattern);
        if (match && match[1]) {
            result.action = 'open';
            result.target = match[1].replace(/"/g, '').trim();
            return result;
        }
    }

    for (const pattern of fillPatterns) {
        const match = raw.match(pattern);
        if (match && match[1]) {
            result.action = 'fill';
            result.target = match[1].replace(/"/g, '').trim();
            return result;
        }
    }

    return result;
}


const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

/**
 * A reusable hook for adding wake-word powered voice commands to a React application.
 * @param {object} options Configuration for the hook.
 * @param {string} [options.wakeWord="hey prism"] The wake word to listen for.
 * @param {string} [options.language="en-US"] The language for speech recognition.
 * @param {number} [options.commandTimeout=4000] Milliseconds to listen for a command after the wake word.
 * @param {function(): void} [options.onWake] Callback when the wake word is detected.
 * @param {function(object): void} [options.onCommand] Callback with the parsed command object.
 */
export function useVoiceCommands({
  wakeWord = 'hey prism',
  language = 'en-US',
  commandTimeout = 4000,
  onWake = () => {},
  onCommand = () => {},
} = {}) {
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [error, setError] = useState(null);

  const isSupported = !!SpeechRecognition;
  const recognitionRef = useRef(null);
  const commandTimeoutRef = useRef(null);
  const wakeWordDetectedRef = useRef(false);
  const restartTimerRef = useRef(null);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    clearTimeout(restartTimerRef.current);
    setIsListening(false);
    wakeWordDetectedRef.current = false;
  }, []);

  const start = useCallback(() => {
    if (isListening || !isSupported) {
      return;
    }
    
    stop(); // Ensure any previous instance is stopped.

    setError(null);
    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Debounced automatic restart unless explicitly stopped
      if (recognitionRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = setTimeout(() => {
            if (recognitionRef.current) {
               recognition.start();
            }
        }, 500);
      }
    };

    recognition.onerror = (event) => {
        if (event.error === 'no-speech' || event.error === 'audio-capture') {
            // These are common and we can ignore them to allow auto-restart
        } else if (event.error === 'not-allowed') {
            setError('Microphone access was denied. Please enable it in your browser settings.');
            stop(); // Don't try to restart if permissions are denied
        } else {
            setError(`Speech recognition error: ${event.error}`);
        }
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join('');

      setLastTranscript(transcript);

      const lowerCaseTranscript = transcript.toLowerCase();

      if (wakeWordDetectedRef.current) {
          // Already detected wake word, waiting for command
          if (event.results[event.results.length - 1].isFinal) {
              const commandText = lowerCaseTranscript.replace(wakeWord.toLowerCase(), '').trim();
              const parsed = parseCommand(commandText);
              if (parsed.action !== 'unknown') {
                  onCommand(parsed);
              }
              wakeWordDetectedRef.current = false;
              clearTimeout(commandTimeoutRef.current);
          }
      } else if (lowerCaseTranscript.includes(wakeWord.toLowerCase())) {
        wakeWordDetectedRef.current = true;
        onWake();
        clearTimeout(commandTimeoutRef.current);
        commandTimeoutRef.current = setTimeout(() => {
          wakeWordDetectedRef.current = false;
        }, commandTimeout);
      }
    };

    recognition.start();

  }, [isListening, isSupported, language, onCommand, onWake, wakeWord, commandTimeout, stop]);


  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stop();
    };
  }, [stop]);

  // NOTE: Fallback path is not implemented with audio recording logic
  // as the primary path is the Web Speech API. A developer would add
  // MediaRecorder logic here if `isSupported` is false.
  if (!isSupported) {
      console.warn("Web Speech API is not supported in this browser. Voice commands are disabled.");
  }

  return { start, stop, isListening, isSupported, lastTranscript, error };
}
