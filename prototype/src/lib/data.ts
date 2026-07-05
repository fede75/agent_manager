export type Status = "Active" | "Draft" | "Pending" | "Suspended" | "Revoked" | "Approved" | "Rejected" | "Partial";
export type ToolType = "read" | "write" | "critical_action";
export type Risk = "Low" | "Medium" | "High" | "Critical";
export type AccessLevel = "full" | "read" | "write" | "custom";
export type RequestType = "application_agent" | "agent_mcp" | "collective_mcp" | "agent_skill";
export type DeploymentStage = "draft" | "registered" | "certified" | "deployed" | "retired";
export type IdentityMode = "workload" | "end_user" | "pre_authorized";
export type AuthMode = "iam" | "oauth" | "api_key" | "none";
export type SkillUsagePolicy = "open" | "restricted" | "approval_required";
export type SkillStatus = "draft" | "under_review" | "approved" | "deprecated" | "retired";
export type SkillVersionStatus = "draft" | "approved" | "deprecated" | "retired";

export type Application = { id: string; name: string; owner: string; businessArea: string; country: string; environment: string; description: string; status: Status; uuaa?: string };
export type Collective = { id: string; name: string; owner: string; businessArea: string; country: string; platform: string; description: string; status: Status; uuaa?: string };
export type Agent = { id: string; name: string; type: string; owner: string; businessArea: string; country: string; environment: string; criticality: Risk; description: string; status: Status; uuaa?: string; registryProvider?: string; registryAgentId?: string; agentVersion?: string; runtimeArn?: string; deploymentStage?: DeploymentStage; identityMode?: IdentityMode; observability?: string };
export type Tool = { id: string; name: string; description: string; type: ToolType; resource: string; sensitivity: Risk; risk: Risk; requiresApproval: boolean; status: Status; gatewayRoute?: string; toolSchema?: string };
export type Mcp = { id: string; name: string; owner: string; businessArea: string; backendSystem: string; country: string; environment: string; risk: Risk; description: string; status: Status; tools: Tool[]; uuaa?: string; gatewayId?: string; mcpServerId?: string; protocol?: string; authMode?: AuthMode; identityMode?: IdentityMode; observability?: string };
export type Skill = { id: string; ada_skill_id: string; name: string; description: string; descriptor_type: "AGENT_SKILL"; owner_uuaa: string; skill_owner: string; domain: string; status: SkillStatus; visibility: "public_internal" | "restricted"; usage_policy: SkillUsagePolicy; risk_level: Risk; data_classification: "internal" | "confidential" | "restricted"; allowed_agent_types: string[]; allowed_uuaas: string[]; tags: string[]; governance_reference: string; registry_provider: "AWS_AGENT_REGISTRY" | "INTERNAL" | "GIT" | "OTHER"; registry_id: string; registry_record_id: string; registry_record_arn: string; registry_record_status: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "DEPRECATED"; registry_endpoint_type: "API" | "MCP_ENDPOINT" | "NONE"; last_sync_status: "never_synced" | "synced" | "sync_error"; last_sync_date: string; created_at: string; updated_at: string };
export type SkillVersion = { id: string; ada_skill_version_id: string; skill_id: string; version: string; status: SkillVersionStatus; change_type: "patch" | "minor" | "major"; breaking_change: boolean; release_notes: string; registry_record_version: string; registry_record_revision_id: string; artifact_format: "SKILL_MD" | "MARKDOWN_PLUS_JSON" | "CUSTOM_JSON"; artifact_location: string; definition_json_location: string; specification_markdown: string; instruction_summary: string; input_contract: string; output_contract: string; required_tools: string[]; required_mcp_servers: string[]; constraints: string[]; safety_notes: string[]; examples: string[]; compatible_runtimes: string[]; requires_recertification: boolean; published_at: string; deprecated_at: string; retirement_date: string };
export type AgentSkillAssociation = { id: string; association_id: string; agent_id: string; skill_id: string; skill_version: string; authorization_status: "active" | "revoked" | "pending"; upgrade_policy: "pinned" | "auto_patch"; associated_by: string; associated_at: string; approval_request_id: string };
export type Subscription = { id: string; type: RequestType; sourceId: string; targetId: string; mcpId?: string; accessLevel: AccessLevel; toolIds: string[]; purpose: string; requester: string; approver: string; status: Status; conditions: string; expiration: string; updated: string };
export type AccessRequest = Subscription & { requestedAccess: AccessLevel; requestedToolIds: string[]; justification: string; skillId?: string; requestedVersion?: string; approvedVersion?: string; approvalPolicyApplied?: SkillUsagePolicy; riskLevel?: Risk };
export type AuditEvent = { id: string; timestamp: string; actor: string; action: string; entity: string; decision: string; reason: string; correlationId: string };

export type AppState = {
  applications: Application[];
  collectives: Collective[];
  agents: Agent[];
  mcps: Mcp[];
  skills: Skill[];
  skillVersions: SkillVersion[];
  agentSkillAssociations: AgentSkillAssociation[];
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

const skill = (id: string, name: string, owner_uuaa: string, domain: string, risk_level: Risk, usage_policy: SkillUsagePolicy): Skill => ({
  id,
  ada_skill_id: id,
  name,
  description: `${name} corporate reusable agent skill.`,
  descriptor_type: "AGENT_SKILL",
  owner_uuaa,
  skill_owner: `${domain} Skill Owner`,
  domain,
  status: "approved",
  visibility: usage_policy === "open" ? "public_internal" : "restricted",
  usage_policy,
  risk_level,
  data_classification: risk_level === "Critical" ? "restricted" : risk_level === "High" ? "confidential" : "internal",
  allowed_agent_types: ["service", "advisor", "review", "risk", "investigation", "operations"],
  allowed_uuaas: [owner_uuaa, "KDIT", "RISK", "DATA", "FRAD"],
  tags: [domain.toLowerCase().replaceAll(" ", "-"), usage_policy],
  governance_reference: `GOV-${id.split(".").pop()?.toUpperCase()}`,
  registry_provider: "AWS_AGENT_REGISTRY",
  registry_id: `skill-registry-${owner_uuaa.toLowerCase()}`,
  registry_record_id: `record-${id.split(".").pop()}`,
  registry_record_arn: `arn:aws:bedrock-agentcore:eu-west-1:012345678901:skill/${id}`,
  registry_record_status: "APPROVED",
  registry_endpoint_type: "NONE",
  last_sync_status: "synced",
  last_sync_date: today,
  created_at: today,
  updated_at: today,
});

export const skillMarkdown = (skill_id: string, version: string) => {
  const examples: Record<string, string> = {
    "bbva.skill.gdpr-redaction": `# bbva.skill.gdpr-redaction v${version}

## Purpose
Redact and minimize personal data before an ADA agent writes summaries, CRM notes or customer-service responses.

## When To Use
- Customer, employee or third-party personal data appears in context.
- The output may be copied to CRM, audit notes or customer support tools.

## Agent Instructions
1. Detect names, national IDs, phone numbers, emails, addresses, account numbers and card numbers.
2. Replace direct identifiers with labels such as [CUSTOMER], [ACCOUNT] or [PHONE].
3. Preserve business meaning while minimizing personal data.
4. Escalate when the user asks to reveal restricted personal data.

## Input Contract
- customer_context
- target_channel
- requester_role: role invoking the agent.
- allowed_fields

## Output Contract
- redacted_text
- redaction_summary
- residual_risk
- escalation_required

## Acceptance Criteria
- Direct identifiers are removed unless explicitly allowed.
- Account and card numbers are always masked.
- The output remains useful for the business task.

## Example
Input: "Maria Garcia, DNI 12345678Z, called from +34 600111222 about account ES12..."

Output:
- redacted_text: "[CUSTOMER] called from [PHONE] about [ACCOUNT]."
- redaction_summary: "name, national id, phone, account"
- residual_risk: "low"
- escalation_required: false
`,
    "bbva.skill.complaint-classification": `# bbva.skill.complaint-classification v${version}

## Purpose
Classify customer complaints into BBVA operational categories and produce a concise rationale for CRM routing.

## Agent Instructions
1. Identify the primary complaint driver.
2. Choose exactly one primary category and, when useful, one secondary category.
3. Extract evidence phrases from supplied text only.
4. Estimate urgency from customer impact, financial loss and regulatory sensitivity.
5. Do not decide compensation or final complaint resolution.

## Input Contract
- complaint_text
- channel
- product_context

## Output Contract
- primary_category
- secondary_category
- urgency
- rationale
- recommended_owner_queue

## Acceptance Criteria
- Classification is evidence-based.
- High urgency is used for fraud, vulnerable customer, financial loss or regulatory risk.

## Example
Input: "The app charged me twice for the same transfer and nobody has answered my claim."

Output:
- primary_category: "payments"
- secondary_category: "digital_channels"
- urgency: "high"
- rationale: "Customer reports duplicate transfer charge and unresolved claim."
- recommended_owner_queue: "Payments Operations"
`,
    "bbva.skill.fraud-investigation-runbook": `# bbva.skill.fraud-investigation-runbook v${version}

## Purpose
Guide fraud investigation agents through controlled triage without autonomous blocking or refund decisions.

## Agent Instructions
1. Summarize alert, transaction pattern and customer impact.
2. Check available transaction, device, merchant, geo and previous-case evidence.
3. Rank indicators as confirmed, suspicious or missing.
4. Recommend next analyst action, not a final fraud decision.
5. Require human review before account, card or payment restrictions.

## Input Contract
- alert_payload
- transaction_context
- customer_contact_history
- available_evidence_refs

## Output Contract
- case_summary
- fraud_indicators
- missing_evidence
- recommended_next_action
- human_review_required

## Example
Output:
- case_summary: "Three card-not-present purchases from new device within 8 minutes."
- fraud_indicators: ["new_device", "velocity", "merchant_risk"]
- missing_evidence: ["customer confirmation"]
- recommended_next_action: "Contact customer and hold analyst review."
- human_review_required: true
`,
    "bbva.skill.credit-risk-policy-review": `# bbva.skill.credit-risk-policy-review v${version}

## Purpose
Help credit risk agents review policy evidence and produce non-binding analysis for human decision makers.

## Agent Instructions
1. Compare application facts against supplied policy excerpts.
2. Separate facts, assumptions and missing evidence.
3. Highlight policy breaches and compensating factors.
4. Never approve, reject or price credit autonomously.

## Input Contract
- application_summary
- risk_metrics
- policy_evidence
- analyst_question

## Output Contract
- policy_findings
- risk_observations
- missing_information
- recommended_human_review_focus

## Example
Output:
- policy_findings: "Debt-to-income exceeds threshold in supplied policy section 4.2."
- risk_observations: "Stable payroll income partially mitigates volatility."
- missing_information: "Updated bureau score not provided."
- recommended_human_review_focus: "Validate affordability exception criteria."
`,
    "bbva.skill.mcp-security-review": `# bbva.skill.mcp-security-review v${version}

## Purpose
Review requested MCP/tool access and identify security, identity and data-governance concerns.

## Agent Instructions
1. Inspect requested MCP, tool types and access level.
2. Flag write or critical_action tools.
3. Verify identity propagation and audit requirements.
4. Recommend least-privilege alternatives when full access is requested.

## Input Contract
- agent_metadata
- mcp_metadata
- requested_tools
- requested_access
- business_justification

## Output Contract
- risk_summary
- least_privilege_recommendation
- required_controls
- approval_recommendation

## Example
Output:
- risk_summary: "Full access includes write tool updateCustomerContactData."
- least_privilege_recommendation: "Approve read tools only plus createCRMCase."
- required_controls: ["end_user_identity", "audit_log", "case_reference"]
- approval_recommendation: "partial"
`,
    "bbva.skill.data-product-onboarding": `# bbva.skill.data-product-onboarding v${version}

## Purpose
Guide agents through onboarding a data product with ownership, classification and governance evidence.

## Agent Instructions
1. Identify producer, consumer, data domain and UUAA.
2. Confirm data classification and retention constraints.
3. Check that governance reference and quality owner exist.
4. Generate a missing-evidence checklist.

## Input Contract
- data_product_description
- owner_metadata
- data_classification
- consumer_use_case

## Output Contract
- onboarding_summary
- missing_controls
- data_governance_questions
- next_steps

## Example
Output:
- onboarding_summary: "Customer complaints mart for service analytics."
- missing_controls: ["retention_policy", "quality_slo"]
- data_governance_questions: ["Is personal data tokenized?"]
- next_steps: ["Create OneTrust reference", "Assign data steward"]
`,
    "bbva.skill.customer-response-drafting": `# bbva.skill.customer-response-drafting v${version}

## Purpose
Draft clear, empathetic and policy-safe customer responses for service agents.

## Agent Instructions
1. Use plain language and a calm professional tone.
2. Do not promise compensation, approval or timelines not present in evidence.
3. Include next steps and ownership when available.
4. Avoid exposing internal-only notes or restricted data.

## Input Contract
- customer_issue
- known_facts
- allowed_message_points
- channel

## Output Contract
- draft_response
- tone_notes
- omitted_sensitive_information
- escalation_required

## Example
Output:
- draft_response: "We are reviewing your case and will update you through the secure channel once the pending checks are complete."
- tone_notes: "empathetic, concise"
- omitted_sensitive_information: ["internal risk marker"]
- escalation_required: false
`,
  };
  if (examples[skill_id]) return examples[skill_id];
  return `# ${skill_id} v${version}

## Purpose
This Skill defines the mandatory operating instructions an ADA agent must follow when using this capability in a BBVA financial workflow.

## When To Use
- Use only when the agent has an approved Agent -> Skill association for this exact version.
- Use when the user request matches the business domain and input context is sufficient.

## Agent Instructions
1. Read the full business context before producing an answer.
2. Apply BBVA data classification and privacy rules.
3. Produce grounded outputs with a short rationale.
4. Escalate when confidence is low or policy evidence is missing.

## Input Contract
- business_context
- requester_role
- evidence_refs

## Output Contract
- decision_or_recommendation
- rationale
- controls_applied
- escalation_required

## Example
Input: Customer service case with free-text complaint and CRM notes.

Output:
- classification: service_quality
- rationale: complaint references branch waiting time and unresolved follow-up.
- controls_applied: customer identifiers redacted.
- escalation_required: false
`;
};

const skillVersion = (skill_id: string, version: string, change_type: "patch" | "minor" | "major" = "minor", breaking_change = false): SkillVersion => ({
  id: `${skill_id}:${version}`,
  ada_skill_version_id: `${skill_id}:${version}`,
  skill_id,
  version,
  status: "approved",
  change_type,
  breaking_change,
  release_notes: `Release ${version} for ${skill_id}`,
  registry_record_version: version,
  registry_record_revision_id: `rev-${skill_id.split(".").pop()}-${version.replaceAll(".", "-")}`,
  artifact_format: "SKILL_MD",
  artifact_location: `s3://ada-agent-skills/${skill_id}/${version}/SKILL.md`,
  definition_json_location: `s3://ada-agent-skills/${skill_id}/${version}/definition.json`,
  specification_markdown: skillMarkdown(skill_id, version),
  instruction_summary: "Reusable operating instructions and guardrails for regulated banking workflows.",
  input_contract: "Structured customer, case or policy context.",
  output_contract: "Grounded recommendation, summary or classification with rationale.",
  required_tools: [],
  required_mcp_servers: [],
  constraints: ["No autonomous customer-impacting decision", "Preserve auditability"],
  safety_notes: ["Escalate low confidence outputs", "Respect data classification"],
  examples: ["Review input context and produce compliant response."],
  compatible_runtimes: ["AgentCore Runtime", "ADA Python Runtime"],
  requires_recertification: breaking_change,
  published_at: today,
  deprecated_at: "",
  retirement_date: "31-12-2026",
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
  skills: [
    skill("bbva.skill.gdpr-redaction", "GDPR Redaction Skill", "DATA", "Data Governance", "Medium", "approval_required"),
    skill("bbva.skill.complaint-classification", "Complaint Classification Skill", "KDIT", "Customer Service", "Medium", "restricted"),
    skill("bbva.skill.fraud-investigation-runbook", "Fraud Investigation Runbook Skill", "FRAD", "Fraud Prevention", "High", "approval_required"),
    skill("bbva.skill.credit-risk-policy-review", "Credit Risk Policy Review Skill", "RISK", "Risk", "Critical", "approval_required"),
    skill("bbva.skill.mcp-security-review", "MCP Security Review Skill", "KDIT", "Platform Engineering", "High", "restricted"),
    skill("bbva.skill.data-product-onboarding", "Data Product Onboarding Skill", "DATA", "Data Governance", "Medium", "open"),
    skill("bbva.skill.customer-response-drafting", "Customer Response Drafting Skill", "KDIT", "Customer Service", "Low", "open"),
  ],
  skillVersions: [
    skillVersion("bbva.skill.gdpr-redaction", "1.1.0", "minor"),
    skillVersion("bbva.skill.gdpr-redaction", "1.2.0", "minor"),
    skillVersion("bbva.skill.complaint-classification", "2.1.0", "minor"),
    skillVersion("bbva.skill.fraud-investigation-runbook", "3.0.0", "major", true),
    skillVersion("bbva.skill.credit-risk-policy-review", "1.0.0", "major"),
    skillVersion("bbva.skill.mcp-security-review", "1.4.0", "minor"),
    skillVersion("bbva.skill.data-product-onboarding", "1.1.0", "minor"),
    skillVersion("bbva.skill.customer-response-drafting", "2.2.0", "minor"),
    skillVersion("bbva.skill.customer-response-drafting", "2.3.0", "minor"),
  ],
  agentSkillAssociations: [
    { id: "ask-1", association_id: "ask-1", agent_id: "agt-customer", skill_id: "bbva.skill.gdpr-redaction", skill_version: "1.2.0", authorization_status: "active", upgrade_policy: "pinned", associated_by: "Customer Service AI Owner", associated_at: today, approval_request_id: "req-skill-1" },
    { id: "ask-2", association_id: "ask-2", agent_id: "agt-compliance", skill_id: "bbva.skill.gdpr-redaction", skill_version: "1.2.0", authorization_status: "active", upgrade_policy: "pinned", associated_by: "Compliance AI Owner", associated_at: today, approval_request_id: "req-skill-2" },
    { id: "ask-3", association_id: "ask-3", agent_id: "agt-customer", skill_id: "bbva.skill.complaint-classification", skill_version: "2.1.0", authorization_status: "active", upgrade_policy: "pinned", associated_by: "Customer Service AI Owner", associated_at: today, approval_request_id: "" },
    { id: "ask-4", association_id: "ask-4", agent_id: "agt-fraud", skill_id: "bbva.skill.fraud-investigation-runbook", skill_version: "3.0.0", authorization_status: "active", upgrade_policy: "pinned", associated_by: "Fraud AI Owner", associated_at: today, approval_request_id: "req-skill-3" },
    { id: "ask-5", association_id: "ask-5", agent_id: "agt-credit", skill_id: "bbva.skill.credit-risk-policy-review", skill_version: "1.0.0", authorization_status: "active", upgrade_policy: "pinned", associated_by: "Credit Risk AI Owner", associated_at: today, approval_request_id: "req-skill-4" },
    { id: "ask-6", association_id: "ask-6", agent_id: "agt-compliance", skill_id: "bbva.skill.mcp-security-review", skill_version: "1.4.0", authorization_status: "active", upgrade_policy: "pinned", associated_by: "Compliance AI Owner", associated_at: today, approval_request_id: "" },
    { id: "ask-7", association_id: "ask-7", agent_id: "agt-customer", skill_id: "bbva.skill.customer-response-drafting", skill_version: "2.3.0", authorization_status: "active", upgrade_policy: "auto_patch", associated_by: "Customer Service AI Owner", associated_at: today, approval_request_id: "" },
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
    { id: "req-skill-5", type: "agent_skill", sourceId: "agt-branch", targetId: "bbva.skill.gdpr-redaction", skillId: "bbva.skill.gdpr-redaction", requestedVersion: "1.2.0", approvedVersion: "", approvalPolicyApplied: "approval_required", riskLevel: "Medium", accessLevel: "full", requestedAccess: "full", requestedToolIds: [], toolIds: [], purpose: "Branch summaries must redact personal data", requester: "Branch AI Owner", approver: "Data Governance Skill Owner", status: "Pending", conditions: "", expiration: "31-12-2026", updated: today, justification: "BranchOperationsAgent needs GDPR-safe summaries." },
  ],
  audit: [
    { id: "aud-1", timestamp: "03-07-2026 11:07:22", actor: "system", action: "seed_loaded", entity: "console", decision: "allow", reason: "Initial financial mock data loaded", correlationId: "ADA-0001" },
    { id: "aud-2", timestamp: "03-07-2026 11:09:10", actor: "Customer Data Owner", action: "subscription_approved", entity: "CustomerServiceAgent -> CustomerDataMCP", decision: "allow", reason: "Read-only with masking", correlationId: "ADA-0002" },
  ],
};

export const newId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
export const nowStamp = () => new Date().toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", "");
