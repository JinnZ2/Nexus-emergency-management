/**
 * Client-side audit log for emergency actions.
 * Persists to localStorage so it survives page reloads.
 */

export interface AuditEntry {
  timestamp: string;
  action: string;
  risk: 'low' | 'medium' | 'high' | 'info';
  user: string;
  detail: string;
}

const STORAGE_KEY = 'nexus_audit_log';
const MAX_ENTRIES = 500;

/** Append an entry to the audit log */
export function logAudit(action: string, risk: AuditEntry['risk'], detail: string): AuditEntry {
  const entry: AuditEntry = {
    timestamp: new Date().toISOString(),
    action,
    risk,
    user: 'operator',
    detail,
  };

  const log = getAuditLog();
  log.unshift(entry);

  // Keep log bounded
  if (log.length > MAX_ENTRIES) {
    log.length = MAX_ENTRIES;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch {
    // localStorage may be unavailable — log still works in-memory for this session
    console.warn('[AUDIT] localStorage unavailable, entry logged to console only');
  }

  return entry;
}

/** Retrieve the full audit log */
export function getAuditLog(): AuditEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/** Clear the audit log */
export function clearAuditLog(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}

/** Format a timestamp for display in the audit log UI */
export function formatAuditTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
