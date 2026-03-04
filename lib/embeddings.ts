import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// Initialize the Google Gen AI client
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!ai) {
    throw new Error('NEXT_PUBLIC_GEMINI_API_KEY is not configured.');
  }

  try {
    const response = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: text,
    });

    if (!response.embeddings || response.embeddings.length === 0 || !response.embeddings[0].values) {
      throw new Error('No embeddings returned from Google AI');
    }

    return response.embeddings[0].values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}
