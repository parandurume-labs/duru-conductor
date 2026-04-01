---
name: m365-workflows
description: >-
  Microsoft 365 integration patterns for Teams, SharePoint, and Outlook
  automation. Use when building Teams bots, sending Teams channel notifications,
  creating SharePoint document workflows, handling Adaptive Cards, automating
  Outlook email, or working with Microsoft Graph API. Covers MCP server
  conventions, compound site IDs, channel ID management, Adaptive Card size
  limits, and Korea Standard Time handling. Activate whenever Microsoft 365,
  Teams, SharePoint, Outlook, or Graph API is mentioned.
license: SEE LICENSE IN ../../LICENSE
metadata:
  author: parandurume-labs
  version: "1.0.0"
  license: GM-Social-v2.0
---

# Microsoft 365 Workflow Patterns

This skill provides rules for building reliable Microsoft 365 integrations with Teams, SharePoint, and Outlook. Rules are ordered by impact.

---

## Learned Patterns (Auto-Updated)

Before applying the rules below, check if `LESSONS.md` exists in the project root. If it does, read the section tagged with `m365-workflows` and apply those project-specific lessons alongside the rules below.

---

## MCP Server Configuration

When using the M365 MCP server, configure the endpoint:

```
Server URL: ms365-mcp.delightfulbeach-79de09ed.koreacentral.azurecontainerapps.io/mcp
```

---

## Category 1: SharePoint Integration (CRITICAL)

### Rule 1: Use Compound Site ID Format

**Impact:** CRITICAL — Simple site IDs fail in Graph API calls. The compound format is required.

❌ **Wrong:**
```javascript
// Using site ID alone — this will fail
const siteId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const response = await graphClient
  .api(`/sites/${siteId}/lists`)
  .get();
```

✅ **Correct:**
```javascript
// Compound site ID: hostname:/path:/siteId
const siteId = "contoso.sharepoint.com:/sites/project-alpha:/a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const response = await graphClient
  .api(`/sites/${siteId}/lists`)
  .get();
```

**Format:** `{hostname}:/{server-relative-path}:/{site-id}`

### Rule 2: SharePoint Internal Field Names

**Impact:** CRITICAL — Display names and internal names are different. Using display names causes silent failures.

| Display Name | Internal Name | Type |
|---|---|---|
| Title | Title | Text |
| Created | Created | DateTime |
| Created By | Author | Person |
| Modified | Modified | DateTime |
| Modified By | Editor | Person |
| File Name | FileLeafRef | Text |
| File Size | FileSizeDisplay | Text |
| Content Type | ContentTypeId | ContentType |
| ID | ID | Counter |
| Checked Out To | CheckoutUser | Person |

❌ **Wrong:**
```javascript
await graphClient
  .api(`/sites/${siteId}/lists/${listId}/items`)
  .select("Created By, Modified By, File Name")
  .get();
```

✅ **Correct:**
```javascript
await graphClient
  .api(`/sites/${siteId}/lists/${listId}/items`)
  .expand("fields($select=Author,Editor,FileLeafRef)")
  .get();
```

### Rule 3: Handle Large Document Libraries with Pagination

**Impact:** HIGH — SharePoint returns max 200 items per page by default. Missing pagination means missing data.

❌ **Wrong:**
```javascript
// Only gets first page (up to 200 items)
const items = await graphClient
  .api(`/sites/${siteId}/lists/${listId}/items`)
  .get();
```

✅ **Correct:**
```javascript
let allItems = [];
let response = await graphClient
  .api(`/sites/${siteId}/lists/${listId}/items`)
  .top(200)
  .get();

allItems.push(...response.value);

while (response["@odata.nextLink"]) {
  response = await graphClient
    .api(response["@odata.nextLink"])
    .get();
  allItems.push(...response.value);
}
```

---

## Category 2: Teams Channels & Messages (CRITICAL)

### Rule 4: Channel IDs in Environment Variables

**Impact:** CRITICAL — Hardcoded channel IDs break when channels are recreated or when moving between environments.

❌ **Wrong:**
```javascript
const channelId = "19:abc123def456@thread.tacv2";  // Hardcoded
await graphClient
  .api(`/teams/${teamId}/channels/${channelId}/messages`)
  .post(message);
```

✅ **Correct:**
```javascript
const channelId = process.env.TEAMS_CHANNEL_ID;
if (!channelId) throw new Error("TEAMS_CHANNEL_ID environment variable is required");

await graphClient
  .api(`/teams/${teamId}/channels/${channelId}/messages`)
  .post(message);
```

### Rule 5: Teams Message Size Limit

**Impact:** HIGH — Messages over 28KB are silently truncated or rejected.

❌ **Wrong:**
```javascript
// Dumping entire report as a Teams message
const message = { body: { content: entireReport } };  // Could be 100KB+
```

✅ **Correct:**
```javascript
// Summary in message, full report as file attachment or link
const message = {
  body: {
    contentType: "html",
    content: `<p><strong>Report Summary</strong></p>
              <p>${summary}</p>
              <p><a href="${reportUrl}">View full report</a></p>`
  }
};
```

### Rule 6: Use HTML Content Type for Rich Messages

**Impact:** MEDIUM — Plain text messages cannot include formatting, links, or mentions.

❌ **Wrong:**
```javascript
const message = {
  body: {
    contentType: "text",
    content: "Build #42 passed. See results at https://..."
  }
};
```

✅ **Correct:**
```javascript
const message = {
  body: {
    contentType: "html",
    content: `<p>Build <strong>#42</strong> passed ✅</p>
              <p><a href="https://...">View results</a></p>`
  }
};
```

---

## Category 3: Adaptive Cards (HIGH)

### Rule 7: Adaptive Card 28KB Size Limit

**Impact:** HIGH — Cards exceeding 28KB fail to render with no useful error message.

❌ **Wrong:**
```json
{
  "type": "AdaptiveCard",
  "body": [
    {
      "type": "TextBlock",
      "text": "... (embedding 50KB of data in the card)"
    }
  ]
}
```

✅ **Correct:**
```json
{
  "type": "AdaptiveCard",
  "version": "1.5",
  "body": [
    {
      "type": "TextBlock",
      "text": "Report Summary",
      "weight": "Bolder",
      "size": "Medium"
    },
    {
      "type": "TextBlock",
      "text": "Top 5 items shown. Click below for full details.",
      "wrap": true
    }
  ],
  "actions": [
    {
      "type": "Action.OpenUrl",
      "title": "View Full Report",
      "url": "https://..."
    }
  ]
}
```

**Best practice:** Keep card payload under 20KB; use links for detailed data.

### Rule 8: Always Set Card Version

**Impact:** MEDIUM — Missing version defaults to 1.0, which lacks many features.

❌ **Wrong:**
```json
{
  "type": "AdaptiveCard",
  "body": [...]
}
```

✅ **Correct:**
```json
{
  "type": "AdaptiveCard",
  "version": "1.5",
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "body": [...]
}
```

### Rule 9: Wrap Long Text in Cards

**Impact:** MEDIUM — Text without `wrap: true` is clipped on mobile devices.

❌ **Wrong:**
```json
{ "type": "TextBlock", "text": "This is a very long description that..." }
```

✅ **Correct:**
```json
{ "type": "TextBlock", "text": "This is a very long description that...", "wrap": true }
```

---

## Category 4: Time & Locale (HIGH)

### Rule 10: Default to Korea Standard Time

**Impact:** HIGH — Scheduled events, notifications, and timestamps are wrong if timezone is not set explicitly.

❌ **Wrong:**
```javascript
// No timezone specified — defaults to UTC
const event = {
  start: { dateTime: "2025-03-15T09:00:00" },
  end: { dateTime: "2025-03-15T10:00:00" }
};
```

✅ **Correct:**
```javascript
const event = {
  start: { dateTime: "2025-03-15T09:00:00", timeZone: "Korea Standard Time" },
  end: { dateTime: "2025-03-15T10:00:00", timeZone: "Korea Standard Time" }
};
```

**Note:** Microsoft Graph uses Windows timezone IDs (`Korea Standard Time`), not IANA (`Asia/Seoul`).

### Rule 11: Date Format for Korean Locale

**Impact:** MEDIUM — Korean users expect `YYYY년 MM월 DD일` format.

❌ **Wrong:**
```javascript
const dateStr = date.toLocaleDateString("en-US"); // "3/15/2025"
```

✅ **Correct:**
```javascript
const dateStr = date.toLocaleDateString("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric"
}); // "2025년 3월 15일"
```

---

## Category 5: Environment Variable Conventions

All M365-related environment variables should follow this naming convention:

| Variable | Purpose | Example |
|---|---|---|
| `M365_TENANT_ID` | Azure AD tenant ID | `a1b2c3d4-...` |
| `M365_CLIENT_ID` | App registration client ID | `e5f6a7b8-...` |
| `TEAMS_TEAM_ID` | Target team ID | `19:abc...@thread.tacv2` |
| `TEAMS_CHANNEL_ID` | Target channel ID | `19:def...@thread.tacv2` |
| `TEAMS_WEBHOOK_URL` | Incoming webhook URL | `https://...webhook.office.com/...` |
| `SHAREPOINT_SITE_ID` | Compound site ID | `contoso.sharepoint.com:/sites/...` |
| `SHAREPOINT_LIST_ID` | Target list/library ID | `a1b2c3d4-...` |
| `GRAPH_API_SCOPE` | Graph API permission scope | `https://graph.microsoft.com/.default` |

**Rules:**
- Never hardcode any of these values
- Use `.env` files for local development (add `.env` to `.gitignore`)
- Use Azure Key Vault or platform secrets for production
- Validate all required variables at startup — fail fast with clear error messages

---

## Category 6: Microsoft Graph Advanced (HIGH)

### Rule 12: Graph API Batch Requests

**Impact:** HIGH — Making individual Graph API calls in a loop causes throttling (HTTP 429) and poor performance.

❌ **Wrong:**
```javascript
// N+1 problem — one API call per user
const users = ["user1@contoso.com", "user2@contoso.com", "user3@contoso.com"];
for (const email of users) {
  const profile = await graphClient.api(`/users/${email}`).get();
  results.push(profile);
}
```

✅ **Correct:**
```javascript
// Batch up to 20 requests in a single call
const batchContent = {
  requests: users.map((email, i) => ({
    id: String(i + 1),
    method: "GET",
    url: `/users/${email}?$select=displayName,mail,department`
  }))
};

const batchResponse = await graphClient.api("/$batch").post(batchContent);

for (const response of batchResponse.responses) {
  if (response.status === 200) {
    results.push(response.body);
  } else if (response.status === 429) {
    // Individual request throttled — retry after delay
    const retryAfter = response.headers["Retry-After"] || 5;
    await delay(retryAfter * 1000);
    // Retry individual request
  }
}
```

**Why:** Graph API batch endpoint accepts up to 20 requests per batch. Each request in the batch can succeed or fail independently. Always handle per-request errors, especially 429 (throttling).

### Rule 13: Teams Tab SSO Authentication

**Impact:** HIGH — Prompting users to log in separately in a Teams tab creates friction and confusion.

❌ **Wrong:**
```javascript
// Redirecting to a login page inside Teams tab
window.location.href = "/login?redirect=/tab";
```

✅ **Correct:**
```javascript
import * as microsoftTeams from "@microsoft/teams-js";

async function getToken() {
  await microsoftTeams.app.initialize();

  try {
    // Silent SSO — no user interaction needed
    const token = await microsoftTeams.authentication.getAuthToken();

    // Exchange Teams token for your API token (server-side)
    const apiToken = await fetch("/api/auth/teams-exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamsToken: token })
    }).then(r => r.json());

    return apiToken.accessToken;
  } catch (error) {
    // Fallback: interactive consent popup
    if (error.message === "resourceRequiresConsent") {
      const token = await microsoftTeams.authentication.authenticate({
        url: `${window.location.origin}/auth-start`,
        width: 600,
        height: 535
      });
      return token;
    }
    throw error;
  }
}
```

```python
# Server-side: exchange Teams token using On-Behalf-Of flow
from msal import ConfidentialClientApplication

app = ConfidentialClientApplication(
    client_id=os.environ["M365_CLIENT_ID"],
    client_credential=os.environ["M365_CLIENT_SECRET"],
    authority=f"https://login.microsoftonline.com/{os.environ['M365_TENANT_ID']}"
)

result = app.acquire_token_on_behalf_of(
    user_assertion=teams_token,
    scopes=["User.Read", "Mail.Read"]
)
```

**Why:** Teams SSO provides a seamless experience — the user is already authenticated in Teams. Use the On-Behalf-Of (OBO) flow server-side to exchange the Teams token for Graph API permissions.

### Rule 14: SharePoint Framework (SPFx) Web Part Patterns

**Impact:** HIGH — Custom SPFx web parts with incorrect patterns cause rendering failures and memory leaks.

❌ **Wrong:**
```typescript
// Direct DOM manipulation in SPFx
export default class MyWebPart extends BaseClientSideWebPart<IMyProps> {
  public render(): void {
    this.domElement.innerHTML = `
      <div>${this.properties.title}</div>
      <div id="content"></div>
    `;
    // Direct fetch without error handling
    fetch("/api/data").then(r => r.json()).then(data => {
      document.getElementById("content")!.innerHTML = data.html;
    });
  }
}
```

✅ **Correct:**
```typescript
import * as React from "react";
import * as ReactDom from "react-dom";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import { SPHttpClient } from "@microsoft/sp-http";

export default class MyWebPart extends BaseClientSideWebPart<IMyProps> {
  public render(): void {
    const element = React.createElement(MyComponent, {
      title: this.properties.title,
      spHttpClient: this.context.spHttpClient,
      siteUrl: this.context.pageContext.web.absoluteUrl,
      displayMode: this.displayMode
    });
    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);  // Prevent memory leaks
  }
}
```

**Why:** Use React for SPFx rendering (not direct DOM manipulation). Always unmount components in `onDispose()`. Use `SPHttpClient` for authenticated SharePoint API calls — it handles token management automatically.

---

## Category 7: Outlook & Planner Integration (MEDIUM)

### Rule 15: Outlook Actionable Messages

**Impact:** MEDIUM — Sending plain notifications when actionable cards are available misses engagement opportunities.

❌ **Wrong:**
```python
# Plain text email notification
send_email(
    to="manager@contoso.com",
    subject="Expense Report Pending Approval",
    body="Employee Kim submitted an expense report for ₩150,000. Please approve in the system."
)
```

✅ **Correct:**
```python
# Actionable Message with Adaptive Card (MessageCard format is deprecated)
card_payload = {
    "type": "AdaptiveCard",
    "$schema": "https://adaptivecards.io/schemas/adaptive-card.json",
    "version": "1.5",
    "body": [
        {
            "type": "TextBlock",
            "text": "경비 보고서 승인 요청",
            "weight": "bolder",
            "size": "medium"
        },
        {
            "type": "FactSet",
            "facts": [
                {"title": "제출자", "value": "김철수"},
                {"title": "금액", "value": "₩150,000"},
                {"title": "카테고리", "value": "출장비"},
                {"title": "날짜", "value": "2026년 3월 31일"}
            ]
        }
    ],
    "actions": [
        {
            "type": "Action.Http",
            "title": "승인",
            "method": "POST",
            "url": "https://api.contoso.com/expenses/123/approve",
            "body": "{\"action\": \"approve\", \"expenseId\": \"123\"}",
            "headers": [{"name": "Content-Type", "value": "application/json"}]
        },
        {
            "type": "Action.Http",
            "title": "반려",
            "method": "POST",
            "url": "https://api.contoso.com/expenses/123/reject",
            "body": "{\"action\": \"reject\", \"expenseId\": \"123\"}"
        },
        {
            "type": "Action.OpenUrl",
            "title": "상세 보기",
            "url": "https://expenses.contoso.com/123"
        }
    ]
}

send_email(
    to="manager@contoso.com",
    subject="경비 보고서 승인 요청 - 김철수 (₩150,000)",
    body="<html><body>경비 보고서가 제출되었습니다.</body></html>",
    actionable_card=card_payload
)
```

**Why:** Actionable Messages let users approve, reject, or respond directly from Outlook without opening another app. Register your service at https://aka.ms/publishactionablecard for production use.

### Rule 16: OneDrive File Operations via Graph

**Impact:** MEDIUM — Using SharePoint API for simple file operations is unnecessarily complex.

❌ **Wrong:**
```javascript
// Using SharePoint REST API for file upload
await fetch(`${siteUrl}/_api/web/GetFolderByServerRelativeUrl('/Documents')/Files/add(url='report.pdf',overwrite=true)`, {
  method: "POST",
  headers: { "Authorization": `Bearer ${token}` },
  body: fileContent
});
```

✅ **Correct:**
```javascript
// Upload file to OneDrive/SharePoint via Graph API
// Small files (< 4MB) — simple upload
await graphClient
  .api(`/drives/${driveId}/items/root:/Reports/report.pdf:/content`)
  .put(fileContent);

// Large files (> 4MB) — resumable upload session
const session = await graphClient
  .api(`/drives/${driveId}/items/root:/Reports/large-report.pdf:/createUploadSession`)
  .post({
    item: {
      "@microsoft.graph.conflictBehavior": "rename",
      name: "large-report.pdf"
    }
  });

// Upload in chunks (recommended: 5-10MB chunks)
const CHUNK_SIZE = 5 * 1024 * 1024;
for (let offset = 0; offset < fileSize; offset += CHUNK_SIZE) {
  const chunk = fileContent.slice(offset, offset + CHUNK_SIZE);
  const end = Math.min(offset + CHUNK_SIZE, fileSize) - 1;
  await fetch(session.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Range": `bytes ${offset}-${end}/${fileSize}`,
      "Content-Length": chunk.length
    },
    body: chunk
  });
}
```

**Why:** Graph API's drive endpoint works for both OneDrive and SharePoint document libraries. Use simple upload for files < 4MB, resumable upload for larger files. The upload session URL is pre-authenticated — no Bearer token needed.

### Rule 17: Planner Task Management via Graph

**Impact:** MEDIUM — Manual task tracking when Graph API can automate Planner integration.

✅ **Correct:**
```javascript
// Create a Planner task
const task = await graphClient.api("/planner/tasks").post({
  planId: planId,
  bucketId: bucketId,
  title: "리뷰: 3월 경비 보고서",
  assignments: {
    [assigneeId]: {
      "@odata.type": "#microsoft.graph.plannerAssignment",
      orderHint: " !"
    }
  },
  dueDateTime: "2026-04-07T09:00:00Z",
  priority: 3  // 1=Urgent, 3=Important, 5=Medium, 9=Low
});

// Update task details (description, checklist)
await graphClient
  .api(`/planner/tasks/${task.id}/details`)
  .header("If-Match", task["@odata.etag"])
  .patch({
    description: "3월 팀 경비 보고서를 검토하고 승인해 주세요.",
    checklist: {
      [guid()]: {
        title: "금액 확인",
        isChecked: false
      },
      [guid()]: {
        title: "영수증 첨부 확인",
        isChecked: false
      }
    }
  });
```

**Why:** Planner tasks require `If-Match` etag header for updates (optimistic concurrency). Priority uses a 1-9 scale. Assignments use the user's ID as the key. Always include `orderHint` with a space-bang pattern.

### Rule 18: Power Automate Cloud Flow Triggers from Code

**Impact:** MEDIUM — Building custom automation when Power Automate flows can handle it is over-engineering.

✅ **Correct:**
```python
import httpx

# Trigger a Power Automate flow via HTTP request trigger
FLOW_TRIGGER_URL = os.environ["POWER_AUTOMATE_WEBHOOK_URL"]

async def trigger_approval_flow(expense_data: dict):
    """Trigger Power Automate approval flow from application code."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            FLOW_TRIGGER_URL,
            json={
                "submitter": expense_data["submitter_name"],
                "amount": expense_data["amount"],
                "category": expense_data["category"],
                "approver_email": expense_data["approver_email"],
                "callback_url": f"{API_BASE}/api/expenses/{expense_data['id']}/status"
            },
            timeout=30.0
        )
        response.raise_for_status()
        return response.json()
```

**Why:** Power Automate excels at approval workflows, multi-step notifications, and M365 orchestration. Use HTTP request triggers to invoke flows from your code. Use HTTP response actions to return results. This avoids reimplementing approval logic, Teams notifications, and Outlook email in your application.

### Rule 19: Teams Meeting Transcript Access

**Impact:** MEDIUM — Accessing meeting transcripts requires specific Graph API permissions and timing considerations.

✅ **Correct:**
```javascript
// 1. List transcripts for a meeting (available after meeting ends)
const transcripts = await graphClient
  .api(`/me/onlineMeetings/${meetingId}/transcripts`)
  .get();

// 2. Get transcript content
if (transcripts.value.length > 0) {
  const transcriptId = transcripts.value[0].id;

  // Get as VTT format (includes timestamps)
  const vttContent = await graphClient
    .api(`/me/onlineMeetings/${meetingId}/transcripts/${transcriptId}/content`)
    .header("Accept", "text/vtt")
    .get();

  // Or get as plain text (no timestamps)
  const textContent = await graphClient
    .api(`/me/onlineMeetings/${meetingId}/transcripts/${transcriptId}/content`)
    .header("Accept", "text/plain")
    .get();
}
```

**Required permissions:** `OnlineMeetingTranscript.Read.All` (application) or `OnlineMeetingTranscript.Read` (delegated).

**Why:** Transcripts are only available after the meeting ends and transcription was enabled. Use VTT format when you need speaker attribution and timestamps. Use plain text for summarization or search indexing.

---

## Pre-Deployment Checklist (M365 Integrations)

**Authentication:**
- [ ] App registration has minimum required Graph API permissions
- [ ] Teams SSO configured for tabs (no separate login)
- [ ] OAuth 2.0 used for API plugins (not API keys)

**SharePoint:**
- [ ] Compound site ID format used
- [ ] Internal field names used (not display names)
- [ ] SPFx web parts unmount on dispose

**Teams:**
- [ ] Adaptive Cards under 28KB
- [ ] Channel IDs retrieved dynamically (not hardcoded)
- [ ] Webhook URLs stored in Key Vault

**Graph API:**
- [ ] Batch requests used for bulk operations (≤20 per batch)
- [ ] Retry logic for HTTP 429 with Retry-After header
- [ ] Delta queries for incremental sync

**Localization:**
- [ ] Korean date format (YYYY년 MM월 DD일)
- [ ] Korea Standard Time timezone ID used
- [ ] Korean error messages in 합니다체
