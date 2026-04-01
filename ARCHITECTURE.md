# Architecture

> Project: Conductor v2 — New Skill Pack + Self-Improving Feedback Loop
> Created: 2026-03-31
> Skill: /duru-conductor

## Structure

```
skills/
  korean-compliance/SKILL.md      # NEW — Phase 1
  azure-ai-foundry/SKILL.md       # NEW — Phase 1
  m365-copilot-extensions/SKILL.md # NEW — Phase 1
  azure-security-audit/SKILL.md   # NEW — Phase 1
  azure-best-practices/SKILL.md   # EXPAND — Phase 2 (+10 rules)
  m365-workflows/SKILL.md         # EXPAND — Phase 2 (+8 rules)
  duru-conductor/SKILL.md              # UPDATE — Phase 3 (LESSONS.md convention)
  careful/SKILL.md                # UPDATE — Phase 3 (LESSONS.md convention)
  review/SKILL.md                 # UPDATE — Phase 3 (LESSONS.md convention)
  retro/SKILL.md                  # UPDATE — Phase 3 (LESSONS.md convention)
  web-browser-review/SKILL.md     # UPDATE — Phase 3 (LESSONS.md convention)
```

## Rule Format (all skills follow this)

```markdown
### Rule N: [Title]

**Impact:** CRITICAL|HIGH|MEDIUM — [one-line why]

[Wrong example with code block]

[Correct example with code block]

**Why:** [explanation]
```

## LESSONS.md Convention

Every SKILL.md includes this section after the intro, before rules:

```markdown
## Learned Patterns (Auto-Updated)

Before applying the rules below, check if `LESSONS.md` exists in the project root.
If it does, read the section tagged with this skill's name and apply those
project-specific lessons alongside the rules below.
```

## Execution Plan

| # | Workstream | Owner | Deliverables | Depends On |
|---|---|---|---|---|
| 1 | korean-compliance skill | Compliance Specialist | `skills/korean-compliance/SKILL.md` (~10 rules) | — |
| 2 | azure-ai-foundry skill | Azure Architect | `skills/azure-ai-foundry/SKILL.md` (~15 rules) | — |
| 3 | m365-copilot-extensions skill | M365 Specialist | `skills/m365-copilot-extensions/SKILL.md` (~10 rules) | — |
| 4 | azure-security-audit skill | Security Engineer | `skills/azure-security-audit/SKILL.md` (~12 rules) | — |
| 5 | Expand azure-best-practices | Azure Architect | +10 rules to existing SKILL.md | — |
| 6 | Expand m365-workflows | M365 Specialist | +8 rules to existing SKILL.md | — |
| 7 | LESSONS.md convention | All | Add convention section to all 11 skills | #1-#6 |
| 8 | Build & index | All | Regenerate CLAUDE.md, AGENTS.md, update README | #1-#7 |

## Effort Estimate

| Workstream | Human Team | AI-Assisted | Compression |
|---|---|---|---|
| 4 new skills | 4 days | 30 min | ~190x |
| 2 skill expansions | 2 days | 15 min | ~190x |
| LESSONS.md convention | 1 day | 10 min | ~140x |
| Build & index | 2 hours | 5 min | ~24x |
| **Total** | ~7.5 days | ~60 min | ~180x |
