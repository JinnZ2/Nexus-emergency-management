
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Zap, ShieldAlert, Terminal, ArrowRight, Lock, Unlock } from 'lucide-react';
import { EmergencyAction, Pipeline } from '@/types';
import { cn } from '@/lib/utils';

const actions: EmergencyAction[] = [
  { id: 'kill-all', label: 'Global Kill Switch', risk: 'high', requiresAuth: true },
  { id: 'safe-mode', label: 'Enable Safe Mode', risk: 'medium', requiresAuth: true },
  { id: 'flush-cache', label: 'Flush Global Cache', risk: 'low', requiresAuth: false },
  { id: 'reroute', label: 'Reroute Traffic (BGP)', risk: 'high', requiresAuth: true },
];

const pipelines: Pipeline[] = [
  { id: 'p1', name: 'TRDAP Recovery', description: 'Automated rollback of last 3 deployments', status: 'idle', lastRun: '2 days ago' },
  { id: 'p2', name: 'Orbital Realignment', description: 'Physics-informed node stabilization', status: 'active', lastRun: 'Running now' },
  { id: 'p3', name: 'Resource Injection', description: 'Direct compute provisioning to Sector 7', status: 'error', lastRun: 'Failed 1h ago' },
];

export default function EmergencyManagement() {
  const [isLocked, setIsLocked] = useState(true);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            Emergency Management <ShieldAlert className="text-rose-500 w-8 h-8" />
          </h2>
          <p className="text-zinc-400 mt-1">Extreme Case Intervention & Safety Protocols</p>
        </div>
        <Button 
          variant={isLocked ? "outline" : "destructive"}
          onClick={() => setIsLocked(!isLocked)}
          className="gap-2"
        >
          {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          {isLocked ? "Unlock Protocols" : "Lock Protocols"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kill Switches */}
        <Card className="lg:col-span-2 bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 text-sm font-medium uppercase tracking-wider opacity-50 italic">Intervention Triggers</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {actions.map((action) => (
              <div 
                key={action.id} 
                className={cn(
                  "p-6 rounded-xl border transition-all duration-300 flex flex-col justify-between h-40",
                  isLocked ? "bg-zinc-950/50 border-zinc-800 opacity-50 grayscale" : "bg-zinc-950 border-zinc-800 hover:border-rose-500/50 group"
                )}
              >
                <div className="flex justify-between items-start">
                  <div className={cn(
                    "p-2 rounded-lg",
                    action.risk === 'high' ? "bg-rose-500/10 text-rose-500" :
                    action.risk === 'medium' ? "bg-amber-500/10 text-amber-500" :
                    "bg-blue-500/10 text-blue-500"
                  )}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase tracking-tighter">
                    Risk: {action.risk}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">{action.label}</h3>
                  <Button 
                    disabled={isLocked}
                    className={cn(
                      "w-full gap-2",
                      action.risk === 'high' ? "bg-rose-600 hover:bg-rose-700" : "bg-zinc-800 hover:bg-zinc-700"
                    )}
                  >
                    Execute <Zap className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Direct Pipelines */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 text-sm font-medium uppercase tracking-wider opacity-50 italic">Direct Pipelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pipelines.map((p) => (
              <div key={p.id} className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-orange-500/30 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-zinc-100 group-hover:text-orange-500 transition-colors">{p.name}</h4>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    p.status === 'active' ? "bg-emerald-500 animate-pulse" :
                    p.status === 'error' ? "bg-rose-500" : "bg-zinc-700"
                  )} />
                </div>
                <p className="text-xs text-zinc-500 mb-3">{p.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-zinc-600 font-mono">Last: {p.lastRun}</span>
                  <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Safety Log */}
      <Card className="bg-zinc-950 border-zinc-800 border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-zinc-500 text-xs font-mono flex items-center gap-2">
            <Terminal className="w-3 h-3" /> SAFETY_AUDIT_LOG
          </CardTitle>
        </CardHeader>
        <CardContent className="font-mono text-[10px] text-zinc-600 space-y-1">
          <p>[10:56:01] Protocol system initialized. Status: ARMED</p>
          <p>[10:56:05] Integrity check: TRDAP (OK), Orbital (OK)</p>
          <p>[10:56:12] User session verified for extreme intervention</p>
          <p className="text-amber-500/70">[10:56:18] WARNING: Global Kill Switch requires dual-factor AI verification</p>
        </CardContent>
      </Card>
    </div>
  );
}
