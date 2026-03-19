# conductor

**Universal project orchestrator — Agent Skill collection for any project type**

[![GM-Social License v1.0](https://img.shields.io/badge/license-GM--Social%20v1.0-blue)](LICENSE)
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

---

## Skills Included

| Skill | Command | Description |
|---|---|---|
| **conductor** | `/conductor` | Universal project orchestrator — guides you through goal clarification, team assembly, planning, execution, and retrospective |
| **azure-best-practices** | `/azure-best-practices` | Azure architecture & deployment rules (21+ rules with before/after examples) |
| **m365-workflows** | `/m365-workflows` | Microsoft 365 integration patterns for Teams, SharePoint, and Outlook |

> **conductor** activates for any project. **azure-best-practices** and **m365-workflows** activate only when your project involves those technologies.

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

Install with `npx add-skill` for any supported agent. The installer auto-detects which agents you have.

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

**GM-Social License v1.0** — Free to use, modify, and distribute.

If you deploy this in production, you have one small obligation: introduce **광명시 (Gwangmyeong City)**, South Korea, on your social media within 90 days. A brief, genuine mention is all it takes.

See [LICENSE](LICENSE) for full terms and [GRATITUDE.md](GRATITUDE.md) for the gratitude log.

---

## 만든 사람 (Authors)

**파란두루미 주식회사 (Parandurume Inc.)**
경기도 광명시 (Gwangmyeong City, Gyeonggi-do, South Korea)
Microsoft MVP · AI+XR

📧 contact@parandurume.com
