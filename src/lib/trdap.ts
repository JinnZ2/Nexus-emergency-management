/**
 * TRDAP (Technical Resource Deployment and Analysis Platform) data models.
 * Provides topology definitions, data generators, and utility functions.
 */

import type { DeploymentMetric, Pipeline } from '@/types';

/** Service topology - defines the four infrastructure layers */
export const SERVICE_LAYERS = {
  edge: ['API Gateway', 'Load Balancer', 'CDN Node', 'WAF'],
  compute: ['Auth Service', 'Data Processor', 'Task Queue', 'ML Pipeline'],
  storage: ['Storage Engine', 'Cache Layer', 'Search Index', 'Message Bus'],
  core: ['Config Server', 'Service Mesh', 'Log Aggregator', 'Metrics Collector'],
} as const;

/** Generate deployment metrics for all services */
export function generateMetrics(): DeploymentMetric[] {
  const services = Object.values(SERVICE_LAYERS).flat();
  return services.map((service, i) => ({
    id: `svc-${i + 1}`,
    service,
    status: i === 2 ? 'warning' : i === 14 ? 'critical' : 'healthy',
    latency: Math.round(10 + Math.random() * 100),
    cpu: Math.round(5 + Math.random() * 80),
    memory: Math.round(100 + Math.random() * 3500),
    timestamp: new Date().toISOString(),
  }));
}

/** Recovery and maintenance pipelines */
export function getRecoveryPipelines(): Pipeline[] {
  return [
    { id: 'p1', name: 'TRDAP Recovery', description: 'Automated rollback of last 3 deployments', status: 'idle', lastRun: '2 days ago' },
    { id: 'p2', name: 'Orbital Realignment', description: 'Physics-informed node stabilization', status: 'active', lastRun: 'Running now' },
    { id: 'p3', name: 'Resource Injection', description: 'Direct compute provisioning to Sector 7', status: 'error', lastRun: 'Failed 1h ago' },
    { id: 'p4', name: 'Cache Warm-up', description: 'Pre-populate edge caches from storage layer', status: 'idle', lastRun: '6h ago' },
    { id: 'p5', name: 'Mesh Rebalance', description: 'Re-distribute service mesh traffic weights', status: 'idle', lastRun: '12h ago' },
  ];
}

/** Compute aggregate health score (0-100) from deployment metrics */
export function computeHealthScore(metrics: DeploymentMetric[]): number {
  if (metrics.length === 0) return 0;
  const weights = { healthy: 1, warning: 0.5, critical: 0 };
  const total = metrics.reduce((sum, m) => sum + weights[m.status], 0);
  return Math.round((total / metrics.length) * 100);
}
