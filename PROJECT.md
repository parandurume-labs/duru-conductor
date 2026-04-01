# duru-skills — Project Brief for AI

> 이 문서는 생성형 AI가 `duru-skills` 프로젝트를 처음부터 만들 수 있도록 작성된 설계 문서입니다.
> 코드를 작성하기 전에 이 문서를 끝까지 읽고, 질문이 있으면 먼저 물어보세요.

---

## 1. 프로젝트 정체성

### 이름
`duru-skills`

### 한 문장 정의
AI 코딩 에이전트(Claude Code, GitHub Copilot, Cursor 등)에 `/duru-conductor` 슬래시 커맨드를 추가하여, 소프트웨어 프로젝트를 처음부터 끝까지 오케스트레이션하는 **Agent Skill 컬렉션**이다.

### 무엇을 만드는가
- `skills/` 디렉토리 아래 여러 **SKILL.md** 파일로 구성된 레포지토리
- 각 SKILL.md는 AI 에이전트가 특정 도메인에서 더 잘 동작하도록 지시하는 구조화된 문서
- `packages/build/` 스크립트가 모든 스킬을 하나의 `AGENTS.md`로 컴파일
- `npx add-skill parandurume-labs/duru-skills` 한 줄로 설치 가능

### 무엇을 만들지 않는가
- 실행 가능한 서버, API, 웹앱이 아님
- 플러그인, 익스텐션, npm 패키지가 아님
- 오직 **Markdown + YAML + Node.js 빌드 스크립트**만 존재

---

## 2. 배경 & 동기

### Agent Skills란
[agentskills.io](https://agentskills.io) 오픈 표준. AI 에이전트가 특정 태스크를 수행할 때 로드하는 **도메인 전문 지식 문서**. Anthropic이 설계하고 오픈 표준으로 공개했으며, Claude Code, GitHub Copilot, Cursor, OpenAI Codex가 모두 지원한다.

### 왜 duru-skills인가
기존 Agent Skills(예: Vercel의 `react-best-practices`)는 단일 기술 도메인에 집중한다. `duru-skills`는 여기서 한 발 더 나아가:
1. **프로젝트 전체 오케스트레이션** — 요구사항 수집부터 배포까지
2. **도메인별 전문 스킬** — Azure, M365 등 파란두루미 기술 스택 특화
3. **팀 에이전트 구성** — 태스크를 역할별로 분해하고 병렬 실행

### 만든 사람
파란두루미 주식회사 (Parandurume Inc.) · Microsoft MVP · 경기도 광명시

### 라이선스
**GM-Social License v2.0** — 자유롭게 사용, 수정, 배포 가능. 단 운영 환경 배포 시 90일 내에 광명시를 소셜미디어에 소개해야 함. [LICENSE 파일 참조]

---

## 3. 포함될 스킬 목록

| 스킬 디렉토리 | 슬래시 커맨드 | 역할 | 우선순위 |
|---|---|---|---|
| `skills/conductor` | `/duru-conductor` | 프로젝트 전체 오케스트레이션 (4단계) | P0 |
| `skills/azure-best-practices` | `/azure-best-practices` | Azure 아키텍처 & 배포 룰 30+ | P0 |
| `skills/m365-workflows` | `/m365-workflows` | Teams, SharePoint, Outlook 자동화 패턴 | P0 |

> 향후 추가 가능: `duruon-iot-patterns`, `xr-computer-vision`, `kr-gov-proposal`

---

## 4. 유저 스토리

### 4-1. 핵심 사용자 (Primary User)

**페르소나: 파란두루미 개발자 / AI+XR 스타트업 CTO**
- Azure 기반 프로덕션 서비스 운영
- M365(Teams, SharePoint) 자동화 경험
- Claude Code를 주요 코딩 에이전트로 사용
- 프로젝트마다 비슷한 설계 결정을 반복하는 데 피로감

---

**US-01: 새 프로젝트 시작**
```
나는 개발자로서
막연한 아이디어를 가지고 /duru-conductor를 실행했을 때
에이전트가 빠진 요구사항을 질문하고 실행 계획을 잡아주길 원한다
왜냐하면 매번 처음부터 아키텍처를 설계하는 시간을 줄이고 싶기 때문이다
```

**수용 기준:**
- 최대 5개의 질문으로 갭을 채운다
- Intake Summary를 구조화된 표로 출력한다
- 워크스트림(Architect/Backend/Frontend/Infra/QA)을 분해해서 실행 계획을 낸다
- `ARCHITECTURE.md`를 코드보다 먼저 작성한다

---

**US-02: Azure 배포 설계**
```
나는 개발자로서
Azure Container Apps 배포 설정을 작성할 때
/azure-best-practices가 활성화되어 있길 원한다
왜냐하면 Managed Identity, 이미지 태그, 헬스프로브 같은 실수를 사전에 막고 싶기 때문이다
```

**수용 기준:**
- CRITICAL 룰 위반 시 즉시 경고
- 잘못된 패턴(before) → 올바른 패턴(after) 코드 예시 제공
- 배포 전 체크리스트 출력

---

**US-03: M365 자동화**
```
나는 개발자로서
Teams 알림이나 SharePoint 트리거 워크플로를 만들 때
/m365-workflows 스킬이 MCP 서버 컨벤션과 Adaptive Card 구조를 알고 있길 원한다
왜냐하면 compound site ID 포맷 실수나 잘못된 필드명으로 시간을 낭비하기 싫기 때문이다
```

**수용 기준:**
- SharePoint compound site ID 포맷 자동 적용
- Teams channel ID를 환경변수로 관리하도록 안내
- Adaptive Card 28KB 제한 경고
- Korea Standard Time timezone 자동 설정

---

**US-04: 사후 학습**
```
나는 개발자로서
프로젝트가 끝났을 때
에이전트가 RETROSPECTIVE.md를 작성하고 스킬 개선을 제안하길 원한다
왜냐하면 다음 프로젝트에서 같은 실수를 반복하지 않고 싶기 때문이다
```

**수용 기준:**
- `RETROSPECTIVE.md` 자동 생성
- "Proposed skill updates" 섹션 포함
- `SKILL-PATCH.md` 초안 작성 (사람이 검토 후 커밋)

---

**US-05: 설치**
```
나는 새 프로젝트를 시작하는 개발자로서
npx add-skill parandurume-labs/duru-conductor 한 줄로 스킬을 설치하고
즉시 /duru-conductor를 쓸 수 있길 원한다
```

**수용 기준:**
- `npx add-skill` 명령으로 설치 가능
- 설치 후 Claude Code에서 `/duru-conductor` 자동완성
- README에 설치 방법 명확히 기재

---

**US-06: 기여**
```
나는 오픈소스 기여자로서
새 스킬(예: iot-patterns)을 추가하고 PR을 냈을 때
자동으로 AGENTS.md가 재생성되길 원한다
```

**수용 기준:**
- `skills/새스킬/SKILL.md` 추가 후 `npm run build` 실행 시 자동 포함
- GitHub Actions가 PR merge 시 AGENTS.md 재생성 & 커밋
- validate.js가 frontmatter 오류를 PR에서 잡아냄

---

### 4-2. 보조 사용자 (Secondary User)

**페르소나: GM-Social License 수혜자 (타 도시/국가 개발자)**

**US-07: 라이선스 준수**
```
나는 이 스킬을 운영 환경에 배포한 개발자로서
GM-Social License 조건을 쉽게 이해하고 이행하고 싶다
```

**수용 기준:**
- README에 라이선스 조건(광명시 소개 의무)을 간결하게 안내
- `GRATITUDE.md` 파일에 기록 방법 명시
- CONTRIBUTING.md에 기여 시 라이선스 동의 안내

---

## 5. 기술 설계

### 5-1. 레포 구조 (최종 목표)

```
duru-skills/
├── skills/
│   ├── duru-skills/
│   │   ├── SKILL.md                # /duru-conductor 슬래시 커맨드의 본체
│   │   └── references/
│   │       └── AGENT-TEAMS.md      # 에이전트 페르소나 6종 정의
│   ├── azure-best-practices/
│   │   └── SKILL.md
│   └── m365-workflows/
│       └── SKILL.md
├── packages/
│   └── build/
│       ├── build.js                # 빌드 스크립트
│       └── validate.js             # 검증 스크립트
├── .github/
│   └── workflows/
│       └── build.yml               # CI: 스킬 변경 시 자동 빌드
├── AGENTS.md                       # 빌드 결과물 (모든 스킬 합본)
├── CLAUDE.md                       # Claude Code 전용 인덱스
├── GRATITUDE.md                    # GM-Social 라이선스 감사 기록
├── LICENSE                         # GM-Social License v2.0
├── README.md
├── CONTRIBUTING.md
├── .gitignore
└── package.json
```

---

### 5-2. SKILL.md 스펙 (agentskills.io 표준)

모든 SKILL.md는 반드시 이 구조를 따른다:

```yaml
---
name: 스킬이름           # 폴더명과 정확히 일치, lowercase + hyphen only
description: >-          # AI가 언제 이 스킬을 쓸지 판단하는 핵심 텍스트
  ...트리거 키워드 풍부하게...
license: SEE LICENSE IN ../../LICENSE
allowed-tools: Bash Read Write Edit Glob Grep
metadata:
  author: parandurume-labs
  version: "1.0.0"
  license: GM-Social-v2.0
---

# 스킬 제목

스킬 본문 (Markdown, 5000 토큰 이하 권장)
```

**규칙:**
- `name` 필드 = 폴더 이름 (반드시 일치)
- `description`은 에이전트가 이 스킬을 쓸지 판단하는 유일한 근거 → 트리거 키워드 최대한 포함
- 본문은 Impact 순으로 룰 정렬 (CRITICAL → HIGH → MEDIUM → LOW)
- 각 룰에 ❌ 잘못된 예시 + ✅ 올바른 예시 포함

---

### 5-3. duru-skills 스킬 동작 흐름

```
사용자: /duru-conductor [요청]
         │
         ▼
┌─────────────────────┐
│  Phase 1: Intake    │  요청 파싱 → 최대 5개 질문 → Intake Summary
└────────┬────────────┘
         │ (사용자 확인)
         ▼
┌─────────────────────┐
│  Phase 2: Planning  │  워크스트림 분해 → 의존성 맵 → Execution Plan
└────────┬────────────┘
         │ (사용자 확인)
         ▼
┌─────────────────────┐
│  Phase 3: Execute   │  ARCHITECTURE.md → 병렬 빌드 → 통합 → QA
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Phase 4: Retro     │  RETROSPECTIVE.md → 스킬 업데이트 제안
└─────────────────────┘
```

---

### 5-4. 빌드 스크립트 동작

`build.js`:
1. `skills/*/SKILL.md` 전체 탐색
2. YAML frontmatter 파싱 (외부 라이브러리 없이 직접 파싱)
3. `AGENTS.md` 생성 — 모든 스킬 전체 내용 합본
4. `CLAUDE.md` 생성 — name + description 요약만

`validate.js`:
1. SKILL.md 존재 여부
2. frontmatter 형식 확인
3. `name` 필드가 폴더명과 일치하는지 확인
4. 실패 시 `exit code 1`

---

### 5-5. 의존성 정책

> **원칙: 외부 npm 패키지 0개**

`build.js`와 `validate.js`는 Node.js 내장 모듈(`fs`, `path`)만 사용한다.
SKILL.md 파일들은 순수 Markdown + YAML이다.
이 레포를 클론하면 `npm install` 없이 즉시 `node packages/build/build.js`가 동작해야 한다.

---

## 6. 파일별 작성 기준

### `skills/duru-duru-skills/SKILL.md`
- 4단계(Intake → Planning → Execute → Retrospective) 구조를 명확히 서술
- Phase 1: 7개 차원(Goal, Stack, Infra, Auth, Integrations, Constraints, Quality)으로 갭 분석
- Phase 2: 워크스트림 6종과 의존성 맵
- Phase 3: 코드 품질 게이트 체크리스트 포함
- Phase 4: RETROSPECTIVE.md 템플릿 제공
- Failure Modes 섹션(피해야 할 안티패턴) 포함
- Self-Improvement Protocol 섹션 (사람 승인 필요 명시)

### `skills/duru-duru-skills/references/AGENT-TEAMS.md`
- 6개 에이전트 페르소나: Architect, Backend, Frontend, Infra, Integration, QA
- 각 페르소나: 활성화 조건 / 책임 / 코딩 표준 / 산출 파일
- 프로젝트 타입별 추천 팀 구성 표
- 워크스트림 병렬 실행 의존성 다이어그램 (텍스트)

### `skills/azure-best-practices/SKILL.md`
- 6개 카테고리, 30+ 룰
- 반드시 포함: Managed Identity, 이미지 태그 고정, Foundry max_tokens, workload identity federation
- 각 룰: Impact 등급 + ❌ before + ✅ after 코드 예시
- 마지막에 배포 전 체크리스트

### `skills/m365-workflows/SKILL.md`
- 5개 카테고리
- 반드시 포함: compound site ID, 내부 필드명 표, Korea Standard Time, Adaptive Card 구조
- MCP 서버 URL: `ms365-mcp.delightfulbeach-79de09ed.koreacentral.azurecontainerapps.io/mcp`
- 환경변수 컨벤션 섹션

### `packages/build/build.js`
- CommonJS (`require`)
- 외부 의존성 없음
- YAML frontmatter는 정규식으로 직접 파싱
- 빌드 완료 시 스킬 목록과 개수 콘솔 출력

### `packages/build/validate.js`
- 실패 조건마다 명확한 오류 메시지 (`❌ skills/xxx/SKILL.md — reason`)
- 성공 시 `✅ All skills valid.`
- 실패 시 `process.exit(1)`

### `.github/workflows/build.yml`
- 트리거: `skills/**` 또는 `packages/build/**` 변경
- jobs: validate → build → commit (push 이벤트만)
- `[skip ci]` 태그로 재귀 방지

### `LICENSE`
- GM-Social License v2.0 원문 그대로 사용
- 상단 저작권 라인: `이인희 (LEE Inhee), 파란두루미 주식회사 (Parandurume Inc.)`
- 프로젝트명: `duru-skills — AI Project Orchestration Agent Skill`

### `GRATITUDE.md`
- GM-Social License 제3.2조 안내
- 감사 로그 테이블 (날짜, 기관, 게시물, 플랫폼)
- 파란두루미 주식회사 첫 번째 행으로 기재

### `README.md`
- 배지: GM-Social License, Agent Skills compatible
- 설치 명령: `npx add-skill parandurume-labs/duru-skills`
- 스킬 목록 표
- 빠른 사용 예시 (한국어 포함)
- GM-Social 라이선스 조건 간략히 (광명시 안내)

---

## 7. 완료 기준 (Definition of Done)

프로젝트가 완성됐다고 볼 수 있는 기준:

```
□ node packages/build/validate.js → 에러 없이 통과
□ npm run build → AGENTS.md, CLAUDE.md 생성
□ AGENTS.md에 3개 스킬 내용이 모두 포함
□ CLAUDE.md에 3개 스킬의 name + description 요약
□ skills/duru-duru-skills/SKILL.md — name: duru-skills (폴더명 일치)
□ skills/azure-best-practices/SKILL.md — name: azure-best-practices
□ skills/m365-workflows/SKILL.md — name: m365-workflows
□ LICENSE 파일 존재 (GM-Social v2.0)
□ GRATITUDE.md 존재
□ README.md — 설치 명령어 포함
□ .github/workflows/build.yml 존재
□ .gitignore — node_modules 제외
□ package.json — scripts.build, scripts.validate 존재
□ 외부 npm 패키지 의존성 0개
```

---

## 8. AI에게 당부하는 것

1. **코드보다 설계 먼저** — SKILL.md 내용의 품질이 이 프로젝트의 핵심이다. 빌드 스크립트는 부수적이다.

2. **description 필드를 진지하게 작성** — 에이전트는 이 한 필드만 보고 스킬을 활성화할지 결정한다. 트리거 키워드가 풍부할수록 실제로 잘 동작한다.

3. **룰마다 실제 예시** — "하지 마세요"만 있는 룰은 쓸모없다. 반드시 ❌ before + ✅ after 코드가 있어야 한다.

4. **외부 패키지 금지** — `build.js`와 `validate.js`는 `fs`와 `path`만 사용한다. `yaml`, `front-matter` 같은 패키지를 설치하려 하지 말 것.

5. **폴더명 = name 필드** — SKILL.md의 `name:`은 반드시 해당 폴더 이름과 정확히 같아야 한다. 이것이 틀리면 슬래시 커맨드가 동작하지 않는다.

6. **한국어와 영어 혼용** — README, GRATITUDE, CONTRIBUTING은 한영 혼용 가능. SKILL.md 본문은 영어로 작성 (에이전트 호환성).

7. **진행 중 막히면 물어볼 것** — 특히 GM-Social License 조건을 LICENSE 파일에 어떻게 반영할지, SKILL.md 룰 내용이 실제 프로덕션에 맞는지 확신이 없으면 작업을 멈추고 확인할 것.
