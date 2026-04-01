# Project Review

> Project: Conductor v2 — New Skill Pack + Self-Improving Feedback Loop
> Created: 2026-04-01
> Skill: /review
> Project Type: mixed (software + content)

## Summary

Conductor v2 is a substantial upgrade — from 7 skills with 32 rules to 11 skills with 101 rules, plus a cross-cutting LESSONS.md self-improving convention. The architecture is sound, the rule format is consistent, and the build/validation pipeline works correctly. The most impactful additions are `korean-compliance` (no competitor has this) and `azure-ai-foundry` (fills the biggest Azure gap). However, several code examples contain deprecated APIs or incorrect SDK patterns that would fail at runtime — these need fixing before enterprise teams rely on them. No security issues found. No hardcoded secrets (the examples intentionally show them as anti-patterns).

## Findings

| # | Severity | Category | Finding | File / Section | Recommendation |
|---|---|---|---|---|---|
| 1 | ~~HIGH~~ | Correctness | ✅ FIXED — Graph SDK `ExternalItem.Properties` now uses `AdditionalData` dictionary | m365-copilot-extensions/SKILL.md Rule 6 | Fixed |
| 2 | ~~HIGH~~ | Correctness | ✅ FIXED — ISMS-P control numbers updated to v2.0 (2.5.1, 2.6.1, 2.8.4) | korean-compliance/SKILL.md Rules 5-7 | Fixed |
| 3 | ~~HIGH~~ | Completeness | ✅ FIXED — Added 정보통신망법 (Rule 9), 전자금융거래법 (Rule 10), breach notification (Rule 8) | korean-compliance/SKILL.md Rules 8-10 | Fixed |
| 4 | ~~HIGH~~ | Correctness | ✅ FIXED — `securityContacts` API updated to `2023-12-01-preview` | azure-security-audit/SKILL.md Rule 7 | Fixed |
| 5 | ~~MEDIUM~~ | Correctness | ✅ FIXED — Updated to `max_completion_tokens` with backwards-compatibility note | azure-ai-foundry/SKILL.md Rules 3, 8 | Fixed |
| 6 | ~~MEDIUM~~ | Correctness | ✅ FIXED — Replaced deprecated `MessageCard` with Adaptive Card + `Action.Http` | m365-workflows/SKILL.md Rule 15 | Fixed |
| 7 | ~~MEDIUM~~ | Correctness | ✅ FIXED — Metric name corrected to `CpuUsageNanoCores` | azure-best-practices/SKILL.md Rule 26 | Fixed |
| 8 | ~~MEDIUM~~ | Correctness | ✅ FIXED — KQL query now uses `parse_json(identity_s)` | azure-security-audit/SKILL.md Rule 11 | Fixed |
| 9 | ~~MEDIUM~~ | Completeness | ✅ FIXED — Added Rule 8: 72-hour breach notification (PIPA Article 34) | korean-compliance/SKILL.md Rule 8 | Fixed |
| 10 | ~~MEDIUM~~ | Accuracy | ✅ FIXED — Pricing dict now stamped "as of 2026-03" | azure-ai-foundry/SKILL.md Rule 9 | Fixed |
| 11 | ~~LOW~~ | Correctness | ✅ FIXED — Added `"state": "enabled"` to Conditional Access JSON | azure-security-audit/SKILL.md Rule 2 | Fixed |
| 12 | ~~LOW~~ | Correctness | ✅ FIXED — Updated to `teamsapp package` / `teamsapp publish` | m365-copilot-extensions/SKILL.md Rule 9 | Fixed |
| 13 | LOW | Consistency | Rules 15-19 in m365-workflows omit ❌ Wrong examples, unlike earlier rules | m365-workflows/SKILL.md Rules 15-19 | Deferred — style-only |
| 14 | ~~LOW~~ | Completeness | ✅ FIXED — Added note about required child resources | azure-best-practices/SKILL.md Rule 29 | Fixed |
| 15 | ~~LOW~~ | Completeness | ✅ FIXED — NIA citation updated to "(updated 2023)" | korean-compliance/SKILL.md Rule 14 | Fixed |

## Statistics

| Metric | Value |
|---|---|
| Files reviewed | 17 (all changed files in commit c7d2069) |
| Total findings | 15 |
| CRITICAL | 0 |
| HIGH | 4 |
| MEDIUM | 6 |
| LOW | 5 |
| PASS (no issues) | 4 dimensions (Security, Dependency, Build Pipeline, LESSONS.md Convention) |

## What Works Well

- **Rule format consistency** — All 101 rules follow the same Impact/Wrong/Correct/Why structure. An engineer reading any skill knows exactly what to expect.
- **Korean-compliance is genuinely unique** — No other skill collection in the 13,000+ ecosystem covers PIPA, ISMS-P, or Korean UI patterns. This is the strongest differentiator.
- **LESSONS.md convention is elegant** — Zero dependencies, zero code, pure text convention. Every skill has it. It's the right level of ambition for a v2 release.
- **Build pipeline works** — `npm run validate` catches malformed skills, `npm run build` regenerates the index. Zero external dependencies maintained.
- **No security issues in examples** — All "wrong" examples clearly show anti-patterns. No actual secrets leaked. Managed Identity is consistently recommended as the correct pattern.
- **Cross-platform compatibility** — All 11 skills installed successfully across Claude Code, Codex, Gemini CLI, GitHub Copilot, and more.
- **Pre-deployment checklists** — Every Azure/M365/Korean skill ends with a comprehensive checklist. These are immediately useful even without reading all the rules.

## Prioritized Next Steps

1. **Fix the 4 HIGH findings** — Graph SDK typing (finding 1), ISMS-P control numbers (2), missing Korean laws (3), and deprecated security contacts API (4). These are factual errors that would mislead enterprise users.
2. **Fix the `max_tokens` deprecation** (finding 5) — This affects the most-used code pattern in azure-ai-foundry. Update to `max_completion_tokens` with a note about backwards compatibility.
3. **Replace deprecated MessageCard format** (finding 6) — Outlook actionable messages should use Adaptive Cards, which is already the pattern in m365-copilot-extensions. Consistency opportunity.
4. **Fix Container Apps metric name** (finding 7) — `CpuUsageNanoCores` vs `UsageNanoCores` would cause alert deployment failures. Quick one-word fix.

## Biggest Benefits from This Change

The changes deliver three tiers of value:

### Tier 1: Immediate High Value
- **`korean-compliance`** — Unique in the entire ecosystem. Korean enterprise teams can immediately use the PIPA consent patterns, privacy policy checklist, and KST handling rules. No other skill pack covers this.
- **Expanded `azure-best-practices` (31 rules)** — The cost optimization rules (28-31) and monitoring rules (26-27) fill the most common gaps in Azure deployments. Budget alerts and Application Insights setup alone prevent the two most common production surprises: cost overruns and undetected outages.

### Tier 2: Strategic Differentiation
- **`azure-ai-foundry`** — Azure OpenAI is the fastest-growing Azure service. Having 12 rules covering Managed Identity, content safety, model versioning, and cost tracking positions duru-skills as the go-to skill for Korean enterprise AI projects.
- **LESSONS.md feedback loop** — This is the moat. Over time, duru-skills gets smarter for each specific project. No static skill collection can compete with one that learns.

### Tier 3: Ecosystem Completeness
- **`m365-copilot-extensions`** — Copilot extensibility is new and poorly documented. Having declarative agent and API plugin patterns makes duru-skills the only skill pack covering the full Microsoft AI + cloud stack.
- **`azure-security-audit`** — Enterprise teams need security audit patterns for compliance. Combined with `korean-compliance`, this covers both Azure security and Korean regulatory requirements.
