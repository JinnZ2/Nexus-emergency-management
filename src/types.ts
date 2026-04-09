export interface Pipeline {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'idle' | 'error';
  lastRun: string;
}

export interface EmergencyAction {
  id: string;
  label: string;
  risk: 'low' | 'medium' | 'high';
  requiresAuth: boolean;
}

export interface DeploymentMetric {
  id: string;
  service: string;
  status: 'healthy' | 'warning' | 'critical';
  latency: number;
  cpu: number;
  memory: number;
  timestamp: string;
}

export interface OrbitalNode {
  id: string;
  name: string;
  orbitRadius: number;
  speed: number;
  health: number;
  type: 'compute' | 'storage' | 'network' | 'gateway';
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentManifest {
  system: string;
  version: string;
  protocols: AgentProtocolEntry[];
  endpoints: Record<string, string>;
  safety_constraints: Record<string, string>;
}

export interface AgentProtocolEntry {
  id: string;
  type: string;
  access: string;
}
