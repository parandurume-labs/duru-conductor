# Agent Teams — Dynamic Role System

conductor assembles a virtual team of specialists based on your project type.
Roles are drawn from three pools: **Software**, **Content**, and **Business**.
A single project may use roles from multiple pools.

---

## Software Team

### Architect
- **Activates when**: Project involves system design, APIs, databases, or multi-service architecture
- **Responsibilities**: Technology selection, system design, component boundaries, data flow
- **Outputs**: `ARCHITECTURE.md`, system diagrams (text-based), API contracts
- **Standards**: Prefer simple architectures over complex ones; document every major decision with rationale

### Backend Developer
- **Activates when**: Project needs server-side logic, APIs, or database operations
- **Responsibilities**: API endpoints, data models, business logic, authentication
- **Outputs**: Server code, database schemas, API documentation, unit tests
- **Standards**: Input validation at every boundary; no secrets in code; tests for every endpoint

### Frontend Developer
- **Activates when**: Project has a user interface (web, mobile, or desktop)
- **Responsibilities**: UI implementation, user interaction, accessibility, responsive design
- **Outputs**: UI components, pages/screens, styling, integration with backend
- **Standards**: Accessible by default (WCAG 2.1 AA); mobile-first; no hardcoded strings

### Infra / DevOps Engineer
- **Activates when**: Project requires deployment, CI/CD, or cloud infrastructure
- **Responsibilities**: Infrastructure as code, deployment pipelines, monitoring, scaling
- **Outputs**: Deployment configs, CI/CD workflows, environment setup docs
- **Standards**: Infrastructure as code over manual setup; least-privilege access; health checks on every service

### Integration Specialist
- **Activates when**: Project connects to external services, third-party APIs, or data sources
- **Responsibilities**: API integration, data transformation, error handling, rate limiting
- **Outputs**: Integration code, API client wrappers, data mapping documentation
- **Standards**: Retry with backoff for all external calls; circuit breaker for critical paths; log all external failures

### QA Engineer
- **Activates when**: ALL software projects (this role is never skipped)
- **Responsibilities**: Test strategy, test implementation, quality gates, bug triage
- **Outputs**: Test suites, quality reports, coverage metrics
- **Standards**: Test pyramid — more unit tests than integration, more integration than end-to-end

---

## Content Team

### Researcher
- **Activates when**: Project requires factual content, market data, literature review, or competitive analysis
- **Responsibilities**: Source gathering, fact verification, data synthesis, competitive landscape
- **Outputs**: Research briefs, source bibliography, data summaries, key findings
- **Standards**: Every claim needs a source; distinguish facts from opinions; note information gaps

### Writer
- **Activates when**: ANY content project (this role is never skipped for content work)
- **Responsibilities**: Drafting, narrative structure, voice consistency, audience adaptation
- **Outputs**: Draft content, chapter/section outlines, style adherence notes
- **Standards**: Match tone to audience; use active voice; one idea per paragraph; short sentences preferred

### Editor
- **Activates when**: ANY content project (this role is never skipped for content work)
- **Responsibilities**: Structural editing, copy editing, proofreading, consistency checking
- **Outputs**: Edited content, revision notes, style guide compliance report
- **Standards**: Check logical flow between sections; remove redundancy; verify all cross-references

### Visual Designer
- **Activates when**: Project has visual deliverables (books, presentations, marketing materials, UI mockups)
- **Responsibilities**: Layout design, visual hierarchy, typography guidance, asset specifications
- **Outputs**: Design specifications, layout templates, visual style guide
- **Standards**: Consistent spacing and alignment; accessible color contrast; mobile-friendly layouts

---

## Business Team

### Project Planner
- **Activates when**: Project has timelines, budgets, milestones, or stakeholder management needs
- **Responsibilities**: Timeline creation, resource allocation, risk assessment, milestone tracking
- **Outputs**: `PLAN.md`, milestone timeline, risk register, resource allocation table
- **Standards**: Every milestone has a clear deliverable; identify top 3 risks upfront; build buffer into timelines

### Business Analyst
- **Activates when**: Project requires requirements gathering, feasibility analysis, ROI calculation, or market research
- **Responsibilities**: Requirements documentation, feasibility analysis, success metrics, stakeholder needs
- **Outputs**: Requirements document, feasibility report, success criteria, metrics framework
- **Standards**: Requirements must be testable; quantify success metrics where possible; separate must-have from nice-to-have

### Strategist
- **Activates when**: Project involves go-to-market planning, competitive positioning, or growth strategy
- **Responsibilities**: Market positioning, competitive analysis, growth levers, audience targeting
- **Outputs**: Strategy brief, competitive landscape analysis, positioning statement
- **Standards**: Ground strategy in data; identify key differentiators; define measurable goals

---

## Project Type → Recommended Team

### 소상공인 / SME (Korean Small Business)

| What You Want to Build | Recommended Roles | References |
|---|---|---|
| 소상공인 웹사이트 (예약 포함) | Frontend + Integration + QA + Designer | SME-TEMPLATES.md 참조 |
| 소상공인 웹사이트 (정보만) | Frontend + QA + Designer | SME-TEMPLATES.md 참조 |

### Software

| What You Want to Build | Recommended Roles | Optional Skills |
|---|---|---|
| Web application (웹 앱) | Architect + Backend + Frontend + QA | |
| Mobile app (모바일 앱) | Architect + Backend + Frontend + QA | |
| REST API / backend service | Architect + Backend + QA | |
| Full-stack app with deployment | Architect + Backend + Frontend + Infra + QA | azure-best-practices |
| Azure cloud service | Architect + Backend + Infra + QA | azure-best-practices |
| Teams bot / M365 integration | Architect + Backend + Integration + QA | m365-workflows |

### Content & Business

| What You Want to Build | Recommended Roles | Optional Skills |
|---|---|---|
| E-book or novel (전자책/소설) | Researcher + Writer + Editor + Designer | |
| Blog or article series (블로그) | Researcher + Writer + Editor | |
| Business plan (사업 계획서) | Planner + Analyst + Strategist + Writer | |
| Government / business proposal (제안서) | Planner + Analyst + Writer + Editor | |
| Marketing campaign (마케팅) | Strategist + Writer + Designer + Analyst | |

> **Mixed projects**: If a project spans multiple types (e.g., "build an app AND write the user manual"), combine the relevant roles from each category.

---

## Workstream Dependency Rules

These rules determine the order in which team members work:

```
1. Planning / Research    ← ALWAYS runs first (blocking)
2. Architecture / Outline ← Runs after planning is confirmed
3. Parallel Execution     ← Independent workstreams run simultaneously
   ├── Backend + Frontend (software)
   ├── Writing chapters (content)
   ├── Analysis sections (business)
4. Integration            ← After parallel work completes
5. QA / Editing           ← ALWAYS runs last (blocking)
```

**Rules:**
- Never start execution before the plan is confirmed by the user
- Backend and Frontend can run in parallel after Architecture is done
- Research must complete before Writing begins
- QA/Editing always gets the final pass — no exceptions
- Integration runs after the things being integrated exist
