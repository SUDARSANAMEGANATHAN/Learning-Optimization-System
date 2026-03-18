type ChatHistoryItem = {
  role: string;
  content: string;
};

type ApiErrorPayload = {
  error?: string;
  details?: string;
};

async function postToAiApi<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const apiBaseUrl = (import.meta as ImportMeta & { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL?.replace(/\/$/, '') || '';
  const response = await fetch(`${apiBaseUrl}/api/ai/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    let payload: ApiErrorPayload | null = null;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    throw new Error(payload?.details || payload?.error || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const geminiService = {
  async generateSummary(text: string) {
    const data = await postToAiApi<{ text: string }>('summary', { text });
    return data.text;
  },

  async explainConcept(docText: string, concept: string) {
    const data = await postToAiApi<{ text: string }>('explain', { docText, concept });
    return data.text;
  },

  async chatWithDocumentStream(
    docText: string,
    history: ChatHistoryItem[],
    message: string,
    onChunk: (text: string) => void
  ) {
    const data = await postToAiApi<{ text: string }>('chat', { docText, history, message });
    onChunk(data.text);
    return data.text;
  },

  async generateFlashcards(text: string, count: number = 8) {
    const data = await postToAiApi<{ cards: any[] }>('flashcards', { text, count });
    return data.cards || [];
  },

  async generateQuiz(text: string, count: number = 5) {
    const data = await postToAiApi<{ questions: any[] }>('quiz', { text, count });
    return data.questions || [];
  },

  async generateCommunityResponse(message: string, history: { userName: string; content: string }[]) {
    const data = await postToAiApi<{ text: string }>('community', { message, history });
    return data.text;
  },

  async generateRecommendations(userData: { documents: any[]; quizzes: any[]; flashcards: any[] }) {
    const data = await postToAiApi<{ recommendations: any[] }>('recommendations', { userData });
    return data.recommendations || [];
  }
};
