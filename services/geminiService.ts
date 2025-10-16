import { GoogleGenAI } from "@google/genai";

const callGemini = async (apiKey: string, systemPrompt: string, userMessage: string, useSearch: boolean = false) => {
  if (!apiKey) {
    throw new Error("Vui lòng nhập API Key của bạn.");
  }
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userMessage,
        config: {
            systemInstruction: systemPrompt,
            ...(useSearch && { tools: [{googleSearch: {}}] })
        }
    });
    // Safely handle cases where response.text might be undefined (e.g., blocked response)
    // by using the nullish coalescing operator to default to an empty string.
    return (response.text ?? '').replace(/^\d+\.\s*/, '').trim();
  } catch (error) {
    console.error("Gemini API call failed:", error);
    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
            return "Lỗi: API Key không hợp lệ. Vui lòng kiểm tra lại.";
        }
        return `Lỗi từ Gemini API: ${error.message}`;
    }
    return "Lỗi không xác định từ Gemini API.";
  }
};

export const getTopicIdeas = async (apiKey: string, keyword: string, systemPrompt: string): Promise<string> => {
  return callGemini(apiKey, systemPrompt, `Từ khóa: "${keyword}"`);
};

export const createGeneralScript = async (apiKey: string, topic: string, systemPrompt:string): Promise<string> => {
  return callGemini(apiKey, systemPrompt, topic);
};

export const createDetailedScript = async (apiKey: string, generalScript: string, systemPrompt: string): Promise<string> => {
  return callGemini(apiKey, systemPrompt, generalScript);
};

export const analyzeAndExtractCharacters = async (apiKey: string, detailedScript: string, systemPrompt: string): Promise<string> => {
  return callGemini(apiKey, systemPrompt, detailedScript);
};

export const extractAndCleanPrompts = async (apiKey: string, detailedScript: string, systemPrompt: string): Promise<string> => {
  return callGemini(apiKey, systemPrompt, detailedScript);
};

export const identifyCharactersInPrompts = async (apiKey: string, combinedInput: string, systemPrompt: string): Promise<string> => {
  return callGemini(apiKey, systemPrompt, combinedInput);
};

export const replacePlaceholders = async (apiKey: string, combinedInput: string, systemPrompt: string): Promise<string> => {
  return callGemini(apiKey, systemPrompt, combinedInput);
};

export const finalizePrompts = async (apiKey: string, mappedPrompts: string, systemPrompt: string): Promise<string> => {
  return callGemini(apiKey, systemPrompt, mappedPrompts);
};

export const optimizeVideoPrompts = async (apiKey: string, imagePrompts: string, systemPrompt: string): Promise<string> => {
  return callGemini(apiKey, systemPrompt, imagePrompts);
};

export const extractVoiceOver = async (apiKey: string, detailedScript: string, systemPrompt: string): Promise<string> => {
  return callGemini(apiKey, systemPrompt, detailedScript);
};

export const generateImagePromptsList = async (apiKey: string, promptsJson: string, systemPrompt: string): Promise<string> => {
    return callGemini(apiKey, systemPrompt, promptsJson);
};

export const createThumbnailAndMetadata = async (apiKey: string, generalScript: string, systemPrompt: string): Promise<string> => {
  return callGemini(apiKey, systemPrompt, generalScript);
};