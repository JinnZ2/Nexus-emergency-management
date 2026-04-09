import express from 'express';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const SYSTEM_PROMPT = `You are the Nexus Infrastructure Assistant.
You help users manage a complex infrastructure environment that combines TRDAP (Technical Resource Deployment and Analysis Platform) and Orbital-Phycom (Physics-informed Orbital Monitoring).

Emergency & Protocol Context:
- You have access to Emergency Management protocols (Kill Switches, Safe Mode).
- You follow the Agent Protocol (JSON-LD manifest) for machine-to-machine interaction.
- High-risk actions require explicit user confirmation and dual-factor AI verification.`;

app.post('/api/v1/assistant', async (req, res) => {
  const { prompt, context } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Invalid prompt' });
    return;
  }

  if (prompt.length > 4000) {
    res.status(400).json({ error: 'Prompt too long (max 4000 chars)' });
    return;
  }

  if (!GEMINI_API_KEY) {
    res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    return;
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const sanitizedContext = typeof context === 'string' ? context.slice(0, 2000) : '';

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `${SYSTEM_PROMPT}

Current Infrastructure Context:
${sanitizedContext}

User Query:
${prompt.slice(0, 4000)}

Provide a concise, professional, and technical response.`,
    });

    res.json({ response: response.text });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Nexus API server running on port ${PORT}`);
});
