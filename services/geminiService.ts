
import { GoogleGenAI } from "@google/genai";
import type { Priority, Status } from '../types';
import { Priority as PriorityEnum } from '../types';

// IMPORTANT: This key is retrieved from environment variables.
// Ensure you have a valid API key set in your environment.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.warn("Gemini API key not found. AI features will be disabled. Please set process.env.API_KEY.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });
const model = 'gemini-2.5-flash';

const validPriorities = Object.values(PriorityEnum).join(', ');

export const suggestPriority = async (title: string, description: string): Promise<Priority | null> => {
    if (!API_KEY) return null;

    try {
        const prompt = `Based on the following task title and description, suggest a priority level from this list: ${validPriorities}. Respond with only one word from the list.
        Title: "${title}"
        Description: "${description}"`;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });
        
        const suggested = response.text.trim();

        // Validate the response is one of the enum values
        if (Object.values(PriorityEnum).includes(suggested as Priority)) {
            return suggested as Priority;
        }
        return null;
    } catch (error) {
        console.error("Error suggesting priority:", error);
        return null;
    }
};

export const generateDescription = async (title: string): Promise<string | null> => {
    if (!API_KEY) return null;
    try {
        const prompt = `Based on the task title "${title}", write a detailed task description for a professional office environment. The description should be clear, concise, and actionable.`;
        
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error generating description:", error);
        return null;
    }
};

export const suggestUpdateNote = async (title: string, oldStatus: Status, newStatus: Status): Promise<string | null> => {
    if (!API_KEY) return null;
    try {
        const prompt = `A task with the title "${title}" is changing status from "${oldStatus}" to "${newStatus}".
        Write a brief, professional update note (1-2 sentences) explaining the reason for this change or the next steps.`;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error suggesting update note:", error);
        return null;
    }
};
