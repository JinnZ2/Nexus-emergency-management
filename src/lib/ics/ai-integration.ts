/**
 * AI Integration into ICS Command Structure
 *
 * Defines where AI partners sit within the Incident Command System,
 * what roles they can fill, their authorities, limitations,
 * and handoff protocols between AI and human operators.
 */

export type AIAuthorityLevel = 'autonomous' | 'recommend' | 'assist' | 'observe';

export interface AIRole {
  id: string;
  title: string;
  icsParent: string;           // ICS role ID this AI reports to
  authorityLevel: AIAuthorityLevel;
  capabilities: string[];
  limitations: string[];
  handoffTriggers: string[];   // conditions that require handoff to human
}

export const AI_ROLES: AIRole[] = [
  {
    id: 'ai-ops-monitor',
    title: 'AI Operations Monitor',
    icsParent: 'ops-chief',
    authorityLevel: 'recommend',
    capabilities: [
      'Continuous monitoring of all TRDAP service metrics',
      'Anomaly detection across latency, CPU, memory, and error rates',
      'Pattern recognition for cascading failure prediction',
      'Automated situation reports every 15 minutes',
      'Resource utilization forecasting (4-hour lookahead)',
      'Cross-domain correlation (e.g., power affecting comms)',
    ],
    limitations: [
      'Cannot execute emergency actions — must stage for human approval',
      'Cannot modify infrastructure configuration autonomously',
      'Cannot override human decisions or Safety Officer orders',
      'Cannot communicate externally (no public statements, no mutual aid requests)',
    ],
    handoffTriggers: [
      'Anomaly confidence drops below 70% — flag for human interpretation',
      'Multiple conflicting indicators — human judgment required',
      'Incident level escalates to 4 or 5 — human takes direct control',
      'AI model uncertainty exceeds threshold — defer to human expertise',
      'Life-safety decision required — always human',
    ],
  },
  {
    id: 'ai-planning-analyst',
    title: 'AI Planning Analyst',
    icsParent: 'planning-chief',
    authorityLevel: 'assist',
    capabilities: [
      'Aggregate and synthesize data from all resource domains',
      'Generate draft Incident Action Plans from current data',
      'Model "what-if" scenarios for proposed actions',
      'Track resource status and predict exhaustion timelines',
      'Historical incident pattern matching',
      'Generate situation summaries for briefings',
    ],
    limitations: [
      'Draft plans require Planning Chief review and IC approval',
      'Cannot prioritize between competing objectives — that is a human values decision',
      'Scenario models are probabilistic, not certain — must communicate uncertainty',
      'Cannot access classified or restricted information beyond its clearance',
    ],
    handoffTriggers: [
      'Plan involves trade-offs between life-safety objectives — human decides',
      'Data quality degrades (stale sensors, conflicting reports) — flag to Planning Chief',
      'Scenario modeling shows high variance (>40% uncertainty) — present options, do not recommend',
      'Inter-agency coordination required — Liaison Officer handles',
    ],
  },
  {
    id: 'ai-logistics-optimizer',
    title: 'AI Logistics Optimizer',
    icsParent: 'logistics-chief',
    authorityLevel: 'recommend',
    capabilities: [
      'Optimize resource allocation across domains',
      'Track supply chain status and predict shortages',
      'Recommend personnel shift scheduling to minimize fatigue',
      'Calculate fuel consumption and generator runtime projections',
      'Identify mutual aid resources from connected databases',
      'Draft resource requests for Logistics Chief review',
    ],
    limitations: [
      'Cannot procure resources or authorize purchases',
      'Cannot reassign personnel between sections without Logistics Chief approval',
      'Cannot contact external vendors or mutual aid partners directly',
      'Resource recommendations must account for human factors (morale, local knowledge)',
    ],
    handoffTriggers: [
      'Resource conflict between domains — Logistics Chief arbitrates',
      'Emergency procurement needed — Finance Chief must authorize',
      'Volunteer coordination — human touch required for morale and safety briefing',
      'Supply chain disruption beyond modeled parameters — human assessment needed',
    ],
  },
  {
    id: 'ai-comms-coordinator',
    title: 'AI Communications Coordinator',
    icsParent: 'comms-lead',
    authorityLevel: 'autonomous',
    capabilities: [
      'Monitor all communication channel health in real-time',
      'Automatically switch to backup channels on primary failure',
      'Route messages to appropriate ICS roles based on content',
      'Log all communications for audit trail',
      'Detect communication anomalies (jamming, interference)',
      'Generate communication status reports',
    ],
    limitations: [
      'Cannot compose or send external communications (PIO responsibility)',
      'Cannot encrypt/decrypt classified traffic — pass through only',
      'Automatic channel switching limited to pre-approved backup list',
      'Cannot make content decisions about message priority for human-authored messages',
    ],
    handoffTriggers: [
      'All pre-approved backup channels exhausted — Comms Lead decides next steps',
      'Suspected security compromise of comm channels — Security/Safety Officer',
      'Need to establish new frequency coordination with external agencies — Liaison',
      'Communication content involves operational security decisions — IC',
    ],
  },
  {
    id: 'ai-safety-sentinel',
    title: 'AI Safety Sentinel',
    icsParent: 'safety',
    authorityLevel: 'recommend',
    capabilities: [
      'Monitor environmental conditions (weather, hazmat readings, structural integrity)',
      'Track personnel work hours and flag fatigue risks',
      'Cross-reference current conditions against known hazard patterns',
      'Generate safety alerts and advisories',
      'Monitor for IDLH (Immediately Dangerous to Life and Health) indicators',
      'Track PPE compliance and expiration',
    ],
    limitations: [
      'Cannot order operations halted — only Safety Officer has that authority',
      'Cannot make judgment calls on acceptable risk — that requires human risk tolerance assessment',
      'Sensor data interpretation in ambiguous conditions defers to human experts',
      'Cannot override operational decisions, only flag safety concerns',
    ],
    handoffTriggers: [
      'IDLH indicators detected — IMMEDIATE alert to Safety Officer for decision',
      'Conflicting safety data — human expert assessment required',
      'Personnel showing signs of acute stress/trauma — human welfare check required',
      'Novel hazard not in training data — flag to Safety Officer and Planning',
    ],
  },
];

/** Handoff protocol between AI and human operators */
export interface HandoffProtocol {
  id: string;
  name: string;
  direction: 'ai_to_human' | 'human_to_ai' | 'bidirectional';
  trigger: string;
  procedure: string[];
  acknowledgmentRequired: boolean;
}

export const HANDOFF_PROTOCOLS: HandoffProtocol[] = [
  {
    id: 'ho-001',
    name: 'Escalation to Human',
    direction: 'ai_to_human',
    trigger: 'AI encounters situation beyond its authority level or confidence threshold',
    procedure: [
      'AI generates structured handoff brief: situation, actions taken, options identified, uncertainty level',
      'Alert sent to responsible ICS role with priority tag',
      'AI continues monitoring but takes no further autonomous action on the escalated issue',
      'Human acknowledges receipt within 5 minutes (or alert escalates up chain)',
      'Human makes decision and communicates back to AI',
      'AI logs the handoff, decision, and rationale in audit trail',
    ],
    acknowledgmentRequired: true,
  },
  {
    id: 'ho-002',
    name: 'Task Delegation to AI',
    direction: 'human_to_ai',
    trigger: 'Human operator delegates monitoring or analysis task to AI partner',
    procedure: [
      'Human specifies: task scope, authority level, reporting frequency, escalation criteria',
      'AI confirms understanding and restates parameters',
      'AI begins task and sends initial status within 5 minutes',
      'AI reports at specified intervals or immediately on escalation triggers',
      'Human can recall delegation at any time with "RECALL [task-id]"',
      'Task logged with start/end times, delegating authority, and outcomes',
    ],
    acknowledgmentRequired: true,
  },
  {
    id: 'ho-003',
    name: 'Shift Handoff (AI Continuity)',
    direction: 'bidirectional',
    trigger: 'Human shift change — AI maintains continuity across human operator transitions',
    procedure: [
      'AI generates comprehensive shift handoff brief 15 minutes before shift change',
      'Brief includes: active incidents, pending actions, resource status, open concerns',
      'Incoming human operator reviews brief and asks AI clarifying questions',
      'AI flags any items where outgoing operator had specific context or preferences',
      'Incoming operator confirms handoff accepted',
      'AI adjusts communication style/preferences for new operator if different',
    ],
    acknowledgmentRequired: true,
  },
  {
    id: 'ho-004',
    name: 'Emergency Override',
    direction: 'ai_to_human',
    trigger: 'AI detects condition requiring immediate human action that cannot wait for normal escalation',
    procedure: [
      'AI sends PRIORITY ALERT to all relevant ICS roles simultaneously',
      'Alert includes: condition detected, severity assessment, recommended immediate action',
      'AI activates all backup notification channels (redundancy)',
      'If no human acknowledgment within 2 minutes, AI escalates to IC directly',
      'AI continues alerting until acknowledged — does NOT take autonomous action beyond alerting',
      'Exception: AI Comms Coordinator may auto-switch to backup channels per pre-approved list',
    ],
    acknowledgmentRequired: true,
  },
];

/** Get AI roles that report to a specific ICS role */
export function getAIReportsTo(icsRoleId: string): AIRole[] {
  return AI_ROLES.filter((r) => r.icsParent === icsRoleId);
}
