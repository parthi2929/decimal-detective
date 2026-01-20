import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to prevent API calls if no key is present (fallback mode)
const hasKey = !!apiKey;

export const generateProblemContext = async (num1: number, num2: number): Promise<string> => {
  if (!hasKey) {
    return `Let's multiply ${num1} and ${num2}! Can you help me solve this?`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a very short, fun, one-sentence story for a kid (age 8-10) involving the multiplication of ${num1} and ${num2}. 
      Keep it under 20 words. Use simple objects like apples, stickers, or meters.`,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `Let's multiply ${num1} and ${num2}!`;
  }
};

export const getTutorHelp = async (step: string, problem: string, userError?: string): Promise<string> => {
  if (!hasKey) {
    return "Don't give up! You can do it. Try checking your math again.";
  }

  try {
    const prompt = `You are a friendly, encouraging math tutor for kids named Professor Hoot.
    The student is stuck on the step: "${step}" for the problem "${problem}".
    ${userError ? `The student entered "${userError}" which is incorrect.` : ''}
    Give a short, helpful hint (max 1 sentence) to guide them. Be super positive!`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Keep trying! Remember to take it one step at a time.";
  }
};

export const getCelebrationMessage = async (): Promise<string> => {
  if (!hasKey) return "Amazing job! You are a Decimal Detective master!";
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Generate a short, enthusiastic congratulatory message for a kid who just solved a math problem. Max 10 words.",
    });
    return response.text.trim();
  } catch (error) {
    return "Spectacular work! You solved it!";
  }
};
