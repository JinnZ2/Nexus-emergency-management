# Nexus Emergency Runbook (base layer)

revision: 2026-09-06.1

Plain-text mirror of the procedures embedded in `index.html`. Readable with no browser, no network, no server, no key. If `index.html` will not render, use this file.

Grade each step as you go. Record what blocked you by naming the exact element.

CC0 1.0 Universal. No rights reserved.

---

## rb-001  Total Service Outage

Severity: **critical**

Trigger: All TRDAP services report critical status simultaneously

### Steps

1. [ ] Verify outage is real (check from multiple vantage points)
2. [ ] Activate Global Kill Switch to prevent cascading damage
3. [ ] Isolate affected infrastructure layers (edge -> core)
4. [ ] Enable Safe Mode on all compute nodes
5. [ ] Initiate TRDAP Recovery pipeline for last known-good deployment
6. [ ] Gradually re-enable services starting from core layer outward
7. [ ] Monitor orbital node health for 15 minutes before declaring recovery

### Rollback

- If recovery pipeline fails, manually roll back via deployment history
- If safe mode is unstable, trigger full cache flush before retry
- Last resort: BGP reroute to disaster recovery site

### Estimated impact

Full platform downtime. All user-facing services affected.

Search keywords: outage, down, offline, all services, total failure, everything down, kill switch, critical

---

## rb-002  Orbital Node Drift

Severity: **high**

Trigger: Orbital eccentricity exceeds 0.05 limit on any node

### Steps

1. [ ] Identify drifting node(s) in Orbital Monitoring panel
2. [ ] Check physics health logs for drag anomalies or gravitational perturbation
3. [ ] Initiate Orbital Realignment pipeline
4. [ ] If node health drops below 80%, isolate from mesh network
5. [ ] Apply delta-V correction if PHYCOM seed expansion indicates recoverable trajectory
6. [ ] Verify node sync returns to >99% before reconnecting to mesh

### Rollback

- If realignment fails, decommission node and redistribute load
- Activate Resource Injection pipeline to backfill capacity

### Estimated impact

Degraded performance in affected sector. Possible data replication lag.

Search keywords: orbital, drift, eccentricity, node drift, phycom, realignment, physics, orbit

---

## rb-003  API Gateway Saturation

Severity: **high**

Trigger: API Gateway latency >500ms or CPU >95%

### Steps

1. [ ] Check for DDoS pattern in traffic analysis
2. [ ] Enable WAF rate limiting if not already active
3. [ ] Flush global cache to free memory
4. [ ] Scale edge layer horizontally if infrastructure allows
5. [ ] If traffic is legitimate, activate Mesh Rebalance pipeline
6. [ ] Monitor for 10 minutes, escalate to BGP reroute if unresolved

### Rollback

- Disable rate limiting if false positive detected
- Revert mesh weights to previous configuration

### Estimated impact

Elevated latency for all API consumers. Possible timeout errors.

Search keywords: gateway, api gateway, latency, saturate, ddos, traffic, rate limit, overload, cpu

---

## rb-004  AI Assistant Unavailable

Severity: **medium**

Trigger: Gemini API returns errors or is unreachable

### Steps

1. [ ] Verify API key is valid and not rate-limited
2. [ ] Check server/api.ts health endpoint at /api/v1/health
3. [ ] Use this runbook for manual decision-making until AI is restored
4. [ ] If persistent (>30 min), switch to manual monitoring mode
5. [ ] All emergency actions remain available through the UI regardless of AI status

### Rollback

- Restart API server: npm run dev:server
- If API key is compromised, rotate immediately and update .env.local

### Estimated impact

No AI-assisted analysis. Manual operation only. No data loss.

Search keywords: ai unavailable, gemini, assistant down, api error, ai down, llm, model, claude, openai

---

## rb-005  Data Pipeline Failure

Severity: **high**

Trigger: Resource Injection or TRDAP Recovery pipeline enters error state

### Steps

1. [ ] Check pipeline error message in Direct Pipelines panel
2. [ ] Verify storage layer health (Storage Engine, Cache Layer)
3. [ ] If storage is healthy, retry pipeline with fresh parameters
4. [ ] If storage is degraded, initiate Cache Warm-up pipeline first
5. [ ] Monitor compute provisioning in affected sector
6. [ ] Verify data integrity after pipeline recovery

### Rollback

- If pipeline is stuck, kill and restart from last checkpoint
- If data corruption detected, restore from last verified snapshot

### Estimated impact

Affected sector operates at reduced capacity until resolved.

Search keywords: pipeline, recovery, injection, data pipeline, cache, warm-up, rebalance, failed

---

## Enhancement-only functions (not in the base layer)

- AI analysis on top of the runbook: needs server process, provider reachability, and a key.
- TRDAP live telemetry and orbital monitoring: need the connected-mode application.
- Intervention triggers (Global Kill Switch, Enable Safe Mode, Flush Global Cache, Reroute Traffic (BGP)): connected-mode controls. If done by hand at the equipment, write it in the audit log with time, action, and who did it.
- ICS staging queue, decision statistics, JSON export: connected mode. The base form is a written decision record: proposal, decision, decided by, rationale (mandatory).
