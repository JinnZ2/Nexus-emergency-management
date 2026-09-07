/**
 * Assistant service, connected mode.
 *
 * Order of operations:
 *   base layer (runbook keyword match, synchronous, always)
 *     -> enhancement (any provider via the server proxy), only if a probe
 *        has said it is reachable, and only as an addition to the base result.
 *
 * The base result never waits on the network. If enhancement is unreachable,
 * nothing retries, nothing times out in front of the operator, and no banner
 * blocks use. The enhancement request itself has a hard abort so a hung
 * backhaul cannot hold a pending indicator open forever.
 *
 * File name is inherited from the scaffold; see INVESTIGATION.md, E3.
 */
import { EMERGENCY_RUNBOOK, RUNBOOK_REVISION, matchRunbookEntries } from '@/lib/runbook';

export type AssistantLayer = 'base' | 'enhancement';

export interface AssistantResponse {
  content: string;
  provider: string;       // 'base' | 'gemini' | 'claude' | 'openai'
  layer: AssistantLayer;
}

export interface EnhancementState {
  reachable: boolean | null;   // null = not probed yet
  providers: string[];
  checkedAt: string | null;
}

const PROBE_TIMEOUT_MS = 3_000;
const ENHANCEMENT_TIMEOUT_MS = 20_000;

// --- Base layer ---

/** Synchronous. Always produces a result. */
export function baseLayerResponse(prompt: string): AssistantResponse {
  const matches = matchRunbookEntries(prompt);

  if (matches.length === 0) {
    return {
      content:
        `[BASE LAYER rev ${RUNBOOK_REVISION}] No runbook match for that wording.\n\n` +
        `Procedures available:\n${EMERGENCY_RUNBOOK.map((r) => `- ${r.id} "${r.title}" (${r.severity})`).join('\n')}\n\n` +
        `Try: outage, orbital drift, gateway, API, pipeline.`,
      provider: 'base',
      layer: 'base',
    };
  }

  const entry = matches[0];
  const steps = entry.steps.map((s, i) => `  ${i + 1}. ${s}`).join('\n');
  const rollback = entry.rollback.map((s) => `  - ${s}`).join('\n');

  let content = `[BASE LAYER rev ${RUNBOOK_REVISION}] ${entry.id}\n\n`;
  content += `**${entry.title}** (Severity: ${entry.severity.toUpperCase()})\n\n`;
  content += `Trigger: ${entry.trigger}\n\n`;
  content += `Steps:\n${steps}\n\n`;
  content += `Rollback:\n${rollback}\n\n`;
  content += `Impact: ${entry.estimatedImpact}`;
  if (matches.length > 1) {
    content += `\n\n---\nAlso relevant: ${matches.slice(1).map((m) => `"${m.title}"`).join(', ')}`;
  }

  return { content, provider: 'base', layer: 'base' };
}

// --- Enhancement ---

function withTimeout(ms: number): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

/** One probe. Never throws. Call on mount, on the browser `online` event, or on operator request. */
export async function probeEnhancement(): Promise<EnhancementState> {
  const t = withTimeout(PROBE_TIMEOUT_MS);
  try {
    const res = await fetch('/api/v1/health', { signal: t.signal });
    if (!res.ok) return { reachable: false, providers: [], checkedAt: new Date().toISOString() };
    const data = await res.json();
    const providers: string[] = Array.isArray(data.activeProviders) ? data.activeProviders : [];
    return { reachable: providers.length > 0, providers, checkedAt: new Date().toISOString() };
  } catch {
    return { reachable: false, providers: [], checkedAt: new Date().toISOString() };
  } finally {
    t.clear();
  }
}

/**
 * Ask a provider to augment what the base layer already produced.
 * Returns null on any failure. Never throws. Never retries.
 */
export async function requestEnhancement(
  prompt: string,
  context: string,
  base: AssistantResponse,
): Promise<AssistantResponse | null> {
  const t = withTimeout(ENHANCEMENT_TIMEOUT_MS);
  try {
    const res = await fetch('/api/v1/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        // The server caps context at 2000 chars. Base result goes first so the
        // provider sees what the operator already has.
        context: `${base.content.slice(0, 1400)}\n\n${context}`.slice(0, 2000),
      }),
      signal: t.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.response) return null;
    return { content: data.response, provider: data.provider || 'unknown', layer: 'enhancement' };
  } catch {
    return null;
  } finally {
    t.clear();
  }
}
