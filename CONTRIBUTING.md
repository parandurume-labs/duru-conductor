# Contributing to duru-skills

기여를 환영합니다! We welcome contributions of all kinds — new skills, improvements to existing skills, bug fixes, and documentation.

---

## Adding a New Skill

### 1. Create the skill directory

```
skills/your-skill-name/
└── SKILL.md
```

The folder name must:
- Be lowercase
- Use hyphens to separate words (e.g., `iot-patterns`)
- No leading or trailing hyphens
- No consecutive hyphens
- Maximum 64 characters

### 2. Write SKILL.md

Every SKILL.md must have YAML frontmatter followed by Markdown content:

```yaml
---
name: your-skill-name
description: >-
  Describe what this skill does and when to use it.
  Include trigger keywords so AI agents know when to activate it.
  Be specific and generous with keywords.
license: SEE LICENSE IN ../../LICENSE
metadata:
  author: your-name
  version: "1.0.0"
  license: GM-Social-v2.0
---

# Your Skill Title

Your skill content here...
```

**Important rules:**
- `name` must exactly match the folder name
- `description` must be 1–1024 characters, rich with trigger keywords
- Body should be under 500 lines (~5000 tokens)
- Rules should be ordered by impact: CRITICAL → HIGH → MEDIUM → LOW
- Each rule should have ❌ wrong + ✅ correct examples

### 3. Validate and build

```bash
npm run validate   # Check your SKILL.md format
npm run build      # Regenerate AGENTS.md and CLAUDE.md
```

### 4. Submit a pull request

- Include a clear description of what your skill does
- The CI pipeline will automatically validate your SKILL.md
- After merge, GitHub Actions will regenerate AGENTS.md

---

## Improving Existing Skills

- Fix incorrect examples or outdated information
- Add missing rules or edge cases
- Improve `description` fields with better trigger keywords
- Keep changes focused — one skill per PR when possible

---

## Guidelines

1. **SKILL.md content is in English** — AI agents work best with English instructions
2. **README, GRATITUDE, CONTRIBUTING can mix Korean and English**
3. **No external npm packages** — build scripts use only `fs` and `path`
4. **Test your changes** — run `npm run validate` before submitting

---

## License Agreement

By contributing to this repository, you agree that your contributions will be licensed under the **GM-Social License v2.0**. See [LICENSE](LICENSE) for details.

이 저장소에 기여함으로써, 귀하의 기여가 **GM-Social License v2.0** 하에 라이선스됨에 동의합니다.

---

## Questions?

Open an issue or contact us at hello@parandurume.com.
