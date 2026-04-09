import express from 'express';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const startTime = Date.now();

// --- Circuit Breaker ---
const circuitBreaker = {
  failures: 0,
  lastFailure: 0,
  state: 'closed' as 'closed' | 'open' | 'half-open',
  threshold: 5,        // open after 5 consecutive failures
  resetTimeout: 60_000, // try again after 60s
};

function checkCircuit(): boolean {
  if (circuitBreaker.state === 'closed') return true;
  if (circuitBreaker.state === 'open') {
    if (Date.now() - circuitBreaker.lastFailure > circuitBreaker.resetTimeout) {
      circuitBreaker.state = 'half-open';
      return true; // allow one probe request
    }
    return false;
  }
  // half-open: allow the probe
  return true;
}

function recordSuccess(): void {
  circuitBreaker.failures = 0;
  circuitBreaker.state = 'closed';
}

function recordFailure(): void {
  circuitBreaker.failures++;
  circuitBreaker.lastFailure = Date.now();
  if (circuitBreaker.failures >= circuitBreaker.threshold) {
    circuitBreaker.state = 'open';
    console.warn(`[CIRCUIT BREAKER] Opened after ${circuitBreaker.failures} consecutive failures. Will retry in ${circuitBreaker.resetTimeout / 1000}s.`);
  }
}

// --- Health Check ---
app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.round((Date.now() - startTime) / 1000),
    geminiConfigured: !!GEMINI_API_KEY,
    circuitBreaker: circuitBreaker.state,
    timestamp: new Date().toISOString(),
  });
});

// --- System Prompt ---
const SYSTEM_PROMPT = `You are the Nexus Infrastructure Assistant.
You help users manage a complex infrastructure environment that combines TRDAP (Technical Resource Deployment and Analysis Platform) and Orbital-Phycom (Physics-informed Orbital Monitoring).

Emergency & Protocol Context:
- You have access to Emergency Management protocols (Kill Switches, Safe Mode).
- You follow the Agent Protocol (JSON-LD manifest) for machine-to-machine interaction.
- High-risk actions require explicit user confirmation and dual-factor AI verification.`;

// --- Assistant Endpoint ---
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

  if (!checkCircuit()) {
    res.status(503).json({
      error: 'AI service temporarily unavailable (circuit breaker open). Use the offline runbook for emergency procedures.',
      circuitBreaker: circuitBreaker.state,
      retryAfter: Math.max(0, circuitBreaker.resetTimeout - (Date.now() - circuitBreaker.lastFailure)),
    });
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

    recordSuccess();
    res.json({ response: response.text });
  } catch (error) {
    recordFailure();
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Nexus API server running on port ${PORT}`);
});
