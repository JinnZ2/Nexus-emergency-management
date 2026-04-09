/**
 * ICS Standard Protocols per Resource Domain
 *
 * Each domain has standard operating procedures and explicit deviation triggers —
 * conditions under which the standard protocol is insufficient and operators
 * must escalate or improvise.
 */

export type ResourceDomain = 'communication' | 'electricity' | 'water' | 'labor' | 'emergency_services';

export interface ProtocolStep {
  order: number;
  action: string;
  responsible: string;   // ICS role ID
  timeLimit?: string;    // e.g. "15 min", "1 hour"
  critical: boolean;     // if true, failure here triggers escalation
}

export interface DeviationTrigger {
  id: string;
  condition: string;
  threshold: string;
  action: string;
  authorizedBy: string;  // ICS role ID that can authorize deviation
}

export interface DomainProtocol {
  domain: ResourceDomain;
  label: string;
  description: string;
  standardProcedure: ProtocolStep[];
  deviationTriggers: DeviationTrigger[];
  mutualAid: string[];   // external agencies/resources to request
}

export const DOMAIN_PROTOCOLS: DomainProtocol[] = [
  // --- COMMUNICATION ---
  {
    domain: 'communication',
    label: 'Communication Systems',
    description: 'Radio, cellular, satellite, and network communication management during incidents.',
    standardProcedure: [
      { order: 1, action: 'Establish incident communication plan (ICS 205)', responsible: 'comms-lead', timeLimit: '15 min', critical: true },
      { order: 2, action: 'Verify primary radio channels are operational', responsible: 'comms-lead', timeLimit: '10 min', critical: true },
      { order: 3, action: 'Activate backup communication channels', responsible: 'comms-lead', timeLimit: '20 min', critical: false },
      { order: 4, action: 'Test interoperability with external agencies', responsible: 'comms-lead', timeLimit: '30 min', critical: false },
      { order: 5, action: 'Establish communication schedule (check-ins every 30 min)', responsible: 'comms-lead', critical: false },
      { order: 6, action: 'Deploy mobile repeaters if coverage gaps identified', responsible: 'comms-lead', timeLimit: '1 hour', critical: false },
    ],
    deviationTriggers: [
      {
        id: 'comm-dev-1',
        condition: 'Total communication blackout',
        threshold: 'All primary AND backup channels down simultaneously',
        action: 'Deploy runners/physical messengers. Activate satellite phones from emergency cache. Fall back to pre-arranged meeting points with timed check-ins.',
        authorizedBy: 'ic',
      },
      {
        id: 'comm-dev-2',
        condition: 'Communication channel compromised/intercepted',
        threshold: 'Suspected unauthorized monitoring of incident channels',
        action: 'Switch to pre-arranged encrypted backup frequency. Implement code words for sensitive operations. Notify Safety Officer.',
        authorizedBy: 'comms-lead',
      },
      {
        id: 'comm-dev-3',
        condition: 'Cellular network overload',
        threshold: 'Cellular call completion rate below 30%',
        action: 'Activate Wireless Priority Service (WPS). Request carrier to implement cell-site load balancing. Shift non-critical comms to text/data.',
        authorizedBy: 'comms-lead',
      },
    ],
    mutualAid: ['Telecom providers', 'Amateur radio (ARES/RACES)', 'Military communication units'],
  },

  // --- ELECTRICITY ---
  {
    domain: 'electricity',
    label: 'Electrical / Power',
    description: 'Grid stability, backup power, load management, and utility coordination.',
    standardProcedure: [
      { order: 1, action: 'Assess grid status and identify affected areas', responsible: 'power-lead', timeLimit: '15 min', critical: true },
      { order: 2, action: 'Activate backup generators for critical facilities', responsible: 'power-lead', timeLimit: '30 min', critical: true },
      { order: 3, action: 'Implement load shedding priority matrix', responsible: 'power-lead', timeLimit: '30 min', critical: true },
      { order: 4, action: 'Coordinate with utility provider for restoration timeline', responsible: 'power-lead', timeLimit: '1 hour', critical: false },
      { order: 5, action: 'Establish fuel resupply chain for generators', responsible: 'logistics-chief', timeLimit: '2 hours', critical: false },
      { order: 6, action: 'Monitor generator fuel levels and runtime', responsible: 'power-lead', critical: false },
    ],
    deviationTriggers: [
      {
        id: 'elec-dev-1',
        condition: 'Extended blackout exceeding generator fuel reserves',
        threshold: 'Generator fuel below 25% with no resupply ETA within 4 hours',
        action: 'Initiate emergency triage of powered facilities. Shut down Tier 3 (non-critical) loads. Request emergency fuel from mutual aid. Consider relocating critical operations.',
        authorizedBy: 'ic',
      },
      {
        id: 'elec-dev-2',
        condition: 'Grid instability causing equipment damage',
        threshold: 'Voltage fluctuations exceeding +/- 10% or frequency deviation > 0.5 Hz',
        action: 'Disconnect sensitive equipment immediately. Switch to isolated generator power. Notify utility of grid instability. Do NOT reconnect to grid until stability confirmed for 15 min.',
        authorizedBy: 'power-lead',
      },
      {
        id: 'elec-dev-3',
        condition: 'Generator failure at critical facility',
        threshold: 'Primary AND backup generator failure at hospital, water treatment, or command post',
        action: 'Deploy mobile generator within 30 min. If unavailable, initiate facility evacuation plan. Transfer critical loads to nearest operational facility.',
        authorizedBy: 'ops-chief',
      },
    ],
    mutualAid: ['Regional utility companies', 'National Guard (generator assets)', 'Federal (FEMA ESF-12)'],
  },

  // --- WATER ---
  {
    domain: 'water',
    label: 'Water Systems',
    description: 'Potable water supply, treatment, distribution, and contamination response.',
    standardProcedure: [
      { order: 1, action: 'Assess water system integrity (treatment, distribution, storage)', responsible: 'water-lead', timeLimit: '30 min', critical: true },
      { order: 2, action: 'Test water quality at key distribution points', responsible: 'water-lead', timeLimit: '1 hour', critical: true },
      { order: 3, action: 'Activate emergency water reserves', responsible: 'water-lead', timeLimit: '1 hour', critical: false },
      { order: 4, action: 'Establish emergency water distribution points', responsible: 'logistics-chief', timeLimit: '2 hours', critical: false },
      { order: 5, action: 'Coordinate with upstream/downstream jurisdictions', responsible: 'liaison', timeLimit: '2 hours', critical: false },
      { order: 6, action: 'Issue public guidance on water usage restrictions', responsible: 'pio', timeLimit: '1 hour', critical: false },
    ],
    deviationTriggers: [
      {
        id: 'water-dev-1',
        condition: 'Confirmed water contamination',
        threshold: 'Pathogen or chemical contaminant detected above safe limits',
        action: 'Issue immediate DO NOT USE order. Shut contaminated supply lines. Activate emergency bottled water distribution. Request mutual aid for portable treatment units. Notify state environmental agency.',
        authorizedBy: 'ic',
      },
      {
        id: 'water-dev-2',
        condition: 'Treatment plant failure',
        threshold: 'Treatment plant offline with no redundancy',
        action: 'Issue boil-water advisory. Activate emergency interconnections with neighboring systems. Deploy portable treatment units. Prioritize hospital and shelter supply.',
        authorizedBy: 'water-lead',
      },
      {
        id: 'water-dev-3',
        condition: 'Distribution system pressure loss',
        threshold: 'System pressure below 20 PSI (contamination risk from backflow)',
        action: 'Issue boil-water advisory for affected zones. Isolate depressurized segments. Deploy water trucks to critical facilities. Test for backflow contamination before restoring.',
        authorizedBy: 'water-lead',
      },
    ],
    mutualAid: ['Adjacent water utilities', 'State emergency water reserves', 'Federal (FEMA ESF-3)', 'National Guard (water purification)'],
  },

  // --- LABOR / PERSONNEL ---
  {
    domain: 'labor',
    label: 'Labor / Personnel',
    description: 'Workforce management, volunteer coordination, shift scheduling, and fatigue mitigation.',
    standardProcedure: [
      { order: 1, action: 'Establish staffing needs per section and shift', responsible: 'labor-lead', timeLimit: '30 min', critical: true },
      { order: 2, action: 'Activate on-call personnel roster', responsible: 'labor-lead', timeLimit: '30 min', critical: true },
      { order: 3, action: 'Set up check-in/check-out at staging area', responsible: 'labor-lead', timeLimit: '1 hour', critical: false },
      { order: 4, action: 'Establish 12-hour operational periods with mandatory rest', responsible: 'labor-lead', critical: true },
      { order: 5, action: 'Coordinate volunteer registration and assignment', responsible: 'labor-lead', timeLimit: '2 hours', critical: false },
      { order: 6, action: 'Ensure credentialing for specialized positions', responsible: 'labor-lead', critical: false },
    ],
    deviationTriggers: [
      {
        id: 'labor-dev-1',
        condition: 'Personnel exhaustion / unsafe fatigue levels',
        threshold: 'Personnel working beyond 16 hours or showing signs of impaired judgment',
        action: 'Mandatory stand-down for affected personnel. Compress operations to minimum critical functions. Request mutual aid personnel. IC may authorize reduced operational tempo.',
        authorizedBy: 'safety',
      },
      {
        id: 'labor-dev-2',
        condition: 'Mass casualty among responders',
        threshold: 'More than 20% of assigned personnel incapacitated',
        action: 'Activate emergency mutual aid. Consolidate remaining personnel to critical tasks only. IC declares resource emergency. Request state/federal assistance.',
        authorizedBy: 'ic',
      },
      {
        id: 'labor-dev-3',
        condition: 'Specialized skill shortage',
        threshold: 'No qualified personnel available for critical technical operation',
        action: 'Request specialized mutual aid. Consider remote expert consultation. If life-safety critical, IC may authorize best-qualified available person with real-time expert guidance.',
        authorizedBy: 'ops-chief',
      },
    ],
    mutualAid: ['Regional mutual aid agreements', 'Volunteer organizations (CERT, Red Cross)', 'State emergency management', 'Private sector contractors'],
  },

  // --- EMERGENCY SERVICES ---
  {
    domain: 'emergency_services',
    label: 'Emergency Services',
    description: 'Fire, EMS, law enforcement, search and rescue, and evacuation coordination.',
    standardProcedure: [
      { order: 1, action: 'Establish Unified Command with all ES disciplines', responsible: 'es-lead', timeLimit: '15 min', critical: true },
      { order: 2, action: 'Conduct initial size-up and hazard assessment', responsible: 'es-lead', timeLimit: '15 min', critical: true },
      { order: 3, action: 'Establish hot/warm/cold zones and perimeters', responsible: 'es-lead', timeLimit: '30 min', critical: true },
      { order: 4, action: 'Activate triage and medical staging', responsible: 'es-lead', timeLimit: '30 min', critical: true },
      { order: 5, action: 'Coordinate evacuation routes and sheltering', responsible: 'es-lead', timeLimit: '1 hour', critical: false },
      { order: 6, action: 'Request specialized teams (HazMat, technical rescue) if needed', responsible: 'es-lead', timeLimit: '1 hour', critical: false },
    ],
    deviationTriggers: [
      {
        id: 'es-dev-1',
        condition: 'Mass casualty incident overwhelming local capacity',
        threshold: 'Casualties exceed local hospital surge capacity or available ambulances',
        action: 'Activate regional MCI plan. Request state medical assets. Establish field hospitals. Implement crisis standards of care. IC coordinates with hospital incident commanders.',
        authorizedBy: 'ic',
      },
      {
        id: 'es-dev-2',
        condition: 'Responder safety compromise',
        threshold: 'Conditions degrade making response operations immediately dangerous to life and health (IDLH)',
        action: 'Safety Officer orders immediate withdrawal. Switch to defensive operations. Establish collapse/exclusion zone. No re-entry until conditions reassessed and cleared by Safety Officer.',
        authorizedBy: 'safety',
      },
      {
        id: 'es-dev-3',
        condition: 'Evacuation route compromised',
        threshold: 'Primary AND secondary evacuation routes blocked or unsafe',
        action: 'Activate shelter-in-place for affected population. Deploy route clearance teams. Coordinate alternate routes with law enforcement. Consider aerial evacuation for critical cases.',
        authorizedBy: 'es-lead',
      },
      {
        id: 'es-dev-4',
        condition: 'Multi-hazard escalation',
        threshold: 'Secondary hazard emerges (e.g., fire during flood, HazMat during earthquake)',
        action: 'Expand Unified Command to include new discipline. Reassess all zone boundaries. Re-triage priorities. IC may need to choose between competing life-safety objectives — document decision rationale.',
        authorizedBy: 'ic',
      },
    ],
    mutualAid: ['Regional fire/EMS mutual aid', 'State emergency management', 'Federal (FEMA ESF-4, ESF-8, ESF-9, ESF-13)', 'Urban Search and Rescue (USAR) teams'],
  },
];

/** Get protocol for a specific domain */
export function getProtocol(domain: ResourceDomain): DomainProtocol | undefined {
  return DOMAIN_PROTOCOLS.find((p) => p.domain === domain);
}

/** Get all deviation triggers across all domains, sorted by severity */
export function getAllDeviationTriggers(): Array<DeviationTrigger & { domain: ResourceDomain }> {
  return DOMAIN_PROTOCOLS.flatMap((p) =>
    p.deviationTriggers.map((d) => ({ ...d, domain: p.domain }))
  );
}
