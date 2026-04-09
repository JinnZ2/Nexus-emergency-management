# Agent Interaction Protocol

## System Identity

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Nexus Infrastructure Assistant",
  "version": "2.1.0-emergency",
  "description": "Unified TRDAP deployment analysis and Orbital-Phycom monitoring platform"
}
```

## Available Protocols

| ID | Type | Access | Description |
|----|------|--------|-------------|
| TRDAP-01 | DeploymentAnalysis | Read/Write | Service health, latency, CPU/memory metrics |
| PHYCOM-02 | OrbitalMonitoring | Read-Only | Orbital mechanics, node positioning, physics telemetry |
| EMERGENCY-03 | Intervention | Restricted | Kill switches, safe mode, traffic rerouting |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/assistant` | POST | AI-assisted infrastructure query (proxied to Gemini) |
| `/api/v1/trdap/telemetry` | GET | TRDAP deployment metrics (planned) |
| `/api/v1/phycom/mechanics` | GET | Orbital mechanics data (planned) |
| `/api/v1/emergency/execute` | POST | Emergency action execution (restricted, planned) |

## Safety Constraints

```json
{
  "max_cpu_threshold": "95%",
  "orbital_eccentricity_limit": 0.05,
  "kill_switch_auth": "Multi-Factor AI",
  "max_prompt_length": 4000,
  "rate_limit": "60 requests/minute"
}
```

## Interaction Rules

1. **Read before write.** Always query current state before modifying infrastructure.
2. **Confirm before acting.** High-risk actions require explicit human approval.
3. **Log everything.** All agent actions are recorded in the safety audit log.
4. **Respect access levels.** Read-Only protocols cannot be promoted to Read/Write by agents.
