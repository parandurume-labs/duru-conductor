---
name: azure-ai-foundry
description: >-
  Azure AI Foundry and Azure OpenAI best practices. Use when building AI
  applications with Azure AI Foundry (formerly Azure AI Studio), deploying
  models (GPT, Phi, Mistral), configuring Prompt Flow, setting up content
  filtering, managing AI service costs, or integrating AI services with
  Container Apps and other Azure compute. Covers model deployment, safety,
  identity, cost management, and production readiness. Activate whenever
  Azure AI, Azure OpenAI, AI Foundry, Prompt Flow, or AI model deployment
  is mentioned.
license: SEE LICENSE IN ../../LICENSE
metadata:
  author: parandurume-labs
  version: "1.0.0"
  license: GM-Social-v2.0
---

# Azure AI Foundry Best Practices

This skill provides rules for building secure, reliable, and cost-effective AI applications on Azure AI Foundry. Rules are ordered by impact: CRITICAL rules prevent security breaches or runaway costs; HIGH rules prevent common production issues; MEDIUM rules improve maintainability and efficiency.

---

## Learned Patterns (Auto-Updated)

Before applying the rules below, check if `LESSONS.md` exists in the project root. If it does, read the section tagged with `azure-ai-foundry` and apply those project-specific lessons alongside the rules below.

---

## Category 1: Identity & Security (CRITICAL)

### Rule 1: Use Managed Identity for AI Services — Never Use API Keys

**Impact:** CRITICAL — API keys for Azure OpenAI are the most commonly leaked credentials in AI projects.

❌ **Wrong:**
```python
from openai import AzureOpenAI

client = AzureOpenAI(
    api_key="sk-abc123...",  # Hardcoded API key
    api_version="2024-10-21",
    azure_endpoint="https://my-openai.openai.azure.com"
)
```

✅ **Correct:**
```python
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

credential = DefaultAzureCredential()
token_provider = get_bearer_token_provider(
    credential, "https://cognitiveservices.azure.com/.default"
)

client = AzureOpenAI(
    azure_ad_token_provider=token_provider,
    api_version="2024-10-21",
    azure_endpoint="https://my-openai.openai.azure.com"
)
```

**Why:** Managed Identity eliminates API key management entirely. Assign `Cognitive Services OpenAI User` role to the app's managed identity. This works for Azure OpenAI, AI Foundry, and all Cognitive Services.

### Rule 2: Configure Content Safety Filtering

**Impact:** CRITICAL — Unfiltered AI outputs can generate harmful, illegal, or brand-damaging content.

❌ **Wrong:**
```python
# Deploying model with no content filtering
# (or requesting filter removal without business justification)
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": user_input}]
    # No content filtering configured on the deployment
)
```

✅ **Correct:**
```python
# 1. Configure content filtering policy in AI Foundry portal or via API
# Set severity thresholds for: hate, sexual, violence, self-harm
# Recommended minimum: medium severity for all categories

# 2. Handle filtered responses gracefully
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": user_input}]
)

if response.choices[0].finish_reason == "content_filter":
    # Log for monitoring, return safe fallback
    log.warning(f"Content filtered: prompt_id={prompt_id}")
    return {
        "message": "요청하신 내용을 처리할 수 없습니다.",
        "messageEn": "Unable to process the requested content.",
        "filtered": True
    }
```

**Why:** Azure AI Foundry provides built-in content filtering. Always configure it, handle `content_filter` finish reasons, and log filtered requests for monitoring.

### Rule 3: Set max_completion_tokens on Every AI Call

**Impact:** CRITICAL — Unbounded token generation causes runaway costs and timeouts.

❌ **Wrong:**
```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=messages
    # No max_completion_tokens — model can generate up to context limit
)
```

✅ **Correct:**
```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=messages,
    max_completion_tokens=2000,  # Appropriate for the use case
    temperature=0.7
)

# Track token usage for cost monitoring
usage = response.usage
log.info(
    f"Tokens: prompt={usage.prompt_tokens}, "
    f"completion={usage.completion_tokens}, "
    f"cost_estimate=${estimate_cost(usage)}"
)
```

**Why:** Without `max_completion_tokens`, a single malformed prompt can generate a 128K-token response. At GPT-4o pricing, that's ~$4 per request. Set limits appropriate for each use case. Note: older SDK versions use `max_tokens` — both work, but `max_completion_tokens` is the current parameter name.

---

## Category 2: Model Deployment (HIGH)

### Rule 4: Use Standard Deployments for Production, Provisioned for Predictable Workloads

**Impact:** HIGH — Wrong deployment type causes either cost overruns or throttling under load.

❌ **Wrong:**
```bicep
// Using Global Standard for latency-sensitive production workload
resource deployment 'Microsoft.CognitiveServices/accounts/deployments@2024-10-01' = {
  name: 'gpt-4o-prod'
  properties: {
    model: { format: 'OpenAI', name: 'gpt-4o', version: '2024-08-06' }
  }
  sku: { name: 'GlobalStandard', capacity: 100 }  // Variable latency
}
```

✅ **Correct:**
```bicep
// Standard deployment for most workloads
resource standardDeployment 'Microsoft.CognitiveServices/accounts/deployments@2024-10-01' = {
  name: 'gpt-4o-standard'
  properties: {
    model: { format: 'OpenAI', name: 'gpt-4o', version: '2024-08-06' }
  }
  sku: { name: 'Standard', capacity: 80 }  // Regional, lower latency
}

// Provisioned Throughput for high-volume, latency-sensitive workloads
resource provisionedDeployment 'Microsoft.CognitiveServices/accounts/deployments@2024-10-01' = {
  name: 'gpt-4o-provisioned'
  properties: {
    model: { format: 'OpenAI', name: 'gpt-4o', version: '2024-08-06' }
  }
  sku: { name: 'ProvisionedManaged', capacity: 50 }  // PTUs, guaranteed throughput
}
```

**Why:** Standard = pay-per-token, good for variable loads. Provisioned = reserved throughput units (PTUs), good for predictable high-volume workloads. Global Standard = cheapest but highest latency variance.

### Rule 5: Multi-Region Deployment for Availability and Model Access

**Impact:** HIGH — New models and higher quotas are often available in specific regions first.

❌ **Wrong:**
```python
# Single-region, single-endpoint
client = AzureOpenAI(
    azure_endpoint="https://my-openai-eastus.openai.azure.com",
    ...
)
```

✅ **Correct:**
```python
# Multi-region with failover using LiteLLM or custom router
from litellm import Router

router = Router(
    model_list=[
        {
            "model_name": "gpt-4o",
            "litellm_params": {
                "model": "azure/gpt-4o",
                "api_base": "https://my-openai-eastus.openai.azure.com",
                "api_version": "2024-10-21"
            }
        },
        {
            "model_name": "gpt-4o",
            "litellm_params": {
                "model": "azure/gpt-4o",
                "api_base": "https://my-openai-swedencentral.openai.azure.com",
                "api_version": "2024-10-21"
            }
        }
    ],
    routing_strategy="latency-based-routing"
)

response = await router.acompletion(
    model="gpt-4o",
    messages=messages,
    max_completion_tokens=2000
)
```

**Why:** Azure OpenAI regions have different model availability, quotas, and latency. Multi-region deployment provides failover and access to the newest models. `koreacentral` often has limited GPU model availability — pair with `eastus` or `swedencentral`.

### Rule 6: Pin Model Versions in Production

**Impact:** HIGH — Model version updates can change output behavior and break downstream logic.

❌ **Wrong:**
```bicep
resource deployment 'Microsoft.CognitiveServices/accounts/deployments@2024-10-01' = {
  name: 'gpt-4o'
  properties: {
    model: { format: 'OpenAI', name: 'gpt-4o' }  // No version — auto-updates
    versionUpgradeOption: 'OnceNewDefaultVersionAvailable'  // Auto-upgrade
  }
}
```

✅ **Correct:**
```bicep
resource deployment 'Microsoft.CognitiveServices/accounts/deployments@2024-10-01' = {
  name: 'gpt-4o-2024-08-06'
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-4o'
      version: '2024-08-06'  // Pinned version
    }
    versionUpgradeOption: 'NoAutoUpgrade'  // Manual upgrade only
  }
}
```

**Why:** Model version changes can alter output format, reasoning quality, and cost. Pin versions in production and test upgrades in staging before promoting.

---

## Category 3: Prompt Flow & Application Patterns (HIGH)

### Rule 7: Use Prompt Flow for Complex AI Pipelines

**Impact:** HIGH — Ad-hoc chained LLM calls become unmaintainable and hard to debug.

❌ **Wrong:**
```python
# Hard-coded chain of LLM calls
def process_document(doc):
    summary = call_llm("Summarize: " + doc)
    entities = call_llm("Extract entities from: " + summary)
    sentiment = call_llm("Analyze sentiment: " + summary)
    return combine(summary, entities, sentiment)
```

✅ **Correct:**
```yaml
# flow.dag.yaml — Azure AI Foundry Prompt Flow
inputs:
  document:
    type: string

nodes:
  - name: summarize
    type: llm
    source: { type: code, path: summarize.jinja2 }
    inputs: { document: ${inputs.document} }

  - name: extract_entities
    type: llm
    source: { type: code, path: extract_entities.jinja2 }
    inputs: { summary: ${summarize.output} }

  - name: analyze_sentiment
    type: python
    source: { type: code, path: sentiment.py }
    inputs: { text: ${summarize.output} }

outputs:
  result:
    type: object
    value:
      summary: ${summarize.output}
      entities: ${extract_entities.output}
      sentiment: ${analyze_sentiment.output}
```

**Why:** Prompt Flow provides visual debugging, built-in evaluation, versioned prompt templates, and easy deployment to Container Apps or Azure ML managed endpoints. Use it for any pipeline with 2+ LLM calls.

### Rule 8: Implement Retry with Exponential Backoff for Rate Limits

**Impact:** HIGH — Azure OpenAI enforces TPM (tokens per minute) and RPM (requests per minute) limits. Without retry logic, requests fail silently under load.

❌ **Wrong:**
```python
# No retry — fails on 429
response = client.chat.completions.create(
    model="gpt-4o",
    messages=messages
)
```

✅ **Correct:**
```python
import time
from openai import RateLimitError

def call_with_retry(client, messages, max_retries=3):
    for attempt in range(max_retries):
        try:
            return client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                max_tokens=2000
            )
        except RateLimitError as e:
            if attempt == max_retries - 1:
                raise
            # Use Retry-After header if available
            retry_after = int(e.response.headers.get("Retry-After", 2 ** attempt))
            log.warning(
                f"Rate limited (attempt {attempt + 1}/{max_retries}), "
                f"retrying in {retry_after}s"
            )
            time.sleep(retry_after)
```

**Why:** Azure OpenAI returns HTTP 429 with a `Retry-After` header. Respect it. The Azure OpenAI Python SDK has built-in retry, but configure `max_retries` explicitly.

---

## Category 4: Cost Management (MEDIUM)

### Rule 9: Monitor and Alert on Token Usage

**Impact:** MEDIUM — AI costs can spike unexpectedly without monitoring.

❌ **Wrong:**
```python
# No cost tracking
response = client.chat.completions.create(model="gpt-4o", messages=messages)
return response.choices[0].message.content
```

✅ **Correct:**
```python
import json

# Cost per 1K tokens — pricing as of 2026-03, verify at azure.com/pricing
COST_PER_1K = {
    "gpt-4o": {"input": 0.0025, "output": 0.01},
    "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
}

def call_with_cost_tracking(client, model, messages):
    response = client.chat.completions.create(
        model=model, messages=messages, max_tokens=2000
    )

    usage = response.usage
    costs = COST_PER_1K.get(model, {"input": 0, "output": 0})
    estimated_cost = (
        (usage.prompt_tokens / 1000) * costs["input"] +
        (usage.completion_tokens / 1000) * costs["output"]
    )

    # Emit metric for Azure Monitor / Application Insights
    log.info(json.dumps({
        "event": "ai_call",
        "model": model,
        "prompt_tokens": usage.prompt_tokens,
        "completion_tokens": usage.completion_tokens,
        "estimated_cost_usd": round(estimated_cost, 6)
    }))

    return response
```

**Why:** Set up Azure Monitor alerts on daily/weekly AI spend. Use Application Insights custom metrics to track cost per feature, per user, or per API endpoint.

### Rule 10: Use the Right Model for the Task

**Impact:** MEDIUM — Using GPT-4o for tasks that GPT-4o-mini handles is 16x more expensive.

❌ **Wrong:**
```python
# Using GPT-4o for simple classification
response = client.chat.completions.create(
    model="gpt-4o",  # $2.50/M input, $10/M output
    messages=[
        {"role": "system", "content": "Classify as positive/negative."},
        {"role": "user", "content": review_text}
    ]
)
```

✅ **Correct:**
```python
# Model selection based on task complexity
MODEL_MAP = {
    "classification": "gpt-4o-mini",    # Simple tasks — 16x cheaper
    "extraction": "gpt-4o-mini",         # Structured extraction
    "summarization": "gpt-4o-mini",      # Short summaries
    "reasoning": "gpt-4o",               # Complex analysis
    "code_generation": "gpt-4o",          # Code requires stronger model
    "creative": "gpt-4o",                # Nuanced creative writing
}

def get_completion(task_type, messages):
    model = MODEL_MAP.get(task_type, "gpt-4o-mini")
    return client.chat.completions.create(
        model=model, messages=messages, max_tokens=2000
    )
```

**Why:** GPT-4o-mini handles classification, extraction, and simple summarization nearly as well as GPT-4o at 1/16th the cost. Reserve GPT-4o for reasoning, code generation, and creative tasks.

---

## Category 5: Deployment to Container Apps (MEDIUM)

### Rule 11: Deploy Prompt Flow to Container Apps with Managed Identity

**Impact:** MEDIUM — Prompt Flow needs proper identity and health probe configuration for production deployment.

❌ **Wrong:**
```bicep
// Deploying without health probes or managed identity
resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: 'ai-flow'
  properties: {
    template: {
      containers: [{
        name: 'flow'
        image: 'myregistry.azurecr.io/prompt-flow:latest'  // No pinned tag
        env: [{ name: 'OPENAI_API_KEY', value: 'sk-...' }]  // Key in env
      }]
    }
  }
}
```

✅ **Correct:**
```bicep
resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: 'ai-flow'
  identity: { type: 'SystemAssigned' }
  properties: {
    template: {
      containers: [{
        name: 'flow'
        image: 'myregistry.azurecr.io/prompt-flow:1.2.3'  // Pinned version
        env: [
          { name: 'AZURE_OPENAI_ENDPOINT', value: openAiEndpoint }
          // No API key — uses managed identity
        ]
        resources: { cpu: json('1.0'), memory: '2Gi' }
      }]
      scale: {
        minReplicas: 1  // Avoid cold starts for AI endpoints
        maxReplicas: 10
        rules: [{ name: 'http', http: { metadata: { concurrentRequests: '10' }}}]
      }
    }
    configuration: {
      ingress: {
        external: true
        targetPort: 8080
        transport: 'http'
      }
    }
  }
}

// Assign Cognitive Services role to Container App identity
resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(containerApp.id, cognitiveServicesAccount.id, cognitiveServicesUserRole)
  scope: cognitiveServicesAccount
  properties: {
    roleDefinitionId: cognitiveServicesUserRole  // Cognitive Services OpenAI User
    principalId: containerApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}
```

**Why:** Container Apps with managed identity eliminates API key management for AI services. Set `minReplicas: 1` to avoid cold start latency on AI endpoints. Pin image tags to prevent unexpected model behavior changes.

---

## Category 6: Open-Source and Fine-Tuned Models (MEDIUM)

### Rule 12: Deploy Open-Source Models via AI Foundry Model Catalog

**Impact:** MEDIUM — Self-hosting open-source models (Phi, Mistral, Llama) without AI Foundry adds operational burden.

❌ **Wrong:**
```bash
# Self-hosting on a VM with manual GPU management
ssh gpu-vm
docker run -p 8080:8080 -v /models:/models \
  vllm/vllm-openai --model mistralai/Mistral-7B-v0.1
```

✅ **Correct:**
```python
# Deploy via AI Foundry Model Catalog — Serverless API or Managed Compute
# 1. Deploy from Azure AI Foundry portal: Model Catalog → Deploy
# 2. Access via the same OpenAI-compatible API

from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

credential = DefaultAzureCredential()
token_provider = get_bearer_token_provider(
    credential, "https://cognitiveservices.azure.com/.default"
)

# Serverless API deployment — pay-per-token, no GPU management
client = AzureOpenAI(
    azure_ad_token_provider=token_provider,
    api_version="2024-10-21",
    azure_endpoint="https://my-ai-foundry.services.ai.azure.com/models"
)

response = client.chat.completions.create(
    model="Phi-4",  # Deployed model name
    messages=messages,
    max_completion_tokens=1000
)
```

**Why:** AI Foundry Model Catalog provides one-click deployment for 1,600+ open-source models with managed infrastructure, auto-scaling, and the same OpenAI-compatible API. Serverless API means no GPU management.

---

## Pre-Deployment Checklist (Azure AI)

**Identity & Security:**
- [ ] All AI service connections use Managed Identity (no API keys)
- [ ] `Cognitive Services OpenAI User` role assigned to app identity
- [ ] Content safety filtering configured on all model deployments
- [ ] `max_completion_tokens` set on every LLM call

**Model Deployment:**
- [ ] Model versions pinned (no auto-upgrade in production)
- [ ] Deployment type matches workload (Standard vs. Provisioned)
- [ ] Multi-region failover configured for critical workloads

**Cost Management:**
- [ ] Token usage monitoring and alerting configured
- [ ] Right model for the task (GPT-4o-mini for simple tasks)
- [ ] Budget alerts set in Azure Cost Management
- [ ] Dev/test environments use lower-cost models

**Production Readiness:**
- [ ] Retry logic with exponential backoff for rate limits
- [ ] Content filter responses handled gracefully
- [ ] AI usage disclosure for user-facing decisions (per NIA guidelines)
- [ ] Container Apps minReplicas ≥ 1 for AI endpoints
