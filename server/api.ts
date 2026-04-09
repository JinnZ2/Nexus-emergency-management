import express from 'express';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
app.use(express.json());

const startTime = Date.now();

// --- Provider Configuration ---
// Add keys for any providers you have. The server tries them in order.
// Only providers with a configured key are active.

interface ProviderConfig {
  name: string;
  envKey: string;
  call: (apiKey: string, systemPrompt: string, userPrompt: string) => Promise<string>;
}

interface CircuitState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}

const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_RESET_MS = 60_000;

const circuitBreakers: Record<string, CircuitState> = {};

function getCircuit(name: string): CircuitState {
  if (!circuitBreakers[name]) {
    circuitBreakers[name] = { failures: 0, lastFailure: 0, state: 'closed' };
  }
  return circuitBreakers[name];
}

function isCircuitOpen(name: string): boolean {
  const cb = getCircuit(name);
  if (cb.state === 'closed') return false;
  if (cb.state === 'open') {
    if (Date.now() - cb.lastFailure > CIRCUIT_RESET_MS) {
      cb.state = 'half-open';
      return false; // allow probe
    }
    return true;
  }
  return false; // half-open allows probe
}

function recordSuccess(name: string): void {
  const cb = getCircuit(name);
  cb.failures = 0;
  cb.state = 'closed';
}

function recordFailure(name: string): void {
  const cb = getCircuit(name);
  cb.failures++;
  cb.lastFailure = Date.now();
  if (cb.failures >= CIRCUIT_THRESHOLD) {
    cb.state = 'open';
    console.warn(`[CIRCUIT BREAKER] ${name} opened after ${cb.failures} failures. Retry in ${CIRCUIT_RESET_MS / 1000}s.`);
  }
}

// --- Provider Implementations ---

const providers: ProviderConfig[] = [
  {
    name: 'gemini',
    envKey: 'GEMINI_API_KEY',
    call: async (apiKey, systemPrompt, userPrompt) => {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `${systemPrompt}\n\n${userPrompt}`,
      });
      return response.text || '';
    },
  },
  {
    name: 'claude',
    envKey: 'ANTHROPIC_API_KEY',
    call: async (apiKey, systemPrompt, userPrompt) => {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });
      if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
      const data = await res.json();
      return data.content?.[0]?.text || '';
    },
  },
  {
    name: 'openai',
    envKey: 'OPENAI_API_KEY',
    call: async (apiKey, systemPrompt, userPrompt) => {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 1024,
        }),
      });
      if (!res.ok) throw new Error(`OpenAI API ${res.status}`);
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    },
  },
];

// Build active provider list from configured keys
function getActiveProviders(): Array<ProviderConfig & { apiKey: string }> {
  return providers
    .map((p) => ({ ...p, apiKey: process.env[p.envKey] || '' }))
    .filter((p) => p.apiKey.length > 0);
}

// --- System Prompt ---
const SYSTEM_PROMPT = `You are the Nexus Infrastructure Assistant.
You help users manage a complex infrastructure environment that combines TRDAP (Technical Resource Deployment and Analysis Platform) and Orbital-Phycom (Physics-informed Orbital Monitoring).

Emergency & Protocol Context:
- You have access to Emergency Management protocols (Kill Switches, Safe Mode).
- You follow the Agent Protocol (JSON-LD manifest) for machine-to-machine interaction.
- High-risk actions require explicit user confirmation and dual-factor AI verification.`;

// --- Health Check ---
app.get('/api/v1/health', (_req, res) => {
  const active = getActiveProviders();
  const providerStatus: Record<string, { configured: boolean; circuit: string }> = {};
  for (const p of providers) {
    const key = process.env[p.envKey] || '';
    providerStatus[p.name] = {
      configured: key.length > 0,
      circuit: getCircuit(p.name).state,
    };
  }

  res.json({
    status: 'ok',
    uptime: Math.round((Date.now() - startTime) / 1000),
    providers: providerStatus,
    activeProviders: active.map((p) => p.name),
    timestamp: new Date().toISOString(),
  });
});

// --- Assistant Endpoint (failover chain) ---
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

  const active = getActiveProviders();
  if (active.length === 0) {
    res.status(503).json({
      error: 'No AI providers configured. Set at least one API key (GEMINI_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY).',
      provider: null,
      fallback: 'offline_runbook',
    });
    return;
  }

  const sanitizedContext = typeof context === 'string' ? context.slice(0, 2000) : '';
  const userPrompt = `Current Infrastructure Context:\n${sanitizedContext}\n\nUser Query:\n${prompt.slice(0, 4000)}\n\nProvide a concise, professional, and technical response.`;

  const errors: string[] = [];

  // Try each provider in order, skip those with open circuits
  for (const provider of active) {
    if (isCircuitOpen(provider.name)) {
      errors.push(`${provider.name}: circuit breaker open`);
      continue;
    }

    try {
      const text = await provider.call(provider.apiKey, SYSTEM_PROMPT, userPrompt);
      recordSuccess(provider.name);
      res.json({
        response: text,
        provider: provider.name,
        failoversAttempted: errors.length,
      });
      return;
    } catch (err) {
      recordFailure(provider.name);
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${provider.name}: ${msg}`);
      console.error(`[PROVIDER FAIL] ${provider.name}:`, msg);
      // Continue to next provider
    }
  }

  // All providers failed
  res.status(503).json({
    error: 'All AI providers failed. Use the offline emergency runbook.',
    provider: null,
    fallback: 'offline_runbook',
    failoversAttempted: errors.length,
    details: errors,
  });
});

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => {
  const active = getActiveProviders();
  console.log(`Nexus API server running on port ${PORT}`);
  console.log(`Active AI providers: ${active.length > 0 ? active.map(p => p.name).join(' -> ') : 'NONE (configure API keys)'}`);
});
