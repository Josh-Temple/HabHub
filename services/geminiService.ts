
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface HabitInsight {
  quote: string;
  advice: string;
}

export const getHabitInsight = async (completed: number, total: number): Promise<HabitInsight> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `The user has completed ${completed} out of ${total} habits today. Provide a short motivational quote and one sentence of advice to keep them going in a refined, elegant tone.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quote: { type: Type.STRING },
            advice: { type: Type.STRING }
          },
          required: ["quote", "advice"]
        }
      }
    });

    const json = JSON.parse(response.text || "{}");
    return {
      quote: json.quote || "Quality is not an act, it is a habit.",
      advice: json.advice || "Keep moving forward with intention."
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      quote: "Quality is not an act, it is a habit.",
      advice: "Consistency is the key to mastery."
    };
  }
};
