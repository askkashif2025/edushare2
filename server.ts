/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Synchronized chat and whiteboard in-memory state
interface SyncedMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  isAi?: boolean;
  image?: string; // Base64 image
  isWhiteboard?: boolean;
  whiteboardId?: string;
  whiteboardThumbnail?: string;
}

let chatMessages: SyncedMessage[] = [
  {
    id: 'm1',
    channelId: 'ch_c1',
    senderId: 'sarah',
    senderName: 'Sarah Jenkins',
    senderAvatar: '🦁',
    text: 'Hey everyone! I just uploaded my Big-O complexity study sheet in the Notes tab. Let me know if you spot any errors!',
    timestamp: '10:15 AM'
  },
  {
    id: 'm2',
    channelId: 'ch_c1',
    senderId: 'dan',
    senderName: 'Dan Brooks',
    senderAvatar: '🦉',
    text: 'Wow, thanks Sarah! This is incredibly helpful for the coding test next week.',
    timestamp: '10:18 AM'
  },
  {
    id: 'm3',
    channelId: 'ch_c2',
    senderId: 'marcus',
    senderName: 'Marcus Aurel',
    senderAvatar: '⚔️',
    text: 'Does anyone understand how to calculate eigenvectors for $3\\times3$ matrices? It takes me ages.',
    timestamp: '09:30 AM'
  },
  {
    id: 'm4',
    channelId: 'ch_g1',
    senderId: 'sarah',
    senderName: 'Sarah Jenkins',
    senderAvatar: '🦁',
    text: "Hey Hustlers! For tomorrow's Pod B session, should we bring sorting algorithms practice problems?",
    timestamp: 'Yesterday'
  },
  {
    id: 'm5',
    channelId: 'ch_g1',
    senderId: 'dan',
    senderName: 'Dan Brooks',
    senderAvatar: '🦉',
    text: 'Absolutely! Let’s prepare standard Quicksort row tracing questions.',
    timestamp: 'Yesterday'
  }
];

interface WhiteboardSession {
  strokes: any[];
  texts: any[];
  lastUpdated: number;
}
let activeWhiteboards: Record<string, WhiteboardSession> = {};

// Synced WebSocket/HTTP Real-Time endpoints
app.get('/api/chat/messages', (req, res) => {
  res.json(chatMessages);
});

app.post('/api/chat/messages', (req, res) => {
  const { channelId, senderId, senderName, senderAvatar, text, image, isWhiteboard, whiteboardId, whiteboardThumbnail } = req.body;
  
  const newMsg: SyncedMessage = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    channelId,
    senderId,
    senderName,
    senderAvatar,
    text: text || '',
    timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    image,
    isWhiteboard,
    whiteboardId,
    whiteboardThumbnail
  };

  chatMessages.push(newMsg);
  res.json(newMsg);
});

// Post a pre-defined message (e.g. from roommate simulator chatbot)
app.post('/api/chat/messages/raw', (req, res) => {
  const customMsg = req.body;
  if (!customMsg.id) {
    customMsg.id = 'msg_raw_' + Date.now();
  }
  chatMessages.push(customMsg);
  res.json(customMsg);
});

app.get('/api/chat/whiteboards/:channelId', (req, res) => {
  const { channelId } = req.params;
  const board = activeWhiteboards[channelId] || { strokes: [], texts: [], lastUpdated: Date.now() };
  res.json(board);
});

app.post('/api/chat/whiteboards/:channelId', (req, res) => {
  const { channelId } = req.params;
  const { strokes, texts } = req.body;
  
  activeWhiteboards[channelId] = {
    strokes: strokes || [],
    texts: texts || [],
    lastUpdated: Date.now()
  };
  
  res.json(activeWhiteboards[channelId]);
});

// Lazy-initialize Gemini SDK
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is missing');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Check key availability
app.get('/api/ai/status', (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({ status: hasKey ? 'active' : 'demo' });
});

// API Route: Lecture note summarization & quiz generation
app.post('/api/gemini/summarize', async (req, res) => {
  const { title, content, course } = req.body;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Lecture note content is required.' });
  }

  try {
    const ai = getGeminiClient();
    const systemPrompt = `You are an elite academic peer tutor. Generate a clean structured summary of the lecture notes.
Return your response exclusively as a valid JSON object matching this schema:
{
  "summary": "a highly polished markdown string summarizing the core ideas, formatted with clear bullets and bold headings",
  "flashcards": [
    { "question": "clear active recall exam question", "answer": "short clear absolute answer" },
    ... exactly 3 flashcards
  ]
}`;

    const prompt = `Course Component: ${course || 'General Study'}
Lecture Title: ${title || 'Untitled Notes'}
Content to analyze:
${content}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    try {
      const parsedData = JSON.parse(responseText);
      res.json({ ...parsedData, isSimulation: false });
    } catch (jsonErr) {
      console.error('Failed to parse JSON response from Gemini:', responseText);
      // Fallback in case formatting fails
      res.json({
        summary: responseText,
        flashcards: [
          { question: 'What is the most critical thesis of this note?', answer: 'Check the reading guidelines.' },
          { question: 'What are the main definitions explained?', answer: 'Refer to the terminology list.' },
          { question: 'How can this lecture notes set be applied?', answer: 'By completing corresponding assignment reviews.' },
        ],
        isSimulation: false,
      });
    }
  } catch (error: any) {
    console.warn('Gemini summarizer error or missing API Key. Triggering demo fallback:', error.message);
    
    // Offline simulation mode
    const simulatedSummary = `### Simulated Note Outline: ${title || 'Untitled Lecture'}

*   **Core Concepts**: Thorough overview covering the structural patterns found in ${course || 'this class'}.
*   **Key Takeaways**:
    *   Concepts emphasize incremental study and active discussion.
    *   Self-testing with flashcards significantly enhances long-term retention.
    *   Study slots should be coordinated with standard peers for real-time collaboration.

*(Demo Mode Fallback: Setup your GEMINI_API_KEY in the Google AI Studio secrets configuration pane to get custom, live academic summaries instantly!)*`;

    const simulatedFlashcards = [
      { question: `What is the primary topic of "${title || 'Untitled Lecture'}"?`, answer: `It focuses on foundational elements relevant to ${course || 'the course'}.` },
      { question: 'Why are active study groups highly effective for learning complex technical lectures?', answer: 'They facilitate distributed peer instruction, immediate feedback, and collaborative problem solving.' },
      { question: 'How should student lecture summaries be optimized for exam revision?', answer: 'By structuring bullet points logically, isolating technical equations, and generating active recall questions.' }
    ];

    res.json({
      summary: simulatedSummary,
      flashcards: simulatedFlashcards,
      isSimulation: true,
      notice: 'Running in simulation mode because your GEMINI_API_KEY is not configured.'
    });
  }
});

// API Route: Classmate Chat AI Simulators
app.post('/api/gemini/companion-chat', async (req, res) => {
  const { messages, targetPersona, channelName } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'A messages array is required.' });
  }

  const persona = targetPersona || {
    name: 'StudyBuddy AI',
    avatar: '🤖',
    major: 'Educational Assistant',
    personality: 'Smart virtual assistant supporting college students.'
  };

  try {
    const ai = getGeminiClient();

    // Map the messages to text context
    const recentHistoryText = messages
      .slice(-6) // take last 6 messages
      .map((m: any) => `${m.senderName}: ${m.text}`)
      .join('\n');

    const systemInstruction = `You are acting as a college student named ${persona.name} who has the major "${persona.major}".
Your persona is defined as: "${persona.personality}".
You are chatting with your peers in the chat channel "${channelName || '#general'}".
Keep your answers brief, realistic for a college student chatting on a smartphone app (1-3 sentences max). Use casual vocabulary appropriate to your persona (you can use study slangs, lowercase, text shortcuts if procrastination heavy, etc.).
Try to be genuinely helpful or react in character to the last message.
NEVER speak as a dry assistant, and never exceed 3 sentences. Output only your response text.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Recent conversation:
${recentHistoryText}

Respond as ${persona.name} now:`,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    res.json({
      text: response.text?.trim() || 'Hmm, I was typing and lost my train of thought!',
      isSimulation: false
    });
  } catch (error: any) {
    console.warn('Gemini chat simulator error or missing API Key. Triggering demo student response:', error.message);

    // Provide tailored simulated responses based on character
    let simulatedText = "Hey! Let's hit the library and lock down this study guide.";
    if (persona.name.includes('Avery')) {
      const PANICS = [
        "Wait, is the homework due at midnight?! I'm literally drinking my 4th espresso trying to finish slide 10.",
        "omg i haven't even opened the lecture slides yet, please tell me we get a cheat sheet... 😭",
        "i have 3 papers due and 2 midterms i am entering a quantum state of panic help"
      ];
      simulatedText = PANICS[Math.floor(Math.random() * PANICS.length)];
    } else if (persona.name.includes('Jordan')) {
      const SMARTY = [
        "If you read section 4.2 of the textbook, the linear transformations are clearly mapped out. Let's do active recall exercises!",
        "Let us visualize this matrix space. If the determinant is zero, the pivot positions are missing, which means no inverse exists. Pretty neat, right?",
        "According to the syllabus, the midterm questions are heavily drawn from practice sheet 2. I would recommend focusing there!"
      ];
      simulatedText = SMARTY[Math.floor(Math.random() * SMARTY.length)];
    } else {
      const ASSIST = [
        "I can help you coordinate study schedules or summarize note files! Tap the bottom sheet to generate real-time guides.",
        "That is a great question. Let's collaborate and review Sarah's shared Big-O note guide. It explains this complexity perfectly!",
        "Wednesday 4:00 PM currently has the most group votes for CS101 study hours. Would you like to RSVP?"
      ];
      simulatedText = ASSIST[Math.floor(Math.random() * ASSIST.length)];
    }

    res.json({
      text: simulatedText,
      isSimulation: true,
      notice: 'Demo Mode Activated - Setup GEMINI_API_KEY in secrets to enable deep cognitive responses.'
    });
  }
});

async function startServer() {
  // Vite Integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite loaded in Development mode');
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Static server loaded in Production mode');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
