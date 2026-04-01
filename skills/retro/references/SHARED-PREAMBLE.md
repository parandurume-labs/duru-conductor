# Shared Preamble — Common Patterns for All Skills

This reference defines shared logic used by duru-conductor, review, retro, and other skills. Load this file when you need project detection, artifact awareness, or standard formatting.

---

## Project Type Detection

Scan the workspace for these indicators and classify the project:

| Indicator | Project Type |
|---|---|
| `package.json`, `Cargo.toml`, `go.mod`, `requirements.txt`, `*.sln` | Software |
| `OUTLINE.md`, `chapters/`, `manuscript/`, `*.docx` draft | Content |
| `PLAN.md` (with business sections), `financials/`, `proposal-*.md` | Business |
| Multiple indicators from different types | Mixed |

If no indicators are found, ask the user: "What type of project is this — software, content (books/docs), business (plans/proposals), or a mix?"

---

## Artifact Detection (Conductor Phase Awareness)

Conductor produces artifacts at each phase. Check for them to determine project state:

| Artifact | Meaning | Next Action |
|---|---|---|
| `INTAKE.md` exists | Phase 1 complete | Proceed to Phase 2 (Planning) |
| `ARCHITECTURE.md` / `OUTLINE.md` / `PLAN.md` exists | Phase 2 complete | Proceed to Phase 3 (Execute) |
| `BUILD-LOG.md` exists | Phase 3 in progress | Check last completed workstream, resume |
| `BUILD-LOG.md` with all workstreams done | Phase 3 complete | Proceed to Phase 4 (Retrospective) |
| `RETROSPECTIVE.md` exists | Phase 4 complete | Project is done |
| `REVIEW.md` exists | Quality review completed | Use findings for retro or next iteration |

When artifacts exist, always tell the user: "I found [artifact]. This project appears to be in [phase]. Would you like to continue from here, or start fresh?"

---

## Standard Question Format

When asking the user questions, follow these rules:

1. **Numbered list** — maximum 5 questions per round
2. **Plain language** — no jargon; explain technical terms if unavoidable
3. **Defaults in brackets** — e.g., "What framework? [default: React]"
4. **Group related questions** — don't ask about the same topic twice
5. **Skip what you know** — never re-ask information already provided

---

## Standard Artifact Header

When creating any artifact file (INTAKE.md, BUILD-LOG.md, REVIEW.md, RETROSPECTIVE.md), use this header:

```markdown
# [Artifact Name]

> Project: [project name or description]
> Created: [YYYY-MM-DD]
> Skill: [/duru-conductor, /review, or /retro]
```

This header enables other skills to identify who created the artifact and when.
