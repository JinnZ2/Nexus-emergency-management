/**
 * Runbook access for connected mode.
 *
 * The runbook does not live here. It lives in the base layer,
 * offline/index.html, as an embedded JSON block, mirrored in offline/RUNBOOK.md.
 * This module reads that file at build time (Vite `?raw` import) and exposes
 * the parsed data to the React application.
 *
 * Direction of dependency: the app reads the base layer. The base layer never
 * reads the app. Edit the runbook in offline/index.html and offline/RUNBOOK.md
 * together; test_base_layer.py checks that they agree.
 */
import baseLayerHtml from '../../offline/index.html?raw';

export interface RunbookEntry {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium';
  trigger: string;
  steps: string[];
  rollback: string[];
  estimatedImpact: string;
}

export interface BaseLayerRunbook {
  revision: string;
  entries: RunbookEntry[];
  keywords: Record<string, string[]>;
}

/** Path of the base layer relative to the repository root. */
export const BASE_LAYER_PATH = 'offline/index.html';

function readBaseLayer(html: string): BaseLayerRunbook {
  const match = html.match(/<script type="application\/json" id="nexus-runbook">\s*([\s\S]*?)\s*<\/script>/);
  if (!match) {
    throw new Error(`runbook block not found in ${BASE_LAYER_PATH}`);
  }
  return JSON.parse(match[1]) as BaseLayerRunbook;
}

export const BASE_LAYER: BaseLayerRunbook = readBaseLayer(baseLayerHtml);
export const EMERGENCY_RUNBOOK: RunbookEntry[] = BASE_LAYER.entries;
export const RUNBOOK_KEYWORDS: Record<string, string[]> = BASE_LAYER.keywords;
export const RUNBOOK_REVISION: string = BASE_LAYER.revision;

/** Look up a runbook entry by ID */
export function getRunbookEntry(id: string): RunbookEntry | undefined {
  return EMERGENCY_RUNBOOK.find((entry) => entry.id === id);
}

/** Find applicable runbook entries by severity */
export function getRunbookBySeverity(severity: RunbookEntry['severity']): RunbookEntry[] {
  return EMERGENCY_RUNBOOK.filter((entry) => entry.severity === severity);
}

/** Keyword scoring. Same logic as the base layer's own search. */
export function matchRunbookEntries(query: string): RunbookEntry[] {
  const lower = query.toLowerCase();
  return EMERGENCY_RUNBOOK
    .map((entry) => ({
      entry,
      score: (RUNBOOK_KEYWORDS[entry.id] || []).reduce((sum, kw) => sum + (lower.includes(kw) ? 1 : 0), 0),
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.entry);
}
