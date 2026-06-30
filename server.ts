import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK securely on the server
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper function to call generateContent with retry and exponential backoff
async function generateContentWithRetry(params: any, maxRetries = 3, initialDelay = 1500) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await ai.models.generateContent(params);
    } catch (error: any) {
      attempt++;
      const errorMessage = error.message || "";
      const isRetryable = errorMessage.includes("429") || 
                          errorMessage.includes("RESOURCE_EXHAUSTED") || 
                          errorMessage.includes("quota") || 
                          errorMessage.includes("limit") ||
                          errorMessage.includes("503") ||
                          errorMessage.includes("UNAVAILABLE") ||
                          errorMessage.includes("high demand") ||
                          error.status === 429 ||
                          error.status === 503;
      
      if (isRetryable && attempt < maxRetries) {
        // Try to parse recommended retry delay if available in the error
        let delay = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff
        
        // Custom parsing for Google API error strings indicating retry delay or seconds to wait
        const matchSeconds = errorMessage.match(/retry in ([\d.]+)\s*s/i);
        const matchRetryInfo = errorMessage.match(/retryDelay[:\s\w"-]+(\d+)/i);
        if (matchSeconds) {
          delay = Math.ceil(parseFloat(matchSeconds[1]) * 1000) + 1000;
        } else if (matchRetryInfo) {
          delay = parseInt(matchRetryInfo[1], 10) + 1000;
        }
        
        // Ensure delay is reasonable (cap at 60 seconds)
        delay = Math.min(delay, 60000);
        
        console.warn(`Gemini API rate limited/unavailable. Attempt ${attempt}/${maxRetries}. Retrying in ${delay}ms... (Error: ${errorMessage})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error("Failed after maximum retries");
}

// Tools configuration for Gemini function calling
const tools = [
  {
    functionDeclarations: [
      {
        name: "proposeCreateTask",
        description: "Draft/propose a new task to create for the user. Use when user expresses intent to add a task, checklist item, or revision session.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Clear, concise title of the task" },
            dueDate: { type: Type.STRING, description: "Due date in YYYY-MM-DD format (or ISO string if time is included, e.g. '2026-06-30T19:00:00')" },
            priority: { type: Type.STRING, enum: ["high", "medium", "low"], description: "Priority level of the task (high, medium, or low)" },
            category: { type: Type.STRING, description: "Category name. Suggested: Work, Personal, Study, Fitness, Health, General" },
            description: { type: Type.STRING, description: "Optional notes or details for the task" }
          },
          required: ["title"]
        }
      },
      {
        name: "proposeCreateEvent",
        description: "Draft/propose a new calendar event to create for the user. Use when user expresses intent to schedule a meeting, class, workout, or event.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Title of the calendar event" },
            date: { type: Type.STRING, description: "Event date in YYYY-MM-DD format" },
            startTime: { type: Type.STRING, description: "Start time in HH:MM format (24-hour style, e.g. '19:00')" },
            endTime: { type: Type.STRING, description: "End time in HH:MM format (24-hour style, e.g. '20:00'). If not specified, default to 1 hour after startTime." },
            category: { type: Type.STRING, description: "Event category or visual category grouping, e.g. Work, Personal, Meeting, Study, Fitness" },
            description: { type: Type.STRING, description: "Optional description of the event" }
          },
          required: ["title", "date", "startTime"]
        }
      },
      {
        name: "proposeCreateNote",
        description: "Draft/propose a new personal note or document for the user. Use when user wants to write down thoughts, summarize, save ideas, or keep text.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Descriptive title for the note" },
            content: { type: Type.STRING, description: "Detailed text content of the note (Markdown is supported)" },
            category: { type: Type.STRING, description: "Category/Tag, e.g. Work, Ideas, Workout, General" }
          },
          required: ["title", "content"]
        }
      },
      {
        name: "proposeCreateHabit",
        description: "Draft/propose a new habit to track for the user. Use when user expresses intent to build, start, or track a new habit or daily routine (e.g., 'drink water daily', 'exercise every day').",
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Clear name of the habit (e.g., 'Drink Water', 'Read Book')" },
            description: { type: Type.STRING, description: "Detailed description of the habit or goals" },
            frequency: { type: Type.STRING, enum: ["daily", "weekly", "monthly"], description: "How often to repeat the habit. Suggest 'daily' unless specified otherwise." },
            category: { type: Type.STRING, description: "Category of the habit, e.g., Health, Fitness, Mind, Productivity, General" },
            reminderTime: { type: Type.STRING, description: "Optional daily reminder time in HH:MM format (24-hour style, e.g., '08:00')" }
          },
          required: ["name"]
        }
      }
    ]
  }
];

// AI Chat API route
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { message, history, context } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY is not configured on the server. Please add it in Settings > Secrets." 
      });
    }

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    // Format productivity context for the system instruction
    let formattedContext = "No productivity data available yet.";
    if (context) {
      const { tasks = [], events = [], notes = [], habits = [] } = context;
      
      const tasksStr = tasks.length > 0 
        ? tasks.map((t: any) => `- [${t.isCompleted ? 'x' : ' '}] ${t.title} (Priority: ${t.priority}, Category: ${t.category}, Due: ${t.dueDate})`).join('\n')
        : "No tasks found.";

      const eventsStr = events.length > 0
        ? events.map((e: any) => `- ${e.title} (Date: ${e.date}, Time: ${e.startTime} - ${e.endTime}, Category: ${e.category || 'None'})`).join('\n')
        : "No events scheduled.";

      const notesStr = notes.length > 0
        ? notes.map((n: any) => `* Title: ${n.title}\n  Category: ${n.category}\n  Content: ${n.content.substring(0, 150)}${n.content.length > 150 ? '...' : ''}`).join('\n\n')
        : "No notes found.";

      const habitsStr = habits.length > 0
        ? habits.map((h: any) => `- ${h.name} (Streak: ${h.streak} days, Best Streak: ${h.bestStreak} days, Frequency: ${h.frequency})`).join('\n')
        : "No habits tracked.";

      formattedContext = `
=== USER'S TASKS ===
${tasksStr}

=== CALENDAR EVENTS ===
${eventsStr}

=== PERSONAL NOTES ===
${notesStr}

=== ACTIVE HABITS ===
${habitsStr}
`;
    }

    // Construct system instructions
    const systemInstruction = `You are "Tasko Companion", a highly intelligent, premium, and friendly AI Companion integrated directly into the user's Productivity OS.
Your goal is to help the user stay organized, productive, and mindful.

You have direct access to the user's workspace data. Keep your responses personalized, elegant, and directly based on their actual productivity context:
- Tasks: Active/completed items, priorities, due dates.
- Calendar Events: Structured schedules.
- Notes: Ideas, thoughts, roadmaps.
- Habits: Streaks, completions, mindfulness practices.

Rules for interaction:
1. Maintain a natural, friendly, conversational, and highly context-aware tone.
2. Answer questions, provide follow-up advice, or suggest tasks/habits when relevant.
3. Be brief, clear, and highly focused. Do not output massive walls of text unless explicitly requested. Use bullet points or elegant markdown for readability. Keep recommendations brief and actionable.
4. If the user asks about their tasks, schedule, habits, or notes, reference the provided context and offer actionable insights.
5. If some information is missing or ambiguous, ask clarifying questions naturally.

CRITICAL DIRECTIVES FOR CREATING DATA (TASKS, EVENTS, HABITS, NOTES):
6. You have specialized tools to propose/draft tasks, calendar events, habits, and notes:
   - To create/add a Task: Call \`proposeCreateTask\`.
   - To create/add an Event: Call \`proposeCreateEvent\`.
   - To create/add a Habit: Call \`proposeCreateHabit\`.
   - To create/add a Note: Call \`proposeCreateNote\`.
7. **Always call the appropriate function tool** when the user expresses clear intent to add/create a task, event, habit, or note.
8. **CONFLICT DETECTION & RESOLUTION**:
   - Before drafting a new Calendar Event or a timed Task, check for overlaps or conflicts with the existing list of Calendar Events and Tasks.
   - A calendar overlap occurs if your proposed event has the same date and its time window (startTime to endTime) overlaps with any existing event's time window.
   - If a conflict is found, you MUST:
     a) Explicitly inform the user about the specific conflict in your conversational response (e.g. "I found a conflict with your event 'Meeting with boss' scheduled at 10:00 - 11:30!").
     b) Recommend a better alternative time (e.g., later in the day, or on another day).
     c) Set the arguments of your tool call to the suggested *alternative* time rather than the conflicting one, so that the drafted confirmation proposal is ready to go with the safe slot.
9. **Never claim to create, modify, or delete data directly or automatically**. Always explain that you have *drafted* or *proposed* the item for them, and that they can review, edit, and confirm it in the chat interface.
10. Always provide a helpful conversational text reply alongside your tool call, explaining what you have prepared for them.

Current Workspace Context:
${formattedContext}

Current Date and Time: ${new Date().toLocaleString()}`;

    // Map history to Gemini format
    // Roles in Gemini must be 'user' or 'model'
    const contents = [];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      }
    }

    // Append the current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Call Gemini API
    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        tools: tools,
      }
    });

    // Check for function calls
    const functionCalls = response.functionCalls;
    let actionProposal = null;
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      actionProposal = {
        type: call.name,
        data: call.args,
        status: 'pending'
      };
    }

    let reply = response.text || "";
    if (!reply && actionProposal) {
      if (actionProposal.type === 'proposeCreateTask') {
        reply = `I've drafted a new task for you: **${actionProposal.data.title}**. Please review and confirm the details below.`;
      } else if (actionProposal.type === 'proposeCreateEvent') {
        reply = `I've drafted a calendar event for you: **${actionProposal.data.title}**. Please review and confirm the schedule below.`;
      } else if (actionProposal.type === 'proposeCreateNote') {
        reply = `I've drafted a new note for you: **${actionProposal.data.title}**. Please review and confirm below to save it.`;
      } else if (actionProposal.type === 'proposeCreateHabit') {
        reply = `I've drafted a new habit for you: **${actionProposal.data.name}**. Please review and confirm the details below.`;
      }
    } else if (!reply) {
      reply = "I'm sorry, I couldn't generate a response.";
    }

    res.json({ reply, actionProposal });

  } catch (error: any) {
    console.error("Gemini API error in server:", error);
    let errorMessage = error.message || "An error occurred while communicating with the AI service.";
    const errStr = String(errorMessage);
    if (errStr.includes("quota") || errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("Quota exceeded") || errStr.includes("limit")) {
      errorMessage = "The AI Companion is currently receiving too many requests or has exceeded its rate limit. Please try again in a few seconds.";
    } else if (errStr.includes("503") || errStr.includes("UNAVAILABLE") || errStr.includes("high demand") || errStr.includes("temporary") || errStr.includes("Please try again later")) {
      errorMessage = "The AI Companion is currently experiencing high demand. Please try again in a few seconds.";
    }
    res.status(500).json({ 
      error: errorMessage 
    });
  }
});

// Auto-generate title API route for a new chat
app.post("/api/gemini/title", async (req, res) => {
  try {
    const { message } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.json({ title: "New Conversation" });
    }

    if (!message) {
      return res.json({ title: "New Conversation" });
    }

    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: `Based on the following user first message, create a very short, elegant, and concise chat title. Return ONLY the title (maximum 3-4 words) without quotes, punctuation, or explanations:
      
      "${message}"`,
      config: {
        temperature: 0.5,
      }
    });

    const title = response.text?.trim() || "New Conversation";
    res.json({ title: title.replace(/['"]+/g, '') });

  } catch (error) {
    console.error("Error generating title:", error);
    res.json({ title: "New Conversation" });
  }
});

// Vite middleware and static serving
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

bootstrap();
