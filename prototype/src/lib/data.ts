export type Status = "Active" | "Draft" | "Pending" | "Suspended" | "Revoked" | "Approved" | "Rejected" | "Partial";
export type ToolType = "read" | "write" | "critical_action";
export type Risk = "Low" | "Medium" | "High" | "Critical";
export type AccessLevel = "full" | "read" | "write" | "custom";
export type RequestType = "application_agent" | "collective_agent" | "agent_mcp" | "collective_mcp";
export type DeploymentStage = "draft" | "registered" | "certified" | "deployed" | "retired";
export type IdentityMode = "workload" | "end_user" | "pre_authorized";
export type AuthMode = "iam" | "oauth" | "api_key" | "none";

export type Application = { id: string; name: string; owner: string; businessArea: string; country: string; environment: string; description: string; status: Status; uuaa?: string };
export type Collective = { id: string; name: string; owner: string; businessArea: string; country: string; platform: string; description: string; status: Status; uuaa?: string };
export type Agent = { id: string; name: string; type: string; owner: string; businessArea: string; country: string; environment: string; criticality: Risk; description: string; status: Status; uuaa?: string; registryProvider?: string; registryAgentId?: string; agentVersion?: string; runtimeArn?: string; deploymentStage?: DeploymentStage; identityMode?: IdentityMode; observability?: string };
export type Tool = { id: string; name: string; description: string; type: ToolType; resource: string; sensitivity: Risk; risk: Risk; requiresApproval: boolean; status: Status; gatewayRoute?: string; toolSchema?: string };
export type Mcp = { id: string; name: string; owner: string; businessArea: string; backendSystem: string; country: string; environment: string; risk: Risk; description: string; status: Status; tools: Tool[]; uuaa?: string; gatewayId?: string; mcpServerId?: string; protocol?: string; authMode?: AuthMode; identityMode?: IdentityMode; observability?: string };
export type Subscription = { id: string; type: RequestType; sourceId: string; targetId: string; mcpId?: string; accessLevel: AccessLevel; toolIds: string[]; purpose: string; requester: string; approver: string; status: Status; conditions: string; expiration: string; updated: string };
export type AccessRequest = Subscription & { requestedAccess: AccessLevel; requestedToolIds: string[]; justification: string };
export type AuditEvent = { id: string; timestamp: string; actor: string; action: string; entity: string; decision: string; reason: string; correlationId: string };

export type AppState = {
  applications: Application[];
  collectives: Collective[];
  agents: Agent[];
  mcps: Mcp[];
  subscriptions: Subscription[];
  requests: AccessRequest[];
  audit: AuditEvent[];
};

const today = "03-07-2026";

const tool = (id: string, name: string, type: ToolType, resource: string, risk: Risk, requiresApproval = false): Tool => ({
  id,
  name,
  type,
  resource,
  risk,
  sensitivity: risk,
  requiresApproval,
  description: `${name} over ${resource}`,
  status: "Active",
  gatewayRoute: `/tools/${name}`,
  toolSchema: "json-schema:v1",
});

const agentRegistry = (id: string, stage: DeploymentStage = "deployed", identityMode: IdentityMode = "pre_authorized") => ({
  registryProvider: "Amazon Bedrock AgentCore Registry",
  registryAgentId: `agcore-${id}`,
  agentVersion: stage === "draft" ? "0.1.0" : "1.3.0",
  runtimeArn: `arn:aws:bedrock-agentcore:eu-west-1:012345678901:runtime/${id}`,
  deploymentStage: stage,
  identityMode,
  observability: "CloudWatch traces enabled",
});

const gateway = (id: string, authMode: AuthMode = "iam", identityMode: IdentityMode = "end_user") => ({
  gatewayId: `gw-${id}`,
  mcpServerId: `mcp-server-${id}`,
  protocol: "MCP via AgentCore Gateway",
  authMode,
  identityMode,
  observability: "Gateway invocation metrics enabled",
});

export const seedState: AppState = {
  applications: [
    { id: "app-mobile", name: "Mobile Banking App", owner: "Digital Channels Owner", businessArea: "Retail Banking", country: "ES", environment: "prod", description: "Customer mobile channel for retail banking journeys.", status: "Active", uuaa: "KDIT" },
    { id: "app-branch", name: "Branch Portal", owner: "Branch Network Owner", businessArea: "Branch Network", country: "ES", environment: "prod", description: "Assisted branch operations workplace.", status: "Active", uuaa: "KDIT" },
    { id: "app-crm", name: "CRM Next", owner: "Customer Service Owner", businessArea: "Customer Service", country: "ES", environment: "prod", description: "CRM workspace for contact center and customer care.", status: "Active", uuaa: "KDIT" },
    { id: "app-mortgage", name: "Mortgage Origination", owner: "Mortgage Platform Owner", businessArea: "Retail Banking", country: "ES", environment: "pre", description: "Mortgage assessment and origination flow.", status: "Active", uuaa: "KDIT" },
    { id: "app-payments", name: "Payments Backoffice", owner: "Payments Operations Owner", businessArea: "Payments", country: "ES", environment: "prod", description: "Backoffice workflows for payment operations.", status: "Active", uuaa: "KDIT" },
    { id: "app-fraud", name: "Fraud Console", owner: "Fraud Operations Owner", businessArea: "Fraud Prevention", country: "GL", environment: "prod", description: "Analyst console for fraud investigations.", status: "Active", uuaa: "KDIT" },
    { id: "app-wealth", name: "Wealth Hub", owner: "Wealth Digital Owner", businessArea: "Wealth Management", country: "ES", environment: "prod", description: "Advisory workspace for wealth managers.", status: "Active", uuaa: "KDIT" },
    { id: "app-compliance", name: "Compliance Workbench", owner: "Compliance Owner", businessArea: "Compliance", country: "GL", environment: "prod", description: "Regulatory review and evidence management.", status: "Active", uuaa: "KDIT" },
  ],
  collectives: [
    { id: "col-branch", name: "Branch Employees Spain", owner: "Branch Workforce Owner", businessArea: "Branch Network", country: "ES", platform: "ChatGPT Enterprise", description: "Employees using conversational AI in branches.", status: "Active", uuaa: "KDIT" },
    { id: "col-mortgage", name: "Mortgage Advisors", owner: "Mortgage Advisory Owner", businessArea: "Retail Banking", country: "ES", platform: "ChatGPT Enterprise", description: "Mortgage specialists asking for customer and loan context.", status: "Active", uuaa: "KDIT" },
    { id: "col-contact", name: "Contact Center Agents", owner: "Contact Center Owner", businessArea: "Customer Service", country: "ES", platform: "Gemini Enterprise", description: "Customer support teams using enterprise assistant.", status: "Active", uuaa: "KDIT" },
    { id: "col-fraud", name: "Fraud Analysts", owner: "Fraud Analytics Owner", businessArea: "Fraud Prevention", country: "GL", platform: "ChatGPT Enterprise", description: "Fraud analysts investigating alerts.", status: "Active", uuaa: "KDIT" },
    { id: "col-risk", name: "Corporate Risk Team", owner: "Risk Office Owner", businessArea: "Risk", country: "GL", platform: "Copilot Studio", description: "Risk managers consuming controlled data.", status: "Active", uuaa: "KDIT" },
    { id: "col-data", name: "Data Stewards", owner: "Data Governance Owner", businessArea: "Data Governance", country: "GL", platform: "ChatGPT Enterprise", description: "Data governance and quality users.", status: "Active", uuaa: "KDIT" },
  ],
  agents: [
    { id: "agt-customer", name: "CustomerServiceAgent", type: "service", owner: "Customer Service AI Owner", businessArea: "Customer Service", country: "ES", environment: "prod", criticality: "Medium", description: "Handles customer support summaries and CRM actions.", status: "Active", uuaa: "KDIT", ...agentRegistry("agt-customer") },
    { id: "agt-mortgage", name: "MortgageAdvisorAgent", type: "advisor", owner: "Mortgage AI Owner", businessArea: "Retail Banking", country: "ES", environment: "prod", criticality: "High", description: "Assists mortgage advisors with customer profile and affordability.", status: "Active", uuaa: "KDIT", ...agentRegistry("agt-mortgage", "certified") },
    { id: "agt-fraud", name: "FraudInvestigationAgent", type: "investigation", owner: "Fraud AI Owner", businessArea: "Fraud Prevention", country: "GL", environment: "prod", criticality: "Critical", description: "Supports fraud alert triage and investigations.", status: "Active", uuaa: "FRAD", ...agentRegistry("agt-fraud") },
    { id: "agt-payments", name: "PaymentsAssistantAgent", type: "operations", owner: "Payments AI Owner", businessArea: "Payments", country: "ES", environment: "pre", criticality: "Critical", description: "Assists payment operation teams.", status: "Active", uuaa: "PAYM", ...agentRegistry("agt-payments", "registered") },
    { id: "agt-branch", name: "BranchOperationsAgent", type: "operations", owner: "Branch AI Owner", businessArea: "Branch Network", country: "ES", environment: "prod", criticality: "High", description: "Guides branch staff through assisted operations.", status: "Active", uuaa: "KDIT", ...agentRegistry("agt-branch") },
    { id: "agt-wealth", name: "WealthAdvisorAgent", type: "advisor", owner: "Wealth AI Owner", businessArea: "Wealth Management", country: "ES", environment: "prod", criticality: "High", description: "Supports wealth advisors with portfolio insights.", status: "Active", uuaa: "WLTH", ...agentRegistry("agt-wealth", "certified") },
    { id: "agt-compliance", name: "ComplianceReviewAgent", type: "review", owner: "Compliance AI Owner", businessArea: "Compliance", country: "GL", environment: "prod", criticality: "High", description: "Reviews regulatory evidence and policies.", status: "Active", uuaa: "RISK", ...agentRegistry("agt-compliance") },
    { id: "agt-credit", name: "CreditRiskAgent", type: "risk", owner: "Credit Risk AI Owner", businessArea: "Risk", country: "GL", environment: "prod", criticality: "Critical", description: "Supports credit risk analysis.", status: "Active", uuaa: "RISK", ...agentRegistry("agt-credit", "certified") },
  ],
  mcps: [
    { id: "mcp-customer", name: "CustomerDataMCP", owner: "Customer Data Owner", businessArea: "Data Governance", backendSystem: "Customer 360", country: "ES", environment: "prod", risk: "High", description: "Customer profile and contact data tools.", status: "Active", uuaa: "KDIT", ...gateway("customer-data"), tools: [tool("t-profile", "getCustomerProfile", "read", "Customer Profile", "High"), tool("t-contact", "updateCustomerContactData", "write", "Customer Contact", "High", true), tool("t-consent", "getCustomerConsents", "read", "Privacy Consents", "High")] },
    { id: "mcp-accounts", name: "AccountsMCP", owner: "Accounts Data Owner", businessArea: "Retail Banking", backendSystem: "Core Accounts", country: "ES", environment: "prod", risk: "High", description: "Account balances and movements.", status: "Active", uuaa: "KDIT", ...gateway("accounts"), tools: [tool("t-balance", "getAccountBalance", "read", "Account", "High"), tool("t-tx", "getTransactionHistory", "read", "Transactions", "High"), tool("t-freeze", "freezeAccount", "critical_action", "Account", "Critical", true)] },
    { id: "mcp-payments", name: "PaymentsMCP", owner: "Payments Owner", businessArea: "Payments", backendSystem: "Payment Hub", country: "ES", environment: "prod", risk: "Critical", description: "Payment initiation and status tools.", status: "Active", uuaa: "PAYM", ...gateway("payments", "iam", "pre_authorized"), tools: [tool("t-pay-status", "getPaymentStatus", "read", "Payment", "Medium"), tool("t-init-pay", "initiatePayment", "critical_action", "Payment", "Critical", true), tool("t-cancel-pay", "cancelPayment", "write", "Payment", "Critical", true)] },
    { id: "mcp-cards", name: "CardsMCP", owner: "Cards Owner", businessArea: "Retail Banking", backendSystem: "Cards Platform", country: "ES", environment: "prod", risk: "High", description: "Card data and operations.", status: "Active", uuaa: "CARD", ...gateway("cards"), tools: [tool("t-card", "getCardDetails", "read", "Card", "High"), tool("t-block", "blockCard", "critical_action", "Card", "Critical", true), tool("t-limits", "updateCardLimits", "write", "Card", "High", true)] },
    { id: "mcp-loans", name: "LoansMCP", owner: "Loans Owner", businessArea: "Retail Banking", backendSystem: "Loan Origination", country: "ES", environment: "prod", risk: "High", description: "Loan and mortgage information.", status: "Active", uuaa: "LOAN", ...gateway("loans"), tools: [tool("t-mortgage", "getMortgageSimulation", "read", "Mortgage", "Medium"), tool("t-loan", "getLoanApplication", "read", "Loan", "High"), tool("t-credit-ex", "approveCreditException", "critical_action", "Credit", "Critical", true)] },
    { id: "mcp-fraud", name: "FraudMCP", owner: "Fraud Data Owner", businessArea: "Fraud Prevention", backendSystem: "Fraud Engine", country: "GL", environment: "prod", risk: "Critical", description: "Fraud alerts and risk assessment.", status: "Active", uuaa: "FRAD", ...gateway("fraud", "oauth", "end_user"), tools: [tool("t-fraud-risk", "assessFraudRisk", "read", "Fraud Signal", "High"), tool("t-flag", "flagSuspiciousTransaction", "write", "Transaction", "Critical", true), tool("t-case-link", "linkFraudCase", "write", "Fraud Case", "High", true)] },
    { id: "mcp-crm", name: "CRMCaseMCP", owner: "CRM Owner", businessArea: "Customer Service", backendSystem: "CRM Next", country: "ES", environment: "prod", risk: "Medium", description: "CRM case management.", status: "Active", uuaa: "KDIT", ...gateway("crm-case"), tools: [tool("t-case", "createCRMCase", "write", "CRM Case", "Medium"), tool("t-case-read", "getCRMCase", "read", "CRM Case", "Medium"), tool("t-case-note", "addCaseNote", "write", "CRM Case", "Medium")] },
    { id: "mcp-doc", name: "DocumentRetrievalMCP", owner: "Document Platform Owner", businessArea: "Data Governance", backendSystem: "Documentum", country: "GL", environment: "prod", risk: "High", description: "Signed contracts and document search.", status: "Active", uuaa: "DATA", ...gateway("document-retrieval", "oauth", "end_user"), tools: [tool("t-doc-search", "searchCustomerDocuments", "read", "Documents", "High"), tool("t-contract", "retrieveSignedContract", "read", "Contracts", "High"), tool("t-doc-class", "classifyDocument", "write", "Documents", "Medium")] },
    { id: "mcp-risk", name: "RiskScoringMCP", owner: "Risk Models Owner", businessArea: "Risk", backendSystem: "Risk Scoring", country: "GL", environment: "prod", risk: "High", description: "Risk scoring services.", status: "Active", uuaa: "RISK", ...gateway("risk-scoring", "iam", "pre_authorized"), tools: [tool("t-score", "getCreditRiskScore", "read", "Risk Score", "High"), tool("t-stress", "runStressScenario", "critical_action", "Risk Model", "Critical", true), tool("t-limit", "recommendCreditLimit", "read", "Credit Limit", "High")] },
    { id: "mcp-comp", name: "ComplianceMCP", owner: "Compliance Data Owner", businessArea: "Compliance", backendSystem: "GRC Platform", country: "GL", environment: "prod", risk: "High", description: "Compliance checks and evidence.", status: "Active", uuaa: "RISK", ...gateway("compliance", "oauth", "end_user"), tools: [tool("t-kyc", "getKycStatus", "read", "KYC", "High"), tool("t-sanctions", "screenSanctionsList", "read", "Sanctions", "Critical"), tool("t-evidence", "attachComplianceEvidence", "write", "Evidence", "High", true)] },
  ],
  subscriptions: [
    { id: "sub-aa-1", type: "application_agent", sourceId: "app-crm", targetId: "agt-customer", accessLevel: "full", toolIds: [], purpose: "Customer support automation", requester: "Customer Service Owner", approver: "Customer Service AI Owner", status: "Active", conditions: "CRM channel only", expiration: "31-12-2026", updated: today },
    { id: "sub-aa-2", type: "application_agent", sourceId: "app-mortgage", targetId: "agt-mortgage", accessLevel: "full", toolIds: [], purpose: "Mortgage assessment", requester: "Mortgage Platform Owner", approver: "Mortgage AI Owner", status: "Active", conditions: "Mortgage advisors only", expiration: "31-12-2026", updated: today },
    { id: "sub-aa-3", type: "application_agent", sourceId: "app-fraud", targetId: "agt-fraud", accessLevel: "full", toolIds: [], purpose: "Fraud investigation", requester: "Fraud Operations Owner", approver: "Fraud AI Owner", status: "Active", conditions: "Analyst workflow", expiration: "31-12-2026", updated: today },
    { id: "sub-am-1", type: "agent_mcp", sourceId: "agt-customer", targetId: "mcp-customer", mcpId: "mcp-customer", accessLevel: "read", toolIds: [], purpose: "Customer lookup", requester: "Customer Service AI Owner", approver: "Customer Data Owner", status: "Active", conditions: "Mask sensitive fields", expiration: "31-12-2026", updated: today },
    { id: "sub-am-2", type: "agent_mcp", sourceId: "agt-customer", targetId: "mcp-crm", mcpId: "mcp-crm", accessLevel: "write", toolIds: [], purpose: "CRM case creation", requester: "Customer Service AI Owner", approver: "CRM Owner", status: "Active", conditions: "Audit every write", expiration: "31-12-2026", updated: today },
    { id: "sub-am-3", type: "agent_mcp", sourceId: "agt-mortgage", targetId: "mcp-loans", mcpId: "mcp-loans", accessLevel: "read", toolIds: [], purpose: "Mortgage simulation", requester: "Mortgage AI Owner", approver: "Loans Owner", status: "Active", conditions: "No credit exception approvals", expiration: "31-12-2026", updated: today },
    { id: "sub-am-4", type: "agent_mcp", sourceId: "agt-fraud", targetId: "mcp-fraud", mcpId: "mcp-fraud", accessLevel: "custom", toolIds: ["t-fraud-risk", "t-flag"], purpose: "Fraud triage", requester: "Fraud AI Owner", approver: "Fraud Data Owner", status: "Active", conditions: "Human review for flags", expiration: "31-12-2026", updated: today },
    { id: "sub-cm-1", type: "collective_mcp", sourceId: "col-mortgage", targetId: "mcp-customer", mcpId: "mcp-customer", accessLevel: "read", toolIds: [], purpose: "Conversational customer context", requester: "Mortgage Advisory Owner", approver: "Customer Data Owner", status: "Active", conditions: "End user identity propagated", expiration: "31-12-2026", updated: today },
    { id: "sub-cm-2", type: "collective_mcp", sourceId: "col-fraud", targetId: "mcp-fraud", mcpId: "mcp-fraud", accessLevel: "read", toolIds: [], purpose: "Fraud analysis assistant", requester: "Fraud Analytics Owner", approver: "Fraud Data Owner", status: "Active", conditions: "Read-only in assistant", expiration: "31-12-2026", updated: today },
  ],
  requests: [
    { id: "req-1", type: "application_agent", sourceId: "app-mobile", targetId: "agt-customer", accessLevel: "full", requestedAccess: "full", requestedToolIds: [], toolIds: [], purpose: "Self-service customer care", requester: "Digital Channels Owner", approver: "Customer Service AI Owner", status: "Pending", conditions: "", expiration: "31-12-2026", updated: today, justification: "Mobile channel wants AI-assisted customer answers." },
    { id: "req-2", type: "agent_mcp", sourceId: "agt-payments", targetId: "mcp-payments", mcpId: "mcp-payments", accessLevel: "full", requestedAccess: "full", requestedToolIds: [], toolIds: [], purpose: "Payment operations assistant", requester: "Payments AI Owner", approver: "Payments Owner", status: "Pending", conditions: "", expiration: "30-09-2026", updated: today, justification: "Backoffice assistant needs payment operations tools." },
    { id: "req-3", type: "collective_mcp", sourceId: "col-contact", targetId: "mcp-crm", mcpId: "mcp-crm", accessLevel: "read", requestedAccess: "read", requestedToolIds: [], toolIds: [], purpose: "CRM case lookup from Gemini Enterprise", requester: "Contact Center Owner", approver: "CRM Owner", status: "Pending", conditions: "", expiration: "31-12-2026", updated: today, justification: "Agents need case lookup in conversational assistant." },
  ],
  audit: [
    { id: "aud-1", timestamp: "03-07-2026 11:07:22", actor: "system", action: "seed_loaded", entity: "console", decision: "allow", reason: "Initial financial mock data loaded", correlationId: "ADA-0001" },
    { id: "aud-2", timestamp: "03-07-2026 11:09:10", actor: "Customer Data Owner", action: "subscription_approved", entity: "CustomerServiceAgent -> CustomerDataMCP", decision: "allow", reason: "Read-only with masking", correlationId: "ADA-0002" },
  ],
};

export const newId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
export const nowStamp = () => new Date().toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", "");
