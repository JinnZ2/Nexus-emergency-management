/**
 * Offline Emergency Runbook
 *
 * Pre-computed decision trees and procedures that work without network/API.
 * These are the fallback when the AI assistant is unreachable.
 */

export interface RunbookEntry {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium';
  trigger: string;
  steps: string[];
  rollback: string[];
  estimatedImpact: string;
}

export const EMERGENCY_RUNBOOK: RunbookEntry[] = [
  {
    id: 'rb-001',
    title: 'Total Service Outage',
    severity: 'critical',
    trigger: 'All TRDAP services report critical status simultaneously',
    steps: [
      'Verify outage is real (check from multiple vantage points)',
      'Activate Global Kill Switch to prevent cascading damage',
      'Isolate affected infrastructure layers (edge -> core)',
      'Enable Safe Mode on all compute nodes',
      'Initiate TRDAP Recovery pipeline for last known-good deployment',
      'Gradually re-enable services starting from core layer outward',
      'Monitor orbital node health for 15 minutes before declaring recovery',
    ],
    rollback: [
      'If recovery pipeline fails, manually roll back via deployment history',
      'If safe mode is unstable, trigger full cache flush before retry',
      'Last resort: BGP reroute to disaster recovery site',
    ],
    estimatedImpact: 'Full platform downtime. All user-facing services affected.',
  },
  {
    id: 'rb-002',
    title: 'Orbital Node Drift',
    severity: 'high',
    trigger: 'Orbital eccentricity exceeds 0.05 limit on any node',
    steps: [
      'Identify drifting node(s) in Orbital Monitoring panel',
      'Check physics health logs for drag anomalies or gravitational perturbation',
      'Initiate Orbital Realignment pipeline',
      'If node health drops below 80%, isolate from mesh network',
      'Apply delta-V correction if PHYCOM seed expansion indicates recoverable trajectory',
      'Verify node sync returns to >99% before reconnecting to mesh',
    ],
    rollback: [
      'If realignment fails, decommission node and redistribute load',
      'Activate Resource Injection pipeline to backfill capacity',
    ],
    estimatedImpact: 'Degraded performance in affected sector. Possible data replication lag.',
  },
  {
    id: 'rb-003',
    title: 'API Gateway Saturation',
    severity: 'high',
    trigger: 'API Gateway latency >500ms or CPU >95%',
    steps: [
      'Check for DDoS pattern in traffic analysis',
      'Enable WAF rate limiting if not already active',
      'Flush global cache to free memory',
      'Scale edge layer horizontally if infrastructure allows',
      'If traffic is legitimate, activate Mesh Rebalance pipeline',
      'Monitor for 10 minutes, escalate to BGP reroute if unresolved',
    ],
    rollback: [
      'Disable rate limiting if false positive detected',
      'Revert mesh weights to previous configuration',
    ],
    estimatedImpact: 'Elevated latency for all API consumers. Possible timeout errors.',
  },
  {
    id: 'rb-004',
    title: 'AI Assistant Unavailable',
    severity: 'medium',
    trigger: 'Gemini API returns errors or is unreachable',
    steps: [
      'Verify API key is valid and not rate-limited',
      'Check server/api.ts health endpoint at /api/v1/health',
      'Use this runbook for manual decision-making until AI is restored',
      'If persistent (>30 min), switch to manual monitoring mode',
      'All emergency actions remain available through the UI regardless of AI status',
    ],
    rollback: [
      'Restart API server: npm run dev:server',
      'If API key is compromised, rotate immediately and update .env.local',
    ],
    estimatedImpact: 'No AI-assisted analysis. Manual operation only. No data loss.',
  },
  {
    id: 'rb-005',
    title: 'Data Pipeline Failure',
    severity: 'high',
    trigger: 'Resource Injection or TRDAP Recovery pipeline enters error state',
    steps: [
      'Check pipeline error message in Direct Pipelines panel',
      'Verify storage layer health (Storage Engine, Cache Layer)',
      'If storage is healthy, retry pipeline with fresh parameters',
      'If storage is degraded, initiate Cache Warm-up pipeline first',
      'Monitor compute provisioning in affected sector',
      'Verify data integrity after pipeline recovery',
    ],
    rollback: [
      'If pipeline is stuck, kill and restart from last checkpoint',
      'If data corruption detected, restore from last verified snapshot',
    ],
    estimatedImpact: 'Affected sector operates at reduced capacity until resolved.',
  },
];

/** Look up a runbook entry by ID */
export function getRunbookEntry(id: string): RunbookEntry | undefined {
  return EMERGENCY_RUNBOOK.find((entry) => entry.id === id);
}

/** Find applicable runbook entries by severity */
export function getRunbookBySeverity(severity: RunbookEntry['severity']): RunbookEntry[] {
  return EMERGENCY_RUNBOOK.filter((entry) => entry.severity === severity);
}
