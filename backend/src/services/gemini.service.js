const logger = require('../utils/logger');

const API_KEY = process.env.GEMINI_API_KEY;

/**
 * Call Gemini API using standard REST HTTP fetch
 */
const generateContent = async (systemPrompt, userPrompt) => {
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured in backend .env');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: `${systemPrompt}\n\nUser Input / Request:\n${userPrompt}` }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1000
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Gemini API HTTP Error:', errorText);
    throw new Error(`Gemini API Error: ${response.statusText}`);
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text.trim();
};

/**
 * Generate Structured JSON output from Gemini
 */
const generateJSON = async (systemPrompt, userPrompt) => {
  const prompt = `${systemPrompt}\n\nUser Input:\n${userPrompt}\n\nIMPORTANT: Respond ONLY with valid JSON. Do not include markdown codeblocks or extra text.`;
  const text = await generateContent('', prompt);
  
  // Clean markdown block wrappers if present
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    logger.error('Failed to parse Gemini JSON output:', cleaned);
    return { text: cleaned };
  }
};

module.exports = {
  generateContent,
  generateJSON
};
