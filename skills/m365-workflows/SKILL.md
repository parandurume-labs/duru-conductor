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
allowed-tools: Bash Read Write Edit Glob Grep
metadata:
  author: parandurume-labs
  version: "1.0.0"
  license: GM-Social-v2.0
---

# Microsoft 365 Workflow Patterns

This skill provides rules for building reliable Microsoft 365 integrations with Teams, SharePoint, and Outlook. Rules are ordered by impact.

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
