
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Shield, Radio, Zap, Droplets, Users, Siren,
  ChevronDown, ChevronRight, AlertTriangle, ArrowRight,
  GitBranch, Package, TriangleAlert, Bot, BookOpen,
  ClipboardList, Check, X, Clock, Gauge, FileText, Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ICS_ROLES, getDirectReports,
  DOMAIN_PROTOCOLS, type ResourceDomain,
  INCIDENT_LEVELS, DEVIATION_RULES,
  getResourceSummary,
  AI_ROLES, HANDOFF_PROTOCOLS,
  getStagedActions, reviewAction, type StagedAction,
  TRAINING_MODULES,
  getDecisionLog, getDecisionStats, recordOutcome, exportDecisionLog,
  type DecisionRecord, type DecisionOutcome,
} from '@/lib/ics';

type Tab = 'chain' | 'protocols' | 'resources' | 'escalation' | 'ai-partners' | 'staging' | 'training' | 'decisions';

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
  const [expandedAIRole, setExpandedAIRole] = useState<string | null>(null);
  const [stagedActions, setStagedActions] = useState(getStagedActions);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'chain', label: 'Command Chain' },
    { id: 'protocols', label: 'Protocols' },
    { id: 'resources', label: 'Resources' },
    { id: 'escalation', label: 'Escalation' },
    { id: 'ai-partners', label: 'AI Partners' },
    { id: 'staging', label: 'Staging Queue' },
    { id: 'decisions', label: 'Decision Log' },
    { id: 'training', label: 'Training' },
  ];

  const [decisionLog, setDecisionLog] = useState(getDecisionLog);

  const handleReview = (actionId: string, status: 'approved' | 'rejected', notes: string) => {
    const result = reviewAction(actionId, status, 'operator', notes);
    if (result) {
      setStagedActions(getStagedActions());
      setDecisionLog(getDecisionLog());
    }
  };

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

      {/* --- AI Partners Tab --- */}
      {tab === 'ai-partners' && (
        <div className="space-y-6">
          {/* AI Roles */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100 text-sm font-medium uppercase tracking-wider opacity-50 italic flex items-center gap-2">
                <Bot className="w-4 h-4" /> AI Partner Roles in ICS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {AI_ROLES.map((role) => {
                const isExpanded = expandedAIRole === role.id;
                const levelColors: Record<string, string> = {
                  autonomous: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5',
                  recommend: 'text-blue-500 border-blue-500/20 bg-blue-500/5',
                  assist: 'text-amber-500 border-amber-500/20 bg-amber-500/5',
                  observe: 'text-zinc-400 border-zinc-400/20 bg-zinc-400/5',
                };
                return (
                  <div key={role.id} className="border border-zinc-800 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedAIRole(isExpanded ? null : role.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
                        <Bot className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm font-medium text-white">{role.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] text-zinc-500">
                          Reports to: {role.icsParent}
                        </Badge>
                        <Badge variant="outline" className={cn("text-[10px] uppercase", levelColors[role.authorityLevel])}>
                          {role.authorityLevel}
                        </Badge>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-4 border-t border-zinc-800 pt-4">
                        <div>
                          <p className="text-xs text-emerald-500 uppercase tracking-wider mb-2">Capabilities</p>
                          <ul className="space-y-1">
                            {role.capabilities.map((c, i) => (
                              <li key={i} className="text-sm text-zinc-300 flex gap-2">
                                <Check className="w-3 h-3 text-emerald-500 mt-1 shrink-0" /> {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs text-rose-500 uppercase tracking-wider mb-2">Limitations</p>
                          <ul className="space-y-1">
                            {role.limitations.map((l, i) => (
                              <li key={i} className="text-sm text-zinc-400 flex gap-2">
                                <X className="w-3 h-3 text-rose-500 mt-1 shrink-0" /> {l}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs text-amber-500 uppercase tracking-wider mb-2">Handoff Triggers (defer to human)</p>
                          <ul className="space-y-1">
                            {role.handoffTriggers.map((h, i) => (
                              <li key={i} className="text-sm text-zinc-400 flex gap-2">
                                <ArrowRight className="w-3 h-3 text-amber-500 mt-1 shrink-0" /> {h}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Handoff Protocols */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100 text-sm font-medium uppercase tracking-wider opacity-50 italic">
                Handoff Protocols
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {HANDOFF_PROTOCOLS.map((proto) => (
                <div key={proto.id} className="p-4 rounded-lg bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-white text-sm">{proto.name}</h4>
                    <Badge variant="outline" className="text-[10px] uppercase text-indigo-400 border-indigo-400/20">
                      {proto.direction.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-500 mb-3">Trigger: {proto.trigger}</p>
                  <ol className="space-y-1">
                    {proto.procedure.map((step, i) => (
                      <li key={i} className="text-sm text-zinc-400 flex gap-2">
                        <span className="text-indigo-500 font-mono text-xs mt-0.5">{i + 1}.</span> {step}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* --- Staging Queue Tab --- */}
      {tab === 'staging' && (
        <div className="space-y-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100 text-sm font-medium uppercase tracking-wider opacity-50 italic flex items-center gap-2">
                <ClipboardList className="w-4 h-4" /> AI Proposed Actions — Pending Human Review
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stagedActions.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-8">No staged actions. AI partners will queue recommendations here.</p>
              ) : (
                stagedActions.map((action) => (
                  <StagedActionCard key={action.id} action={action} onReview={handleReview} />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* --- Training Tab --- */}
      {tab === 'training' && (
        <div className="space-y-4">
          {TRAINING_MODULES.map((mod) => {
            const isExpanded = expandedModule === mod.id;
            const categoryColors: Record<string, string> = {
              fundamentals: 'text-indigo-500 border-indigo-500/20 bg-indigo-500/5',
              domain: 'text-orange-500 border-orange-500/20 bg-orange-500/5',
              decision: 'text-amber-500 border-amber-500/20 bg-amber-500/5',
              handoff: 'text-blue-500 border-blue-500/20 bg-blue-500/5',
              situational: 'text-rose-500 border-rose-500/20 bg-rose-500/5',
            };

            return (
              <Card key={mod.id} className="bg-zinc-900 border-zinc-800">
                <button onClick={() => setExpandedModule(isExpanded ? null : mod.id)} className="w-full text-left">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-indigo-400" />
                        <div>
                          <span className="text-white font-bold">{mod.title}</span>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className={cn("text-[10px] uppercase", categoryColors[mod.category])}>
                              {mod.category}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] text-zinc-500">
                              {mod.audience.includes('all') ? 'All AI' : mod.audience.join(', ')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
                    </CardTitle>
                  </CardHeader>
                </button>
                {isExpanded && (
                  <CardContent className="space-y-6 pt-0">
                    {mod.content.map((section, si) => (
                      <div key={si}>
                        <h4 className="text-sm font-bold text-white mb-2">{section.heading}</h4>
                        <p className="text-sm text-zinc-400 leading-relaxed mb-3">{section.body}</p>
                        {section.keyPoints && (
                          <ul className="space-y-1 mb-3">
                            {section.keyPoints.map((kp, i) => (
                              <li key={i} className="text-sm text-zinc-300 flex gap-2">
                                <ArrowRight className="w-3 h-3 text-indigo-500 mt-1 shrink-0" /> {kp}
                              </li>
                            ))}
                          </ul>
                        )}
                        {section.warnings && (
                          <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/10">
                            {section.warnings.map((w, i) => (
                              <p key={i} className="text-sm text-rose-400 flex gap-2">
                                <TriangleAlert className="w-3 h-3 mt-1 shrink-0" /> {w}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* --- Decision Log Tab --- */}
      {tab === 'decisions' && (
        <DecisionLogView log={decisionLog} onRefresh={() => setDecisionLog(getDecisionLog())} />
      )}
    </div>
  );
}

// --- Subcomponents ---

function DecisionLogView({ log, onRefresh }: { key?: React.Key; log: DecisionRecord[]; onRefresh: () => void }) {
  const stats = getDecisionStats();
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [outcomeInput, setOutcomeInput] = useState<{ id: string; status: DecisionOutcome; desc: string } | null>(null);

  const handleRecordOutcome = () => {
    if (!outcomeInput || !outcomeInput.desc.trim()) return;
    recordOutcome(outcomeInput.id, outcomeInput.status, outcomeInput.desc, 'operator');
    setOutcomeInput(null);
    onRefresh();
  };

  const handleExport = () => {
    const json = exportDecisionLog();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-decision-log-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const decisionColors: Record<string, string> = {
    approved: 'text-emerald-500',
    rejected: 'text-rose-500',
    modified: 'text-amber-500',
    expired: 'text-zinc-500',
  };

  const outcomeColors: Record<string, string> = {
    ai_correct: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    ai_incorrect: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    inconclusive: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20',
    pending_outcome: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    not_applicable: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20',
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard label="Total Decisions" value={stats.total} />
        <StatCard label="Approved" value={stats.approved} color="text-emerald-500" />
        <StatCard label="Rejected" value={stats.rejected} color="text-rose-500" />
        <StatCard label="Outcomes Logged" value={stats.outcomesRecorded} color="text-blue-500" />
        <StatCard label="AI Correct" value={stats.aiCorrect} color="text-emerald-400" />
        <StatCard label="AI Incorrect" value={stats.aiIncorrect} color="text-amber-400" />
      </div>

      {/* Export */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={handleExport} className="gap-2 text-xs">
          <Download className="w-3 h-3" /> Export Log (JSON)
        </Button>
      </div>

      {/* Decision Records */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 text-sm font-medium uppercase tracking-wider opacity-50 italic flex items-center gap-2">
            <FileText className="w-4 h-4" /> Accountability Trail — AI Proposed, Human Decided
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {log.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8">No decisions recorded yet. Review staged actions to create entries.</p>
          ) : (
            log.map((record) => {
              const isExpanded = expandedRecord === record.id;
              return (
                <div key={record.id} className="border border-zinc-800 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedRecord(isExpanded ? null : record.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" /> : <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{record.aiProposal.title}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          AI: {record.aiProposal.aiRole} ({record.aiProposal.confidence}% conf)
                          {' -> '}
                          Human: {record.humanDecision.decidedBy}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <Badge variant="outline" className={cn("text-[10px] uppercase", decisionColors[record.humanDecision.decision])}>
                        {record.humanDecision.decision}
                      </Badge>
                      {record.outcome ? (
                        <Badge variant="outline" className={cn("text-[10px] uppercase", outcomeColors[record.outcome.status])}>
                          {record.outcome.status.replace(/_/g, ' ')}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-zinc-600">
                          no outcome yet
                        </Badge>
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-4 border-t border-zinc-800 pt-4">
                      {/* AI Proposal */}
                      <div className="p-4 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                        <p className="text-xs text-indigo-400 uppercase tracking-wider mb-2 font-bold">AI Proposal</p>
                        <p className="text-sm text-zinc-300 mb-2">{record.aiProposal.description}</p>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-zinc-500">Rationale: </span>
                            <span className="text-zinc-400">{record.aiProposal.rationale}</span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-zinc-500">Confidence: <span className="text-indigo-400">{record.aiProposal.confidence}%</span></p>
                            <p className="text-zinc-500">Priority: <span className="text-zinc-400">{record.aiProposal.priority}</span></p>
                            <p className="text-zinc-500">Risk: <span className="text-zinc-400">{record.aiProposal.riskLevel}</span></p>
                            <p className="text-zinc-500">Proposed: <span className="text-zinc-400">{new Date(record.aiProposal.proposedAt).toLocaleString()}</span></p>
                          </div>
                        </div>
                      </div>

                      {/* Human Decision */}
                      <div className={cn("p-4 rounded-lg border", record.humanDecision.decision === 'rejected' ? "bg-rose-500/5 border-rose-500/10" : "bg-emerald-500/5 border-emerald-500/10")}>
                        <p className={cn("text-xs uppercase tracking-wider mb-2 font-bold", decisionColors[record.humanDecision.decision])}>
                          Human Decision: {record.humanDecision.decision}
                        </p>
                        <p className="text-sm text-zinc-300 mb-2">{record.humanDecision.rationale}</p>
                        <div className="text-xs text-zinc-500 space-y-1">
                          <p>Decided by: <span className="text-zinc-400">{record.humanDecision.decidedBy}</span></p>
                          <p>Response time: <span className="text-zinc-400">{Math.round(record.humanDecision.responseTimeMs / 1000)}s</span></p>
                          <p>Decided at: <span className="text-zinc-400">{new Date(record.humanDecision.decidedAt).toLocaleString()}</span></p>
                        </div>
                      </div>

                      {/* Outcome */}
                      {record.outcome ? (
                        <div className={cn("p-4 rounded-lg border", outcomeColors[record.outcome.status])}>
                          <p className="text-xs uppercase tracking-wider mb-2 font-bold">
                            Outcome: {record.outcome.status.replace(/_/g, ' ')}
                          </p>
                          <p className="text-sm text-zinc-300 mb-2">{record.outcome.description}</p>
                          <p className="text-xs text-zinc-500">Recorded by: {record.outcome.recordedBy} at {new Date(record.outcome.recordedAt).toLocaleString()}</p>
                        </div>
                      ) : (
                        <div className="p-4 rounded-lg border border-dashed border-zinc-800 bg-zinc-950">
                          {outcomeInput?.id === record.id ? (
                            <div className="space-y-3">
                              <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Record What Actually Happened</p>
                              <select
                                value={outcomeInput.status}
                                onChange={(e) => setOutcomeInput({ ...outcomeInput, status: e.target.value as DecisionOutcome })}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white"
                              >
                                <option value="ai_correct">AI was correct</option>
                                <option value="ai_incorrect">AI was incorrect</option>
                                <option value="inconclusive">Inconclusive</option>
                                <option value="not_applicable">Not applicable</option>
                              </select>
                              <textarea
                                value={outcomeInput.desc}
                                onChange={(e) => setOutcomeInput({ ...outcomeInput, desc: e.target.value })}
                                placeholder="What actually happened? This is permanent record..."
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white min-h-[80px] resize-y"
                              />
                              <div className="flex gap-2">
                                <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleRecordOutcome}>
                                  Record Outcome
                                </Button>
                                <Button variant="outline" onClick={() => setOutcomeInput(null)}>Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setOutcomeInput({ id: record.id, status: 'ai_correct', desc: '' })}
                              className="w-full text-sm text-zinc-500 hover:text-zinc-300 transition-colors text-center py-2"
                            >
                              + Record what actually happened (close the accountability loop)
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, color }: { key?: React.Key; label: string; value: number; color?: string }) {
  return (
    <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-center">
      <p className={cn("text-xl font-bold", color || "text-white")}>{value}</p>
      <p className="text-[10px] text-zinc-500 uppercase">{label}</p>
    </div>
  );
}

function StagedActionCard({ action, onReview }: { key?: React.Key; action: StagedAction; onReview: (id: string, status: 'approved' | 'rejected', notes: string) => void }) {
  const [reviewNotes, setReviewNotes] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  const priorityColors: Record<string, string> = {
    critical: 'text-rose-500 border-rose-500/20 bg-rose-500/5',
    high: 'text-amber-500 border-amber-500/20 bg-amber-500/5',
    medium: 'text-blue-500 border-blue-500/20 bg-blue-500/5',
    low: 'text-zinc-400 border-zinc-400/20 bg-zinc-400/5',
  };

  const statusIcons: Record<string, React.ReactNode> = {
    pending: <Clock className="w-4 h-4 text-amber-500" />,
    approved: <Check className="w-4 h-4 text-emerald-500" />,
    rejected: <X className="w-4 h-4 text-rose-500" />,
    executed: <Check className="w-4 h-4 text-indigo-500" />,
    expired: <Clock className="w-4 h-4 text-zinc-500" />,
  };

  const handleSubmitReview = (status: 'approved' | 'rejected') => {
    if (!reviewNotes.trim()) return;
    onReview(action.id, status, reviewNotes.trim());
    setReviewNotes('');
    setShowReviewForm(false);
  };

  return (
    <div className={cn(
      "p-5 rounded-xl border",
      action.status === 'pending' ? "bg-zinc-950 border-zinc-700" : "bg-zinc-950 border-zinc-800"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {statusIcons[action.status]}
          <h4 className="font-bold text-white text-sm">{action.title}</h4>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-[10px] uppercase", priorityColors[action.priority])}>
            {action.priority}
          </Badge>
          <Badge variant="outline" className="text-[10px] text-zinc-500 uppercase">
            {action.status}
          </Badge>
        </div>
      </div>

      <p className="text-sm text-zinc-400 mb-3">{action.description}</p>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-[10px] text-zinc-500 uppercase mb-1">AI Rationale</p>
          <p className="text-xs text-zinc-400">{action.rationale}</p>
        </div>
        <div>
          <p className="text-[10px] text-zinc-500 uppercase mb-1">Estimated Impact</p>
          <p className="text-xs text-zinc-400">{action.estimatedImpact}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-3 text-[10px] text-zinc-500">
        <span>Proposed by: <span className="text-zinc-400">{action.proposedBy}</span></span>
        <span>Domain: <span className="text-zinc-400">{action.targetDomain}</span></span>
        <span>Risk: <span className={cn(
          action.riskLevel === 'high' ? 'text-rose-500' : action.riskLevel === 'medium' ? 'text-amber-500' : 'text-zinc-400'
        )}>{action.riskLevel}</span></span>
        <span className="flex items-center gap-1"><Gauge className="w-3 h-3" /> Confidence: <span className="text-zinc-400">{action.confidence}%</span></span>
      </div>

      {action.reviewedBy && (
        <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 mb-3">
          <p className="text-[10px] text-zinc-500 uppercase mb-1">Decision by {action.reviewedBy}</p>
          <p className="text-xs text-zinc-300">{action.reviewNotes}</p>
        </div>
      )}

      {action.status === 'pending' && !showReviewForm && (
        <div className="pt-2 border-t border-zinc-800">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => setShowReviewForm(true)}
          >
            <FileText className="w-3 h-3" /> Review This Proposal
          </Button>
        </div>
      )}

      {action.status === 'pending' && showReviewForm && (
        <div className="pt-3 border-t border-zinc-800 space-y-3">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-1.5">
              Your rationale <span className="text-rose-500">*</span>
              <span className="normal-case text-zinc-600 ml-1">(required — this goes on the permanent decision record)</span>
            </label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Why are you approving or rejecting this? What factors informed your decision?"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white min-h-[80px] resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <Button
              disabled={!reviewNotes.trim()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/30 text-white gap-1.5"
              onClick={() => handleSubmitReview('approved')}
            >
              <Check className="w-3 h-3" /> Approve
            </Button>
            <Button
              disabled={!reviewNotes.trim()}
              className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-600/30 text-white gap-1.5"
              onClick={() => handleSubmitReview('rejected')}
            >
              <X className="w-3 h-3" /> Reject
            </Button>
            <Button variant="outline" onClick={() => { setShowReviewForm(false); setReviewNotes(''); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

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
