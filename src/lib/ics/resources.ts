/**
 * ICS Resource Tracking
 *
 * Types and utilities for tracking resource status across all domains.
 * Maps to ICS resource management concepts: available, assigned, out-of-service.
 */

import type { ResourceDomain } from './protocols';

export type ResourceStatus = 'available' | 'assigned' | 'out_of_service' | 'requested';

export interface Resource {
  id: string;
  name: string;
  domain: ResourceDomain;
  type: string;
  status: ResourceStatus;
  location: string;
  assignedTo: string | null; // ICS role ID
  capacity: string;
  notes: string;
}

export interface ResourceRequest {
  id: string;
  domain: ResourceDomain;
  description: string;
  priority: 'immediate' | 'urgent' | 'routine';
  requestedBy: string;   // ICS role ID
  status: 'pending' | 'approved' | 'deployed' | 'denied';
  timestamp: string;
}

/** Baseline resource inventory for demonstration */
export const RESOURCE_INVENTORY: Resource[] = [
  // Communication
  { id: 'r-001', name: 'Primary Radio System', domain: 'communication', type: 'radio', status: 'assigned', location: 'Command Post', assignedTo: 'comms-lead', capacity: '16 channels', notes: 'VHF/UHF capable' },
  { id: 'r-002', name: 'Satellite Phone Kit (x4)', domain: 'communication', type: 'satphone', status: 'available', location: 'Equipment Cache A', assignedTo: null, capacity: '4 units', notes: 'Iridium network' },
  { id: 'r-003', name: 'Mobile Repeater Unit', domain: 'communication', type: 'repeater', status: 'available', location: 'Staging Area', assignedTo: null, capacity: '25 mi range', notes: 'Vehicle-mounted' },

  // Electricity
  { id: 'r-010', name: 'Generator 50kW (Primary)', domain: 'electricity', type: 'generator', status: 'assigned', location: 'Command Post', assignedTo: 'power-lead', capacity: '50 kW', notes: '72hr fuel at 50% load' },
  { id: 'r-011', name: 'Generator 100kW (Mobile)', domain: 'electricity', type: 'generator', status: 'available', location: 'Equipment Cache B', assignedTo: null, capacity: '100 kW', notes: 'Trailer-mounted' },
  { id: 'r-012', name: 'UPS Battery Bank', domain: 'electricity', type: 'ups', status: 'assigned', location: 'Server Room', assignedTo: 'power-lead', capacity: '4 hr runtime', notes: 'Critical systems only' },

  // Water
  { id: 'r-020', name: 'Water Tanker 3000 gal', domain: 'water', type: 'tanker', status: 'available', location: 'Staging Area', assignedTo: null, capacity: '3000 gallons', notes: 'Potable certified' },
  { id: 'r-021', name: 'Portable Treatment Unit', domain: 'water', type: 'treatment', status: 'available', location: 'Equipment Cache C', assignedTo: null, capacity: '500 gal/hr', notes: 'Requires power source' },
  { id: 'r-022', name: 'Bottled Water Reserve', domain: 'water', type: 'supply', status: 'assigned', location: 'Distribution Point 1', assignedTo: 'water-lead', capacity: '2000 cases', notes: '1 gal/person/day' },

  // Labor
  { id: 'r-030', name: 'Shift A Team (12 personnel)', domain: 'labor', type: 'team', status: 'assigned', location: 'Field Operations', assignedTo: 'ops-chief', capacity: '12 persons', notes: 'On duty 0600-1800' },
  { id: 'r-031', name: 'Shift B Team (12 personnel)', domain: 'labor', type: 'team', status: 'available', location: 'Rest Area', assignedTo: null, capacity: '12 persons', notes: 'On standby for 1800-0600' },
  { id: 'r-032', name: 'CERT Volunteer Pool', domain: 'labor', type: 'volunteers', status: 'available', location: 'Volunteer Staging', assignedTo: null, capacity: '30 persons', notes: 'Basic training certified' },

  // Emergency Services
  { id: 'r-040', name: 'Engine Company (3 units)', domain: 'emergency_services', type: 'fire', status: 'assigned', location: 'Hot Zone Perimeter', assignedTo: 'es-lead', capacity: '3 engines, 12 FF', notes: 'Structure fire capable' },
  { id: 'r-041', name: 'ALS Ambulance (2 units)', domain: 'emergency_services', type: 'ems', status: 'assigned', location: 'Medical Staging', assignedTo: 'es-lead', capacity: '2 units, 4 medics', notes: 'ALS equipped' },
  { id: 'r-042', name: 'HazMat Team', domain: 'emergency_services', type: 'hazmat', status: 'available', location: 'Station 5', assignedTo: null, capacity: '6 technicians', notes: 'Level A entry capable' },
];

/** Get resources filtered by domain */
export function getResourcesByDomain(domain: ResourceDomain): Resource[] {
  return RESOURCE_INVENTORY.filter((r) => r.domain === domain);
}

/** Get resources by status */
export function getResourcesByStatus(status: ResourceStatus): Resource[] {
  return RESOURCE_INVENTORY.filter((r) => r.status === status);
}

/** Summary counts per domain */
export function getResourceSummary(): Record<ResourceDomain, { total: number; available: number; assigned: number; outOfService: number }> {
  const domains: ResourceDomain[] = ['communication', 'electricity', 'water', 'labor', 'emergency_services'];
  const summary = {} as ReturnType<typeof getResourceSummary>;

  for (const domain of domains) {
    const resources = getResourcesByDomain(domain);
    summary[domain] = {
      total: resources.length,
      available: resources.filter((r) => r.status === 'available').length,
      assigned: resources.filter((r) => r.status === 'assigned').length,
      outOfService: resources.filter((r) => r.status === 'out_of_service').length,
    };
  }

  return summary;
}
