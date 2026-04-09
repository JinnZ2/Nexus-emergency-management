/**
 * AI Staging Queue
 *
 * AI partners propose actions here. Humans review, approve, reject, or modify.
 * Nothing executes without human approval (except pre-authorized autonomous actions).
 */

export type StagedActionStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'expired' | 'modified';
export type ActionPriority = 'critical' | 'high' | 'medium' | 'low';

export interface StagedAction {
  id: string;
  timestamp: string;
  proposedBy: string;          // AI role ID
  targetDomain: string;        // resource domain or 'cross-domain'
  priority: ActionPriority;
  title: string;
  description: string;
  rationale: string;
  affectedResources: string[];
  estimatedImpact: string;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;          // 0-100, AI's confidence in recommendation
  status: StagedActionStatus;
  reviewedBy: string | null;   // human who reviewed
  reviewNotes: string | null;
  expiresAt: string | null;    // some actions are time-sensitive
  dependencies: string[];      // IDs of actions this depends on
}

const STORAGE_KEY = 'nexus_staging_queue';

/** Get all staged actions */
export function getStagedActions(): StagedAction[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : getInitialQueue();
  } catch {
    return getInitialQueue();
  }
}

/** Add a new action to the staging queue */
export function stageAction(action: Omit<StagedAction, 'id' | 'timestamp' | 'status' | 'reviewedBy' | 'reviewNotes'>): StagedAction {
  const staged: StagedAction = {
    ...action,
    id: `sa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    status: 'pending',
    reviewedBy: null,
    reviewNotes: null,
  };

  const queue = getStagedActions();
  queue.unshift(staged);
  saveQueue(queue);
  return staged;
}

/** Update the status of a staged action (approve, reject, etc.)
 *  Automatically records the decision in the accountability log. */
export function reviewAction(
  actionId: string,
  status: 'approved' | 'rejected' | 'modified',
  reviewedBy: string,
  notes: string,
  incidentLevel: number = 3
): StagedAction | null {
  if (!notes.trim()) return null; // rationale is required for accountability

  const queue = getStagedActions();
  const action = queue.find((a) => a.id === actionId);
  if (!action) return null;

  const proposedAt = action.timestamp;
  const decidedAt = new Date().toISOString();
  const responseTimeMs = new Date(decidedAt).getTime() - new Date(proposedAt).getTime();

  action.status = status;
  action.reviewedBy = reviewedBy;
  action.reviewNotes = notes;
  saveQueue(queue);

  // Write to the decision accountability log
  try {
    const { logDecision } = require('./decision-log');
    logDecision(
      {
        actionId: action.id,
        aiRole: action.proposedBy,
        title: action.title,
        description: action.description,
        rationale: action.rationale,
        confidence: action.confidence,
        priority: action.priority,
        riskLevel: action.riskLevel,
        proposedAt,
      },
      {
        decision: status,
        decidedBy: reviewedBy,
        rationale: notes,
        decidedAt,
        responseTimeMs,
      },
      incidentLevel,
      action.targetDomain,
      []
    );
  } catch {
    // decision log import may fail in non-browser environments
  }

  return action;
}

/** Mark an approved action as executed */
export function markExecuted(actionId: string): void {
  const queue = getStagedActions();
  const action = queue.find((a) => a.id === actionId);
  if (action && action.status === 'approved') {
    action.status = 'executed';
    saveQueue(queue);
  }
}

/** Clear expired actions */
export function clearExpired(): number {
  const queue = getStagedActions();
  const now = new Date().toISOString();
  let cleared = 0;

  for (const action of queue) {
    if (action.expiresAt && action.expiresAt < now && action.status === 'pending') {
      action.status = 'expired';
      cleared++;
    }
  }

  if (cleared > 0) saveQueue(queue);
  return cleared;
}

function saveQueue(queue: StagedAction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue.slice(0, 200)));
  } catch {
    // localStorage unavailable
  }
}

/** Demonstration queue showing the kinds of actions AI partners propose */
function getInitialQueue(): StagedAction[] {
  const now = new Date();
  const later = (mins: number) => new Date(now.getTime() + mins * 60000).toISOString();
  const ago = (mins: number) => new Date(now.getTime() - mins * 60000).toISOString();

  return [
    {
      id: 'sa-demo-001',
      timestamp: ago(3),
      proposedBy: 'ai-ops-monitor',
      targetDomain: 'electricity',
      priority: 'high',
      title: 'Initiate Load Shedding - Tier 3 Non-Critical',
      description: 'Generator fuel consumption is 15% above projected rate. At current burn rate, reserves drop below 25% threshold in approximately 3.5 hours. Recommend shedding Tier 3 (non-critical) loads now to extend runtime to 6+ hours.',
      rationale: 'Fuel resupply ETA is 5 hours per Logistics. Current burn rate will cross 25% threshold before resupply arrives. Proactive shedding avoids emergency triage later.',
      affectedResources: ['r-010', 'r-012'],
      estimatedImpact: 'Non-critical systems (office lighting, non-essential HVAC) go offline. No impact to critical operations.',
      riskLevel: 'low',
      confidence: 87,
      status: 'pending',
      reviewedBy: null,
      reviewNotes: null,
      expiresAt: later(60),
      dependencies: [],
    },
    {
      id: 'sa-demo-002',
      timestamp: ago(8),
      proposedBy: 'ai-safety-sentinel',
      targetDomain: 'labor',
      priority: 'critical',
      title: 'Mandatory Rest - Shift A Approaching 14-Hour Mark',
      description: 'Shift A team has been on duty for 13 hours 42 minutes. ICS protocol mandates rest after 16 hours, but cognitive impairment research shows significant degradation after 14 hours. Recommend initiating shift transition now.',
      rationale: 'Personnel fatigue is a leading cause of incident-within-incident. Early transition is safer than waiting for the hard limit.',
      affectedResources: ['r-030', 'r-031'],
      estimatedImpact: 'Brief reduction in operational capacity during 30-minute handoff period.',
      riskLevel: 'medium',
      confidence: 94,
      status: 'pending',
      reviewedBy: null,
      reviewNotes: null,
      expiresAt: later(30),
      dependencies: [],
    },
    {
      id: 'sa-demo-003',
      timestamp: ago(15),
      proposedBy: 'ai-planning-analyst',
      targetDomain: 'cross-domain',
      priority: 'medium',
      title: 'Draft IAP Update - Incorporate Water Quality Data',
      description: 'Latest water quality test results from Distribution Point 3 show slight elevation in turbidity (2.1 NTU vs 1.0 NTU baseline). Not actionable yet but trend is upward. Recommend updating the Incident Action Plan to include water quality monitoring at 30-minute intervals instead of current 2-hour intervals.',
      rationale: 'Early detection of water quality degradation enables proactive response before contamination thresholds are reached. Cost of increased monitoring is minimal.',
      affectedResources: ['r-022'],
      estimatedImpact: 'Increased monitoring workload for Water Systems Lead. No operational disruption.',
      riskLevel: 'low',
      confidence: 72,
      status: 'pending',
      reviewedBy: null,
      reviewNotes: null,
      expiresAt: null,
      dependencies: [],
    },
    {
      id: 'sa-demo-004',
      timestamp: ago(25),
      proposedBy: 'ai-logistics-optimizer',
      targetDomain: 'communication',
      priority: 'medium',
      title: 'Pre-position Satellite Phones at Forward Staging',
      description: 'Weather forecast shows 40% probability of thunderstorms in 6 hours which could degrade cellular and radio comms. Recommend pre-positioning satellite phone kit from Equipment Cache A to Forward Staging Area.',
      rationale: 'Proactive positioning eliminates 45-minute transport delay if storms materialize. Kit is currently available and unassigned.',
      affectedResources: ['r-002'],
      estimatedImpact: 'Satellite phones unavailable at Equipment Cache A. Available at Forward Staging instead.',
      riskLevel: 'low',
      confidence: 68,
      status: 'approved',
      reviewedBy: 'logistics-chief',
      reviewNotes: 'Good thinking. Approved — send with next supply run.',
      expiresAt: null,
      dependencies: [],
    },
    {
      id: 'sa-demo-005',
      timestamp: ago(45),
      proposedBy: 'ai-ops-monitor',
      targetDomain: 'emergency_services',
      priority: 'high',
      title: 'Request Additional ALS Unit - Predicted Demand Surge',
      description: 'Based on incident progression pattern matching, I predict a 73% probability of additional medical needs within the next 2 hours. Current ALS capacity (2 units) will likely be insufficient.',
      rationale: 'Historical pattern: incidents of this type and duration see a second wave of medical needs as initial adrenaline wears off and delayed symptoms present.',
      affectedResources: ['r-041'],
      estimatedImpact: 'Mutual aid ALS unit deployed to medical staging. Cost: mutual aid agreement activation.',
      riskLevel: 'low',
      confidence: 73,
      status: 'rejected',
      reviewedBy: 'es-lead',
      reviewNotes: 'Appreciate the analysis but our current 2 units are handling well. Nearest mutual aid ALS is 45 min away. Will reconsider if actual demand increases.',
      expiresAt: null,
      dependencies: [],
    },
  ];
}
