---
name: azure-security-audit
description: >-
  Azure security audit and hardening patterns. Use when auditing Azure
  infrastructure security, migrating Key Vault access policies to RBAC,
  configuring Entra ID Conditional Access, setting up private endpoints,
  enabling Defender for Cloud, or reviewing network security groups.
  Covers identity security, network isolation, secret management,
  compliance checking, and threat protection. Activate whenever Azure
  security, audit, NSG, private endpoint, Defender, or Conditional Access
  is mentioned.
license: SEE LICENSE IN ../../LICENSE
metadata:
  author: parandurume-labs
  version: "1.0.0"
  license: GM-Social-v2.0
---

# Azure Security Audit

This skill provides rules for auditing and hardening Azure infrastructure security. Rules are ordered by impact: CRITICAL rules prevent data breaches or unauthorized access; HIGH rules prevent common security misconfigurations; MEDIUM rules improve security posture and compliance readiness.

---

## Learned Patterns (Auto-Updated)

Before applying the rules below, check if `LESSONS.md` exists in the project root. If it does, read the section tagged with `azure-security-audit` and apply those project-specific lessons alongside the rules below.

---

## Category 1: Identity & Access Security (CRITICAL)

### Rule 1: Migrate Key Vault from Access Policies to RBAC

**Impact:** CRITICAL — Access policies grant vault-wide permissions with no audit trail. RBAC provides granular, auditable access.

❌ **Wrong:**
```bicep
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: 'my-keyvault'
  properties: {
    enableRbacAuthorization: false  // Uses access policies
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: appServicePrincipalId
        permissions: {
          secrets: ['get', 'list', 'set', 'delete']  // Over-permissioned
        }
      }
    ]
  }
}
```

✅ **Correct:**
```bicep
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: 'my-keyvault'
  properties: {
    enableRbacAuthorization: true  // Use RBAC
    accessPolicies: []  // Empty — RBAC handles access
  }
}

// Granular role assignment — least privilege
resource secretsUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, appIdentity.id, 'Key Vault Secrets User')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      '4633458b-17de-408a-b874-0445c86b69e6'  // Key Vault Secrets User
    )
    principalId: appIdentity.id
    principalType: 'ServicePrincipal'
  }
}
```

**Why:** Key Vault RBAC provides per-secret access control, audit logs via Azure Monitor, and integration with Entra ID Conditional Access. Access policies are legacy and cannot be audited at the individual secret level.

**Key Vault roles:**
| Role | Secrets | Keys | Certificates |
|---|---|---|---|
| Key Vault Secrets User | Read | — | — |
| Key Vault Secrets Officer | Read/Write/Delete | — | — |
| Key Vault Crypto User | — | Sign/Verify/Encrypt | — |
| Key Vault Administrator | Full | Full | Full |

### Rule 2: Entra ID Conditional Access for Admin Portals

**Impact:** CRITICAL — Azure Portal and admin APIs without Conditional Access are vulnerable to credential theft.

❌ **Wrong:**
```
# No Conditional Access — any authenticated user from any location
# can access Azure Portal with just username/password
```

✅ **Correct:**
```json
// Conditional Access Policy via Microsoft Graph API
{
  "displayName": "Require MFA and compliant device for Azure management",
  "conditions": {
    "applications": {
      "includeApplications": [
        "797f4846-ba00-4fd7-ba43-dac1f8f63013"  // Azure Management
      ]
    },
    "users": {
      "includeRoles": [
        "62e90394-69f5-4237-9190-012177145e10",  // Global Administrator
        "e8611ab8-c189-46e8-94e1-60213ab1f814"   // Privileged Role Admin
      ]
    },
    "locations": {
      "includeLocations": ["All"],
      "excludeLocations": ["AllTrusted"]  // Office IPs
    }
  },
  "grantControls": {
    "builtInControls": ["mfa", "compliantDevice"],
    "operator": "AND"
  },
  "sessionControls": {
    "signInFrequency": {
      "value": 4,
      "type": "hours"
    }
  },
  "state": "enabled"
}
```

**Why:** Conditional Access enforces MFA, device compliance, and location restrictions. At minimum: require MFA for all admin roles, block legacy authentication protocols, and enforce sign-in frequency for privileged roles.

### Rule 3: Disable Legacy Authentication Protocols

**Impact:** CRITICAL — Legacy protocols (IMAP, POP3, SMTP basic auth) bypass MFA and Conditional Access.

✅ **Correct:**
```json
// Conditional Access Policy to block legacy auth
{
  "displayName": "Block legacy authentication",
  "conditions": {
    "applications": { "includeApplications": ["All"] },
    "users": { "includeUsers": ["All"] },
    "clientAppTypes": [
      "exchangeActiveSync",
      "other"  // Includes IMAP, POP3, SMTP basic auth
    ]
  },
  "grantControls": {
    "builtInControls": ["block"],
    "operator": "OR"
  },
  "state": "enabled"
}
```

**Why:** Legacy authentication is the #1 vector for credential stuffing attacks against Azure AD/Entra ID. Modern authentication (OAuth 2.0) supports MFA and Conditional Access.

---

## Category 2: Network Security (HIGH)

### Rule 4: Private Endpoints for Data Services

**Impact:** HIGH — Public endpoints on databases, storage accounts, and key vaults expose them to internet-based attacks.

❌ **Wrong:**
```bicep
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'mystorageaccount'
  properties: {
    // No network restrictions — public internet access
    publicNetworkAccess: 'Enabled'
  }
}
```

✅ **Correct:**
```bicep
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'mystorageaccount'
  properties: {
    publicNetworkAccess: 'Disabled'
    networkAcls: {
      defaultAction: 'Deny'
    }
  }
}

resource privateEndpoint 'Microsoft.Network/privateEndpoints@2023-09-01' = {
  name: 'pe-storage'
  location: location
  properties: {
    subnet: { id: privateEndpointSubnet.id }
    privateLinkServiceConnections: [
      {
        name: 'storage-connection'
        properties: {
          privateLinkServiceId: storageAccount.id
          groupIds: ['blob']
        }
      }
    ]
  }
}

resource privateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'privatelink.blob.core.windows.net'
  location: 'global'
}

resource dnsZoneLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: privateDnsZone
  name: 'vnet-link'
  location: 'global'
  properties: {
    virtualNetwork: { id: vnet.id }
    registrationEnabled: false
  }
}
```

**Why:** Private endpoints route traffic over the Azure backbone network, never the public internet. Requires Private DNS Zone for name resolution. Apply to: Storage, Cosmos DB, SQL Database, Key Vault, Azure OpenAI, Container Registry.

### Rule 5: NSG Rules — Deny All Inbound by Default

**Impact:** HIGH — Overly permissive NSG rules are the most common network misconfiguration finding.

❌ **Wrong:**
```bicep
resource nsg 'Microsoft.Network/networkSecurityGroups@2023-09-01' = {
  name: 'my-nsg'
  properties: {
    securityRules: [
      {
        name: 'AllowAll'
        properties: {
          priority: 100
          direction: 'Inbound'
          access: 'Allow'
          protocol: '*'
          sourceAddressPrefix: '*'      // Any source
          destinationAddressPrefix: '*'  // Any destination
          sourcePortRange: '*'
          destinationPortRange: '*'      // All ports
        }
      }
    ]
  }
}
```

✅ **Correct:**
```bicep
resource nsg 'Microsoft.Network/networkSecurityGroups@2023-09-01' = {
  name: 'my-nsg'
  properties: {
    securityRules: [
      {
        name: 'AllowHTTPS'
        properties: {
          priority: 100
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourceAddressPrefix: 'Internet'
          destinationAddressPrefix: 'VirtualNetwork'
          sourcePortRange: '*'
          destinationPortRange: '443'
        }
      }
      {
        name: 'AllowBastionSSH'
        properties: {
          priority: 200
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourceAddressPrefix: '10.0.1.0/24'  // Bastion subnet only
          destinationAddressPrefix: 'VirtualNetwork'
          sourcePortRange: '*'
          destinationPortRange: '22'
        }
      }
      // Default deny-all is implicit at priority 65500
    ]
  }
}
```

**Why:** NSGs have an implicit deny-all at the lowest priority. Only add explicit allow rules for required traffic. Never use `*` for source, destination, and port simultaneously. Use Azure Bastion for SSH/RDP instead of exposing ports to the internet.

### Rule 6: Enable NSG Flow Logs

**Impact:** HIGH — Without flow logs, you cannot investigate network-level security incidents.

✅ **Correct:**
```bicep
resource flowLog 'Microsoft.Network/networkWatchers/flowLogs@2023-09-01' = {
  name: '${networkWatcher.name}/nsg-flowlog'
  location: location
  properties: {
    targetResourceId: nsg.id
    storageId: logStorageAccount.id
    enabled: true
    format: { type: 'JSON', version: 2 }
    retentionPolicy: {
      enabled: true
      days: 90
    }
    flowAnalyticsConfiguration: {
      networkWatcherFlowAnalyticsConfiguration: {
        enabled: true
        workspaceResourceId: logAnalyticsWorkspace.id
        trafficAnalyticsInterval: 10
      }
    }
  }
}
```

**Why:** NSG flow logs record all network traffic decisions (allowed/denied). Traffic Analytics processes these logs into actionable dashboards. Retain for at least 90 days for incident investigation.

---

## Category 3: Threat Protection (HIGH)

### Rule 7: Enable Microsoft Defender for Cloud

**Impact:** HIGH — Defender for Cloud provides continuous security assessment and threat detection across all Azure resources.

✅ **Correct:**
```bicep
// Enable Defender for Cloud plans
resource defenderServers 'Microsoft.Security/pricings@2024-01-01' = {
  name: 'VirtualMachines'
  properties: { pricingTier: 'Standard' }
}

resource defenderStorage 'Microsoft.Security/pricings@2024-01-01' = {
  name: 'StorageAccounts'
  properties: {
    pricingTier: 'Standard'
    subPlan: 'DefenderForStorageV2'
  }
}

resource defenderKeyVault 'Microsoft.Security/pricings@2024-01-01' = {
  name: 'KeyVaults'
  properties: { pricingTier: 'Standard' }
}

resource defenderContainers 'Microsoft.Security/pricings@2024-01-01' = {
  name: 'Containers'
  properties: { pricingTier: 'Standard' }
}

// Security contacts for alerts
resource securityContact 'Microsoft.Security/securityContacts@2023-12-01-preview' = {
  name: 'default'
  properties: {
    emails: 'security@contoso.com'
    alertNotifications: { state: 'On', minimalSeverity: 'Medium' }
    notificationsByRole: { state: 'On', roles: ['Owner', 'Contributor'] }
  }
}
```

**Why:** Enable Defender at minimum for: Storage (malware scanning), Key Vault (suspicious access), Containers (image vulnerability scanning), and VMs/Servers (EDR). The free tier provides basic recommendations; Standard tier adds threat detection.

### Rule 8: Azure Policy for Compliance Enforcement

**Impact:** HIGH — Manual compliance checks are error-prone. Azure Policy enforces rules automatically.

❌ **Wrong:**
```
# Relying on documentation and code reviews to enforce security standards
# "All storage accounts must use HTTPS" — written in a wiki nobody reads
```

✅ **Correct:**
```bicep
// Built-in policy: Require HTTPS for storage accounts
resource httpsPolicy 'Microsoft.Authorization/policyAssignments@2024-04-01' = {
  name: 'require-https-storage'
  properties: {
    policyDefinitionId: '/providers/Microsoft.Authorization/policyDefinitions/404c3081-a854-4457-ae30-26a93ef643f9'
    displayName: 'Storage accounts should require HTTPS'
    enforcementMode: 'Default'  // 'Default' = deny, 'DoNotEnforce' = audit only
  }
}

// Custom policy: Require private endpoints for Cosmos DB
resource customPolicy 'Microsoft.Authorization/policyDefinitions@2024-05-01' = {
  name: 'require-private-endpoint-cosmosdb'
  properties: {
    policyType: 'Custom'
    mode: 'All'
    displayName: 'Cosmos DB accounts must use private endpoints'
    policyRule: {
      if: {
        allOf: [
          { field: 'type', equals: 'Microsoft.DocumentDB/databaseAccounts' }
          { field: 'Microsoft.DocumentDB/databaseAccounts/publicNetworkAccess', notEquals: 'Disabled' }
        ]
      }
      then: { effect: 'Deny' }
    }
  }
}
```

**Why:** Azure Policy can audit (report non-compliance) or deny (prevent non-compliant resource creation). Start with audit mode, then switch to deny after confirming no false positives. Use policy initiatives (groups of policies) for compliance frameworks like ISMS-P.

---

## Category 4: Secret Management (HIGH)

### Rule 9: Rotate Secrets Automatically

**Impact:** HIGH — Long-lived secrets are high-value targets. Automated rotation reduces exposure window.

❌ **Wrong:**
```python
# Secret created once, never rotated
# Last rotation: 2023-01-15 (over 3 years ago)
EXTERNAL_API_KEY = os.environ["PARTNER_API_KEY"]
```

✅ **Correct:**
```bicep
// Key Vault with rotation policy
resource secret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'partner-api-key'
  properties: {
    contentType: 'application/x-api-key'
    attributes: {
      enabled: true
      exp: dateTimeToEpoch(dateTimeAdd(utcNow(), 'P90D'))  // Expires in 90 days
    }
  }
}
```

```python
# Application reads from Key Vault — always gets current version
from azure.keyvault.secrets import SecretClient
from azure.identity import DefaultAzureCredential

client = SecretClient(
    vault_url="https://my-keyvault.vault.azure.net",
    credential=DefaultAzureCredential()
)

# Never cache secrets for longer than their rotation period
api_key = client.get_secret("partner-api-key").value
```

**Why:** Set Key Vault secret expiration to match your rotation schedule (30-90 days for API keys). Use Event Grid notifications on near-expiry events to trigger automated rotation via Azure Functions.

---

## Category 5: Monitoring & Incident Response (MEDIUM)

### Rule 10: Diagnostic Settings on All Resources

**Impact:** MEDIUM — Without diagnostic settings, security events are not captured for investigation.

✅ **Correct:**
```bicep
// Send logs to Log Analytics for security monitoring
resource diagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'security-logs'
  scope: keyVault
  properties: {
    workspaceId: logAnalyticsWorkspace.id
    logs: [
      { categoryGroup: 'allLogs', enabled: true }
    ]
    metrics: [
      { category: 'AllMetrics', enabled: true }
    ]
  }
}

// Alert on suspicious Key Vault access
resource kvAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'keyvault-suspicious-access'
  location: 'global'
  properties: {
    severity: 1
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'high-volume-secret-access'
          metricName: 'ServiceApiResult'
          dimensions: [{ name: 'ActivityType', operator: 'Include', values: ['SecretGet'] }]
          operator: 'GreaterThan'
          threshold: 100
          timeAggregation: 'Count'
        }
      ]
    }
    actions: [{ actionGroupId: securityActionGroup.id }]
  }
}
```

**Why:** Enable diagnostic settings on Key Vault, Storage, Entra ID, NSGs, and all data services. Send to Log Analytics Workspace for centralized query. Set alerts for anomalous patterns: high-volume secret access, failed authentication spikes, NSG deny events.

### Rule 11: Incident Response Runbook

**Impact:** MEDIUM — Without a documented response procedure, security incidents escalate due to confusion.

✅ **Template:**
```markdown
# Azure Security Incident Response Runbook

## Severity Classification
- **P1 (Critical):** Active data breach, compromised credentials, ransomware
- **P2 (High):** Unauthorized access detected, suspicious admin activity
- **P3 (Medium):** Policy violation, misconfiguration discovered
- **P4 (Low):** Informational security finding

## Immediate Response (P1/P2)
1. **Contain:** Disable compromised accounts/keys (`az ad user update --id <id> --account-enabled false`)
2. **Preserve:** Enable Key Vault soft delete and purge protection BEFORE deleting anything
3. **Investigate:** Query Log Analytics for scope of access
4. **Notify:** Security team (security@contoso.com), affected data owners
5. **Rotate:** All secrets in affected Key Vaults (`az keyvault secret set ...`)

## Investigation Queries (KQL)
```kusto
// Failed sign-ins from unusual locations
SigninLogs
| where ResultType != 0
| where Location !in ("KR", "US")  // Expected locations
| summarize count() by UserPrincipalName, Location, IPAddress
| order by count_ desc

// Key Vault access audit
AzureDiagnostics
| where ResourceType == "VAULTS"
| where OperationName == "SecretGet"
| extend UPN = parse_json(identity_s).claims.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn"]
| summarize count() by CallerIPAddress, tostring(UPN)
| order by count_ desc
```
```

**Why:** Document procedures BEFORE an incident. Include KQL queries for common investigation scenarios. Review and update quarterly.

### Rule 12: Regular Security Assessment Checklist

**Impact:** MEDIUM — Periodic security reviews catch configuration drift.

✅ **Monthly review checklist:**

```markdown
## Monthly Azure Security Assessment

**Identity & Access:**
- [ ] Review Entra ID sign-in logs for anomalies
- [ ] Audit privileged role assignments (az role assignment list)
- [ ] Verify Conditional Access policies are active
- [ ] Check for stale service principals (unused > 90 days)
- [ ] Review guest user access

**Secrets & Keys:**
- [ ] Check Key Vault secrets approaching expiration
- [ ] Verify no secrets in app settings or environment variables
- [ ] Review Key Vault access logs for unusual patterns

**Network:**
- [ ] Review NSG rules for overly permissive entries
- [ ] Verify private endpoints active for all data services
- [ ] Check NSG flow logs for denied traffic patterns

**Compliance:**
- [ ] Review Defender for Cloud Secure Score
- [ ] Address new security recommendations
- [ ] Verify Azure Policy compliance percentage
- [ ] Review and update incident response runbook
```

---

## Pre-Deployment Security Checklist

**Identity:**
- [ ] Key Vault uses RBAC (not access policies)
- [ ] Conditional Access enabled for admin roles
- [ ] Legacy authentication protocols blocked
- [ ] Service principals use federated credentials (not secrets)

**Network:**
- [ ] Private endpoints for all data services
- [ ] NSG rules follow deny-all-by-default
- [ ] NSG flow logs enabled with Traffic Analytics
- [ ] No public endpoints on databases or key vaults

**Threat Protection:**
- [ ] Defender for Cloud enabled (Storage, KeyVault, Containers minimum)
- [ ] Security contact configured for alerts
- [ ] Azure Policy assignments active (audit or deny mode)

**Secrets:**
- [ ] All secrets in Key Vault with expiration dates
- [ ] No hardcoded secrets in code, config, or environment variables
- [ ] Secret rotation schedule documented

**Monitoring:**
- [ ] Diagnostic settings on all critical resources
- [ ] Alerts configured for security anomalies
- [ ] Incident response runbook documented and tested
