import { GoogleGenAI } from '@google/genai';


const API_KEY = GEMINi_API_KEY ;
// Using gemini-2.5-flash as requested by user
const PRIMARY_MODEL = 'gemini-2.5-flash';

async function callGemini(prompt: string): Promise<string> {
    try {
        const client = new GoogleGenAI({ apiKey: API_KEY });
        const result = await client.models.generateContent({
            model: PRIMARY_MODEL,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        const output = result.candidates?.[0]?.content?.parts?.[0]?.text;
        return output || "No response received.";
    } catch (error: any) {
        console.error('[Gemini API Error]:', error?.message || error);
        throw error;
    }
}

export async function askSecurityBrain(prompt: string, context?: string): Promise<string> {
    try {
        console.log('[AI] Sending prompt:', prompt.substring(0, 100));
        console.log('[AI] Using model:', PRIMARY_MODEL);
        console.log('[AI] API key (first 20 chars):', API_KEY.substring(0, 20));

        // SIMPLIFIED: Just send the prompt, nothing else
        const response = await callGemini(prompt);
        console.log('[AI] Success! Response:', response.substring(0, 100));
        return response;
    } catch (error: any) {
        console.error('[AI] Full error object:', error);
        console.error('[AI] Error message:', error?.message);
        console.error('[AI] Error status:', error?.status);

        // Return the actual error message to help debug
        return `Error: ${error?.message || error?.toString() || 'Unknown error'}`;
    }
}

