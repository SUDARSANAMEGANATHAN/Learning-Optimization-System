
import { storageService } from './storageService';
import { geminiService } from './geminiService';
import { Recommendation } from '../types';

const STORAGE_KEY = 'ai_learn_recommendations';

export const recommendationService = {
  getRecommendations: async (forceRefresh = false): Promise<Recommendation[]> => {
    const user = storageService.getCurrentSession();
    if (!user) return [];

    const cachedData = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
    if (cachedData && !forceRefresh) {
      const { recommendations, timestamp } = JSON.parse(cachedData);
      // Cache for 1 hour
      if (Date.now() - timestamp < 3600000) {
        return recommendations;
      }
    }

    const userData = {
      documents: storageService.getDocuments(),
      quizzes: storageService.getQuizzes(),
      flashcards: storageService.getFlashcardSets()
    };

    if (userData.documents.length === 0) return [];

    try {
      const rawRecs = await geminiService.generateRecommendations(userData);
      const recommendations: Recommendation[] = rawRecs.map((r: any) => ({
        ...r,
        id: Math.random().toString(36).substr(2, 9),
        userId: user.id,
        timestamp: Date.now()
      }));

      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify({
        recommendations,
        timestamp: Date.now()
      }));

      return recommendations;
    } catch (error) {
      console.error("Failed to generate recommendations", error);
      return [];
    }
  }
};
