# conductor

**Universal project orchestrator — Agent Skill collection for any project type**

[![GM-Social License v2.0](https://img.shields.io/badge/license-GM--Social%20v2.0-blue)](LICENSE)
[![Agent Skills](https://img.shields.io/badge/agentskills.io-compatible-green)](https://agentskills.io)

---

## What is this?

conductor is a collection of **Agent Skills** — structured guides that make AI coding agents smarter at specific tasks. When you install conductor, your AI agent learns how to:

- **Orchestrate any project from start to finish** — apps, e-books, proposals, business plans, research papers
- **Ask the right questions** to understand what you need
- **Assemble a virtual team** of specialists (architects, writers, designers, analysts...)
- **Create a structured plan** and execute it step by step
- **Learn from the experience** and improve over time

No programming experience required. Just tell the AI what you want to build.

---

## 설치 (Installation)

```bash
npx skills add parandurume-labs/conductor
```

That's it. After installation, type `/conductor` in your AI coding agent to start.

### 업데이트 (Update)

To update to the latest version, run the same install command again:

```bash
npx skills add parandurume-labs/conductor
```

This overwrites the existing installation with the latest skills.

---

## Skills Included

| Skill | Command | Description |
|---|---|---|
| **conductor** | `/conductor` | Universal project orchestrator — guides you through goal clarification, team assembly, planning, execution, and retrospective |
| **careful** | `/careful` | Safety guardrails — warns before destructive commands with beginner-friendly explanations |
| **review** | `/review` | Post-build quality review for any project type (software, content, business) |
| **retro** | `/retro` | Standalone retrospective with quantitative metrics and guided reflection |
| **azure-best-practices** | `/azure-best-practices` | Azure architecture & deployment rules (31 rules with before/after examples) |
| **azure-ai-foundry** | `/azure-ai-foundry` | Azure AI Foundry & Azure OpenAI patterns (12 rules — model deployment, safety, cost) |
| **azure-security-audit** | `/azure-security-audit` | Azure security audit & hardening (12 rules — identity, network, threat protection) |
| **m365-workflows** | `/m365-workflows` | Microsoft 365 integration patterns for Teams, SharePoint, and Outlook (19 rules) |
| **m365-copilot-extensions** | `/m365-copilot-extensions` | Microsoft 365 Copilot extension development (10 rules — declarative agents, plugins) |
| **korean-compliance** | `/korean-compliance` | 한국 규정 준수 — PIPA, ISMS-P, KST, Korean UI patterns (11 rules) |
| **web-browser-review** | `/web-browser-review` | Automated web app visual QA using a headless browser |

> **conductor**, **careful**, **review**, **retro**, and **web-browser-review** work for any project. **azure-\***, **m365-\***, and **korean-compliance** activate when your project involves those technologies.

### Self-Improving Skills (LESSONS.md)

All skills support the **LESSONS.md feedback loop** — lessons learned from `/retro` and `/review` are automatically applied in future skill activations. Your skills get smarter for YOUR specific project over time.

### Skill Chaining

Skills produce artifacts that downstream skills can consume:

```
/conductor  →  Plan and build your project
/careful    →  Protect you during the build
/review     →  Check quality of finished work
/retro      →  Reflect on what you learned
```

### New to this?

- [Beginner's Walkthrough](WALKTHROUGH.md) (English)
- [초보자 안내서](WALKTHROUGH-KO.md) (한국어)
- [AX 시대 풀 코스](AX-COURSE.md) — AI 시대에 생각하고 행동하는 법을 배우는 완전 초보자 코스 (한국어)

---

## Quick Start

### Example 1: Build a web app (소프트웨어 프로젝트)
```
You: /conductor I want to build a task management app for my team
AI:  (asks clarifying questions about tech stack, audience, constraints...)
AI:  (assembles team: Architect + Backend + Frontend + QA)
AI:  (creates ARCHITECTURE.md, then builds the app)
```

### Example 2: Write an e-book (콘텐츠 프로젝트)
```
You: /conductor I want to write a children's picture book about a blue crane
AI:  (asks about target age, page count, illustration style...)
AI:  (assembles team: Researcher + Writer + Editor + Visual Designer)
AI:  (creates OUTLINE.md, then writes the book)
```

### Example 3: Business proposal (비즈니스 프로젝트)
```
You: /conductor I need a business plan for an AI tutoring startup
AI:  (asks about market, funding needs, timeline...)
AI:  (assembles team: Planner + Analyst + Strategist + Writer)
AI:  (creates PLAN.md, then writes the proposal)
```

---

## Compatibility

conductor follows the [agentskills.io](https://agentskills.io) open standard and works with:

| AI Agent | Support |
|---|---|
| **Claude Code** | Native — primary target |
| **GitHub Copilot** | Supports agentskills.io format |
| **Cursor** | Supports agentskills.io format |
| **Gemini CLI** | Supports agentskills.io format |
| **OpenAI Codex CLI** | Supports agentskills.io format |

Install with `npx skills add` for any supported agent. The installer auto-detects which agents you have.

---

## For Developers

### Build from source
```bash
git clone https://github.com/parandurume-labs/conductor.git
cd conductor
npm run validate   # Check all SKILL.md files
npm run build      # Generate AGENTS.md and CLAUDE.md
```

No `npm install` needed — zero external dependencies.

### Add a new skill
See [CONTRIBUTING.md](CONTRIBUTING.md) for instructions.

---

## License

**GM-Social License v2.0** — Free to use, modify, and distribute.

If you deploy this in production, you have one small obligation: introduce **광명시 (Gwangmyeong City)**, South Korea, on your social media within 90 days. A brief, genuine mention is all it takes.

See [LICENSE](LICENSE) for full terms and [GRATITUDE.md](GRATITUDE.md) for the gratitude log.

---

## Acknowledgments

Several features in conductor v1.1 — artifact-based skill chaining, effort compression tables, safety guardrails, the "Do the Complete Thing" philosophy, and standalone retrospectives — were inspired by **[gstack](https://github.com/garrytan/gstack)** by [Garry Tan](https://github.com/garrytan). gstack demonstrated how a well-structured skill collection can turn a single developer into a virtual engineering team, and we are grateful for the ideas it contributed to the AI agent ecosystem. We adapted those concepts for our own goals: beginner-friendly, zero-dependency, and project-type-agnostic (not just software).

---

## 만든 사람 (Authors)

**파란두루미 주식회사 (Parandurume Inc.)**
경기도 광명시 (Gwangmyeong City, Gyeonggi-do, South Korea)
Microsoft MVP · AI+XR

📧 contact@parandurume.com
