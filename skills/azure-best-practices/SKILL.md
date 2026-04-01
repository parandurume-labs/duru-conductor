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
metadata:
  author: parandurume-labs
  version: "1.0.0"
  license: GM-Social-v2.0
---

# Azure Best Practices

This skill provides rules for building secure, reliable, and cost-effective Azure services. Rules are ordered by impact: CRITICAL rules prevent outages or security breaches; HIGH rules prevent common production issues; MEDIUM rules improve maintainability and cost.

---

## Learned Patterns (Auto-Updated)

Before applying the rules below, check if `LESSONS.md` exists in the project root. If it does, read the section tagged with `azure-best-practices` and apply those project-specific lessons alongside the rules below.

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

## Category 7: Container Apps Advanced (HIGH)

### Rule 22: Container Apps Jobs for Batch Workloads

**Impact:** HIGH — Using always-on Container Apps for batch/scheduled work wastes compute.

❌ **Wrong:**
```bicep
// Always-on container running a cron job internally
resource app 'Microsoft.App/containerApps@2024-03-01' = {
  name: 'batch-processor'
  properties: {
    template: {
      containers: [{
        name: 'batch'
        image: 'myregistry.azurecr.io/batch:1.0'
        // Runs 24/7, but only does work every hour
      }]
      scale: { minReplicas: 1, maxReplicas: 1 }
    }
  }
}
```

✅ **Correct:**
```bicep
resource job 'Microsoft.App/jobs@2024-03-01' = {
  name: 'batch-processor'
  properties: {
    configuration: {
      triggerType: 'Schedule'
      scheduleTriggerConfig: {
        cronExpression: '0 * * * *'  // Every hour
        parallelism: 1
        replicaCompletionCount: 1
      }
      replicaTimeout: 1800  // 30 min max
      replicaRetryLimit: 2
    }
    template: {
      containers: [{
        name: 'batch'
        image: 'myregistry.azurecr.io/batch:1.0'
        resources: { cpu: json('1.0'), memory: '2Gi' }
      }]
    }
  }
}
```

**Why:** Container Apps Jobs run on-demand or on a schedule and stop when done. You only pay for execution time. Use for data processing, report generation, cleanup tasks, and migration scripts.

### Rule 23: Azure Static Web Apps with API Backend

**Impact:** HIGH — Hosting static frontends on Container Apps or App Service is over-provisioned and costly.

❌ **Wrong:**
```bicep
// Full Container App for a React SPA
resource app 'Microsoft.App/containerApps@2024-03-01' = {
  name: 'frontend'
  properties: {
    template: {
      containers: [{
        name: 'nginx'
        image: 'myregistry.azurecr.io/frontend:1.0'
        resources: { cpu: json('0.5'), memory: '1Gi' }
      }]
    }
  }
}
```

✅ **Correct:**
```yaml
# staticwebapp.config.json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/api/*", "/images/*"]
  },
  "routes": [
    { "route": "/api/*", "allowedRoles": ["authenticated"] }
  ],
  "responseOverrides": {
    "401": { "redirect": "/login", "statusCode": 302 }
  },
  "platform": {
    "apiRuntime": "node:18"
  }
}
```

```yaml
# GitHub Actions deployment
- uses: Azure/static-web-apps-deploy@v1
  with:
    azure_static_web_apps_api_token: ${{ secrets.SWA_TOKEN }}
    app_location: "/"
    api_location: "api"
    output_location: "dist"
```

**Why:** Static Web Apps provides free SSL, global CDN, built-in auth, and API Functions backend. Free tier handles most SPAs. Use Container Apps only when you need WebSocket, SSR, or custom server logic.

---

## Category 8: Infrastructure as Code Advanced (HIGH)

### Rule 24: Bicep Module Registry for Reusable Components

**Impact:** HIGH — Copy-pasting Bicep modules across repos leads to drift and inconsistency.

❌ **Wrong:**
```
# Copy-pasting the same container-app.bicep into every project
project-a/infra/modules/container-app.bicep  # v1
project-b/infra/modules/container-app.bicep  # v1 with local edits
project-c/infra/modules/container-app.bicep  # v2, different from above
```

✅ **Correct:**
```bicep
// Reference module from Azure Container Registry
module containerApp 'br:myregistry.azurecr.io/bicep/modules/container-app:1.2.0' = {
  name: 'deploy-api'
  params: {
    name: 'my-api'
    image: 'myregistry.azurecr.io/api:1.0'
    environmentId: containerAppEnv.id
    managedIdentity: true
    minReplicas: 1
  }
}
```

```bash
# Publish module to registry
az bicep publish \
  --file modules/container-app.bicep \
  --target br:myregistry.azurecr.io/bicep/modules/container-app:1.2.0
```

**Why:** Bicep module registry in ACR provides versioning, immutable artifacts, and a single source of truth for infrastructure patterns. Tag modules with semantic versions.

### Rule 25: Bicep Linting and What-If Before Deploy

**Impact:** HIGH — Deploying untested Bicep can delete or misconfigure production resources.

✅ **Correct:**
```bash
# 1. Lint — catch syntax and best practice issues
az bicep lint --file main.bicep

# 2. What-If — preview changes before applying
az deployment group what-if \
  --resource-group my-rg \
  --template-file main.bicep \
  --parameters @params.json \
  --parameters apiKey=${{ secrets.API_KEY }}

# 3. Deploy only after review
az deployment group create \
  --resource-group my-rg \
  --template-file main.bicep \
  --parameters @params.json \
  --parameters apiKey=${{ secrets.API_KEY }}
```

**Why:** `what-if` shows creates, deletes, and modifications before they happen. Always run it in CI/CD before deploy. Use `--confirm-with-what-if` for interactive deployments.

---

## Category 9: Monitoring & Observability (HIGH)

### Rule 26: Azure Monitor Alerts and Action Groups

**Impact:** HIGH — Without alerting, outages go undetected until users report them.

✅ **Correct:**
```bicep
resource actionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: 'ops-team'
  location: 'global'
  properties: {
    groupShortName: 'ops'
    enabled: true
    emailReceivers: [
      { name: 'ops-email', emailAddress: 'ops@contoso.com' }
    ]
    // For Korean Teams channel notifications
    webhookReceivers: [
      {
        name: 'teams-webhook'
        serviceUri: teamsWebhookUrl
        useCommonAlertSchema: true
      }
    ]
  }
}

resource cpuAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'high-cpu-alert'
  location: 'global'
  properties: {
    severity: 2
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [{
        name: 'cpu'
        metricName: 'CpuUsageNanoCores'
        operator: 'GreaterThan'
        threshold: 800000000  // 80% of 1 core
        timeAggregation: 'Average'
      }]
    }
    actions: [{ actionGroupId: actionGroup.id }]
    targetResourceType: 'Microsoft.App/containerApps'
    scopes: [containerApp.id]
  }
}
```

**Why:** Set alerts for: CPU > 80%, memory > 80%, HTTP 5xx > 1%, response time > 2s. Use Action Groups to route to email, Teams webhooks, or PagerDuty.

### Rule 27: Application Insights for End-to-End Tracing

**Impact:** HIGH — Without distributed tracing, diagnosing multi-service issues requires log correlation across services.

✅ **Correct:**
```python
from azure.monitor.opentelemetry import configure_azure_monitor

# One-line setup — auto-instruments requests, dependencies, exceptions
configure_azure_monitor(
    connection_string=os.environ["APPLICATIONINSIGHTS_CONNECTION_STRING"]
)

# Custom telemetry for business metrics
from opentelemetry import metrics
meter = metrics.get_meter("contoso-app")
request_counter = meter.create_counter(
    "business.requests",
    description="Business operation requests"
)

@app.post("/api/orders")
async def create_order(request):
    request_counter.add(1, {"operation": "create_order", "region": "KR"})
    # ... business logic
```

**Why:** Azure Monitor OpenTelemetry auto-instruments HTTP requests, database calls, and external dependencies. Add custom metrics for business KPIs. Use Application Map in Azure Portal to visualize service dependencies.

---

## Category 10: Cost Optimization (MEDIUM)

### Rule 28: Reserved Instances and Savings Plans

**Impact:** MEDIUM — Pay-as-you-go pricing is 30-60% more expensive than reserved capacity for predictable workloads.

✅ **Decision guide:**
```markdown
| Workload Pattern | Recommendation | Savings |
|---|---|---|
| Steady 24/7 (prod DB, app server) | 1-year Reserved Instance | ~35% |
| Steady 24/7, committed | 3-year Reserved Instance | ~55% |
| Variable but predictable compute | Azure Savings Plan | ~25% |
| Batch/dev/test | Spot VMs | ~60-90% |
| Short-lived experiments | Pay-as-you-go | 0% (but no commitment) |
```

**Why:** After running a workload for 2+ months with stable usage, evaluate reserved pricing. Use Azure Advisor cost recommendations to identify candidates.

### Rule 29: Azure Front Door for Global Distribution

**Impact:** MEDIUM — Serving all traffic from a single region increases latency for global users.

✅ **Correct:**
```bicep
resource frontDoor 'Microsoft.Cdn/profiles@2023-05-01' = {
  name: 'contoso-fd'
  sku: { name: 'Standard_AzureFrontDoor' }
  location: 'global'
}

resource endpoint 'Microsoft.Cdn/profiles/afdEndpoints@2023-05-01' = {
  parent: frontDoor
  name: 'api-endpoint'
  location: 'global'
  properties: { enabledState: 'Enabled' }
}

resource originGroup 'Microsoft.Cdn/profiles/originGroups@2023-05-01' = {
  parent: frontDoor
  name: 'api-origins'
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
    }
    healthProbeSettings: {
      probePath: '/health'
      probeRequestType: 'HEAD'
      probeProtocol: 'Https'
      probeIntervalInSeconds: 30
    }
  }
}
```

**Why:** Front Door provides global load balancing, WAF, SSL termination, and caching. Use Standard tier for static content caching, Premium tier for private link origins and advanced WAF rules. Note: a complete deployment also requires `Microsoft.Cdn/profiles/originGroups/origins` and `Microsoft.Cdn/profiles/afdEndpoints/routes` child resources — see [Azure Front Door Bicep docs](https://learn.microsoft.com/azure/frontdoor/create-front-door-bicep) for full examples.

### Rule 30: Azure Service Bus vs. Event Grid Decision Matrix

**Impact:** MEDIUM — Choosing the wrong messaging service leads to over-engineering or under-reliability.

✅ **Decision guide:**
```markdown
| Scenario | Use | Why |
|---|---|---|
| Command/task queue (order processing) | Service Bus Queue | Guaranteed delivery, FIFO, dead-letter |
| Publish/subscribe (notifications) | Service Bus Topic | Filtered subscriptions, sessions |
| Event-driven react (blob created) | Event Grid | Push-based, serverless, low latency |
| High-volume telemetry/logs | Event Hubs | Partitioned streaming, replay |
| Simple webhook notifications | Event Grid | HTTP push, no polling |
| Saga/workflow coordination | Service Bus + Sessions | Session-based message grouping |
```

**Why:** Service Bus = reliable messaging with transactions. Event Grid = reactive event routing. Event Hubs = high-throughput streaming. Don't use Service Bus for simple event notifications (Event Grid is cheaper and simpler). Don't use Event Grid for ordered processing (it doesn't guarantee order).

### Rule 31: Budget Alerts and Cost Anomaly Detection

**Impact:** MEDIUM — Unexpected cost spikes from misconfigured services or attacks go unnoticed without alerts.

✅ **Correct:**
```bicep
resource budget 'Microsoft.Consumption/budgets@2023-11-01' = {
  name: 'monthly-budget'
  properties: {
    category: 'Cost'
    amount: 5000000  // ₩5,000,000 / month
    timeGrain: 'Monthly'
    timePeriod: {
      startDate: '2026-04-01'
      endDate: '2027-03-31'
    }
    notifications: {
      '80Percent': {
        enabled: true
        operator: 'GreaterThan'
        threshold: 80
        contactEmails: ['ops@contoso.com']
        thresholdType: 'Actual'
      }
      '100Percent': {
        enabled: true
        operator: 'GreaterThan'
        threshold: 100
        contactEmails: ['ops@contoso.com', 'finance@contoso.com']
        thresholdType: 'Actual'
      }
      'Forecast120': {
        enabled: true
        operator: 'GreaterThan'
        threshold: 120
        contactEmails: ['ops@contoso.com']
        thresholdType: 'Forecasted'  // Alert on projected overspend
      }
    }
  }
}
```

**Why:** Set budget alerts at 80%, 100% actual and 120% forecasted. Enable Azure Cost Management anomaly detection for automatic alerts on unusual spending patterns.

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
