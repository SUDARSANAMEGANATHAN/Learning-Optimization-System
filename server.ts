import 'dotenv/config';
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const GEMINI_MODEL = "gemini-2.5-flash";
const geminiApiKey = process.env.GEMINI_API_KEY;
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

function ensureAiClient() {
  if (!ai) {
    throw new Error("Missing GEMINI_API_KEY in the server environment.");
  }
  return ai;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown AI error";
}

function extractJsonArray<T>(text: string | undefined): T[] {
  if (!text) {
    return [];
  }

  try {
    return JSON.parse(text) as T[];
  } catch {
    return [];
  }
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }

    next();
  });

  app.use(express.json({ limit: "10mb" }));

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("send_message", (message) => {
      io.emit("receive_message", message);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { docText, history = [], message } = req.body as {
        docText?: string;
        history?: { role: string; content: string }[];
        message?: string;
      };

      if (!docText || !message) {
        return res.status(400).json({ error: "Document text and message are required." });
      }

      const client = ensureAiClient();
      const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          ...history.map((item) => ({
            role: item.role === "user" ? "user" : "model",
            parts: [{ text: item.content }]
          })),
          { role: "user", parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: `You are a world-class Learning Assistant. Answer using the provided document when possible.

DOCUMENT CONTENT:
${docText.substring(0, 25000)}`
        }
      });

      return res.json({ text: response.text || "" });
    } catch (error) {
      console.error("Chat failed", error);
      return res.status(500).json({ error: "Chat request failed.", details: getErrorMessage(error) });
    }
  });

  app.post("/api/ai/summary", async (req, res) => {
    try {
      const { text } = req.body as { text?: string };
      if (!text) {
        return res.status(400).json({ error: "Text is required." });
      }

      const response = await ensureAiClient().models.generateContent({
        model: GEMINI_MODEL,
        contents: `Summarize the following educational content in a structured way with key takeaways: ${text.substring(0, 15000)}`,
        config: {
          systemInstruction: "You are an expert academic summarizer. Provide a concise, professional summary with bullet points for key concepts."
        }
      });

      return res.json({ text: response.text || "" });
    } catch (error) {
      console.error("Summary failed", error);
      return res.status(500).json({ error: "Summary request failed.", details: getErrorMessage(error) });
    }
  });

  app.post("/api/ai/explain", async (req, res) => {
    try {
      const { docText, concept } = req.body as { docText?: string; concept?: string };
      if (!docText || !concept) {
        return res.status(400).json({ error: "Document text and concept are required." });
      }

      const response = await ensureAiClient().models.generateContent({
        model: GEMINI_MODEL,
        contents: `Explain the concept of "${concept}" based on the provided document content.
Use clear formatting, examples, and step-by-step teaching where helpful.

DOCUMENT CONTENT:
${docText.substring(0, 15000)}`,
        config: {
          systemInstruction: "You are an expert tutor. Explain concepts deeply but simply. If the concept is not supported by the text, say so clearly."
        }
      });

      return res.json({ text: response.text || "" });
    } catch (error) {
      console.error("Explain failed", error);
      return res.status(500).json({ error: "Concept explanation failed.", details: getErrorMessage(error) });
    }
  });

  app.post("/api/ai/flashcards", async (req, res) => {
    try {
      const { text, count = 8 } = req.body as { text?: string; count?: number };
      if (!text) {
        return res.status(400).json({ error: "Text is required." });
      }

      const response = await ensureAiClient().models.generateContent({
        model: GEMINI_MODEL,
        contents: `Analyze the following text and extract exactly ${count} of the most critical concepts for revision.
Return JSON only.

Text:
${text.substring(0, 15000)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                answer: { type: Type.STRING },
                difficulty: { type: Type.STRING, enum: ["easy", "medium", "hard"] }
              },
              required: ["question", "answer", "difficulty"]
            }
          }
        }
      });

      return res.json({ cards: extractJsonArray(response.text) });
    } catch (error) {
      console.error("Flashcard generation failed", error);
      return res.status(500).json({ error: "Flashcard generation failed.", details: getErrorMessage(error) });
    }
  });

  app.post("/api/ai/quiz", async (req, res) => {
    try {
      const { text, count = 5 } = req.body as { text?: string; count?: number };
      if (!text) {
        return res.status(400).json({ error: "Text is required." });
      }

      const response = await ensureAiClient().models.generateContent({
        model: GEMINI_MODEL,
        contents: `Generate a ${count} question multiple-choice quiz from the following text. Return JSON only.

Text:
${text.substring(0, 10000)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.NUMBER },
                explanation: { type: Type.STRING }
              },
              required: ["question", "options", "correctIndex", "explanation"]
            }
          }
        }
      });

      return res.json({ questions: extractJsonArray(response.text) });
    } catch (error) {
      console.error("Quiz generation failed", error);
      return res.status(500).json({ error: "Quiz generation failed.", details: getErrorMessage(error) });
    }
  });

  app.post("/api/ai/community", async (req, res) => {
    try {
      const { message, history = [] } = req.body as {
        message?: string;
        history?: { userName: string; content: string }[];
      };

      if (!message) {
        return res.status(400).json({ error: "Message is required." });
      }

      const response = await ensureAiClient().models.generateContent({
        model: GEMINI_MODEL,
        contents: `You are participating in a student group chat.
Recent conversation:
${history.map((item) => `${item.userName}: ${item.content}`).join("\n")}

New message: ${message}`,
        config: {
          systemInstruction: "You are EduAI Bot, a supportive and academically helpful assistant."
        }
      });

      return res.json({ text: response.text || "" });
    } catch (error) {
      console.error("Community response failed", error);
      return res.status(500).json({ error: "Community response failed.", details: getErrorMessage(error) });
    }
  });

  app.post("/api/ai/recommendations", async (req, res) => {
    try {
      const { userData } = req.body as {
        userData?: { documents: any[]; quizzes: any[]; flashcards: any[] };
      };

      if (!userData) {
        return res.status(400).json({ error: "User data is required." });
      }

      const response = await ensureAiClient().models.generateContent({
        model: GEMINI_MODEL,
        contents: `Analyze this study data and return 3-4 personalized study recommendations as JSON.

Documents: ${userData.documents.map((d) => d.title).join(", ")}
Quizzes: ${userData.quizzes.map((q) => `${q.title} (Score: ${q.score}%)`).join(", ")}
Flashcards: ${userData.flashcards.map((f) => f.title).join(", ")}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ["review", "quiz", "concept", "explore"] },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                priority: { type: Type.STRING, enum: ["low", "medium", "high"] },
                targetId: { type: Type.STRING }
              },
              required: ["type", "title", "description", "priority"]
            }
          }
        }
      });

      return res.json({ recommendations: extractJsonArray(response.text) });
    } catch (error) {
      console.error("Recommendations failed", error);
      return res.status(500).json({ error: "Recommendations failed.", details: getErrorMessage(error) });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
