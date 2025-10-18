import { GEMINI_API_KEY, GEMINI_MODEL } from '../config'; // Ensure you have a config file for your API keys

// Function to call the Gemini API
export const callGeminiApi = async (messages, systemInstruction) => {
    if (!GEMINI_API_KEY) {
        throw new Error("API Key is missing. Please set GEMINI_API_KEY.");
    }

    const contents = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
    }));

    const payload = {
        contents: contents,
        systemInstruction: { parts: [{ text: systemInstruction }] },
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                if (response.status === 429 || response.status >= 500) {
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                    continue; 
                }
                const errorBody = await response.json();
                throw new Error(`API error: ${response.status} - ${errorBody.error.message}`);
            }

            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) return text;

        } catch (error) {
            if (attempt === 2) throw error;
        }
    }
    throw new Error("Failed to get response from Gemini after multiple retries.");
};