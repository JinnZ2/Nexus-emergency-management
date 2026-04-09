/**
 * Decision Log — Accountability Trail for AI/Human Decisions
 *
 * Every time an AI proposes and a human decides, the full chain is recorded:
 * what the AI recommended, what the human decided, why, what happened after,
 * and (if relevant) whether the AI's prediction proved right or wrong.
 *
 * This is NOT a general audit log — it is specifically for the AI-proposes,
 * human-decides accountability chain. It answers: "Who knew what, when,
 * and who decided what, and why?"
 */

export type DecisionOutcome = 'pending_outcome' | 'ai_correct' | 'ai_incorrect' | 'inconclusive' | 'not_applicable';

export interface DecisionRecord {
  id: string;

  // What the AI proposed
  aiProposal: {
    actionId: string;          // staging queue action ID
    aiRole: string;            // AI role that proposed
    title: string;
    description: string;
    rationale: string;
    confidence: number;        // AI's stated confidence at time of proposal
    priority: string;
    riskLevel: string;
    proposedAt: string;        // ISO timestamp
  };

  // What the human decided
  humanDecision: {
    decision: 'approved' | 'rejected' | 'modified' | 'expired';
    decidedBy: string;         // human role/name
    rationale: string;         // WHY they decided this — required, cannot be blank
    decidedAt: string;         // ISO timestamp
    responseTimeMs: number;    // how long from proposal to decision
  };

  // What actually happened (filled in retrospectively)
  outcome: {
    status: DecisionOutcome;
    description: string;       // what actually happened
    recordedBy: string;        // who recorded the outcome
    recordedAt: string;        // ISO timestamp
  } | null;

  // Metadata
  incidentLevel: number;       // 1-5 at time of decision
  domain: string;
  tags: string[];              // searchable tags for pattern analysis
}

const STORAGE_KEY = 'nexus_decision_log';
const MAX_RECORDS = 1000;

/** Get all decision records */
export function getDecisionLog(): DecisionRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : getInitialLog();
  } catch {
    return getInitialLog();
  }
}

/** Record a new decision (called when a staged action is reviewed) */
export function logDecision(
  proposal: DecisionRecord['aiProposal'],
  decision: DecisionRecord['humanDecision'],
  incidentLevel: number,
  domain: string,
  tags: string[] = []
): DecisionRecord {
  const record: DecisionRecord = {
    id: `dr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    aiProposal: proposal,
    humanDecision: decision,
    outcome: null,
    incidentLevel,
    domain,
    tags,
  };

  const log = getDecisionLog();
  log.unshift(record);
  if (log.length > MAX_RECORDS) log.length = MAX_RECORDS;
  saveLog(log);
  return record;
}

/** Record the actual outcome for a decision (retrospective accountability) */
export function recordOutcome(
  decisionId: string,
  status: DecisionOutcome,
  description: string,
  recordedBy: string
): DecisionRecord | null {
  const log = getDecisionLog();
  const record = log.find((r) => r.id === decisionId);
  if (!record) return null;

  record.outcome = {
    status,
    description,
    recordedBy,
    recordedAt: new Date().toISOString(),
  };

  saveLog(log);
  return record;
}

/** Get statistics for pattern analysis */
export function getDecisionStats(): {
  total: number;
  approved: number;
  rejected: number;
  expired: number;
  outcomesRecorded: number;
  aiCorrect: number;
  aiIncorrect: number;
  avgResponseTimeMs: number;
  avgConfidence: number;
  rejectedByRole: Record<string, number>;
} {
  const log = getDecisionLog();

  const approved = log.filter((r) => r.humanDecision.decision === 'approved').length;
  const rejected = log.filter((r) => r.humanDecision.decision === 'rejected').length;
  const expired = log.filter((r) => r.humanDecision.decision === 'expired').length;
  const withOutcome = log.filter((r) => r.outcome !== null);
  const aiCorrect = withOutcome.filter((r) => r.outcome?.status === 'ai_correct').length;
  const aiIncorrect = withOutcome.filter((r) => r.outcome?.status === 'ai_incorrect').length;

  const responseTimes = log.map((r) => r.humanDecision.responseTimeMs).filter((t) => t > 0);
  const avgResponseTimeMs = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : 0;

  const confidences = log.map((r) => r.aiProposal.confidence);
  const avgConfidence = confidences.length > 0
    ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
    : 0;

  const rejectedByRole: Record<string, number> = {};
  for (const r of log) {
    if (r.humanDecision.decision === 'rejected') {
      const role = r.humanDecision.decidedBy;
      rejectedByRole[role] = (rejectedByRole[role] || 0) + 1;
    }
  }

  return {
    total: log.length,
    approved,
    rejected,
    expired,
    outcomesRecorded: withOutcome.length,
    aiCorrect,
    aiIncorrect,
    avgResponseTimeMs,
    avgConfidence,
    rejectedByRole,
  };
}

/** Export the decision log as JSON (for post-incident review) */
export function exportDecisionLog(): string {
  return JSON.stringify(getDecisionLog(), null, 2);
}

function saveLog(log: DecisionRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch {
    console.warn('[DECISION LOG] localStorage unavailable');
  }
}

/** Demonstration log showing the accountability chain in action */
function getInitialLog(): DecisionRecord[] {
  const now = new Date();
  const ago = (mins: number) => new Date(now.getTime() - mins * 60000).toISOString();

  return [
    {
      id: 'dr-demo-001',
      aiProposal: {
        actionId: 'sa-demo-005',
        aiRole: 'ai-ops-monitor',
        title: 'Request Additional ALS Unit - Predicted Demand Surge',
        description: 'Based on incident progression pattern matching, I predict a 73% probability of additional medical needs within the next 2 hours.',
        rationale: 'Historical pattern: incidents of this type and duration see a second wave of medical needs as initial adrenaline wears off and delayed symptoms present.',
        confidence: 73,
        priority: 'high',
        riskLevel: 'low',
        proposedAt: ago(45),
      },
      humanDecision: {
        decision: 'rejected',
        decidedBy: 'es-lead',
        rationale: 'Current 2 ALS units are handling demand well with margin. Nearest mutual aid ALS is 45 min away — the response time cost outweighs the speculative benefit at 73% confidence. Will reconsider if actual demand shows increase. AI pattern matching may not account for our pre-positioned first aid teams reducing ALS demand.',
        decidedAt: ago(40),
        responseTimeMs: 300_000,
      },
      outcome: null,
      incidentLevel: 3,
      domain: 'emergency_services',
      tags: ['ems', 'mutual-aid', 'pattern-match', 'demand-forecast'],
    },
    {
      id: 'dr-demo-002',
      aiProposal: {
        actionId: 'sa-demo-004',
        aiRole: 'ai-logistics-optimizer',
        title: 'Pre-position Satellite Phones at Forward Staging',
        description: 'Weather forecast shows 40% probability of thunderstorms in 6 hours which could degrade cellular and radio comms.',
        rationale: 'Proactive positioning eliminates 45-minute transport delay if storms materialize. Kit is currently available and unassigned.',
        confidence: 68,
        priority: 'medium',
        riskLevel: 'low',
        proposedAt: ago(25),
      },
      humanDecision: {
        decision: 'approved',
        decidedBy: 'logistics-chief',
        rationale: 'Low cost, high option value. Even at 40% storm probability the downside of not having satphones forward is worse than the minor inconvenience of moving them. Send with next supply run.',
        decidedAt: ago(22),
        responseTimeMs: 180_000,
      },
      outcome: {
        status: 'ai_correct',
        description: 'Thunderstorms arrived 5.5 hours later. Cellular degraded for 90 minutes. Satellite phones at forward staging were used for 3 critical coordination calls during the outage.',
        recordedBy: 'comms-lead',
        recordedAt: ago(2),
      },
      incidentLevel: 3,
      domain: 'communication',
      tags: ['weather', 'comms', 'pre-positioning', 'proactive'],
    },
    {
      id: 'dr-demo-003',
      aiProposal: {
        actionId: 'sa-prior-001',
        aiRole: 'ai-safety-sentinel',
        title: 'Evacuate Building C - Structural Vibration Anomaly',
        description: 'Accelerometer data shows 2.3x normal vibration amplitude in Building C northeast corner, consistent with structural fatigue patterns.',
        rationale: 'Pattern matches pre-collapse indicators from training data. Confidence is moderate because sensor data could also be explained by nearby heavy equipment operation.',
        confidence: 61,
        priority: 'critical',
        riskLevel: 'high',
        proposedAt: ago(120),
      },
      humanDecision: {
        decision: 'approved',
        decidedBy: 'ic',
        rationale: 'Even at 61% confidence, life-safety risk of a structural failure justifies evacuation. Cost of false alarm (temporary relocation) is acceptable vs. cost of being wrong (casualties). Ordering evacuation and structural assessment.',
        decidedAt: ago(118),
        responseTimeMs: 120_000,
      },
      outcome: {
        status: 'ai_incorrect',
        description: 'Structural engineer assessment found vibrations were caused by a malfunctioning HVAC compressor on the roof, not structural fatigue. Building was safe. However, IC decision to evacuate was still correct given information available at the time — the cost of being wrong about a structural issue is too high to gamble on.',
        recordedBy: 'planning-chief',
        recordedAt: ago(90),
      },
      incidentLevel: 4,
      domain: 'emergency_services',
      tags: ['structural', 'evacuation', 'false-positive', 'life-safety', 'correct-decision-wrong-prediction'],
    },
  ];
}
