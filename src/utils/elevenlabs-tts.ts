/**
 * ElevenLabs Text-to-Speech Integration
 * 
 * Provides realistic human-sounding voice synthesis using the ElevenLabs API.
 * Much more natural than browser's built-in TTS.
 */

// ElevenLabs API configuration
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

// Popular voice IDs from ElevenLabs (you can change these)
export const VOICES = {
  RACHEL: '21m00Tcm4TlvDq8ikWAM',      // Calm, friendly female
  DREW: '29vD33N1CtxCmqQRPOHJ',        // Warm male
  CLYDE: '2EiwWnXFnvU5JabPnv8n',       // Deep male
  DOMI: 'AZnzlk1XvdvUeBnXmlld',        // Strong female
  BELLA: 'EXAVITQu4vr4xnSDxMaL',       // Soft female
  ELLI: 'MF3mGyEYCl7XYWbV9V6O',        // Young female
  JOSH: 'TxGEqnHWrfWFTfGW9XjX',        // Deep narrator male
  ARNOLD: 'VR6AewLTigWG4xSOukaG',      // Crisp male
  ADAM: 'pNInz6obpgDQGcFmaJgB',        // Deep male
  SAM: 'yoZ06aMxZJJ28mfd3POQ',         // Raspy male
} as const;

// Default voice settings for natural speech
const DEFAULT_VOICE_SETTINGS = {
  stability: 0.5,           // Higher = more consistent, lower = more expressive
  similarity_boost: 0.75,   // Higher = more similar to original voice
  style: 0.5,               // Speaking style intensity
  use_speaker_boost: true,  // Enhances voice clarity
};

// Maximum characters per request (ElevenLabs limit)
const MAX_CHARS_PER_REQUEST = 5000;

// Audio queue for sequential playback
let audioQueue: string[] = [];
let isPlaying = false;
let currentAudio: HTMLAudioElement | null = null;

/**
 * Get the API key from environment variables
 */
function getApiKey(): string | null {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ ElevenLabs API key not found. Set VITE_ELEVENLABS_API_KEY in your .env file.');
    return null;
  }
  return apiKey;
}

/**
 * Split long text into smaller chunks at sentence boundaries
 */
function splitTextIntoChunks(text: string, maxLength: number = MAX_CHARS_PER_REQUEST): string[] {
  if (text.length <= maxLength) {
    return [text];
  }

  const chunks: string[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxLength) {
      currentChunk += sentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      // If a single sentence is too long, split by words
      if (sentence.length > maxLength) {
        const words = sentence.split(' ');
        currentChunk = '';
        for (const word of words) {
          if ((currentChunk + ' ' + word).length <= maxLength) {
            currentChunk += (currentChunk ? ' ' : '') + word;
          } else {
            if (currentChunk) chunks.push(currentChunk.trim());
            currentChunk = word;
          }
        }
      } else {
        currentChunk = sentence;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Convert text to speech using ElevenLabs API
 * Returns a blob URL that can be played
 */
async function textToSpeech(
  text: string,
  voiceId: string = VOICES.RACHEL,
  voiceSettings = DEFAULT_VOICE_SETTINGS
): Promise<string> {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error('ElevenLabs API key is missing');
  }

  const response = await fetch(`${ELEVENLABS_API_URL}/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: voiceSettings,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
  }

  // Convert response to blob and create URL
  const audioBlob = await response.blob();
  return URL.createObjectURL(audioBlob);
}

/**
 * Play audio from a blob URL
 */
function playAudio(audioUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    currentAudio = new Audio(audioUrl);
    
    currentAudio.onended = () => {
      URL.revokeObjectURL(audioUrl); // Clean up blob URL
      currentAudio = null;
      resolve();
    };
    
    currentAudio.onerror = () => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      reject(new Error('Audio playback failed'));
    };
    
    currentAudio.play().catch(reject);
  });
}

/**
 * Process the audio queue sequentially
 */
async function processQueue(): Promise<void> {
  if (isPlaying || audioQueue.length === 0) return;
  
  isPlaying = true;
  
  while (audioQueue.length > 0) {
    const audioUrl = audioQueue.shift()!;
    try {
      await playAudio(audioUrl);
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }
  
  isPlaying = false;
}

/**
 * Main function: Speak text using ElevenLabs TTS
 * 
 * @param text - The text to speak
 * @param voiceId - ElevenLabs voice ID (use VOICES constant)
 * @param options - Optional voice settings
 * 
 * @example
 * await speak("Raise your right hand higher");
 * await speak("Great job!", VOICES.JOSH);
 */
export async function speak(
  text: string,
  voiceId: string = VOICES.RACHEL,
  options?: {
    stability?: number;
    similarity_boost?: number;
    waitForCompletion?: boolean;
  }
): Promise<void> {
  const apiKey = getApiKey();
  
  // Fallback to browser TTS if no API key
  if (!apiKey) {
    console.warn('⚠️ Using browser TTS fallback (no ElevenLabs API key)');
    return browserTTSFallback(text);
  }

  const voiceSettings = {
    ...DEFAULT_VOICE_SETTINGS,
    ...(options?.stability !== undefined && { stability: options.stability }),
    ...(options?.similarity_boost !== undefined && { similarity_boost: options.similarity_boost }),
  };

  try {
    // Split text into chunks if needed
    const chunks = splitTextIntoChunks(text);
    
    // Generate audio for all chunks
    const audioUrls: string[] = [];
    for (const chunk of chunks) {
      const audioUrl = await textToSpeech(chunk, voiceId, voiceSettings);
      audioUrls.push(audioUrl);
    }
    
    // Add to queue
    audioQueue.push(...audioUrls);
    
    // Start processing queue
    if (options?.waitForCompletion) {
      await processQueue();
    } else {
      processQueue(); // Fire and forget
    }
  } catch (error) {
    console.error('ElevenLabs TTS error:', error);
    // Fallback to browser TTS on error
    return browserTTSFallback(text);
  }
}

/**
 * Browser TTS fallback when ElevenLabs is unavailable
 */
function browserTTSFallback(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      resolve();
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    
    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Stop all audio playback
 */
export function stopSpeaking(): void {
  // Stop current audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  
  // Clear queue
  audioQueue.forEach(url => URL.revokeObjectURL(url));
  audioQueue = [];
  isPlaying = false;
  
  // Also stop browser TTS if active
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Check if currently speaking
 */
export function isSpeaking(): boolean {
  return isPlaying || (currentAudio !== null && !currentAudio.paused);
}

/**
 * Pre-defined messages for the assessment tasks
 */
export const TASK_MESSAGES = {
  // Task introductions
  RAISE_HAND_INTRO: "Let's start with the first exercise. Please raise your right hand above your head.",
  TOUCH_SHOULDER_INTRO: "Now, touch your left shoulder with your right hand.",
  STAND_ONE_LEG_INTRO: "Try to stand on one leg for a few seconds.",
  WALK_STRAIGHT_INTRO: "Walk in a straight line towards the camera.",
  
  // Encouragement
  DOING_GREAT: "You're doing great! Keep it up!",
  ALMOST_THERE: "Almost there, just a little more.",
  PERFECT: "Perfect! That was excellent.",
  
  // Corrections
  RAISE_HIGHER: "Try raising your hand a bit higher.",
  HOLD_STEADY: "Hold steady, you've got this.",
  SLOW_DOWN: "Take your time, no rush.",
  
  // Task completion
  TASK_COMPLETE: "Great job! Task complete. Ready for the next one?",
  ALL_DONE: "Wonderful! You've completed all the exercises. Great work today!",
};

// Export for use in components
export default speak;
