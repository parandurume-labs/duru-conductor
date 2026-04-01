---
name: m365-copilot-extensions
description: >-
  Microsoft 365 Copilot extension development patterns. Use when building
  declarative agents, API plugins, Graph connectors, Teams message extensions
  as Copilot plugins, or Adaptive Card responses for Copilot. Covers manifest
  authoring, authentication flows, content ingestion, and plugin development.
  Activate whenever Microsoft Copilot extensions, declarative agents,
  Copilot plugins, or Graph connectors are mentioned.
license: SEE LICENSE IN ../../LICENSE
metadata:
  author: parandurume-labs
  version: "1.0.0"
  license: GM-Social-v2.0
---

# Microsoft 365 Copilot Extension Patterns

This skill provides rules for building reliable Microsoft 365 Copilot extensions. Rules are ordered by impact: CRITICAL rules prevent broken extensions or security issues; HIGH rules prevent common development mistakes; MEDIUM rules improve user experience and maintainability.

---

## Learned Patterns (Auto-Updated)

Before applying the rules below, check if `LESSONS.md` exists in the project root. If it does, read the section tagged with `m365-copilot-extensions` and apply those project-specific lessons alongside the rules below.

---

## Category 1: Declarative Agents (CRITICAL)

### Rule 1: Declarative Agent Manifest Structure

**Impact:** CRITICAL — Malformed manifests cause silent deployment failures in Teams Admin Center.

❌ **Wrong:**
```json
{
  "name": "My Agent",
  "description": "An agent that helps with tasks"
}
```

✅ **Correct:**
```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/copilot/declarative-agent/v1.3/schema.json",
  "version": "v1.3",
  "id": "myCompanyAgent",
  "name": "Contoso Assistant",
  "description": "Helps employees find company policies, submit requests, and check project status.",
  "instructions": "You are Contoso Assistant. Answer questions about company policies using the connected SharePoint knowledge base. Always cite the source document. If unsure, say so — never fabricate policy information. Use professional Korean (합니다체) when the user writes in Korean.",
  "conversation_starters": [
    { "text": "What is our vacation policy?" },
    { "text": "How do I submit an expense report?" },
    { "text": "휴가 정책을 알려주세요." }
  ],
  "capabilities": [
    {
      "name": "GraphConnectors",
      "connections": [
        { "connection_id": "contosoPolicies" }
      ]
    },
    {
      "name": "OneDriveAndSharePoint",
      "items_by_url": [
        { "url": "https://contoso.sharepoint.com/sites/policies" }
      ]
    }
  ],
  "actions": [
    { "id": "submitExpenseReport", "file": "expense-plugin.json" }
  ]
}
```

**Why:** The `$schema` enables validation. `instructions` is the system prompt — be specific about behavior, tone, and boundaries. `conversation_starters` help users discover capabilities. `capabilities` connect to data sources; `actions` connect to API plugins.

### Rule 2: Grounding Instructions — Prevent Hallucination

**Impact:** CRITICAL — Copilot agents without proper grounding instructions fabricate information from training data instead of using connected data.

❌ **Wrong:**
```json
{
  "instructions": "Help users with company information."
}
```

✅ **Correct:**
```json
{
  "instructions": "You are the Contoso HR Assistant. Follow these rules strictly:\n\n1. ONLY answer questions using information from the connected SharePoint site and Graph connector. Never use your training data for company-specific questions.\n2. Always cite the source document name and section.\n3. If the connected data does not contain the answer, say: '해당 정보를 찾을 수 없습니다. HR팀(hr@contoso.com)에 문의해 주세요.' / 'I could not find this information. Please contact HR at hr@contoso.com.'\n4. Never fabricate policies, dates, or procedures.\n5. For sensitive topics (compensation, disciplinary), direct the user to HR rather than answering."
}
```

**Why:** Without explicit grounding instructions, Copilot will blend connected data with training data, producing plausible but incorrect answers about company policies. This is the #1 cause of enterprise Copilot agent failure.

---

## Category 2: API Plugins (HIGH)

### Rule 3: OpenAPI Spec for Copilot API Plugins

**Impact:** HIGH — Copilot requires specific OpenAPI conventions that differ from standard API documentation.

❌ **Wrong:**
```yaml
# Standard OpenAPI — missing Copilot-required fields
openapi: 3.0.0
info:
  title: Expense API
  version: 1.0.0
paths:
  /expenses:
    post:
      summary: Create expense
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Expense'
```

✅ **Correct:**
```yaml
openapi: 3.0.0
info:
  title: Expense Report API
  version: 1.0.0
  description: API for submitting and managing expense reports. Copilot uses this API to help employees submit expenses.
paths:
  /expenses:
    post:
      operationId: createExpenseReport
      summary: Submit a new expense report for reimbursement
      description: >-
        Creates a new expense report. The employee provides the amount,
        category, date, and optional receipt. Returns the created report
        with approval status.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [amount, category, date]
              properties:
                amount:
                  type: number
                  description: Expense amount in the employee's local currency
                category:
                  type: string
                  enum: [travel, meals, supplies, equipment, other]
                  description: Expense category for accounting classification
                date:
                  type: string
                  format: date
                  description: Date the expense was incurred (YYYY-MM-DD)
                description:
                  type: string
                  description: Brief description of the expense purpose
                  maxLength: 500
      responses:
        '201':
          description: Expense report created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ExpenseReport'
        '400':
          description: Invalid input — missing required fields or invalid values
```

**Why:** Copilot uses `operationId` to match user intent to API operations. Rich `description` fields help Copilot understand when and how to call each endpoint. `enum` values guide Copilot's parameter selection. Every property needs a `description`.

### Rule 4: Plugin Authentication — Use OAuth 2.0, Not API Keys

**Impact:** HIGH — API keys in plugin manifests are visible to tenant admins and potentially logged.

❌ **Wrong:**
```json
{
  "auth": {
    "type": "apiKeyHeader",
    "reference_id": "expense-api-key"
  }
}
```

✅ **Correct:**
```json
{
  "runtimes": [
    {
      "type": "OpenApi",
      "auth": {
        "type": "OAuthPluginVault",
        "reference_id": "{expense-api-oauth}"
      },
      "spec": { "url": "expense-openapi.yaml" },
      "run_for_functions": ["createExpenseReport", "getExpenseStatus"]
    }
  ]
}
```

**Why:** OAuth 2.0 with Entra ID provides SSO, token refresh, and proper scoping. API keys cannot be scoped per-user and lack audit trails. Configure the OAuth registration in Teams Developer Portal under "API Credentials."

### Rule 5: Adaptive Card Response Formatting

**Impact:** HIGH — Copilot renders API plugin responses as Adaptive Cards. Poorly structured responses display as raw text.

❌ **Wrong:**
```json
{
  "status": "approved",
  "amount": 50000,
  "date": "2026-03-31"
}
```

✅ **Correct:**
```json
{
  "type": "AdaptiveCard",
  "$schema": "https://adaptivecards.io/schemas/adaptive-card.json",
  "version": "1.5",
  "body": [
    {
      "type": "TextBlock",
      "text": "경비 보고서 승인 완료",
      "weight": "bolder",
      "size": "medium"
    },
    {
      "type": "FactSet",
      "facts": [
        { "title": "금액", "value": "₩50,000" },
        { "title": "상태", "value": "승인 완료 ✅" },
        { "title": "날짜", "value": "2026년 3월 31일" }
      ]
    }
  ],
  "actions": [
    {
      "type": "Action.OpenUrl",
      "title": "상세 보기",
      "url": "https://expenses.contoso.com/reports/123"
    }
  ]
}
```

**Why:** Adaptive Cards provide rich, interactive formatting. Use `FactSet` for key-value data, `TextBlock` for headers, and `Action.OpenUrl` for links. Keep cards under 28KB — Copilot truncates larger cards.

---

## Category 3: Graph Connectors (HIGH)

### Rule 6: Graph Connector Content Ingestion

**Impact:** HIGH — Improperly ingested content reduces Copilot's ability to find and cite external data.

❌ **Wrong:**
```csharp
// Ingesting without proper metadata
var item = new ExternalItem {
    Id = "doc-1",
    Properties = new ExternalItemContent {
        Content = documentText,
        ContentType = ExternalItemContentType.Text
    }
};
await graphClient.External.Connections["myConn"].Items["doc-1"].PutAsync(item);
```

✅ **Correct:**
```csharp
var item = new ExternalItem {
    Id = "policy-vacation-2026",
    Properties = new Properties {
        AdditionalData = new Dictionary<string, object> {
            { "title", "Vacation Policy 2026 (휴가 정책)" },
            { "description", "Company vacation policy including PTO accrual, approval process, and blackout dates." },
            { "url", "https://wiki.contoso.com/policies/vacation-2026" },
            { "lastModifiedDateTime", DateTimeOffset.UtcNow },
            { "department", "HR" },
            { "policyType", "Employee Benefits" },
            { "language", "ko-KR" },
            { "effectiveDate", "2026-01-01" }
        }
    },
    Content = new ExternalItemContent {
        Type = ExternalItemContentType.Html,
        Value = documentHtml  // Prefer HTML over plain text for formatting
    },
    Acl = new List<Acl> {
        new Acl {
            Type = AclType.Everyone,
            Value = "everyone",
            AccessType = AccessType.Grant
        }
    }
};
```

**Why:** Rich metadata (`title`, `description`, `department`, `language`) improves search relevance. HTML content preserves formatting. ACLs control who can see the data through Copilot — always set them explicitly.

### Rule 7: Graph Connector Schema Definition

**Impact:** HIGH — Schema defines what properties are searchable, queryable, and refinable in Copilot.

✅ **Correct:**
```csharp
var schema = new Schema {
    BaseType = "microsoft.graph.externalItem",
    Properties = new List<Property> {
        new Property {
            Name = "title",
            Type = PropertyType.String,
            IsSearchable = true,
            IsRetrievable = true,
            IsQueryable = true,
            Labels = new List<Label> { Label.Title }
        },
        new Property {
            Name = "description",
            Type = PropertyType.String,
            IsSearchable = true,
            IsRetrievable = true
        },
        new Property {
            Name = "department",
            Type = PropertyType.String,
            IsQueryable = true,
            IsRetrievable = true,
            IsRefinable = true  // Enables filtering by department
        },
        new Property {
            Name = "url",
            Type = PropertyType.String,
            IsRetrievable = true,
            Labels = new List<Label> { Label.Url }
        },
        new Property {
            Name = "lastModifiedDateTime",
            Type = PropertyType.DateTime,
            IsQueryable = true,
            IsRetrievable = true,
            IsRefinable = true,
            Labels = new List<Label> { Label.LastModifiedDateTime }
        }
    }
};
```

**Why:** `IsSearchable` = full-text search. `IsQueryable` = KQL filter. `IsRefinable` = faceted navigation. `Labels` map to semantic roles Copilot understands. Always set `Labels` for `Title`, `Url`, and `LastModifiedDateTime`.

---

## Category 4: Teams Message Extensions as Copilot Plugins (MEDIUM)

### Rule 8: Search-Based Message Extension for Copilot

**Impact:** MEDIUM — Existing Teams message extensions can be exposed as Copilot plugins with minimal changes.

❌ **Wrong:**
```json
{
  "composeExtensions": [{
    "botId": "bot-id",
    "commands": [{
      "id": "search",
      "type": "query",
      "title": "Search",
      "parameters": [{ "name": "query", "title": "Query" }]
    }]
  }]
}
```

✅ **Correct:**
```json
{
  "composeExtensions": [{
    "botId": "${BOT_ID}",
    "canUpdateConfiguration": false,
    "commands": [{
      "id": "searchExpenses",
      "type": "query",
      "title": "Search Expenses",
      "description": "Search expense reports by employee name, date, or amount",
      "semanticDescription": "Use this command to find expense reports. Users might ask: 'show my expenses from last month', 'find expenses over 100,000 won', or '지난달 경비 보고서 찾아줘'",
      "parameters": [
        {
          "name": "query",
          "title": "Search query",
          "description": "Employee name, expense category, or date range",
          "semanticDescription": "The search term — can be an employee name (e.g., '김철수'), expense category (e.g., 'travel'), date (e.g., 'March 2026'), or amount range",
          "inputType": "text"
        }
      ]
    }]
  }]
}
```

**Why:** `semanticDescription` is the key field that enables Copilot to understand when to invoke your message extension. Write it as natural language examples of what users might say. Include Korean examples for Korean users.

---

## Category 5: Testing and Debugging (MEDIUM)

### Rule 9: Test Declarative Agents in Teams Developer Portal

**Impact:** MEDIUM — Testing agents locally is impossible — they must be sideloaded into Teams.

✅ **Correct workflow:**
```bash
# 1. Package the agent
# Create a Teams app package (ZIP) with:
# - manifest.json (Teams app manifest)
# - declarativeAgent.json (agent definition)
# - openapi specs (if using API plugins)
# - color.png and outline.png (app icons)

# 2. Sideload to Teams
# Teams Admin Center → Manage apps → Upload custom app
# OR use Teams Toolkit CLI (teamsapp):
npx teamsapp package --manifest-path ./appPackage
npx teamsapp publish --manifest-path ./appPackage

# 3. Test in Copilot chat
# Open Microsoft 365 Copilot → @ mention your agent
# Test each conversation starter
# Verify grounding (answers come from connected data, not training data)
# Test Korean and English inputs
```

**Why:** Declarative agents run entirely in the Copilot runtime — there's no local dev server. Use Teams Toolkit for rapid sideloading during development. Always test with both Korean and English inputs.

### Rule 10: Debug API Plugin Calls

**Impact:** MEDIUM — API plugin failures are silent in Copilot — the agent just says "I couldn't find that information."

✅ **Correct:**
```python
# Add structured logging to your API endpoint
import logging
import json

logger = logging.getLogger("copilot-plugin")

@app.post("/expenses")
async def create_expense(request: Request):
    body = await request.json()

    # Log the incoming Copilot request
    logger.info(json.dumps({
        "event": "copilot_plugin_call",
        "operation": "createExpenseReport",
        "parameters": {k: v for k, v in body.items() if k != "receipt"},
        "user_agent": request.headers.get("User-Agent"),
        "correlation_id": request.headers.get("x-ms-correlation-id")
    }))

    try:
        result = await process_expense(body)
        logger.info(json.dumps({
            "event": "copilot_plugin_success",
            "operation": "createExpenseReport",
            "expense_id": result["id"]
        }))
        return result
    except ValidationError as e:
        logger.error(json.dumps({
            "event": "copilot_plugin_error",
            "operation": "createExpenseReport",
            "error": str(e)
        }))
        raise HTTPException(status_code=400, detail=str(e))
```

**Why:** Copilot does not surface API errors to the user. Use `x-ms-correlation-id` to trace requests from Copilot through your API. Monitor logs in Application Insights to identify why Copilot can't complete user requests.

---

## Pre-Deployment Checklist (Copilot Extensions)

**Declarative Agent:**
- [ ] Manifest validates against schema (v1.3+)
- [ ] Grounding instructions explicitly prohibit fabrication
- [ ] Conversation starters cover main use cases (Korean + English)
- [ ] Connected data sources (SharePoint, Graph connectors) verified

**API Plugins:**
- [ ] OpenAPI spec has `operationId`, `description` on every operation and property
- [ ] OAuth 2.0 authentication configured (not API keys)
- [ ] Adaptive Card responses under 28KB
- [ ] Error responses return structured JSON (not HTML error pages)

**Graph Connectors:**
- [ ] Schema properties have correct `IsSearchable`/`IsQueryable`/`IsRefinable` flags
- [ ] `Labels` set for Title, Url, LastModifiedDateTime
- [ ] ACLs configured for proper access control
- [ ] Content uses HTML format for rich display

**Testing:**
- [ ] Tested with Korean and English inputs
- [ ] Verified grounding — answers cite connected data
- [ ] API plugin calls logged with correlation IDs
- [ ] Tested edge cases: no results, auth failure, rate limit
