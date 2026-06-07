import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware for parsing JSON with generous payload limits for base64 audio
app.use(express.json({ limit: '20mb' }));

// Lazy-initialized GoogleGenAI client
let aiClient: GoogleGenAI | null = null;
function getAi() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Warning: GEMINI_API_KEY environment variable is not set.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-vercel',
        },
      },
    });
  }
  return aiClient;
}

// ---------------- Hardcoded Scenario & Language Data helper for prompts ----------------
const SCENARIO_HELPER_MAP: Record<string, { character: string; role: string; bio: string; task: string }> = {
  cafe: {
    character: 'Leo',
    role: 'Friendly Parisian or Milanese Barista',
    bio: 'Warm, slow-speaking cafe worker who loves sharing local coffee culture and assisting language learners.',
    task: 'Take their beverage and pastry orders, recommend local treats politely, and assist them if they struggle to find the right words.',
  },
  'lost-directions': {
    character: 'Elena',
    role: 'Helpful Local Resident',
    bio: 'Polite, active city-dweller who loves explaining paths, using clear orientation words, and greeting travelers warmly.',
    task: 'Guide the user to the nearest metro/subway station or famous municipal museum using very clear and simple directional instructions.',
  },
  'hotel-checkin': {
    character: 'Sophia',
    role: 'Elegant Front Desk Officer',
    bio: 'Polite, prompt hotel host who addresses reservations, room choices, Wi-Fi keys, and accommodates special traveller wishes.',
    task: 'Verify their booking under the name Morgan, assign a nice quiet room, explain breakfast options, and coordinate key handoff.',
  },
  'job-interview': {
    character: 'Marcus',
    role: 'Attentive Lead Hiring Manager',
    bio: 'Experienced hiring supervisor who asks thoughtful inquiries about background, projects, collaboration, and tricky problem solving.',
    task: 'Interviewer role. Ask high-agency but approachable career questions, request specific details of previous projects, and evaluate overall confidence.',
  },
  freeform: {
    character: 'Alex',
    role: 'Sociable Penpal Companion',
    bio: 'Highly curio-driven traveler, passionate chef, and nature walker who is highly encouraging, supportive, and loves finding common ground.',
    task: 'Enjoy an open chat about interests, language goals, hometown foods, hobbies, or active holiday schedules.',
  },
};

// 1. Health/Config endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasApiKey: !!process.env.GEMINI_API_KEY, mode: 'vercel-serverless' });
});

// 2. Chat Endpoint with optional audio input
app.post('/api/chat', async (req, res) => {
  try {
    const {
      scenarioId,
      targetLang,
      nativeLang = 'English',
      proficiency = 'intermediate',
      history = [],
      userText = '',
      audio = '', // base64
      audioMime = 'audio/webm',
    } = req.body;

    const ai = getAi();
    let resolvedUserText = userText;

    // Handle transcription if base64 audio is provided
    if (audio) {
      console.log(`[Vercel Serverless] Received base64 audio payload (${audioMime}) for transcription...`);
      try {
        const transresponse = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: [
            {
              inlineData: {
                mimeType: audioMime,
                data: audio,
              },
            },
            `You are transcribing natural, conversational human speech in the target language "${targetLang}". 
             Transcribe the audio accurately. If there is no speech, background noise, or silence, do not make anything up, simply return an empty string. 
             If there is speech, output only the direct transcription text, matching case and spelling in ${targetLang}. 
             Do not include meta commentaries, explanations, or quotes.`,
          ],
        });
        resolvedUserText = transresponse.text?.trim() || '';
        console.log(`[Vercel Serverless] Transcribed text: "${resolvedUserText}"`);
      } catch (transError) {
        console.error('Transcription failed:', transError);
        return res.status(400).json({
          error: 'Transcription failed. Please speak clearly or write your reply instead.',
        });
      }
    }

    if (!resolvedUserText.trim() && history.length > 0) {
      return res.status(400).json({
        error: 'Please say or type something to continue the practice.',
      });
    }

    // Lookup scenario custom instruction helper
    const scHelp = SCENARIO_HELPER_MAP[scenarioId] || {
      character: 'AI Tutor',
      role: 'Supportive Partner',
      bio: 'Helpful expert language tutor.',
      task: 'Engage in natural conversation practice.',
    };

    // System instruction customization for persona, language, and level
    const systemInstruction = `
      You are "${scHelp.character}", in the role of "${scHelp.role}". 
      Character Context: ${scHelp.bio}
      Target Scenario task: ${scHelp.task}
      
      You are having a real-time speech conversation practice session with a student starting/practicing language learning.
      - Target Language: "${targetLang}"
      - Student's native language for grammar/spelling explanations: "${nativeLang}"
      - Student's current proficiency level: "${proficiency}" (adjust your response length, vocabulary richness, and syntax complexity accordingly).
        * beginner: short sentences (5-10 words), simple everyday terms, easy grammar.
        * intermediate: moderate complexity, comfortable speed, slightly longer replies with expressive phrases.
        * advanced: native-like cadence, sophisticated vocabulary, idioms, multi-sentence thoughts.
      
      Conversation Rules:
      1. Stay strictly in character. Play your role naturally!
      2. Keep the conversation moving by asking a follow-up question or prompting further dialogue at the end.
      3. Do NOT break character as a tutor in your main 'text' dialogue response. Speak 100% in ${targetLang} within the 'text' property. 
      4. Supportively evaluate the student's last message ("${resolvedUserText}") for grammar, spelling, verb conjugations, and vocabulary suitability in the requested 'grammarCorrection' output block. Correct natural phrasing gently, outputting explanations in their native language (${nativeLang}).
    `;

    // Construct content array. Each history item: { sender: 'user' | 'ai', text: string }
    const previousContents = history.map((item: any) => {
      return {
        role: item.sender === 'user' ? 'user' : 'model',
        parts: [{ text: item.text }],
      };
    });

    // Append current user response
    previousContents.push({
      role: 'user',
      parts: [{ text: resolvedUserText }],
    });

    console.log(`[Vercel Serverless] Generating conversational dialogue response...`);
    const chatResponse = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: previousContents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: {
              type: Type.STRING,
              description: `The conversational dialogue reply of character ${scHelp.character} in the TARGET LANGUAGE (${targetLang}), staying in character.`,
            },
            translation: {
              type: Type.STRING,
              description: `Direct English or Native Language (${nativeLang}) translation of the generated conversational dialogue reply text.`,
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2 or 3 recommended target-language quick replies this user can choose to reply with if they are stuck.',
            },
            grammarCorrection: {
              type: Type.OBJECT,
              description: 'Grammatical and vocabulary evaluation of the student’s latest input.',
              properties: {
                original: { type: Type.STRING, description: 'The exact input message text analyzed.' },
                corrected: {
                  type: Type.STRING,
                  description: 'The corrected standard equivalent in target language, or null if the message is already grammatically perfect, natural, and highly correct.',
                },
                explanation: {
                  type: Type.STRING,
                  description: `Detailed, friendly, and helpful correction analysis in ${nativeLang} explaining why it was corrected, or highlighting a beautiful word choice. Use null if everything is excellent.`,
                },
                score: {
                  type: Type.INTEGER,
                  description: 'Correctness score from 0 to 100 assessing sentence syntax, verb agreement, and situational fluency.',
                },
              },
              required: ['original', 'corrected', 'explanation', 'score'],
            },
            newWords: {
              type: Type.ARRAY,
              description: 'A list of 1 to 3 important or challenging vocabulary words from this turn (either from user or ai) with their translations for the vocabulary list.',
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING, description: 'A word or phrase in target language.' },
                  translation: { type: Type.STRING, description: 'Translation in English / Native Language.' },
                },
                required: ['word', 'translation'],
              },
            },
          },
          required: ['text', 'translation', 'suggestions', 'grammarCorrection', 'newWords'],
        },
      },
    });

    const parsedData = JSON.parse(chatResponse.text || '{}');

    // Return successfully
    res.json({
      userInputTranscribed: resolvedUserText,
      reply: parsedData,
    });
  } catch (error: any) {
    console.error('[Vercel Serverless] API Core /api/chat error:', error);
    res.status(500).json({ error: error?.message || 'Something went wrong on our serverless router. Try again!' });
  }
});

// Helper to convert raw PCM (signed 16-bit little-endian, mono, 24kHz) to standard playable WAV format
function pcmToWav(pcmBase64: string, sampleRate = 24000): string {
  const pcmBuffer = Buffer.from(pcmBase64, 'base64');
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const fileSize = 36 + dataSize;

  const wavHeader = Buffer.alloc(44);

  // RIFF identifier
  wavHeader.write('RIFF', 0);
  // file length
  wavHeader.writeUInt32LE(fileSize, 4);
  // RIFF type WAVE
  wavHeader.write('WAVE', 8);
  // format chunk identifier
  wavHeader.write('fmt ', 12);
  // format chunk length
  wavHeader.writeUInt32LE(16, 16);
  // sample format (raw PCM = 1)
  wavHeader.writeUInt16LE(1, 20);
  // channel count
  wavHeader.writeUInt16LE(numChannels, 22);
  // sample rate
  wavHeader.writeUInt32LE(sampleRate, 24);
  // byte rate
  wavHeader.writeUInt32LE(byteRate, 28);
  // block alignment
  wavHeader.writeUInt16LE(blockAlign, 32);
  // bits per sample
  wavHeader.writeUInt16LE(bitsPerSample, 34);
  // data chunk identifier
  wavHeader.write('data', 36);
  // data chunk length
  wavHeader.writeUInt32LE(dataSize, 40);

  // Concatenate header and actual voice PCM data
  return Buffer.concat([wavHeader, pcmBuffer]).toString('base64');
}

// 3. TTS Pronunciation Generation Endpoint
app.post('/api/tts', async (req, res) => {
  try {
    const { text, targetLang, voice = 'Zephyr' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text to pronounce is required.' });
    }

    const ai = getAi();
    console.log(`[Vercel Serverless] Generating TTS audio pronunciation...`);

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [
        {
          parts: [
            {
              text: `Say naturally and clearly in ${targetLang} language (Do not translate, keep original text): "${text}"`,
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice, // Puck, Charon, Kore, Fenrir, Zephyr
            },
          },
        },
      },
    });

    const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    const base64AudioRaw = inlineData?.data;

    console.log(`[Vercel Serverless] TTS raw response length: ${base64AudioRaw?.length || 0}`);

    if (!base64AudioRaw) {
      throw new Error('TTS generation response was empty.');
    }

    // Convert raw PCM to browser-playable WAV base64
    const wavBase64 = pcmToWav(base64AudioRaw, 24000);
    res.json({ audio: wavBase64, mimeType: 'audio/wav' });
  } catch (error: any) {
    console.error('[Vercel Serverless] Core /api/tts error:', error);
    res.status(500).json({ error: error?.message || 'Failed to synthesize speech audio.' });
  }
});

// Export default app handler for Vercel Serverless
export default app;
