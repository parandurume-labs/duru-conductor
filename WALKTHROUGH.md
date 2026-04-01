# Duru-Conductor — A Complete Beginner's Walkthrough

> This guide is written for people who have **never built software, written a business plan, or managed a project before.** No computer science knowledge required. If you can have a conversation, you can use Duru-Conductor.

---

## What Is This?

Imagine you want to build something — a website for your shop, a children's book, a business proposal, or an app. Normally, you would need a team of experts: designers, developers, writers, project managers. That takes time, money, and knowing the right people.

**Duru-Conductor changes that.** It is an AI assistant that acts as your entire project team. You tell it what you want to build, and it guides you through every step — from the first idea to the finished product. It asks the right questions, makes a plan, builds the thing, checks its own work, and helps you learn from the experience.

You do not need to know how to code. You do not need to know what "architecture" means. You just need to know **what you want**, even roughly. Duru-Conductor figures out the rest.

---

## How Does It Work?

Duru-Conductor follows four phases, like a recipe:

```
Phase 1: Intake      →  "What do you want to build?"
Phase 2: Planning    →  "Here's how we'll build it."
Phase 3: Execute     →  "Let's build it, step by step."
Phase 4: Retrospective →  "What did we learn?"
```

You move through these phases in order. Duru-Conductor asks you questions at each step and waits for your approval before moving on. **You are always in control.** It never does something without asking first.

---

## Your First Project — A Real Example

Let's walk through a complete example. Say you own a hair salon in Gwangmyeong and you want a simple website where customers can see your services and book an appointment.

### Phase 1: Intake — "Tell me what you want"

You type:

```
/duru-conductor
I want to build a website for my hair salon. Customers should be able to
see our services and prices and book an appointment online.
```

Duru-Conductor reads your request and figures out what it already knows and what it needs to ask. It might ask:

```
I have a few questions to fill in the details:

1. What is the name of your salon?
2. Do you need customers to pay online, or just book a time slot?
3. Do you have a budget or hosting preference? [default: free hosting on GitHub Pages]
4. Do you want the site in Korean only, or Korean and English?
```

Notice:
- **It never asks more than 5 questions.** It does not want to overwhelm you.
- **It offers defaults.** If you don't know, you can just say "the default is fine."
- **It uses plain language.** No jargon.

You answer, and Duru-Conductor shows you a summary table:

```
| Dimension   | Decision                                       |
|-------------|------------------------------------------------|
| Goal        | Hair salon website with service list + booking  |
| Stack       | HTML + CSS + JavaScript + Google Sheets backend |
| Platform    | GitHub Pages (free hosting)                     |
| Audience    | Local customers, Korean-speaking                |
| Integrations| Google Sheets for booking data                  |
| Constraints | Free, done this week                            |
| Quality     | Mobile-friendly, spam-protected                 |
```

It asks: **"Does this look right?"** You say yes. Now it saves this as `INTAKE.md` — a written record of what was agreed.

### Phase 2: Planning — "Here's the plan"

Duru-Conductor assembles a virtual team (you don't need to do anything — it picks the right roles automatically):

```
| Role             | Responsibility                          |
|------------------|-----------------------------------------|
| Architect        | Design the website structure             |
| Frontend Dev     | Build the pages                         |
| Visual Designer  | Make it look professional                |
| QA Engineer      | Test that everything works              |
```

Then it breaks the work into "workstreams" — parallel tasks:

```
| # | Workstream     | Deliverables              | Depends On |
|---|----------------|---------------------------|------------|
| 1 | Design         | Layout, colors, fonts     | —          |
| 2 | Service Page   | Services + pricing page   | #1         |
| 3 | Booking System | Appointment form + backend| #1         |
| 4 | Testing        | Full test on mobile+desktop| #2, #3    |
```

And here is something special — it shows you an **effort comparison**:

```
| Workstream     | Human Team    | AI-Assisted | Compression |
|----------------|---------------|-------------|-------------|
| Design         | 3 days        | 20 min      | 216x        |
| Service Page   | 2 days        | 15 min      | 192x        |
| Booking System | 5 days        | 30 min      | 240x        |
| Testing        | 1 day         | 10 min      | 144x        |
| **Total**      | **11 days**   | **75 min**  | **211x**    |
```

This is not magic — it is what happens when AI handles the repetitive work. The table helps you see: **it is worth doing the complete, high-quality version**, because the cost is minutes, not weeks.

It asks: **"Should I proceed with this plan?"** You say yes.

### Phase 3: Execute — "Let's build it"

Duru-Conductor works through each workstream in order. After each one, it tells you what it did:

```
✅ Workstream #1 (Design) — Done
   Created: styles.css, layout template
   Next: Building the service page

✅ Workstream #2 (Service Page) — Done
   Created: index.html, services.html
   Next: Building the booking system
```

It saves progress to `BUILD-LOG.md` after each workstream. This means **if your computer crashes or you close the window, Duru-Conductor can pick up where it left off** next time.

After the last workstream, it says: "All workstreams are done. I recommend running `/review` for a quality check before we wrap up."

### Phase 4: Retrospective — "What did we learn?"

Duru-Conductor creates a `RETROSPECTIVE.md` that captures:
- What was built and for whom
- What went well
- What could improve
- Lessons learned
- Metrics (files created, time spent, etc.)

This is your record. If you build another website next month, you (and Duru-Conductor) can look back at this and do even better.

---

## The Six Skills — Your Toolkit

Duru-Conductor is the main orchestrator, but it comes with five companion skills. Think of them as specialists you can call on:

### `/duru-conductor` — The Project Manager

Your starting point for any new project. It handles the full lifecycle: intake, planning, execution, retrospective.

**When to use it:** "I want to build something" or "I have a project idea."

### `/careful` — The Safety Net

Protects you from accidentally running dangerous commands. If you are about to delete something important, it pauses and explains the risk in plain language before proceeding.

**When to use it:** Activate at the start of any session where you are working with files, databases, or git. Especially important for beginners.

**Example:**
```
⚠️ HIGH — This command needs your attention

What it does: Permanently deletes the folder "src/" and everything inside it.
Why it is risky: There is no recycle bin. Once deleted, these files cannot be recovered.
Safer alternative: Move it first with "mv src/ src-backup/" so you can restore it.

Do you want to proceed? (yes / no)
```

It teaches you **why** something is dangerous, not just that it is. Over time, you learn to recognize these patterns yourself.

### `/review` — The Quality Inspector

Examines your finished work and produces a structured report of findings. Works for any project type:
- **Software:** checks for security issues, bugs, test coverage
- **Content:** checks for consistency, accuracy, completeness
- **Business:** checks for feasibility, coherence, completeness

**When to use it:** After your project is built, before you share it with the world.

### `/retro` — The Reflective Coach

Guides you through a retrospective — a structured reflection on what happened, what you learned, and what to do differently next time. Collects real metrics (files changed, tests passed, time spent) so the reflection is grounded in facts, not feelings.

**When to use it:** After finishing any project or significant chunk of work.

### `/azure-best-practices` — Azure Cloud Expert

Production-ready rules for deploying on Microsoft Azure. Only relevant if your project uses Azure cloud services.

### `/m365-workflows` — Microsoft 365 Expert

Integration patterns for Teams, SharePoint, and Outlook. Only relevant if your project connects to Microsoft 365.

---

## How Skills Work Together

Skills are designed to chain. Here is the natural flow:

```
/duru-conductor  →  Plan and build your project
     ↓
/careful    →  Protect you during the build (activate alongside duru-conductor)
     ↓
/review     →  Check the quality of what was built
     ↓
/retro      →  Reflect on what you learned
```

You do not have to use all of them. `/duru-conductor` alone gets you from idea to finished project. The others add depth:

- **Building something for the first time?** Start with `/duru-conductor` + `/careful`
- **Finished building and want to check quality?** Run `/review`
- **Want to get better at building things?** Run `/retro` after each project
- **Deploying to Azure?** Add `/azure-best-practices`
- **Connecting to Teams or SharePoint?** Add `/m365-workflows`

---

## Key Concepts for Complete Beginners

### "What is a skill?"

A skill is a set of instructions that tells the AI how to behave. When you type `/duru-conductor`, you are activating the "duru-conductor" skill, which turns the AI into a project manager. When you type `/review`, you turn it into a quality inspector. Same AI, different expertise.

### "What are artifacts?"

Artifacts are files that Duru-Conductor creates as it works. Think of them as written records:

| File | What It Is | Plain English |
|---|---|---|
| `INTAKE.md` | Intake summary | "What we agreed to build" |
| `ARCHITECTURE.md` | Technical design | "How the thing is structured" |
| `PLAN.md` | Execution plan | "The step-by-step to-do list" |
| `BUILD-LOG.md` | Progress tracker | "What's been done so far" |
| `REVIEW.md` | Quality report | "What's good and what to fix" |
| `RETROSPECTIVE.md` | Lessons learned | "What we learned from this" |

These files serve two purposes:
1. **They are your project's memory.** If you come back next week, Conductor reads them and knows where you left off.
2. **They connect skills.** `/review` reads your `PLAN.md` to check if you built everything you planned. `/retro` reads your `BUILD-LOG.md` to know what was actually done.

### "What if I say the wrong thing?"

Nothing breaks. Conductor always asks for confirmation before doing anything significant. If something goes wrong:
- You can say "stop" or "wait"
- You can say "let's go back to the plan"
- Duru-Conductor never deletes your work without asking (and with `/careful` active, it explains the risk first)

### "What if I don't understand something?"

Say so! "I don't understand what that means" is a perfectly valid response at any point. Duru-Conductor will explain in simpler terms. It is designed for beginners — you are not bothering it.

### "Do I need to install anything?"

You need an AI coding agent that supports skills. The most common ones:
- **Claude Code** (recommended) — type `/duru-conductor` directly
- **GitHub Copilot** — works with the AGENTS.md file
- **Cursor** — works with the AGENTS.md file

No programming languages, databases, or frameworks need to be installed in advance. Duru-Conductor handles setup as part of the build.

---

## The AX Era — Why This Matters

We are living in the **AX era** — the age of AI-augmented everything. This changes what it means to build things:

**Before AX:**
- Building a website required hiring a developer ($3,000-$10,000)
- Writing a business plan required consulting experience
- Managing a project required PM training and tools
- Making a mistake with a terminal command could destroy your work

**In the AX era:**
- You describe what you want, and AI builds it with you
- The AI brings the expertise; you bring the vision and decisions
- Quality that used to require a team is now achievable by one person
- Safety tools explain risks before they happen

**What you need to learn is not coding — it is how to think clearly about what you want.** Duru-Conductor's intake phase (the 7 dimensions) is training you to think like a project leader:

1. **Goal** — What am I trying to achieve?
2. **Stack / Medium** — What form should it take?
3. **Platform** — Where will people find it?
4. **Audience** — Who is it for?
5. **Integrations** — What does it connect to?
6. **Constraints** — What are my limits?
7. **Quality** — How good must it be?

These seven questions work for *any* project — not just technology. They work for a restaurant menu redesign, a neighborhood event plan, a school presentation. The skill you are building by using Conductor is **structured thinking**, and that skill transfers everywhere.

---

## Common Scenarios

### "I want to build a website for my small business"

```
/duru-conductor
I want a website for my cafe. Customers should see the menu,
location, and business hours. Maybe a simple contact form.
```

Duru-Conductor will detect this as an SME (small business) project and automatically load templates optimized for Korean small businesses — including privacy policy reminders, spam protection, and mobile-first design.

### "I want to write a book"

```
/duru-conductor
I want to write a children's picture book about a curious cat
who explores the neighborhood. Target age is 5-8, Korean market.
```

Duru-Conductor assembles a content team (Writer, Editor, Visual Designer) and creates an OUTLINE.md instead of ARCHITECTURE.md.

### "I want to create a business proposal"

```
/duru-conductor
I need a business proposal for a new delivery service in
Gwangmyeong. The pitch is for potential investors.
```

Duru-Conductor assembles a business team (Business Analyst, Strategist, Writer) and creates a PLAN.md with financials, timeline, and success metrics.

### "I broke something and I'm scared"

```
/careful
```

Activate `/careful` mode. Now every dangerous command will be explained before it runs. You cannot accidentally delete your project.

### "I finished building — is it any good?"

```
/review
```

Review will scan everything you built, find issues categorized by severity, and tell you exactly what to fix first.

### "What did I learn from this project?"

```
/retro
```

Retro will gather metrics, ask you reflection questions, and produce a document you can look back on.

---

## Upgrading from conductor

If you previously installed `parandurume-labs/conductor`, follow these steps to upgrade to `duru-skills`:

### Step 1: Remove the old conductor skills

```bash
# macOS/Linux:
rm -rf .agents/skills/conductor .agents/skills/azure-best-practices \
       .agents/skills/m365-workflows .agents/skills/careful \
       .agents/skills/review .agents/skills/retro .agents/skills/web-browser-review

# Windows (PowerShell):
Remove-Item -Recurse -Force .agents\skills\conductor, `
  .agents\skills\azure-best-practices, .agents\skills\m365-workflows, `
  .agents\skills\careful, .agents\skills\review, .agents\skills\retro, `
  .agents\skills\web-browser-review
```

### Step 2: Install duru-skills

```bash
npx skills add parandurume-labs/duru-skills
```

This installs all 11 skills — the original 7 (upgraded) plus 4 new ones (`azure-ai-foundry`, `azure-security-audit`, `m365-copilot-extensions`, `korean-compliance`).

### Step 3: Update your commands

| Old Command | New Command |
|---|---|
| `/conductor` | `/duru-conductor` |

All other skill commands (`/careful`, `/review`, `/retro`, etc.) remain the same.

### Step 4: Verify

Type `/duru-conductor` in your AI coding agent. If it responds with the intake flow, you're all set.

> **Note:** Your existing project artifacts (`INTAKE.md`, `ARCHITECTURE.md`, `BUILD-LOG.md`, `RETROSPECTIVE.md`) are fully compatible — Duru-Conductor reads the same artifact format.

---

## Tips for Getting the Most Out of Duru-Conductor

1. **Be honest about what you don't know.** "I don't know" is a great answer — Duru-Conductor picks a sensible default and moves on.

2. **Read the effort compression table.** It shows you why doing the complete, high-quality version is worth it. AI makes thoroughness cheap.

3. **Use `/careful` if you're nervous.** There is no shame in safety nets. Experienced developers use them too.

4. **Run `/review` before sharing your work.** It catches things you would not notice.

5. **Run `/retro` after every project.** The habit of reflection compounds. Your fifth project will be dramatically better than your first.

6. **Trust the process.** Conductor asks for confirmation at every major step. If something feels wrong, say so. You can always go back.

7. **Save your artifacts.** INTAKE.md, PLAN.md, BUILD-LOG.md, REVIEW.md, RETROSPECTIVE.md — these are your project's story. They help Conductor pick up where you left off, and they help you remember what you learned.

---

## Quick Reference

| I want to... | Type this |
|---|---|
| Start a new project | `/duru-conductor` |
| Protect myself from mistakes | `/careful` |
| Check the quality of my work | `/review` |
| Reflect on what I learned | `/retro` |
| Get Azure deployment help | `/azure-best-practices` |
| Get Microsoft 365 help | `/m365-workflows` |
| Resume a project I started earlier | `/duru-conductor` (it detects existing artifacts and resumes) |

---

> **Remember:** You do not need to be an expert to build something great. You just need a clear idea of what you want and the willingness to walk through the process. Duru-Conductor handles the expertise. You bring the vision.

---

## Acknowledgments

Many of the ideas in duru-skills v2.0 were inspired by **[gstack](https://github.com/garrytan/gstack)** by Garry Tan (President & CEO of Y Combinator). gstack showed the world what a well-designed AI skill collection can achieve — turning one developer into a virtual engineering team capable of shipping thousands of lines per day. Specific ideas we adopted and adapted include:

- **Artifact-based skill chaining** — skills produce files that other skills consume (gstack's "filesystem as database" pattern)
- **Effort compression tables** — showing human-team vs AI-assisted estimates to encourage completeness (gstack's "Boil the Lake" philosophy)
- **Safety guardrails** — the `/careful` skill was inspired by gstack's `/careful` and `/guard` hook-based safety system
- **Standalone retrospectives** — the `/retro` skill draws from gstack's `/retro` with shipping streak tracking
- **`benefits-from` metadata** — explicit skill dependency declarations in frontmatter

We adapted these ideas for a different audience and philosophy: where gstack targets experienced developers building software, duru-skills is designed for **complete beginners building any type of project** — with zero dependencies and plain-language explanations throughout. We are grateful for the innovation gstack brought to the AI agent ecosystem.
