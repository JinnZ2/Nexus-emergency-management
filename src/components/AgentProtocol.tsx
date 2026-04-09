
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cpu, Code, Database, Share2 } from 'lucide-react';

export default function AgentProtocol() {
  const manifest = {
    system: "Nexus Infrastructure Assistant",
    version: "2.1.0-emergency",
    protocols: [
      { id: "TRDAP-01", type: "DeploymentAnalysis", access: "Read/Write" },
      { id: "PHYCOM-02", type: "OrbitalMonitoring", access: "Read-Only" },
      { id: "EMERGENCY-03", type: "Intervention", access: "Restricted" }
    ],
    endpoints: {
      metrics: "/api/v1/trdap/telemetry",
      orbital: "/api/v1/phycom/mechanics",
      actions: "/api/v1/emergency/execute"
    },
    safety_constraints: {
      max_cpu_threshold: "95%",
      orbital_eccentricity_limit: "0.05",
      kill_switch_auth: "Multi-Factor AI"
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            Agent Protocol <Code className="text-blue-500 w-8 h-8" />
          </h2>
          <p className="text-zinc-400 mt-1">Machine-Readable System Manifest for AI Ingestion</p>
        </div>
        <Badge variant="outline" className="text-blue-500 border-blue-500/20 bg-blue-500/5 px-3 py-1">
          JSON-LD Compliant
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 text-sm font-medium uppercase tracking-wider opacity-50 italic">System Manifest (Raw)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-zinc-950 p-6 rounded-xl border border-zinc-800 font-mono text-xs text-blue-400 overflow-x-auto">
              {JSON.stringify(manifest, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100 text-sm font-medium uppercase tracking-wider opacity-50 italic">Integration Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg h-fit">
                  <Cpu className="text-blue-500 w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">Agent Ingestion</h4>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    AI agents should parse the manifest above to understand available pipelines and safety constraints. 
                    All actions must be verified against the <code className="text-blue-400">safety_constraints</code> object.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-lg h-fit">
                  <Database className="text-emerald-500 w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">Data Pipelines</h4>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Direct resource access is provided via authenticated gRPC streams. Use the 
                    <code className="text-emerald-400">endpoints</code> map for routing.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="p-3 bg-orange-500/10 rounded-lg h-fit">
                  <Share2 className="text-orange-500 w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">Federated Safety</h4>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Emergency actions require a signed token from the Nexus Safety Authority. 
                    Agents cannot bypass the physical hardware lock.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
