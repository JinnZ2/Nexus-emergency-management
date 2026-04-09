/**
 * ICS Command Chain — Incident Command System organizational structure.
 *
 * Based on NIMS/FEMA ICS framework, adapted for infrastructure emergencies.
 * Defines roles, hierarchy, span of control, and succession rules.
 */

export type ICSSection = 'command' | 'operations' | 'planning' | 'logistics' | 'finance';

export interface ICSRole {
  id: string;
  title: string;
  section: ICSSection;
  parentId: string | null;
  responsibilities: string[];
  authority: string[];
  /** Max direct reports before requiring delegation */
  spanOfControl: number;
  /** Who assumes this role if the holder is incapacitated */
  successionOrder: string[];
}

export const ICS_ROLES: ICSRole[] = [
  // --- Command Staff ---
  {
    id: 'ic',
    title: 'Incident Commander',
    section: 'command',
    parentId: null,
    responsibilities: [
      'Overall incident management authority',
      'Set objectives and priorities',
      'Approve Incident Action Plan (IAP)',
      'Authorize resource deployment',
      'Coordinate with external agencies',
    ],
    authority: [
      'Declare/escalate/downgrade incident level',
      'Activate/deactivate any ICS section',
      'Override section chief decisions in extremis',
      'Authorize protocol deviations',
    ],
    spanOfControl: 7,
    successionOrder: ['ops-chief', 'planning-chief', 'logistics-chief'],
  },
  {
    id: 'pio',
    title: 'Public Information Officer',
    section: 'command',
    parentId: 'ic',
    responsibilities: [
      'Manage all public communications',
      'Coordinate media releases',
      'Monitor public information channels',
      'Correct misinformation',
    ],
    authority: ['Release approved public statements', 'Restrict information flow for operational security'],
    spanOfControl: 3,
    successionOrder: ['planning-chief'],
  },
  {
    id: 'safety',
    title: 'Safety Officer',
    section: 'command',
    parentId: 'ic',
    responsibilities: [
      'Monitor operations for safety hazards',
      'Ensure personnel safety protocols',
      'Assess risk of proposed actions',
      'Authority to halt unsafe operations',
    ],
    authority: [
      'STOP any operation deemed immediately dangerous',
      'Override operational decisions on safety grounds',
      'Require PPE/safety measures before operations proceed',
    ],
    spanOfControl: 3,
    successionOrder: ['ops-chief'],
  },
  {
    id: 'liaison',
    title: 'Liaison Officer',
    section: 'command',
    parentId: 'ic',
    responsibilities: [
      'Coordinate with external agencies and utilities',
      'Manage mutual aid agreements',
      'Track external resource requests',
      'Maintain inter-agency communication',
    ],
    authority: ['Request mutual aid', 'Establish inter-agency agreements during incident'],
    spanOfControl: 5,
    successionOrder: ['logistics-chief'],
  },

  // --- Operations Section ---
  {
    id: 'ops-chief',
    title: 'Operations Section Chief',
    section: 'operations',
    parentId: 'ic',
    responsibilities: [
      'Direct all tactical operations',
      'Execute the Incident Action Plan',
      'Manage field resources and teams',
      'Report operational status to IC',
    ],
    authority: [
      'Deploy/redeploy field resources',
      'Establish tactical objectives',
      'Request additional resources through Logistics',
    ],
    spanOfControl: 7,
    successionOrder: ['comms-lead', 'es-lead'],
  },
  {
    id: 'comms-lead',
    title: 'Communications Unit Leader',
    section: 'operations',
    parentId: 'ops-chief',
    responsibilities: [
      'Maintain all communication systems',
      'Establish backup communication channels',
      'Manage radio/network frequencies',
      'Ensure interoperability between units',
    ],
    authority: ['Allocate communication channels', 'Switch to backup systems'],
    spanOfControl: 5,
    successionOrder: ['ops-chief'],
  },
  {
    id: 'power-lead',
    title: 'Power/Electrical Unit Leader',
    section: 'operations',
    parentId: 'ops-chief',
    responsibilities: [
      'Monitor and manage electrical infrastructure',
      'Coordinate generator deployment',
      'Manage load shedding priorities',
      'Liaise with utility providers',
    ],
    authority: ['Initiate load shedding', 'Deploy backup generators', 'Disconnect non-critical loads'],
    spanOfControl: 5,
    successionOrder: ['ops-chief', 'water-lead'],
  },
  {
    id: 'water-lead',
    title: 'Water Systems Unit Leader',
    section: 'operations',
    parentId: 'ops-chief',
    responsibilities: [
      'Monitor water supply and distribution',
      'Manage water treatment status',
      'Coordinate emergency water distribution',
      'Monitor contamination risks',
    ],
    authority: ['Issue boil-water advisories', 'Activate emergency water distribution', 'Shut down compromised supply lines'],
    spanOfControl: 5,
    successionOrder: ['ops-chief', 'power-lead'],
  },
  {
    id: 'es-lead',
    title: 'Emergency Services Branch Director',
    section: 'operations',
    parentId: 'ops-chief',
    responsibilities: [
      'Coordinate fire, medical, and law enforcement response',
      'Manage evacuation operations',
      'Coordinate search and rescue',
      'Manage triage and medical staging',
    ],
    authority: ['Order evacuations within incident zone', 'Request mutual aid for ES', 'Establish perimeters'],
    spanOfControl: 7,
    successionOrder: ['ops-chief'],
  },

  // --- Planning Section ---
  {
    id: 'planning-chief',
    title: 'Planning Section Chief',
    section: 'planning',
    parentId: 'ic',
    responsibilities: [
      'Collect and analyze situation data',
      'Prepare the Incident Action Plan',
      'Track resource status',
      'Forecast incident progression',
      'Manage documentation and records',
    ],
    authority: ['Recommend strategy changes to IC', 'Prioritize information collection'],
    spanOfControl: 5,
    successionOrder: ['ic', 'logistics-chief'],
  },

  // --- Logistics Section ---
  {
    id: 'logistics-chief',
    title: 'Logistics Section Chief',
    section: 'logistics',
    parentId: 'ic',
    responsibilities: [
      'Procure and manage all resources',
      'Coordinate labor and personnel allocation',
      'Manage supply chain and staging areas',
      'Provide facilities and transportation',
    ],
    authority: ['Authorize procurement', 'Allocate personnel and equipment', 'Establish staging areas'],
    spanOfControl: 7,
    successionOrder: ['planning-chief', 'finance-chief'],
  },
  {
    id: 'labor-lead',
    title: 'Personnel/Labor Unit Leader',
    section: 'logistics',
    parentId: 'logistics-chief',
    responsibilities: [
      'Track personnel assignments and availability',
      'Manage volunteer coordination',
      'Ensure adequate staffing for all shifts',
      'Process personnel requests from sections',
    ],
    authority: ['Assign personnel to sections', 'Activate volunteer pools', 'Enforce work/rest cycles'],
    spanOfControl: 7,
    successionOrder: ['logistics-chief'],
  },

  // --- Finance/Admin Section ---
  {
    id: 'finance-chief',
    title: 'Finance/Admin Section Chief',
    section: 'finance',
    parentId: 'ic',
    responsibilities: [
      'Track all incident costs',
      'Manage procurement and contracts',
      'Process compensation claims',
      'Maintain financial records for reimbursement',
    ],
    authority: ['Authorize emergency purchases', 'Approve overtime', 'Execute emergency contracts'],
    spanOfControl: 5,
    successionOrder: ['logistics-chief', 'planning-chief'],
  },
];

/** Get a role by ID */
export function getRole(id: string): ICSRole | undefined {
  return ICS_ROLES.find((r) => r.id === id);
}

/** Get all direct reports for a role */
export function getDirectReports(roleId: string): ICSRole[] {
  return ICS_ROLES.filter((r) => r.parentId === roleId);
}

/** Get the full chain of command from a role up to IC */
export function getChainOfCommand(roleId: string): ICSRole[] {
  const chain: ICSRole[] = [];
  let current = getRole(roleId);
  while (current) {
    chain.push(current);
    current = current.parentId ? getRole(current.parentId) : undefined;
  }
  return chain;
}
