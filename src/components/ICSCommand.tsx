
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Shield, Radio, Zap, Droplets, Users, Siren,
  ChevronDown, ChevronRight, AlertTriangle, ArrowRight,
  GitBranch, Package, TriangleAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ICS_ROLES, getDirectReports,
  DOMAIN_PROTOCOLS, type ResourceDomain,
  INCIDENT_LEVELS, DEVIATION_RULES,
  getResourceSummary,
} from '@/lib/ics';

type Tab = 'chain' | 'protocols' | 'resources' | 'escalation';

const DOMAIN_ICONS: Record<ResourceDomain, React.ComponentType<{ className?: string }>> = {
  communication: Radio,
  electricity: Zap,
  water: Droplets,
  labor: Users,
  emergency_services: Siren,
};

const DOMAIN_COLORS: Record<ResourceDomain, string> = {
  communication: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  electricity: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  water: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
  labor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  emergency_services: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
};

export default function ICSCommand() {
  const [tab, setTab] = useState<Tab>('chain');
  const [expandedRole, setExpandedRole] = useState<string | null>('ic');
  const [expandedDomain, setExpandedDomain] = useState<ResourceDomain | null>(null);
  const [expandedDeviation, setExpandedDeviation] = useState<string | null>(null);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'chain', label: 'Command Chain' },
    { id: 'protocols', label: 'Protocols' },
    { id: 'resources', label: 'Resources' },
    { id: 'escalation', label: 'Escalation' },
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            ICS Command <Shield className="text-indigo-500 w-8 h-8" />
          </h2>
          <p className="text-zinc-400 mt-1">Incident Command System — Chain of Command, Protocols & Deviation Rules</p>
        </div>
        <Badge variant="outline" className="text-indigo-500 border-indigo-500/20 bg-indigo-500/5 px-3 py-1">
          NIMS Compliant
        </Badge>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2">
        {tabs.map((t) => (
          <Button
            key={t.id}
            variant={tab === t.id ? 'default' : 'outline'}
            onClick={() => setTab(t.id)}
            className={cn('gap-2', tab === t.id && 'bg-indigo-600 hover:bg-indigo-700 text-white')}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {/* --- Command Chain Tab --- */}
      {tab === 'chain' && (
        <div className="space-y-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100 text-sm font-medium uppercase tracking-wider opacity-50 italic flex items-center gap-2">
                <GitBranch className="w-4 h-4" /> Organizational Hierarchy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {ICS_ROLES.filter(r => r.parentId === null).map((root) => (
                <RoleTree
                  key={root.id}
                  roleId={root.id}
                  depth={0}
                  expandedRole={expandedRole}
                  onToggle={setExpandedRole}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* --- Protocols Tab --- */}
      {tab === 'protocols' && (
        <div className="space-y-4">
          {DOMAIN_PROTOCOLS.map((proto) => {
            const Icon = DOMAIN_ICONS[proto.domain];
            const color = DOMAIN_COLORS[proto.domain];
            const isExpanded = expandedDomain === proto.domain;

            return (
              <Card key={proto.domain} className="bg-zinc-900 border-zinc-800">
                <button
                  onClick={() => setExpandedDomain(isExpanded ? null : proto.domain)}
                  className="w-full text-left"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn('p-2 rounded-lg', color)}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-white font-bold">{proto.label}</span>
                          <p className="text-xs text-zinc-500 font-normal mt-0.5">{proto.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs text-zinc-500">
                          {proto.standardProcedure.length} steps
                        </Badge>
                        <Badge variant="outline" className="text-xs text-rose-500 border-rose-500/20">
                          {proto.deviationTriggers.length} deviations
                        </Badge>
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
                      </div>
                    </CardTitle>
                  </CardHeader>
                </button>

                {isExpanded && (
                  <CardContent className="space-y-6 pt-0">
                    {/* Standard Procedure */}
                    <div>
                      <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Standard Operating Procedure</h4>
                      <div className="space-y-2">
                        {proto.standardProcedure.map((step) => (
                          <div key={step.order} className={cn(
                            "flex items-start gap-3 p-3 rounded-lg border",
                            step.critical ? "bg-zinc-950 border-orange-500/20" : "bg-zinc-950 border-zinc-800"
                          )}>
                            <span className="text-orange-500 font-mono text-xs font-bold mt-0.5 w-5">{step.order}.</span>
                            <div className="flex-1">
                              <p className="text-sm text-zinc-200">{step.action}</p>
                              <div className="flex gap-3 mt-1.5">
                                <span className="text-[10px] text-zinc-500 uppercase">Role: <span className="text-zinc-400">{step.responsible}</span></span>
                                {step.timeLimit && (
                                  <span className="text-[10px] text-zinc-500 uppercase">Time: <span className="text-zinc-400">{step.timeLimit}</span></span>
                                )}
                                {step.critical && (
                                  <span className="text-[10px] text-orange-500 uppercase font-bold">CRITICAL</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Deviation Triggers */}
                    <div>
                      <h4 className="text-xs text-rose-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <TriangleAlert className="w-3 h-3" /> When to Deviate
                      </h4>
                      <div className="space-y-3">
                        {proto.deviationTriggers.map((dev) => (
                          <div key={dev.id} className="p-4 rounded-lg bg-rose-500/5 border border-rose-500/10">
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="text-sm font-bold text-rose-400">{dev.condition}</h5>
                              <span className="text-[10px] text-zinc-500 uppercase">Auth: <span className="text-zinc-400">{dev.authorizedBy}</span></span>
                            </div>
                            <p className="text-xs text-zinc-500 mb-2">Threshold: <span className="text-zinc-400">{dev.threshold}</span></p>
                            <p className="text-sm text-zinc-300">{dev.action}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mutual Aid */}
                    <div>
                      <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Mutual Aid Resources</h4>
                      <div className="flex flex-wrap gap-2">
                        {proto.mutualAid.map((aid, i) => (
                          <Badge key={i} variant="outline" className="text-xs text-zinc-400">{aid}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* --- Resources Tab --- */}
      {tab === 'resources' && (
        <ResourcesView />
      )}

      {/* --- Escalation Tab --- */}
      {tab === 'escalation' && (
        <div className="space-y-8">
          {/* Incident Levels */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100 text-sm font-medium uppercase tracking-wider opacity-50 italic">
                Incident Levels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {INCIDENT_LEVELS.map((level) => (
                  <div key={level.level} className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border",
                    level.level >= 4 ? "bg-rose-500/5 border-rose-500/10" :
                    level.level >= 3 ? "bg-amber-500/5 border-amber-500/10" :
                    "bg-zinc-950 border-zinc-800"
                  )}>
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
                      level.level >= 4 ? "bg-rose-500/20 text-rose-500" :
                      level.level >= 3 ? "bg-amber-500/20 text-amber-500" :
                      level.level >= 2 ? "bg-blue-500/20 text-blue-500" :
                      "bg-zinc-800 text-zinc-400"
                    )}>
                      {level.level}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white">{level.name}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">{level.description}</p>
                      <p className="text-[10px] text-zinc-600 mt-1">Scope: {level.typicalScope}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-500 uppercase">Sections Active</p>
                      <p className="text-xs text-zinc-400">{level.activatedSections.length}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Deviation Rules */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100 text-sm font-medium uppercase tracking-wider opacity-50 italic flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" /> Chain of Command Deviation Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {DEVIATION_RULES.map((rule) => (
                <div key={rule.id} className="border border-zinc-800 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedDeviation(expandedDeviation === rule.id ? null : rule.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      {expandedDeviation === rule.id ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
                      <span className="text-sm font-medium text-white">{rule.name}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-rose-500 border-rose-500/20">
                      Documentation Required
                    </Badge>
                  </button>
                  {expandedDeviation === rule.id && (
                    <div className="px-4 pb-4 space-y-4 border-t border-zinc-800 pt-4">
                      <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Trigger Condition</p>
                        <p className="text-sm text-zinc-300">{rule.condition}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                          <p className="text-xs text-zinc-500 uppercase mb-1">Standard Chain</p>
                          <p className="text-sm text-zinc-400">{rule.standardChain}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20">
                          <p className="text-xs text-indigo-400 uppercase mb-1">Deviated Chain</p>
                          <p className="text-sm text-zinc-300">{rule.deviatedChain}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Justification</p>
                        <p className="text-sm text-zinc-400 italic">{rule.justification}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Constraints</p>
                        <ul className="space-y-1">
                          {rule.constraints.map((c, i) => (
                            <li key={i} className="text-sm text-zinc-400 flex gap-2">
                              <ArrowRight className="w-3 h-3 text-indigo-500 mt-1 shrink-0" />
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// --- Subcomponents ---

interface RoleTreeProps {
  key?: React.Key;
  roleId: string;
  depth: number;
  expandedRole: string | null;
  onToggle: (id: string | null) => void;
}

function RoleTree({ roleId, depth, expandedRole, onToggle }: RoleTreeProps) {
  const role = ICS_ROLES.find(r => r.id === roleId);
  if (!role) return null;

  const children = getDirectReports(roleId);
  const isExpanded = expandedRole === roleId;

  const sectionColors: Record<string, string> = {
    command: 'text-indigo-500 border-indigo-500/20 bg-indigo-500/5',
    operations: 'text-orange-500 border-orange-500/20 bg-orange-500/5',
    planning: 'text-blue-500 border-blue-500/20 bg-blue-500/5',
    logistics: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5',
    finance: 'text-amber-500 border-amber-500/20 bg-amber-500/5',
  };

  return (
    <div style={{ marginLeft: depth * 20 }}>
      <button
        onClick={() => onToggle(isExpanded ? null : roleId)}
        className={cn(
          "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
          isExpanded ? "bg-zinc-950 border-zinc-700" : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
        )}
      >
        {children.length > 0 ? (
          isExpanded ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />
        ) : (
          <div className="w-4" />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">{role.title}</span>
            <Badge variant="outline" className={cn("text-[10px] uppercase", sectionColors[role.section])}>
              {role.section}
            </Badge>
          </div>
          {isExpanded && (
            <div className="mt-3 space-y-3">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Responsibilities</p>
                <ul className="space-y-0.5">
                  {role.responsibilities.map((r, i) => (
                    <li key={i} className="text-xs text-zinc-400">- {r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Authority</p>
                <ul className="space-y-0.5">
                  {role.authority.map((a, i) => (
                    <li key={i} className="text-xs text-indigo-400">- {a}</li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-4">
                <span className="text-[10px] text-zinc-500">Span of control: <span className="text-zinc-400">{role.spanOfControl}</span></span>
                <span className="text-[10px] text-zinc-500">Succession: <span className="text-zinc-400">{role.successionOrder.join(' -> ')}</span></span>
              </div>
            </div>
          )}
        </div>
      </button>

      {/* Child roles */}
      {children.length > 0 && (
        <div className="mt-1 space-y-1">
          {children.map((child) => (
            <RoleTree
              key={child.id}
              roleId={child.id}
              depth={depth + 1}
              expandedRole={expandedRole}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ResourcesView() {
  const summary = getResourceSummary();
  const domains: ResourceDomain[] = ['communication', 'electricity', 'water', 'labor', 'emergency_services'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {domains.map((domain) => {
        const Icon = DOMAIN_ICONS[domain];
        const color = DOMAIN_COLORS[domain];
        const stats = summary[domain];
        const proto = DOMAIN_PROTOCOLS.find(p => p.domain === domain);

        return (
          <Card key={domain} className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <div className={cn('p-2 rounded-lg', color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-white">{proto?.label || domain}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="text-center p-2 bg-zinc-950 rounded-lg">
                  <p className="text-lg font-bold text-emerald-500">{stats.available}</p>
                  <p className="text-[10px] text-zinc-500 uppercase">Available</p>
                </div>
                <div className="text-center p-2 bg-zinc-950 rounded-lg">
                  <p className="text-lg font-bold text-blue-500">{stats.assigned}</p>
                  <p className="text-[10px] text-zinc-500 uppercase">Assigned</p>
                </div>
                <div className="text-center p-2 bg-zinc-950 rounded-lg">
                  <p className="text-lg font-bold text-rose-500">{stats.outOfService}</p>
                  <p className="text-[10px] text-zinc-500 uppercase">OOS</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-800">
                <p className="text-[10px] text-zinc-500">
                  Total: {stats.total} resources
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
