export { ICS_ROLES, getRole, getDirectReports, getChainOfCommand, type ICSRole, type ICSSection } from './command';
export { DOMAIN_PROTOCOLS, getProtocol, getAllDeviationTriggers, type ResourceDomain, type DomainProtocol, type DeviationTrigger } from './protocols';
export { RESOURCE_INVENTORY, getResourcesByDomain, getResourcesByStatus, getResourceSummary, type Resource, type ResourceStatus } from './resources';
export { INCIDENT_LEVELS, DEVIATION_RULES, getIncidentLevel, getApplicableDeviations, type IncidentLevel, type DeviationRule } from './escalation';
export { AI_ROLES, HANDOFF_PROTOCOLS, getAIReportsTo, type AIRole, type AIAuthorityLevel, type HandoffProtocol } from './ai-integration';
export { getStagedActions, stageAction, reviewAction, markExecuted, clearExpired, type StagedAction, type StagedActionStatus, type ActionPriority } from './staging';
export { TRAINING_MODULES, getModulesForRole, getModulesByCategory, getPrerequisiteChain, type TrainingModule, type TrainingSection } from './training';
export { getDecisionLog, logDecision, recordOutcome, getDecisionStats, exportDecisionLog, type DecisionRecord, type DecisionOutcome } from './decision-log';
