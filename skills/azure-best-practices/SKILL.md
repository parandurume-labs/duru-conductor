---
name: azure-best-practices
description: >-
  Azure cloud architecture and deployment best practices. Use when building,
  deploying, or configuring Azure services including Container Apps, App Service,
  Azure Functions, Cosmos DB, Azure OpenAI, AI Foundry, Managed Identity,
  Key Vault, Bicep, ARM templates, workload identity federation, and Azure
  Kubernetes Service. Covers security, identity, networking, cost optimization,
  and production readiness. Activate whenever Azure, cloud deployment, or
  infrastructure-as-code is mentioned.
license: SEE LICENSE IN ../../LICENSE
allowed-tools: Bash Read Write Edit Glob Grep
metadata:
  author: parandurume-labs
  version: "1.0.0"
  license: GM-Social-v1.0
---

# Azure Best Practices

This skill provides rules for building secure, reliable, and cost-effective Azure services. Rules are ordered by impact: CRITICAL rules prevent outages or security breaches; HIGH rules prevent common production issues; MEDIUM rules improve maintainability and cost.

---

## Category 1: Identity & Access (CRITICAL)

### Rule 1: Use Managed Identity — Never Embed Credentials

**Impact:** CRITICAL — Hardcoded credentials are the #1 cause of Azure security incidents.

❌ **Wrong:**
```python
from azure.storage.blob import BlobServiceClient

client = BlobServiceClient.from_connection_string(
    "DefaultEndpointsProtocol=https;AccountName=mystore;AccountKey=abc123..."
)
```

✅ **Correct:**
```python
from azure.identity import DefaultAzureCredential
from azure.storage.blob import BlobServiceClient

credential = DefaultAzureCredential()
client = BlobServiceClient(
    account_url="https://mystore.blob.core.windows.net",
    credential=credential
)
```

**Why:** `DefaultAzureCredential` uses Managed Identity in production and your Azure CLI login locally. No secrets to leak.

### Rule 2: Workload Identity Federation for CI/CD

**Impact:** CRITICAL — Service principal secrets in CI/CD pipelines expire and can be stolen.

❌ **Wrong:**
```yaml
# GitHub Actions
- uses: azure/login@v2
  with:
    creds: ${{ secrets.AZURE_CREDENTIALS }}  # JSON with client secret
```

✅ **Correct:**
```yaml
# GitHub Actions with OIDC
permissions:
  id-token: write
  contents: read

- uses: azure/login@v2
  with:
    client-id: ${{ secrets.AZURE_CLIENT_ID }}
    tenant-id: ${{ secrets.AZURE_TENANT_ID }}
    subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
```

**Why:** Federated credentials use short-lived OIDC tokens — no long-lived secrets to rotate or protect.

### Rule 3: Key Vault for All Secrets

**Impact:** CRITICAL — Environment variables are visible in portal, logs, and process listings.

❌ **Wrong:**
```bicep
resource appService 'Microsoft.Web/sites@2023-12-01' = {
  properties: {
    siteConfig: {
      appSettings: [
        { name: 'DB_PASSWORD', value: 'super-secret-123' }
      ]
    }
  }
}
```

✅ **Correct:**
```bicep
resource appService 'Microsoft.Web/sites@2023-12-01' = {
  properties: {
    siteConfig: {
      appSettings: [
        {
          name: 'DB_PASSWORD'
          value: '@Microsoft.KeyVault(SecretUri=${keyVault::dbPassword.properties.secretUri})'
        }
      ]
    }
  }
}
```

**Why:** Key Vault references are resolved at runtime; the secret value never appears in config or logs.

### Rule 4: Least-Privilege Role Assignments

**Impact:** CRITICAL — Overly broad roles (Owner, Contributor) amplify the blast radius of a compromise.

❌ **Wrong:**
```bicep
resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions',
      'b24988ac-6180-42a0-ab88-20f7382dd24c') // Contributor — too broad
    principalId: app.identity.principalId
  }
}
```

✅ **Correct:**
```bicep
resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions',
      'ba92f5b4-2d11-453d-a403-e96b0029c9fe') // Storage Blob Data Contributor — scoped
    principalId: app.identity.principalId
  }
}
```

---

## Category 2: Container Apps & Deployment (CRITICAL)

### Rule 5: Pin Image Tags — Never Use :latest

**Impact:** CRITICAL — `:latest` causes unpredictable deployments and makes rollback impossible.

❌ **Wrong:**
```yaml
containers:
  - name: api
    image: myregistry.azurecr.io/api:latest
```

✅ **Correct:**
```yaml
containers:
  - name: api
    image: myregistry.azurecr.io/api:1.2.3-sha-a1b2c3d
```

### Rule 6: Always Configure Health Probes

**Impact:** CRITICAL — Without health probes, Azure routes traffic to broken containers.

❌ **Wrong:**
```bicep
resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  properties: {
    template: {
      containers: [{ name: 'api', image: '...' }]
      // No probes defined
    }
  }
}
```

✅ **Correct:**
```bicep
resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  properties: {
    template: {
      containers: [{
        name: 'api'
        image: '...'
        probes: [
          {
            type: 'liveness'
            httpGet: { path: '/healthz', port: 8080 }
            periodSeconds: 10
          }
          {
            type: 'readiness'
            httpGet: { path: '/ready', port: 8080 }
            periodSeconds: 5
          }
        ]
      }]
    }
  }
}
```

### Rule 7: Set CPU and Memory Limits

**Impact:** HIGH — Unlimited resources cause noisy-neighbor problems and cost overruns.

❌ **Wrong:**
```bicep
containers: [{
  name: 'api'
  image: '...'
  // No resource limits
}]
```

✅ **Correct:**
```bicep
containers: [{
  name: 'api'
  image: '...'
  resources: {
    cpu: json('0.5')
    memory: '1Gi'
  }
}]
```

### Rule 8: Use Revision Scope for Zero-Downtime Deploys

**Impact:** HIGH — Single-revision mode causes downtime during deployments.

❌ **Wrong:**
```bicep
properties: {
  configuration: {
    activeRevisionsMode: 'Single'
  }
}
```

✅ **Correct:**
```bicep
properties: {
  configuration: {
    activeRevisionsMode: 'Multiple'
    ingress: {
      traffic: [
        { revisionName: 'api--v2', weight: 100 }
      ]
    }
  }
}
```

---

## Category 3: Azure OpenAI & AI Foundry (HIGH)

### Rule 9: Always Set max_tokens

**Impact:** HIGH — Without max_tokens, a runaway prompt can consume your entire quota.

❌ **Wrong:**
```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": prompt}]
    # No max_tokens — defaults to model maximum
)
```

✅ **Correct:**
```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": prompt}],
    max_tokens=4096
)
```

### Rule 10: Retry with Exponential Backoff for 429s

**Impact:** HIGH — Azure OpenAI rate-limits aggressively; tight retry loops make it worse.

❌ **Wrong:**
```python
import time

for attempt in range(5):
    try:
        response = client.chat.completions.create(...)
        break
    except Exception:
        time.sleep(1)  # Fixed 1-second delay
```

✅ **Correct:**
```python
import time
import random

for attempt in range(5):
    try:
        response = client.chat.completions.create(...)
        break
    except openai.RateLimitError:
        wait = (2 ** attempt) + random.uniform(0, 1)
        time.sleep(wait)
```

### Rule 11: Use Managed Identity for Azure OpenAI

**Impact:** HIGH — API keys are long-lived secrets that can be leaked.

❌ **Wrong:**
```python
from openai import AzureOpenAI

client = AzureOpenAI(
    api_key="sk-abc123...",
    api_version="2024-06-01",
    azure_endpoint="https://myoai.openai.azure.com"
)
```

✅ **Correct:**
```python
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

credential = DefaultAzureCredential()
token_provider = get_bearer_token_provider(credential, "https://cognitiveservices.azure.com/.default")

client = AzureOpenAI(
    azure_ad_token_provider=token_provider,
    api_version="2024-06-01",
    azure_endpoint="https://myoai.openai.azure.com"
)
```

---

## Category 4: Networking & Security (HIGH)

### Rule 12: Enable HTTPS Only

**Impact:** HIGH — HTTP traffic is unencrypted and vulnerable to interception.

❌ **Wrong:**
```bicep
properties: {
  httpsOnly: false
}
```

✅ **Correct:**
```bicep
properties: {
  httpsOnly: true
}
```

### Rule 13: Use Private Endpoints for Data Services

**Impact:** HIGH — Public endpoints expose databases and storage to the internet.

❌ **Wrong:**
```bicep
resource cosmosDb 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' = {
  properties: {
    publicNetworkAccess: 'Enabled'  // Accessible from internet
  }
}
```

✅ **Correct:**
```bicep
resource cosmosDb 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' = {
  properties: {
    publicNetworkAccess: 'Disabled'
  }
}

resource privateEndpoint 'Microsoft.Network/privateEndpoints@2023-11-01' = {
  properties: {
    privateLinkServiceConnections: [{
      properties: {
        privateLinkServiceId: cosmosDb.id
        groupIds: ['Sql']
      }
    }]
  }
}
```

### Rule 14: Enable Diagnostic Logging

**Impact:** HIGH — Without logs, you cannot investigate incidents.

❌ **Wrong:** No diagnostic settings configured (the default).

✅ **Correct:**
```bicep
resource diagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  scope: containerApp
  properties: {
    workspaceId: logAnalytics.id
    logs: [{ categoryGroup: 'allLogs', enabled: true }]
    metrics: [{ category: 'AllMetrics', enabled: true }]
  }
}
```

### Rule 15: CORS — Restrict Origins

**Impact:** HIGH — Wildcard CORS allows any website to call your API.

❌ **Wrong:**
```bicep
cors: {
  allowedOrigins: ['*']
}
```

✅ **Correct:**
```bicep
cors: {
  allowedOrigins: ['https://myapp.example.com']
}
```

---

## Category 4b: Key Vault RBAC Gotchas (HIGH)

### Rule 15b: Contributor Does NOT Grant Key Vault Secret Access

**Impact:** HIGH — Apps with Contributor role on a resource group still cannot read Key Vault secrets when RBAC is enabled.

❌ **Wrong assumption:**
```
"The backend has Contributor role on the resource group, so it can read Key Vault secrets."
```

✅ **Correct:** When Key Vault uses RBAC authorization (`enableRbacAuthorization: true`), you need **separate data-plane roles**:

| Who | Role | Purpose |
|---|---|---|
| Application (Managed Identity) | **Key Vault Secrets User** | Read secrets at runtime |
| Developer / CI/CD | **Key Vault Secrets Officer** | Write/manage secrets |
| Admin | **Key Vault Administrator** | Full control |

```bicep
// Grant the app read-only access to secrets
resource kvRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions',
      '4633458b-17de-408a-b874-0445c86b69e6') // Key Vault Secrets User
    principalId: containerApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}
```

**Why:** Key Vault separates management-plane (Contributor) from data-plane (Secrets User/Officer). This is by design for defense-in-depth.

### Rule 15c: Container Apps Need AcrPull for ACR

**Impact:** HIGH — Container Apps with `identity: 'system'` for ACR registry fail if no AcrPull role is assigned.

❌ **Wrong:**
```bicep
registries: [{
  server: acrLoginServer
  identity: 'system'  // Assumes Managed Identity can pull — it cannot without AcrPull
}]
```

✅ **Correct:** Assign AcrPull role to the Container App's managed identity:
```bicep
resource acrPullRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: acr
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions',
      '7f951dda-4ed3-4680-a7ca-43fe172d538d') // AcrPull
    principalId: containerApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}
```

**Why:** Without AcrPull, the Container App revision will fail with "Identity with resource ID 'system' not found for registry." This blocks all updates to the container app.

---

## Category 4c: Azure OpenAI Multi-Region (HIGH)

### Rule 15d: Use Multiple Regions for Latest Models

**Impact:** HIGH — The newest models (e.g., GPT-5.4) often launch in limited regions first.

✅ **Correct pattern:** Deploy Azure OpenAI resources in multiple regions and route via LiteLLM:

```
Korea Central:  gpt-4o, gpt-5.1-chat, gpt-5-pro
East US 2:      gpt-5.4-mini (newest family)
```

```python
# LiteLLM routes to the correct endpoint based on model
MODEL_TIERS = {
    "generation": [
        {"model": "azure/gpt-5-1-chat", "api_base": KR_ENDPOINT},
        {"model": "azure/gpt-5-4-mini", "api_base": US_ENDPOINT},  # fallback
    ],
}
```

**Why:** Korea Central may not have the latest models on launch day. Having a secondary region (East US 2 or Sweden Central) ensures access to new models while keeping primary workloads in-region.

### Rule 15e: Azure Cache for Redis Takes 15+ Minutes to Provision

**Impact:** MEDIUM — Redis provisioning blocks downstream Bicep resources that depend on it.

✅ **Correct:** For sandbox/dev environments, consider using a Redis container on Azure Container Apps instead of managed Azure Cache for Redis:

```bicep
// Sandbox: use containerized Redis (fast, cheap)
// Production: use Azure Cache for Redis (managed, HA)
```

**Why:** Azure Cache for Redis (even Basic C0) takes 10-20 minutes to provision. This delays initial deployments significantly. Containerized Redis starts in seconds.

---

## Category 4d: Bicep & IaC Gotchas (HIGH)

### Rule 15f: Use JSON Parameter Files for Secure Params

**Impact:** HIGH — Bicep `.bicepparam` files require ALL parameters declared, including secrets. JSON parameter files allow CLI overrides.

❌ **Wrong:**
```
// sandbox.bicepparam — must declare ALL params including secrets
using '../main.bicep'
param environment = 'sandbox'
// ERROR: postgresPassword and jwtSecret are missing
```

✅ **Correct:** Use JSON parameter files and pass secrets via CLI:
```json
// sandbox.json
{
  "parameters": {
    "environment": { "value": "sandbox" },
    "location": { "value": "koreacentral" }
  }
}
```
```bash
az deployment group create \
  --parameters @infra/parameters/sandbox.json \
  --parameters postgresPassword="$PG_PASS" jwtSecret="$JWT_SECRET"
```

**Why:** Secrets should never appear in parameter files (even `.bicepparam`). JSON files + CLI overrides keep secrets out of source control.

### Rule 15g: Founders Hub Subscriptions Limit RBAC via CLI

**Impact:** MEDIUM — `az role assignment create` may fail on sponsored subscriptions with "MissingSubscription" error.

✅ **Workaround:** Assign roles via the Azure Portal instead:
1. Navigate to the resource → **Access Control (IAM)**
2. **+ Add** → **Add role assignment**
3. Select role → Select principal → **Review + assign**

**Why:** Some sponsored/educational subscriptions have API-level restrictions on role assignments. The Portal uses a different auth flow that works.

---

## Category 5: Data & Storage (MEDIUM)

### Rule 16: Cosmos DB — Use Partition Keys Wisely

**Impact:** MEDIUM — Bad partition keys create hot partitions and throttling.

❌ **Wrong:**
```python
container = database.create_container(
    id="orders",
    partition_key=PartitionKey(path="/region")  # Low cardinality
)
```

✅ **Correct:**
```python
container = database.create_container(
    id="orders",
    partition_key=PartitionKey(path="/customerId")  # High cardinality
)
```

### Rule 17: Enable Soft Delete on Storage Accounts

**Impact:** MEDIUM — Without soft delete, accidental deletions are permanent.

✅ **Correct:**
```bicep
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  properties: {
    isSoftDeleteEnabled: true
    softDeleteRetentionDays: 30
  }
}
```

### Rule 18: Use Connection Pooling for SQL

**Impact:** MEDIUM — Opening a new connection per request causes performance issues.

❌ **Wrong:**
```python
def get_data():
    conn = pyodbc.connect(connection_string)  # New connection every call
    cursor = conn.cursor()
    # ...
    conn.close()
```

✅ **Correct:**
```python
from sqlalchemy import create_engine

engine = create_engine(connection_string, pool_size=10, max_overflow=20)

def get_data():
    with engine.connect() as conn:
        # Connection from pool
        # ...
```

---

## Category 6: Cost Optimization (MEDIUM)

### Rule 19: Use Consumption-Based SKUs for Dev/Test

**Impact:** MEDIUM — Running premium SKUs in dev/test wastes budget.

❌ **Wrong:** Using S1 App Service Plan for a dev environment.

✅ **Correct:** Use B1 or Free tier for dev; Consumption plan for Functions dev.

### Rule 20: Set Budget Alerts

**Impact:** MEDIUM — Without alerts, cost overruns go unnoticed until the bill arrives.

✅ **Correct:**
```bicep
resource budget 'Microsoft.Consumption/budgets@2023-11-01' = {
  name: 'monthly-budget'
  properties: {
    amount: 500
    timeGrain: 'Monthly'
    notifications: {
      actual_GreaterThan_80_Percent: {
        enabled: true
        operator: 'GreaterThan'
        threshold: 80
        contactEmails: ['team@example.com']
      }
    }
  }
}
```

### Rule 21: Auto-Shutdown Dev VMs

**Impact:** MEDIUM — Idle VMs running overnight and weekends are pure waste.

✅ **Correct:**
```bicep
resource autoShutdown 'Microsoft.DevTestLab/schedules@2018-09-15' = {
  name: 'shutdown-computevm-${vm.name}'
  properties: {
    status: 'Enabled'
    dailyRecurrence: { time: '1900' }
    timeZoneId: 'Korea Standard Time'
    targetResourceId: vm.id
  }
}
```

---

## Pre-Deployment Checklist

Run through this checklist before every production deployment:

**Identity & Access:**
- [ ] All service connections use Managed Identity (no connection strings with secrets)
- [ ] CI/CD uses workload identity federation (no service principal secrets)
- [ ] All secrets stored in Key Vault (not in environment variables or config)
- [ ] Role assignments follow least privilege
- [ ] Key Vault Secrets User role assigned to app Managed Identity (Contributor is NOT enough)
- [ ] Key Vault Secrets Officer role assigned to developer/deployer accounts
- [ ] AcrPull role assigned to Container App Managed Identities

**Container Apps / Compute:**
- [ ] Image tags are pinned (no `:latest`)
- [ ] Health probes configured (liveness + readiness)
- [ ] Health probe endpoints return proper HTTP status codes (use JSONResponse, not tuples)
- [ ] CPU and memory limits set
- [ ] HTTPS only enabled

**Networking:**
- [ ] Private endpoints for all data services
- [ ] CORS restricted to known origins
- [ ] Diagnostic logging enabled

**Infrastructure as Code:**
- [ ] Bicep parameter files use JSON format (not .bicepparam) for secret override support
- [ ] Secrets passed via CLI `--parameters` flag, never in parameter files
- [ ] Role assignments included in Bicep modules (don't rely on manual Portal setup)

**Cost:**
- [ ] Dev/test environments use consumption or basic SKUs
- [ ] Budget alerts configured
- [ ] Dev VMs have auto-shutdown scheduled
- [ ] Consider containerized Redis for sandbox (Azure Cache takes 15+ min to provision)

**AI Services:**
- [ ] `max_tokens` set on all Azure OpenAI calls
- [ ] Retry with exponential backoff for rate limits
- [ ] Azure OpenAI accessed via Managed Identity (not API key)
- [ ] Multi-region Azure OpenAI for access to newest models
- [ ] LiteLLM or equivalent router for provider failover and cost tracking
