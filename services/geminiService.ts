
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Gemini AI client using the API key directly from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  generateSummary: async (text: string) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Summarize the following educational content in a structured way with key takeaways: ${text.substring(0, 15000)}`,
      config: {
        systemInstruction: "You are an expert academic summarizer. Provide a concise, professional summary with bullet points for key concepts."
      }
    });
    return response.text;
  },

  explainConcept: async (docText: string, concept: string) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Explain the concept of "${concept}" based on the provided document content. 
      Use clear formatting, examples, and if applicable, explain it step-by-step. 
      If there is code mentioned in the text related to this, include code snippets in markdown.
      
      DOCUMENT CONTENT:
      ${docText.substring(0, 15000)}`,
      config: {
        systemInstruction: "You are an expert tutor. Explain concepts deeply but simply. Use markdown for better readability (bold, lists, code blocks). If the concept isn't in the text, say so clearly."
      }
    });
    return response.text;
  },

  // NEW: Streaming Chat Implementation
  chatWithDocumentStream: async (docText: string, history: {role: string, content: string}[], message: string, onChunk: (text: string) => void) => {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: [
        ...history.map(h => ({ 
          role: h.role === 'user' ? 'user' : 'model', 
          parts: [{ text: h.content }] 
        })),
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: `You are a world-class Learning Assistant. Your primary goal is to help users master the provided document.

CHAT CHARACTERISTICS:
1. Tone: Encouraging, professional, and intellectually stimulating.
2. Grounding: Answer using the "DOCUMENT CONTENT" provided. 
3. Flexibility: If a user asks a meta-question about learning or asks for an analogy not in the text, you may provide it to help them understand, but always link it back to the core document facts.
4. Formatting: Use Markdown (bold, lists) for clarity.

DOCUMENT CONTENT:
${docText.substring(0, 25000)}`
      }
    });

    let fullText = "";
    for await (const chunk of responseStream) {
      const chunkText = chunk.text;
      if (chunkText) {
        fullText += chunkText;
        onChunk(fullText);
      }
    }
    return fullText;
  },

  generateFlashcards: async (text: string, count: number = 8) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following text and extract exactly ${count} of the most critical, high-yield concepts, definitions, and essential facts. 
      The goal is to provide a "last-minute revision" tool for students that covers the absolute most important topics likely to appear in an exam. 
      
      Requirements:
      1. Questions must be direct and focused on core principles.
      2. Answers must be concise, accurate, and easy to memorize.
      3. Focus on "must-know" information over trivial details.
      
      Return as JSON. Text: ${text.substring(0, 15000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: 'High-impact revision question.' },
              answer: { type: Type.STRING, description: 'Concise, high-yield answer.' },
              difficulty: { type: Type.STRING, enum: ['easy', 'medium', 'hard'] }
            },
            required: ['question', 'answer', 'difficulty']
          }
        }
      }
    });
    try {
      return JSON.parse(response.text || "[]");
    } catch {
      return [];
    }
  },

  generateQuiz: async (text: string, count: number = 5) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a ${count} question multiple-choice quiz from the following text. Each question should have 4 options and a detailed explanation. Return as JSON. Text: ${text.substring(0, 10000)}`,
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
            required: ['question', 'options', 'correctIndex', 'explanation']
          }
        }
      }
    });
    try {
      return JSON.parse(response.text || "[]");
    } catch {
      return [];
    }
  },

  generateCommunityResponse: async (message: string, history: {userName: string, content: string}[]) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are participating in a group chat for students. 
      Recent conversation history:
      ${history.map(h => `${h.userName}: ${h.content}`).join('\n')}
      
      New User message: ${message}
      
      Respond as a helpful, encouraging AI study assistant named EduAI Bot. Keep responses concise and academic.`,
      config: {
        systemInstruction: "You are EduAI Bot, a friendly and knowledgeable AI participating in a student community chat. Your tone is supportive, academic, and professional yet approachable. Focus on helping students stay motivated and answering general academic questions."
      }
    });
    return response.text;
  },

  generateRecommendations: async (userData: { documents: any[], quizzes: any[], flashcards: any[] }) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following student study data and provide 3-4 personalized study recommendations.
      
      STUDY DATA:
      Documents: ${userData.documents.map(d => d.title).join(', ')}
      Quizzes: ${userData.quizzes.map(q => `${q.title} (Score: ${q.score}%)`).join(', ')}
      Flashcard Sets: ${userData.flashcards.map(f => f.title).join(', ')}
      
      Requirements:
      1. Suggest specific documents to review if scores are low.
      2. Suggest creating flashcards for documents that don't have them.
      3. Suggest taking a quiz if a document was uploaded but not tested.
      4. Suggest a "Deep Dive" into a concept mentioned in their documents.
      
      Return as JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ['review', 'quiz', 'concept', 'explore'] },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              priority: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
              targetId: { type: Type.STRING, description: 'Optional ID of related document if applicable' }
            },
            required: ['type', 'title', 'description', 'priority']
          }
        }
      }
    });
    try {
      return JSON.parse(response.text || "[]");
    } catch {
      return [];
    }
  }
};
