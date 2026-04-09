import { EMERGENCY_RUNBOOK, type RunbookEntry } from '@/lib/runbook';

export interface AssistantResponse {
  content: string;
  provider: string;       // 'gemini' | 'claude' | 'openai' | 'offline_runbook'
  isOfflineFallback: boolean;
}

/** Try the server-side AI provider chain. If the server is unreachable, fall back to local runbook matching. */
export async function getInfrastructureAssistance(prompt: string, context: string): Promise<AssistantResponse> {
  try {
    const response = await fetch('/api/v1/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, context }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        content: data.response || "I couldn't generate a response.",
        provider: data.provider || 'unknown',
        isOfflineFallback: false,
      };
    }

    // Server returned an error — check if it suggests offline runbook
    const errorData = await response.json().catch(() => null);
    if (errorData?.fallback === 'offline_runbook') {
      return offlineFallback(prompt);
    }

    throw new Error(errorData?.error || `HTTP ${response.status}`);
  } catch (error) {
    // Network error or server unreachable — go offline
    console.warn('AI service unreachable, using offline runbook:', error);
    return offlineFallback(prompt);
  }
}

/** Check health of all AI providers */
export async function checkProviderHealth(): Promise<{
  providers: Record<string, { configured: boolean; circuit: string }>;
  activeProviders: string[];
} | null> {
  try {
    const res = await fetch('/api/v1/health');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// --- Offline Runbook Matching ---

function offlineFallback(prompt: string): AssistantResponse {
  const lower = prompt.toLowerCase();
  const matches = matchRunbookEntries(lower);

  if (matches.length === 0) {
    return {
      content: `[OFFLINE MODE] I'm operating without AI service connectivity.\n\nI couldn't find a specific runbook match for your query. Here's what I can help with offline:\n\n${EMERGENCY_RUNBOOK.map(r => `- "${r.title}" (${r.severity})`).join('\n')}\n\nTry asking about: outage, orbital drift, gateway, API, pipeline, or emergency procedures.`,
      provider: 'offline_runbook',
      isOfflineFallback: true,
    };
  }

  const entry = matches[0];
  const steps = entry.steps.map((s, i) => `  ${i + 1}. ${s}`).join('\n');
  const rollback = entry.rollback.map(s => `  - ${s}`).join('\n');

  let response = `[OFFLINE MODE] Using pre-computed emergency runbook.\n\n`;
  response += `**${entry.title}** (Severity: ${entry.severity.toUpperCase()})\n\n`;
  response += `Trigger: ${entry.trigger}\n\n`;
  response += `Steps:\n${steps}\n\n`;
  response += `Rollback:\n${rollback}\n\n`;
  response += `Impact: ${entry.estimatedImpact}`;

  if (matches.length > 1) {
    response += `\n\n---\nAlso relevant: ${matches.slice(1).map(m => `"${m.title}"`).join(', ')}`;
  }

  return {
    content: response,
    provider: 'offline_runbook',
    isOfflineFallback: true,
  };
}

const KEYWORD_MAP: Record<string, string[]> = {
  'rb-001': ['outage', 'down', 'offline', 'all services', 'total failure', 'everything down', 'kill switch', 'critical'],
  'rb-002': ['orbital', 'drift', 'eccentricity', 'node drift', 'phycom', 'realignment', 'physics', 'orbit'],
  'rb-003': ['gateway', 'api gateway', 'latency', 'saturate', 'ddos', 'traffic', 'rate limit', 'overload', 'cpu'],
  'rb-004': ['ai unavailable', 'gemini', 'assistant down', 'api error', 'ai down', 'llm', 'model', 'claude', 'openai'],
  'rb-005': ['pipeline', 'recovery', 'injection', 'data pipeline', 'cache', 'warm-up', 'rebalance', 'failed'],
};

function matchRunbookEntries(query: string): RunbookEntry[] {
  const scored = EMERGENCY_RUNBOOK.map((entry) => {
    const keywords = KEYWORD_MAP[entry.id] || [];
    const score = keywords.reduce((sum, kw) => sum + (query.includes(kw) ? 1 : 0), 0);
    return { entry, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.entry);
}
