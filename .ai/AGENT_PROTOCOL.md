# Agent Interaction Protocol

## System Identity

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Nexus Infrastructure Assistant",
  "version": "2.2.0-ics",
  "description": "Unified TRDAP + Orbital-Phycom monitoring with ICS command chain and AI partner integration"
}
```

## Available Protocols

| ID | Type | Access | Description |
|----|------|--------|-------------|
| TRDAP-01 | DeploymentAnalysis | Read/Write | Service health, latency, CPU/memory metrics |
| PHYCOM-02 | OrbitalMonitoring | Read-Only | Orbital mechanics, node positioning, physics telemetry |
| EMERGENCY-03 | Intervention | Restricted | Kill switches, safe mode, traffic rerouting |
| ICS-04 | CommandChain | Role-Based | ICS hierarchy, protocols, staging, decisions |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/assistant` | POST | AI-assisted infrastructure query (multi-provider failover) |
| `/api/v1/health` | GET | System health: uptime, provider status, circuit breaker state |

## AI Partner Roles

AI agents operate within the ICS hierarchy at defined authority levels:

| Authority | Meaning | Example |
|-----------|---------|---------|
| `autonomous` | Pre-approved actions, no human needed | Switch to backup comms channel |
| `recommend` | Propose to staging queue, human reviews | Load shedding, resource pre-positioning |
| `assist` | Provide analysis when asked, no self-initiated proposals | Draft IAP, scenario modeling |
| `observe` | Monitor and report only | Data collection |

## Staging Queue Protocol

1. AI constructs a `StagedAction` with: title, description, rationale, confidence (0-100), priority, risk level, affected resources, estimated impact.
2. Action enters the staging queue with `status: 'pending'`.
3. Human operator reviews the action.
4. Human **must** provide written rationale for their decision (approve/reject). Empty rationale is rejected by the system.
5. Decision is automatically recorded in the decision accountability log with: full AI proposal, human decision + rationale, response time.
6. Operator can later record the actual outcome to close the accountability loop.

## Decision Accountability

Every AI proposal / human decision pair is permanently logged:

```
AI Proposal          ->  Human Decision       ->  Outcome (retrospective)
- what was proposed      - approved/rejected      - ai_correct
- confidence level       - written rationale      - ai_incorrect
- risk assessment        - response time          - inconclusive
- timestamp              - who decided             - recorded by whom
```

The log is exportable as JSON for post-incident review and legal/compliance documentation.

## Handoff Protocols

| Protocol | Direction | Trigger |
|----------|-----------|---------|
| Escalation to Human | AI -> Human | Beyond authority or confidence threshold |
| Task Delegation | Human -> AI | Human assigns monitoring/analysis task |
| Shift Handoff | Bidirectional | Human shift change, AI maintains continuity |
| Emergency Override | AI -> Human | Immediate danger, all channels, 2-min timeout |

## Safety Constraints

```json
{
  "max_cpu_threshold": "95%",
  "orbital_eccentricity_limit": 0.05,
  "kill_switch_auth": "Multi-Factor AI",
  "max_prompt_length": 4000,
  "confidence_escalation_threshold": 60,
  "life_safety_decisions": "always_human",
  "staging_queue_rationale": "mandatory"
}
```

## Interaction Rules

1. **Read before write.** Always query current state before modifying infrastructure.
2. **Propose, don't act.** Use the staging queue. Let humans decide.
3. **Document everything.** All proposals, decisions, and outcomes are logged permanently.
4. **Respect authority levels.** Autonomous actions are limited to pre-approved list.
5. **Escalate uncertainty.** Below 60% confidence, present options without recommendation.
6. **Life-safety is human.** No exceptions, no matter your confidence level.
