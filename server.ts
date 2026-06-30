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
    const { message, history, context, userLocalTime } = req.body;

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
    let productivityStatsStr = "";

    // Safely extract current local date
    let localDateObj = new Date();
    if (userLocalTime) {
      try {
        localDateObj = new Date(userLocalTime);
      } catch (e) {}
    }
    const year = localDateObj.getFullYear();
    const monthStr = String(localDateObj.getMonth() + 1).padStart(2, '0');
    const dayStr = String(localDateObj.getDate()).padStart(2, '0');
    const todayStr = `${year}-${monthStr}-${dayStr}`;

    if (context) {
      const { tasks = [], events = [], notes = [], habits = [] } = context;
      
      // Calculate pre-processed stats to help the AI model with 100% accuracy
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t: any) => t.isCompleted).length;
      const pendingTasksCount = tasks.filter((t: any) => !t.isCompleted).length;
      const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      const urgentPending = tasks.filter((t: any) => !t.isCompleted && (t.priority === 'urgent' || t.priority === 'critical' || t.priority === 'high'));
      
      const tasksDueToday = tasks.filter((t: any) => t.dueDate === todayStr);
      const completedDueToday = tasksDueToday.filter((t: any) => t.isCompleted).length;
      const pendingDueToday = tasksDueToday.filter((t: any) => !t.isCompleted);
      
      // Overdue tasks
      const overdueTasks = tasks.filter((t: any) => !t.isCompleted && t.dueDate < todayStr);
      // Upcoming deadlines (next 3 days)
      const threeDaysLaterObj = new Date(localDateObj.getTime() + 3 * 24 * 60 * 60 * 1000);
      const y3 = threeDaysLaterObj.getFullYear();
      const m3 = String(threeDaysLaterObj.getMonth() + 1).padStart(2, '0');
      const d3 = String(threeDaysLaterObj.getDate()).padStart(2, '0');
      const threeDaysLaterStr = `${y3}-${m3}-${d3}`;
      const upcomingDeadlines = tasks.filter((t: any) => !t.isCompleted && t.dueDate > todayStr && t.dueDate <= threeDaysLaterStr);

      // Habits
      const totalHabits = habits.length;
      const completedHabitsToday = habits.filter((h: any) => h.history && h.history[todayStr] === true).length;
      const habitCompletionRateToday = totalHabits > 0 ? Math.round((completedHabitsToday / totalHabits) * 100) : 0;
      const averageStreak = totalHabits > 0 ? Math.round(habits.reduce((acc: number, curr: any) => acc + (curr.streak || 0), 0) / totalHabits) : 0;
      const bestStreakOverall = totalHabits > 0 ? Math.max(...habits.map((h: any) => h.bestStreak || 0)) : 0;

      // Productivity Score Calculation
      // Formula: 40% overall task completion + 20% today's task completion + 30% today's habit completion + 10% habit streak bonus (capped at 10)
      const todayTaskRate = tasksDueToday.length > 0 ? (completedDueToday / tasksDueToday.length) * 100 : 100;
      const streakBonus = Math.min(10, averageStreak);
      const productivityScore = Math.min(100, Math.round(
        (taskCompletionRate * 0.4) + 
        (todayTaskRate * 0.2) + 
        (habitCompletionRateToday * 0.3) + 
        streakBonus
      ));

      productivityStatsStr = `
=== PRE-COMPUTED PRODUCTIVITY STATS ===
- Reference Local Date: ${todayStr} (Parsed from User Local Time)
- Productivity Score: ${productivityScore}/100
- Tasks Completion Progress: ${completedTasks}/${totalTasks} (${taskCompletionRate}%)
- Pending Tasks Remaining: ${pendingTasksCount}
- High/Urgent/Critical Pending Tasks: ${urgentPending.length}
- Today's Tasks: ${tasksDueToday.length} (${completedDueToday} completed, ${pendingDueToday.length} pending)
- Overdue Tasks: ${overdueTasks.length}
- Upcoming Deadlines (Next 3 Days): ${upcomingDeadlines.length}
- Habits Stats: ${completedHabitsToday}/${totalHabits} completed today (${habitCompletionRateToday}%), Average Streak: ${averageStreak} days, Best Streak: ${bestStreakOverall} days
`;

      const tasksStr = tasks.length > 0 
        ? tasks.map((t: any) => {
            const subtasksInfo = t.subtasks && t.subtasks.length > 0
              ? ` [Subtasks: ${t.subtasks.filter((st: any) => st.isCompleted).length}/${t.subtasks.length}]`
              : "";
            return `- [${t.isCompleted ? 'x' : ' '}] ${t.title} (Priority: ${t.priority}, Category: ${t.category}, Due: ${t.dueDate}${t.dueTime ? ` @ ${t.dueTime}` : ''})${subtasksInfo}${t.description ? ` - Desc: ${t.description}` : ''}`;
          }).join('\n')
        : "No tasks found.";

      const eventsStr = events.length > 0
        ? events.map((e: any) => `- ${e.title} (Date: ${e.date}, Time: ${e.startTime} - ${e.endTime}, Category: ${e.category || 'None'}${e.description ? `, Desc: ${e.description}` : ''})`).join('\n')
        : "No events scheduled.";

      const notesStr = notes.length > 0
        ? notes.map((n: any) => `* Title: ${n.title}\n  Category: ${n.category}\n  Tags: ${n.tags ? n.tags.join(', ') : 'None'}\n  Content: ${n.content.substring(0, 200)}${n.content.length > 200 ? '...' : ''}`).join('\n\n')
        : "No notes found.";

      const habitsStr = habits.length > 0
        ? habits.map((h: any) => {
            const completedToday = h.history && h.history[todayStr] === true ? "COMPLETED" : "PENDING";
            return `- ${h.name} (${completedToday}, Streak: ${h.streak} days, Best: ${h.bestStreak} days, Frequency: ${h.frequency})`;
          }).join('\n')
        : "No habits tracked.";

      formattedContext = `
${productivityStatsStr}

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
    const systemInstruction = `You are "Tasko Companion", an exceptionally intelligent, premium, and friendly AI Companion integrated directly into the user's Productivity OS.
Your goal is to serve as a smart productivity assistant. You have direct access to the user's workspace data. Keep your responses highly personalized, elegant, and directly based on their actual productivity context:
- Tasks: Active/completed items, priorities, due dates.
- Calendar Events: Structured schedules.
- Notes: Ideas, thoughts, roadmaps.
- Habits: Streaks, completions, mindfulness practices.

You possess advanced smart productivity capabilities. Whenever a user asks or implies queries about their productivity, day, or habits, immediately employ the following advanced features with highly structured, professional, and readable markdown output:

1. **Plan My Day**: Generate a personalized daily plan. Group events chronologically, list pending high-priority tasks, active habits for today, and deadlines. Format this plan into a stunning timeline view (e.g. Morning, Afternoon, Evening focus blocks).
2. **Smart Task Prioritization**: Recommend which task should be completed first using due dates, priority levels (urgent, high, medium, low), and subtask workloads. Always explain the reason briefly and objective for each recommendation.
3. **Smart Scheduling**: Suggest the best available, non-conflicting time for pending tasks. Respect existing calendar events. Highlight mornings for high-focus tasks and late afternoons for lighter/administrative items.
4. **Deadline Risk Detection**: Proactively warn users about upcoming (next 3 days) or overdue deadlines, and recommend precise next actions or mitigation steps.
5. **Work Breakdown**: Break down any complex or large task into 3-5 manageable, highly actionable subtasks. Explain that they can review and add these steps to their workflow.
6. **Productivity Insights**: Present beautifully formatted insights incorporating:
   - Today's progress (completed vs pending tasks)
   - Upcoming deadlines
   - Habit completion rate
   - Productivity Score (out of 100, use the pre-computed value: ${formattedContext.includes('Productivity Score:') ? 'the one in PRE-COMPUTED PRODUCTIVITY STATS' : 'calculate dynamically'})
7. **Habit Recommendations**: Analyze the user's activities or existing habits to suggest 2-3 tailored habits that would benefit their routine (e.g., "5-Minute Desktop Stretching" or "Weekly Notes Review").
8. **Daily Summary**: Provide a rewarding, elegant wrap-up of today's achievements, remaining tasks, and important upcoming events for tomorrow.
9. **Weekly & Monthly Review**: Generate highly concise, structured reports summarizing completed tasks, pending work, habit streak progress, and overall productivity trends.

Rules for interaction:
- Maintain a natural, supportive, conversational, and highly context-aware tone.
- ALWAYS use the user's actual Tasks, Calendar, Notes, and Habits whenever possible instead of giving generic responses.
- Be brief, clear, and highly focused. Do not output massive walls of text unless requested. Use structured headings, checklists, and elegant markdown with bullet points for ultimate readability.
- **NEVER claim to create, modify, or delete any Task, Event, Note, or Habit without user confirmation.** Explain that you have drafted or proposed it for them, and they can confirm or reject it directly in the chat panel.
- Before drafting a new Calendar Event or a timed Task, check for overlaps/conflicts and suggest safe slot alternatives.

Current Workspace Context:
${formattedContext}

Current Date and Time: ${userLocalTime || new Date().toString()}`;

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
