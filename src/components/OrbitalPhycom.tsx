
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrbitalNode } from '@/types';
import { motion } from 'motion/react';
import { Shield, Zap, Globe, Cpu, Database } from 'lucide-react';

const nodes: OrbitalNode[] = [
  { id: 'n1', name: 'Core Compute', orbitRadius: 100, speed: 20, health: 98, type: 'compute' },
  { id: 'n2', name: 'Edge Gateway', orbitRadius: 180, speed: 15, health: 92, type: 'gateway' },
  { id: 'n3', name: 'Global DB', orbitRadius: 260, speed: 10, health: 85, type: 'storage' },
  { id: 'n4', name: 'Mesh Network', orbitRadius: 340, speed: 8, health: 99, type: 'network' },
];

export default function OrbitalPhycom() {
  return (
    <div className="p-8 space-y-8 h-full flex flex-col animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Orbital Monitoring</h2>
        <p className="text-zinc-400 mt-1">Physics-informed Infrastructure Visualization (Phycom)</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-zinc-950 border-zinc-800 overflow-hidden relative flex items-center justify-center min-h-[500px]">
          {/* Orbital Rings */}
          {[100, 180, 260, 340].map((radius) => (
            <div
              key={radius}
              className="absolute border border-zinc-800/50 rounded-full"
              style={{ width: radius * 2, height: radius * 2 }}
            />
          ))}

          {/* Central Core */}
          <div className="relative z-10 w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(249,115,22,0.3)] border-4 border-orange-400/20">
            <Globe className="text-white w-10 h-10 animate-pulse" />
          </div>

          {/* Orbiting Nodes */}
          {nodes.map((node, index) => (
            <motion.div
              key={node.id}
              className="absolute z-20"
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 60 / node.speed * 5,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{ width: node.orbitRadius * 2, height: node.orbitRadius * 2 }}
            >
              <div 
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                style={{ top: 0 }}
              >
                <div className="relative">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border border-zinc-700 shadow-lg transition-transform group-hover:scale-110 ${
                    node.health > 95 ? 'bg-emerald-500/20 text-emerald-500' :
                    node.health > 90 ? 'bg-amber-500/20 text-amber-500' :
                    'bg-rose-500/20 text-rose-500'
                  }`}>
                    {node.type === 'compute' && <Cpu className="w-5 h-5" />}
                    {node.type === 'gateway' && <Zap className="w-5 h-5" />}
                    {node.type === 'storage' && <Database className="w-5 h-5" />}
                    {node.type === 'network' && <Shield className="w-5 h-5" />}
                  </div>
                  
                  {/* Tooltip-like info */}
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-800 p-2 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <p className="font-bold text-white">{node.name}</p>
                    <p className="text-zinc-400">Health: {node.health}%</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </Card>

        <div className="space-y-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100 text-sm font-medium uppercase tracking-wider opacity-50 italic">Orbital Mechanics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-400 text-sm leading-relaxed">
                The infrastructure is modeled as a gravitational system. Nodes orbit the central core based on their 
                logical proximity and data throughput requirements. 
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
                  <p className="text-xs text-zinc-500 uppercase">System Gravity</p>
                  <p className="text-xl font-bold text-white">9.81 m/s²</p>
                </div>
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
                  <p className="text-xs text-zinc-500 uppercase">Node Sync</p>
                  <p className="text-xl font-bold text-white">99.9%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 flex-1">
            <CardHeader>
              <CardTitle className="text-zinc-100 text-sm font-medium uppercase tracking-wider opacity-50 italic">Physics Health Logs</CardTitle>
            </CardHeader>
            <CardContent className="font-mono text-[11px] text-emerald-500/80 space-y-1">
              <p>[10:42:01] Core gravity stable at 1.0G</p>
              <p>[10:42:05] Node n1 (Core Compute) orbit eccentricity: 0.002</p>
              <p>[10:42:12] Node n3 (Global DB) experiencing minor drag in sector 7</p>
              <p>[10:42:18] Orbital velocity compensation active for Edge Gateway</p>
              <p className="animate-pulse">[10:42:25] Monitoring real-time telemetry...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
