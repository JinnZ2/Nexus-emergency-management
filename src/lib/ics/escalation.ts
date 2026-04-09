/**
 * ICS Escalation Matrix
 *
 * Defines incident levels, authority transfer rules, and when/how
 * to deviate from standard chain of command.
 */

export type IncidentLevel = 1 | 2 | 3 | 4 | 5;

export interface IncidentLevelDef {
  level: IncidentLevel;
  name: string;
  description: string;
  typicalScope: string;
  activatedSections: string[];  // ICS section IDs that should be activated
  authorityHolder: string;       // ICS role ID
  deviationAuthority: string;    // who can authorize protocol deviations at this level
}

export const INCIDENT_LEVELS: IncidentLevelDef[] = [
  {
    level: 1,
    name: 'Monitoring',
    description: 'Potential incident identified. Situation under observation.',
    typicalScope: 'Single system or localized issue',
    activatedSections: ['ic'],
    authorityHolder: 'ops-chief',
    deviationAuthority: 'ops-chief',
  },
  {
    level: 2,
    name: 'Alert',
    description: 'Confirmed incident with limited impact. Response initiated.',
    typicalScope: 'Single domain, contained area',
    activatedSections: ['ic', 'ops-chief'],
    authorityHolder: 'ic',
    deviationAuthority: 'ic',
  },
  {
    level: 3,
    name: 'Emergency',
    description: 'Significant incident affecting multiple systems or domains.',
    typicalScope: 'Multiple domains, community-level impact',
    activatedSections: ['ic', 'ops-chief', 'planning-chief', 'logistics-chief'],
    authorityHolder: 'ic',
    deviationAuthority: 'ic',
  },
  {
    level: 4,
    name: 'Major Emergency',
    description: 'Severe incident requiring full ICS activation and mutual aid.',
    typicalScope: 'Multi-jurisdictional, regional impact',
    activatedSections: ['ic', 'ops-chief', 'planning-chief', 'logistics-chief', 'finance-chief', 'pio', 'safety', 'liaison'],
    authorityHolder: 'ic',
    deviationAuthority: 'ic',
  },
  {
    level: 5,
    name: 'Catastrophic',
    description: 'Catastrophic failure. Standard protocols may be insufficient. Maximum flexibility authorized.',
    typicalScope: 'Regional/national, cascading failures across all domains',
    activatedSections: ['ic', 'ops-chief', 'planning-chief', 'logistics-chief', 'finance-chief', 'pio', 'safety', 'liaison', 'comms-lead', 'power-lead', 'water-lead', 'es-lead', 'labor-lead'],
    authorityHolder: 'ic',
    deviationAuthority: 'ic',
  },
];

export interface DeviationRule {
  id: string;
  name: string;
  condition: string;
  standardChain: string;
  deviatedChain: string;
  justification: string;
  constraints: string[];
  documentationRequired: boolean;
}

/** When and how to break from standard chain of command */
export const DEVIATION_RULES: DeviationRule[] = [
  {
    id: 'dev-rule-1',
    name: 'IC Incapacitated',
    condition: 'Incident Commander is unreachable, incapacitated, or compromised',
    standardChain: 'All decisions flow through IC',
    deviatedChain: 'Operations Chief assumes IC role per succession order. If Ops Chief also unavailable, Planning Chief assumes.',
    justification: 'Continuity of command is more critical than waiting for the designated IC.',
    constraints: [
      'Successor must announce assumption of command on all channels',
      'Document time of transfer and reason',
      'Revert to original IC upon their return unless formally relieved',
    ],
    documentationRequired: true,
  },
  {
    id: 'dev-rule-2',
    name: 'Communication Failure Override',
    condition: 'Unable to reach higher authority and time-critical decision required',
    standardChain: 'Request authorization from section chief or IC before acting',
    deviatedChain: 'Unit leader acts on best judgment for immediate life-safety. Reports decision at first opportunity.',
    justification: 'Life-safety decisions cannot wait for communication restoration.',
    constraints: [
      'Only applies when human life is in immediate danger',
      'Must attempt all available communication methods first',
      'Document decision rationale, time, and circumstances',
      'Report to chain of command within 1 hour of communication restoration',
    ],
    documentationRequired: true,
  },
  {
    id: 'dev-rule-3',
    name: 'Cross-Domain Resource Seizure',
    condition: 'Critical resource needed by one domain is allocated to another, and reallocation through Logistics is too slow',
    standardChain: 'Request through Logistics Chief who balances across domains',
    deviatedChain: 'Operations Chief directly reassigns resource between domains. Logistics Chief is notified after the fact.',
    justification: 'In rapidly evolving situations, the Logistics request cycle may be too slow for life-safety needs.',
    constraints: [
      'Only Ops Chief or IC can authorize',
      'Must be life-safety justified (not convenience)',
      'Logistics Chief must be notified within 30 minutes',
      'Resource must be returned or formally reallocated within the next operational period',
    ],
    documentationRequired: true,
  },
  {
    id: 'dev-rule-4',
    name: 'Safety Override',
    condition: 'Safety Officer identifies immediate danger to life and health (IDLH)',
    standardChain: 'Safety Officer advises IC who makes operational decisions',
    deviatedChain: 'Safety Officer can directly order halt/withdrawal without IC approval.',
    justification: 'The Safety Officer has standing authority to stop operations when IDLH conditions exist. This is not a deviation — it is a built-in ICS feature that overrides normal command.',
    constraints: [
      'Must be genuine IDLH condition (not general concern)',
      'IC must be notified as soon as possible',
      'Operations resume only when Safety Officer clears the condition',
    ],
    documentationRequired: true,
  },
  {
    id: 'dev-rule-5',
    name: 'Catastrophic Cascade Authorization',
    condition: 'Level 5 incident with simultaneous failures across 3+ domains',
    standardChain: 'Each domain follows its own standard protocol independently',
    deviatedChain: 'IC consolidates all domain operations under a single tactical priority list. Lower-priority domains operate at minimum viable level.',
    justification: 'When everything is failing simultaneously, parallel independent responses compete for the same resources. Unified triage prevents mutual interference.',
    constraints: [
      'IC must formally declare catastrophic cascade',
      'Priority list must be communicated to all section chiefs',
      'Each domain chief can escalate back to IC if their domain reaches life-safety threshold',
      'Revert to independent domain operations as soon as cascade stabilizes',
    ],
    documentationRequired: true,
  },
];

/** Get the incident level definition */
export function getIncidentLevel(level: IncidentLevel): IncidentLevelDef {
  return INCIDENT_LEVELS[level - 1];
}

/** Determine which deviation rules apply at a given incident level */
export function getApplicableDeviations(level: IncidentLevel): DeviationRule[] {
  if (level <= 2) return DEVIATION_RULES.filter(r => r.id === 'dev-rule-1' || r.id === 'dev-rule-4');
  if (level <= 4) return DEVIATION_RULES.filter(r => r.id !== 'dev-rule-5');
  return DEVIATION_RULES; // Level 5: all deviations potentially applicable
}
