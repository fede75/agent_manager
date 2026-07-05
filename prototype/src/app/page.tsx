"use client";

import { useEffect, useState } from "react";
import { AppState, AccessLevel, RequestType, seedState, newId, nowStamp, skillMarkdown } from "@/lib/data";

const storageKey = "ada-ai-agents-console-state";
const disabledMenuMessage = "Funcionlidad no habilitada en la Maqueta. Usar funcionalidades dentro del apartado AI Agents";
const aiSections = ["AI Applications", "ChatApps Collectives", "Agents", "MCPs", "Skills"];
const uuaas = ["KDIT", "PAYM", "FRAD", "RISK", "DATA", "CARD", "LOAN", "WLTH"];
const profiles = ["Project Owner", "Operations", "AI Engineer", "Application Manager"];
const placeholderSections = ["Catalog", "Data Lake Subscriptions", "Engines", "Models", "SAS Sync", "Data", "Jobs", "Configurations", "Queue", "Projects", "Inferences", "Reports"];
const icons: Record<string, string> = {
  Dashboard: "◉",
  Catalog: "☷",
  "Data Lake Subscriptions": "▰",
  Engines: "✜",
  Models: "♙",
  "SAS Sync": "⇆",
  Data: "▰",
  Jobs: "☄",
  Configurations: "⚙",
  Queue: "◒",
  Projects: "▣",
  Inferences: "✹",
  Authorizations: "◈",
  Reports: "⌁",
  "AI Applications": "▣",
  "ChatApps Collectives": "◎",
  Agents: "✣",
  MCPs: "▦",
  Skills: "✦",
  Subscriptions: "↔",
};

export default function Home() {
  const [state, setState] = useState<AppState>(seedState);
  const [section, setSection] = useState("Dashboard");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ kind: string; id: string } | null>(null);
  const [toast, setToast] = useState("");
  const [disabledMenuModal, setDisabledMenuModal] = useState(false);
  const [selectedUuaa, setSelectedUuaa] = useState("KDIT");
  const [profile, setProfile] = useState("Project Owner");
  const [directoryViews, setDirectoryViews] = useState<Record<string, "table" | "cards">>({ "AI Applications": "cards", "ChatApps Collectives": "cards", Skills: "cards" });

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setState(normalizeState(JSON.parse(saved)));
  }, []);
  useEffect(() => localStorage.setItem(storageKey, JSON.stringify(state)), [state]);

  const audit = (actor: string, action: string, entity: string, decision: string, reason: string) => {
    setState((s) => ({ ...s, audit: [{ id: newId("aud"), timestamp: nowStamp(), actor, action, entity, decision, reason, correlationId: `ADA-${Math.floor(Math.random() * 90000 + 10000)}` }, ...s.audit] }));
  };

  const addEntity = (kind: string, data: any) => {
    setState((s) => {
      const next: AppState = { ...s };
      if (kind === "application") next.applications = [{ id: newId("app"), status: "Active", uuaa: selectedUuaa, ...data }, ...s.applications];
      if (kind === "collective") next.collectives = [{ id: newId("col"), status: "Active", uuaa: selectedUuaa, ...data }, ...s.collectives];
      if (kind === "agent") {
        const id = newId("agt");
        next.agents = [{ id, status: "Active", uuaa: selectedUuaa, ...defaultAgentCore(id), ...data }, ...s.agents];
      }
      if (kind === "mcp") {
        const id = newId("mcp");
        next.mcps = [{ id, status: "Active", uuaa: selectedUuaa, tools: data.tools || [], ...defaultGateway(id), ...data }, ...s.mcps];
      }
      if (kind === "skill") {
        const id = data.ada_skill_id || `bbva.skill.${newId("skill")}`;
        next.skills = [{ id, ada_skill_id: id, name: data.name, description: data.description, descriptor_type: "AGENT_SKILL", owner_uuaa: selectedUuaa, skill_owner: data.owner, domain: data.businessArea, status: "approved", visibility: "restricted", usage_policy: data.usage_policy || "approval_required", risk_level: data.risk_level || "Medium", data_classification: data.data_classification || "internal", allowed_agent_types: [], allowed_uuaas: [selectedUuaa], tags: [], governance_reference: data.governance_reference || `GOV-${id.toUpperCase()}`, registry_provider: "AWS_AGENT_REGISTRY", registry_id: `skill-registry-${selectedUuaa.toLowerCase()}`, registry_record_id: `record-${id}`, registry_record_arn: `arn:aws:bedrock-agentcore:eu-west-1:012345678901:skill/${id}`, registry_record_status: "APPROVED", registry_endpoint_type: "NONE", last_sync_status: "synced", last_sync_date: nowStamp(), created_at: nowStamp(), updated_at: nowStamp(), ...data }, ...s.skills];
        next.skillVersions = [{ id: `${id}:1.0.0`, ada_skill_version_id: `${id}:1.0.0`, skill_id: id, version: "1.0.0", status: "approved", change_type: "minor", breaking_change: false, release_notes: "Initial skill version", registry_record_version: "1.0.0", registry_record_revision_id: `rev-${id}`, artifact_format: "SKILL_MD", artifact_location: `s3://ada-agent-skills/${id}/1.0.0/SKILL.md`, definition_json_location: `s3://ada-agent-skills/${id}/1.0.0/definition.json`, specification_markdown: `# ${id} v1.0.0\n\n## Purpose\n${data.description || "Reusable BBVA agent Skill."}\n\n## Agent Instructions\n1. Use this Skill only when the agent has an approved association for version 1.0.0.\n2. Follow BBVA data classification and auditability rules.\n3. Escalate to the Skill Owner when policy evidence is missing.\n\n## Input Contract\n- business_context\n- requester_role\n- evidence_refs\n\n## Output Contract\n- recommendation\n- rationale\n- controls_applied\n- escalation_required\n\n## Acceptance Criteria\n- Output is grounded in supplied context.\n- No autonomous customer-impacting decision is made.\n- Restricted data is minimized or masked.\n`, instruction_summary: data.description || "Reusable agent skill", input_contract: "Structured context", output_contract: "Guided response", required_tools: [], required_mcp_servers: [], constraints: [], safety_notes: [], examples: [], compatible_runtimes: ["AgentCore Runtime"], requires_recertification: false, published_at: nowStamp(), deprecated_at: "", retirement_date: "31-12-2026" }, ...s.skillVersions];
      }
      return next;
    });
    audit("Project Owner", `${kind}_created`, data.name, "allow", "Created from guided console form");
    setModal(null);
  };

  const cancelRequest = (id: string) => {
    const req = state.requests.find((r) => r.id === id);
    setState((s) => ({ ...s, requests: s.requests.map((r) => r.id === id ? { ...r, status: "Revoked", updated: nowStamp(), conditions: "Cancelled by requester" } : r) }));
    audit(req?.requester || "requester", "request_cancelled", req?.type || id, "cancelled", "Pending request cancelled from asset detail");
  };

  const createRequest = (data: any) => {
    const type = data.type as RequestType;
    const sourceId = data.sourceId || (type === "application_agent" ? state.applications[0]?.id : type === "collective_mcp" ? state.collectives[0]?.id : state.agents[0]?.id);
    const targetId = data.targetId || (type === "application_agent" ? state.agents[0]?.id : type === "agent_skill" ? state.skills[0]?.id : state.mcps[0]?.id);
    const approver = type === "application_agent" ? state.agents.find((a) => a.id === targetId)?.owner : type === "agent_skill" ? state.skills.find((skill) => skill.id === targetId)?.skill_owner : state.mcps.find((m) => m.id === targetId)?.owner;
    const requester = type === "application_agent" ? state.applications.find((a) => a.id === sourceId)?.owner : type === "collective_mcp" ? state.collectives.find((c) => c.id === sourceId)?.owner : state.agents.find((a) => a.id === sourceId)?.owner;
    const req = { id: newId("req"), status: "Pending", accessLevel: data.requestedAccess, toolIds: data.requestedToolIds || [], requestedToolIds: data.requestedToolIds || [], requester, approver, conditions: "", updated: nowStamp(), ...data, sourceId, targetId };
    setState((s) => ({ ...s, requests: [req, ...s.requests] }));
    audit(requester || "requester", "subscription_requested", type, "pending", data.justification || "Subscription request submitted");
    setModal(null);
  };

  const deleteAsset = (kind: string, id: string) => {
    const activeSubs = state.subscriptions.filter((s) => s.status !== "Revoked" && (s.sourceId === id || s.targetId === id || s.mcpId === id));
    const pendingRequests = state.requests.filter((r) => r.status === "Pending" && (r.sourceId === id || r.targetId === id || r.mcpId === id));
    if (activeSubs.length || pendingRequests.length) {
      setToast(`No se puede borrar: tiene ${activeSubs.length} suscripciones activas y ${pendingRequests.length} solicitudes pendientes. Revocalas o cierralas antes.`);
      return;
    }
    setState((s) => {
      if (kind === "application") return { ...s, applications: s.applications.filter((a) => a.id !== id) };
      if (kind === "collective") return { ...s, collectives: s.collectives.filter((c) => c.id !== id) };
      if (kind === "agent") return { ...s, agents: s.agents.filter((a) => a.id !== id) };
      if (kind === "mcp") return { ...s, mcps: s.mcps.filter((m) => m.id !== id) };
      if (kind === "skill") return { ...s, skills: s.skills.filter((skill) => skill.id !== id), skillVersions: s.skillVersions.filter((version) => version.skill_id !== id) };
      return s;
    });
    setDetail(null);
    setToast("Asset borrado correctamente.");
    audit("Project Owner", `${kind}_deleted`, id, "allow", "Asset had no active subscriptions or pending requests");
  };

  const decide = (id: string, decision: "Approved" | "Rejected" | "Partial") => {
    const req = state.requests.find((r) => r.id === id);
    if (!req) return;
    setState((s) => {
      const updatedRequests = s.requests.map((r) => r.id === id ? { ...r, status: decision, updated: nowStamp(), conditions: decision === "Partial" ? "Approved with reduced scope and audit required" : r.conditions } : r);
      if (decision === "Rejected") return { ...s, requests: updatedRequests };
      if (req.type === "agent_skill") {
        const version = decision === "Partial" ? req.approvedVersion || req.requestedVersion : req.requestedVersion;
        return { ...s, requests: updatedRequests, agentSkillAssociations: [{ id: newId("ask"), association_id: newId("ask"), agent_id: req.sourceId, skill_id: req.targetId, skill_version: version || "1.0.0", authorization_status: "active", upgrade_policy: "pinned", associated_by: req.approver, associated_at: nowStamp(), approval_request_id: req.id }, ...s.agentSkillAssociations] };
      }
      return { ...s, requests: updatedRequests, subscriptions: [{ ...req, id: newId("sub"), status: decision === "Partial" ? "Partial" : "Active", accessLevel: decision === "Partial" ? "read" : req.requestedAccess, toolIds: decision === "Partial" ? [] : req.requestedToolIds, updated: nowStamp(), conditions: decision === "Partial" ? "Read-only partial approval" : "Approved by owner" }, ...s.subscriptions] };
    });
    audit(req.approver, `request_${decision.toLowerCase()}`, req.type, decision, decision === "Rejected" ? "Owner rejected the subscription request" : "Subscription created or updated");
  };

  const revoke = (id: string) => {
    setState((s) => ({ ...s, subscriptions: s.subscriptions.map((sub) => sub.id === id ? { ...sub, status: "Revoked", updated: nowStamp() } : sub) }));
    audit("Project Owner", "subscription_revoked", id, "deny", "Subscription revoked from console");
  };

  const addToolToMcp = (mcpId: string, tool: any) => {
    setState((s) => ({
      ...s,
      mcps: s.mcps.map((mcp) => mcp.id === mcpId ? { ...mcp, tools: [...mcp.tools, tool] } : mcp),
    }));
    audit("Project Owner", "tool_added", `${mcpId}.${tool.name}`, "allow", "Tool added from MCP detail");
  };

  const associateSkillToAgent = (agentId: string, skillId: string, version: string) => {
    const skill = state.skills.find((item) => item.id === skillId);
    setState((s) => ({
      ...s,
      agentSkillAssociations: [{ id: newId("ask"), association_id: newId("ask"), agent_id: agentId, skill_id: skillId, skill_version: version, authorization_status: "active", upgrade_policy: skill?.risk_level === "Low" ? "auto_patch" : "pinned", associated_by: "Agent Owner", associated_at: nowStamp(), approval_request_id: "" }, ...s.agentSkillAssociations],
    }));
    audit("Agent Owner", "skill_associated", `${agentId} -> ${skillId}@${version}`, "allow", "Open Skill associated without approval request");
  };

  const entityName = (id?: string) => [...state.applications, ...state.collectives, ...state.agents, ...state.mcps, ...state.skills].find((e: any) => e.id === id)?.name || id || "-";
  const entityUuaa = (id?: string) => {
    const entity = [...state.applications, ...state.collectives, ...state.agents, ...state.mcps, ...state.skills].find((e: any) => e.id === id) as any;
    return entity?.owner_uuaa || entity?.uuaa || "KDIT";
  };
  const byUuaa = (item: any) => (item.uuaa || "KDIT") === selectedUuaa;
  const scopedApplications = state.applications.filter(byUuaa);
  const scopedCollectives = state.collectives.filter(byUuaa);
  const scopedAgents = state.agents.filter(byUuaa);
  const scopedMcps = state.mcps.filter(byUuaa);
  const scopedSkills = state.skills.filter((skill) => skill.owner_uuaa === selectedUuaa);
  const scopedRequests = state.requests.filter((request) => entityUuaa(request.sourceId) === selectedUuaa || entityUuaa(request.targetId) === selectedUuaa || entityUuaa(request.mcpId) === selectedUuaa);
  const canCreateApplication = profile === "Project Owner" || profile === "Application Manager";
  const canManageAiAssets = profile === "Project Owner" || profile === "AI Engineer";
  const canApproveRequests = profile === "Project Owner" || profile === "Operations";

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">
          <div className="brand-line"><span>ADA</span><span className="brand-mark">Λ</span><span>console</span></div>
          <div className="brand-subtitle">BBVA AI Banking Platform</div>
        </div>
        <div className="side-scroll">
        <div className="nav"><NavButton label="Dashboard" section={section} setSection={setSection} setToast={setToast} setDisabledMenuModal={setDisabledMenuModal} disabled /></div>
        <div className="group-title">DATA LAKE</div>
        <div className="nav">
          <NavButton label="Catalog" section={section} setSection={setSection} setToast={setToast} setDisabledMenuModal={setDisabledMenuModal} badge="NEW" disabled />
          <NavButton label="Data Lake Subscriptions" section={section} setSection={setSection} setToast={setToast} setDisabledMenuModal={setDisabledMenuModal} disabled />
        </div>
        <div className="group-title">SANDBOX</div>
        <div className="nav">
          <NavButton label="Engines" section={section} setSection={setSection} setToast={setToast} setDisabledMenuModal={setDisabledMenuModal} disabled />
          <NavButton label="Models" section={section} setSection={setSection} setToast={setToast} setDisabledMenuModal={setDisabledMenuModal} disabled />
          <NavButton label="SAS Sync" section={section} setSection={setSection} setToast={setToast} setDisabledMenuModal={setDisabledMenuModal} disabled />
          <NavButton label="Data" section={section} setSection={setSection} setToast={setToast} setDisabledMenuModal={setDisabledMenuModal} disabled />
        </div>
        <div className="group-title">DATAPROC</div>
        <div className="nav">
          <NavButton label="Jobs" section={section} setSection={setSection} setToast={setToast} setDisabledMenuModal={setDisabledMenuModal} disabled />
          <NavButton label="Configurations" section={section} setSection={setSection} setToast={setToast} setDisabledMenuModal={setDisabledMenuModal} disabled />
          <NavButton label="Queue" section={section} setSection={setSection} setToast={setToast} setDisabledMenuModal={setDisabledMenuModal} disabled />
        </div>
        <div className="group-title">PLATFORM</div>
        <div className="nav">
          <NavButton label="Projects" section={section} setSection={setSection} setToast={setToast} setDisabledMenuModal={setDisabledMenuModal} disabled />
          <NavButton label="Inferences" section={section} setSection={setSection} setToast={setToast} setDisabledMenuModal={setDisabledMenuModal} disabled />
          <NavButton label="Authorizations" section={section} setSection={setSection} setToast={setToast} setDisabledMenuModal={setDisabledMenuModal} />
        </div>
        <div className="group-title">AI AGENTS</div>
        <div className="nav">{aiSections.map((s) => <NavButton key={s} label={s} section={section} setSection={setSection} setToast={setToast} setDisabledMenuModal={setDisabledMenuModal} />)}</div>
        <div className="group-title">TOOLS</div>
        <div className="nav"><NavButton label="Reports" section={section} setSection={setSection} setToast={setToast} setDisabledMenuModal={setDisabledMenuModal} disabled /></div>
        </div>
        <div className="side-footer"><span>BBVA</span><span className="footer-icon">↘</span><span className="footer-icon">▣</span><span className="footer-icon">≪</span></div>
      </aside>
      <main className="main">
        <div className="top"><div className="title">☰ <span>{section.toUpperCase()}</span></div><div className="top-actions">♡ ⚐ ▦ <select className="profile-select" value={profile} onChange={(e) => setProfile(e.target.value)}>{profiles.map((item) => <option key={item}>{item}</option>)}</select><span className="avatar">FE</span></div></div>
        <div className="crumbs"><span><b>AI Project</b> / {section} / <select className="crumb-select" value={selectedUuaa} onChange={(e) => setSelectedUuaa(e.target.value)}>{uuaas.map((u) => <option key={u}>{u}</option>)}</select></span><span className="chips"><span className="chip blue">ES</span><span className="chip">GL</span><span className="chip">PROD</span></span></div>
        <div className="content">
          {section === "Dashboard" && <Dashboard state={state} setSection={setSection} />}
          {toast && <div className="hint"><b>{toast}</b></div>}
          {section === "AI Applications" && <Directory title="AI Applications" kind="application" hint={`Las aplicaciones consumidoras son sistemas o canales que solicitan autorizacion para invocar agentes. Mostrando solo aplicaciones de la UUAA ${selectedUuaa}.`} rows={scopedApplications} state={state} columns={["name","owner","businessArea","country","environment","status"]} query={query} setQuery={setQuery} view={directoryViews["AI Applications"]} setView={(view: "table" | "cards") => setDirectoryViews((views) => ({ ...views, "AI Applications": view }))} onNew={canCreateApplication ? () => setModal("application") : undefined} onView={(id: string) => setDetail({ kind: "application", id })} onDelete={canCreateApplication ? (id: string) => deleteAsset("application", id) : undefined} />}
          {section === "ChatApps Collectives" && <Directory title="ChatApps Collectives" kind="collective" hint={`Los colectivos ChatApps representan grupos de usuarios que utilizan asistentes conversacionales enterprise como ChatGPT Enterprise o Gemini Enterprise. Mostrando solo colectivos de la UUAA ${selectedUuaa}.`} rows={scopedCollectives} state={state} columns={["name","owner","businessArea","country","platform","status"]} query={query} setQuery={setQuery} view={directoryViews["ChatApps Collectives"]} setView={(view: "table" | "cards") => setDirectoryViews((views) => ({ ...views, "ChatApps Collectives": view }))} onNew={canCreateApplication ? () => setModal("collective") : undefined} onView={(id: string) => setDetail({ kind: "collective", id })} onDelete={canCreateApplication ? (id: string) => deleteAsset("collective", id) : undefined} />}
          {section === "Agents" && <Inventory title="Agents" hint={`Los agentes encapsulan capacidades de IA y se alinean con Amazon Bedrock AgentCore Registry como catalogo de lifecycle, Runtime, Identity y observabilidad. Mostrando solo agentes de la UUAA ${selectedUuaa}.`} rows={scopedAgents} columns={["uuaa","name","type","registryAgentId","agentVersion","deploymentStage","identityMode","criticality","status"]} query={query} setQuery={setQuery} onNew={canManageAiAssets ? () => setModal("agent") : undefined} onView={(id: string) => setDetail({ kind: "agent", id })} onDelete={canManageAiAssets ? (id: string) => deleteAsset("agent", id) : undefined} />}
          {section === "MCPs" && <Mcps state={{ ...state, mcps: scopedMcps }} query={query} setQuery={setQuery} onNew={canManageAiAssets ? () => setModal("mcp") : undefined} onView={(id: string) => setDetail({ kind: "mcp", id })} onDelete={canManageAiAssets ? (id: string) => deleteAsset("mcp", id) : undefined} selectedUuaa={selectedUuaa} />}
          {section === "Skills" && <Skills rows={scopedSkills} state={state} query={query} setQuery={setQuery} view={directoryViews.Skills} setView={(view: "table" | "cards") => setDirectoryViews((views) => ({ ...views, Skills: view }))} onNew={canManageAiAssets ? () => setModal("skill") : undefined} onView={(id: string) => setDetail({ kind: "skill", id })} selectedUuaa={selectedUuaa} />}
          {section === "Authorizations" && <AuthorizationRequests requests={scopedRequests} entityName={entityName} decide={decide} canApprove={canApproveRequests} selectedUuaa={selectedUuaa} />}
          {placeholderSections.includes(section) && <PlaceholderSection section={section} />}
        </div>
      </main>
      {detail && <DetailModal detail={detail} close={() => setDetail(null)} state={state} entityName={entityName} createRequest={createRequest} deleteAsset={deleteAsset} cancelRequest={cancelRequest} revoke={revoke} addToolToMcp={addToolToMcp} associateSkillToAgent={associateSkillToAgent} selectedUuaa={selectedUuaa} uuaas={uuaas} profile={profile} />}
      {disabledMenuModal && <DisabledMenuModal close={() => setDisabledMenuModal(false)} />}
      {modal && <EntityModal modal={modal} close={() => setModal(null)} state={state} addEntity={addEntity} createRequest={createRequest} selectedUuaa={selectedUuaa} uuaas={uuaas} />}
    </div>
  );
}

function inferUuaa(id: string) {
  if (id.includes("payments")) return "PAYM";
  if (id.includes("fraud")) return "FRAD";
  if (id.includes("risk") || id.includes("compliance") || id.includes("credit")) return "RISK";
  if (id.includes("doc")) return "DATA";
  if (id.includes("cards")) return "CARD";
  if (id.includes("loans") || id.includes("mortgage")) return "LOAN";
  if (id.includes("wealth")) return "WLTH";
  return "KDIT";
}

function defaultAgentCore(id: string) {
  return {
    registryProvider: "Amazon Bedrock AgentCore Registry",
    registryAgentId: `agcore-${id}`,
    agentVersion: "1.0.0",
    runtimeArn: `arn:aws:bedrock-agentcore:eu-west-1:012345678901:runtime/${id}`,
    deploymentStage: "registered",
    identityMode: "pre_authorized",
    observability: "CloudWatch traces enabled",
  };
}

function defaultGateway(id: string) {
  return {
    gatewayId: `gw-${id}`,
    mcpServerId: `mcp-server-${id}`,
    protocol: "MCP via AgentCore Gateway",
    authMode: "iam",
    identityMode: "end_user",
    observability: "Gateway invocation metrics enabled",
  };
}

function normalizeTool(tool: any) {
  return {
    gatewayRoute: `/tools/${tool.name || tool.id}`,
    toolSchema: "json-schema:v1",
    ...tool,
  };
}

function normalizeState(saved: AppState): AppState {
  return {
    ...saved,
    applications: saved.applications.map((item: any) => ({ ...item, uuaa: item.uuaa || "KDIT" })),
    collectives: saved.collectives.map((item: any) => ({ ...item, uuaa: item.uuaa || "KDIT" })),
    agents: saved.agents.map((item: any) => ({ ...defaultAgentCore(item.id), ...item, uuaa: item.uuaa || inferUuaa(item.id) })),
    mcps: saved.mcps.map((item: any) => ({ ...defaultGateway(item.id), ...item, tools: (item.tools || []).map(normalizeTool), uuaa: item.uuaa || inferUuaa(item.id) })),
    skills: saved.skills || seedState.skills,
    skillVersions: (saved.skillVersions || seedState.skillVersions).map((version: any) => ({
      ...version,
      specification_markdown: version.specification_markdown || skillMarkdown(version.skill_id, version.version),
    })),
    agentSkillAssociations: saved.agentSkillAssociations || seedState.agentSkillAssociations,
  };
}

function NavButton({ label, section, setSection, setToast, setDisabledMenuModal, badge, disabled }: any) {
  const onClick = () => {
    if (disabled) {
      setToast("");
      setDisabledMenuModal(true);
      return;
    }
    setToast("");
    setDisabledMenuModal(false);
    setSection(label);
  };
  return <button className={section === label ? "active" : ""} onClick={onClick}><span>{icons[label]}</span><span className="nav-label">{label.replace("Data Lake ", "")}</span>{badge && <span className="nav-badge">{badge}</span>}</button>;
}

function DisabledMenuModal({ close }: any) {
  return (
    <div className="modal-backdrop">
      <div className="modal notice-modal">
        <div className="modal-head"><h2>Funcionalidad no disponible</h2><button className="btn secondary" onClick={close}>Close</button></div>
        <div className="modal-body">
          <p className="notice-text">{disabledMenuMessage}</p>
        </div>
        <div className="modal-foot"><button className="btn" onClick={close}>Go to AI Agents</button></div>
      </div>
    </div>
  );
}

function Dashboard({ state, setSection }: any) {
  const metrics = [["AI Applications", state.applications.length], ["ChatApps collectives", state.collectives.length], ["Agents", state.agents.length], ["MCPs", state.mcps.length], ["Tools", state.mcps.flatMap((m: any) => m.tools).length], ["Active authorizations", state.subscriptions.filter((s: any) => s.status === "Active").length], ["Pending requests", state.requests.filter((r: any) => r.status === "Pending").length]];
  return <><p className="hint">Control plane de gobierno para Application &rarr; Agent, Agent &rarr; MCP y ChatApps Collective &rarr; MCP. Use esta pantalla para detectar trabajo pendiente y navegar a los flujos clave.</p><div className="grid">{metrics.map(([k,v]: any) => <div className="metric" key={k}><span>{k}</span><strong>{v}</strong></div>)}</div><div className="split"><div className="panel"><div className="panel-head"><b>Pending approvals</b><button className="btn ghost" onClick={() => setSection("Authorizations")}>Open requests</button></div><Rows rows={state.requests.filter((r: any) => r.status === "Pending")} columns={["type","requester","approver","purpose","status"]} /></div><div className="panel"><div className="panel-head"><b>Governance alerts</b></div><table><tbody><tr><td>Critical tools require human approval</td><td><span className="badge Critical">Critical</span></td></tr><tr><td>New MCP tools blocked until classified</td><td><span className="badge Medium">Medium</span></td></tr><tr><td>End user identity must be propagated to MCP runtime</td><td><span className="badge High">High</span></td></tr></tbody></table></div></div></>;
}

function PlaceholderSection({ section }: any) {
  return (
    <>
      <p className="hint">Esta opcion forma parte del menu ADA Console para mantener el look & feel de la plataforma. No tiene funcionalidad implementada en esta maqueta.</p>
      <div className="panel">
        <div className="panel-head"><div className="panel-title">{icons[section]} {section}</div><div className="toolbar"><input className="search" placeholder={`Search ${section.toLowerCase()} by name...`} disabled /><button className="btn secondary">Disabled</button></div></div>
        <table>
          <thead><tr><th>Name</th><th>Type</th><th>Environment</th><th>Updated</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            <tr><td>{section} placeholder</td><td>ADA Console</td><td>Sandbox</td><td>04-07-2026</td><td><span className="badge Pending">Out of scope</span></td><td><button className="btn ghost">View</button></td></tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

function Inventory({ title, hint, rows, columns, query, setQuery, onNew, onView, onDelete }: any) {
  const filtered = rows.filter((r: any) => JSON.stringify(r).toLowerCase().includes(query.toLowerCase())).sort((a: any, b: any) => Number((b.uuaa || "").toLowerCase().startsWith(query.toLowerCase())) - Number((a.uuaa || "").toLowerCase().startsWith(query.toLowerCase())));
  return <><p className="hint">{hint}</p><div className="panel"><div className="panel-head"><div className="panel-title">{icons[title] || "▣"} {title}</div><div className="toolbar"><input className="search" placeholder={`Search ${title.toLowerCase()} by name...`} value={query} onChange={(e) => setQuery(e.target.value)} />{onNew && <button className="btn" onClick={onNew}>+ New</button>}</div></div><Rows rows={filtered} columns={columns} onView={onView} onDelete={onDelete} /></div></>;
}

function Directory({ title, kind, hint, rows, state, columns, query, setQuery, view, setView, onNew, onView, onDelete }: any) {
  const filtered = rows.filter((r: any) => JSON.stringify(r).toLowerCase().includes(query.toLowerCase())).sort((a: any, b: any) => Number((b.uuaa || "").toLowerCase().startsWith(query.toLowerCase())) - Number((a.uuaa || "").toLowerCase().startsWith(query.toLowerCase())));
  const isApplication = kind === "application";
  const relationTypes = isApplication ? ["application_agent"] : ["collective_mcp"];
  const activeRelations = (id: string) => state.subscriptions.filter((sub: any) => relationTypes.includes(sub.type) && sub.sourceId === id && sub.status !== "Revoked");
  const pendingRelations = (id: string) => state.requests.filter((request: any) => relationTypes.includes(request.type) && request.sourceId === id && request.status === "Pending");
  const totalActive = filtered.reduce((sum: number, item: any) => sum + activeRelations(item.id).length, 0);
  const totalPending = filtered.reduce((sum: number, item: any) => sum + pendingRelations(item.id).length, 0);
  const uuaaCount = new Set(filtered.map((item: any) => item.uuaa || "KDIT")).size;
  const prodCount = filtered.filter((item: any) => item.environment === "prod" || item.platform).length;
  const metrics = [
    ["Assets", filtered.length],
    ["Active auth", totalActive],
    ["Pending", totalPending],
    ["UUAAs", uuaaCount],
  ];
  const alertText = totalPending ? `${totalPending} authorization requests pending approval` : "No pending authorization requests";

  return (
    <>
      <p className="hint">{hint}</p>
      <div className="directory-shell">
        <div className="directory-toolbar">
          <input className="search directory-search" placeholder={`Search ${title.toLowerCase()}...`} value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="view-toggle" aria-label="View mode">
            <button className={view === "cards" ? "active" : ""} onClick={() => setView("cards")} title="Cards view">▦</button>
            <button className={view === "table" ? "active" : ""} onClick={() => setView("table")} title="Table view">☷</button>
          </div>
          {onNew && <button className="btn directory-new" onClick={onNew}>Add New...</button>}
        </div>

        <div className="directory-overview">
          <section className="overview-card usage-card">
            <div className="overview-head"><b>Usage</b><span>{isApplication ? "Channels" : "ChatApps"}</span></div>
            {metrics.map(([label, value]: any) => <div className="usage-row" key={label}><span>{label}</span><b>{value}</b></div>)}
          </section>
          <section className="overview-card alert-card">
            <div className="overview-head"><b>Alerts</b><span>{totalPending ? "Review" : "OK"}</span></div>
            <strong>{alertText}</strong>
            <p>{isApplication ? `${prodCount} production applications in the current result set.` : `${prodCount} collective platforms represented in the current result set.`}</p>
          </section>
          <section className="overview-card insight-card">
            <div className="overview-head"><b>Governance</b><span>Scope</span></div>
            <strong>{isApplication ? "Application -> Agent" : "Collective -> Agent / MCP"}</strong>
            <p>Open an asset to request authorization, revoke active subscriptions, or review pending access.</p>
          </section>
        </div>

        {view === "table" ? <div className="panel"><div className="panel-head"><div className="panel-title">{icons[title] || "▣"} {title}</div></div><Rows rows={filtered} columns={columns} onView={onView} onDelete={onDelete} /></div> : <div className="directory-card-grid">
          {filtered.map((item: any) => {
            const active = activeRelations(item.id);
            const pending = pendingRelations(item.id);
            return (
              <article className="asset-card" key={item.id}>
                <div className="asset-card-head">
                  <div className="asset-avatar">{item.name.slice(0, 1)}</div>
                  <div><h3>{item.name}</h3><p>{item.uuaa || "KDIT"} · {item.country} · {item.environment || item.platform}</p></div>
                  <button className="btn ghost more-btn" onClick={() => onView(item.id)}>•••</button>
                </div>
                <div className="asset-card-body">
                  <p>{item.description}</p>
                  <div className="mini-tags"><span>{item.businessArea}</span><span>{item.owner}</span></div>
                </div>
                <div className="asset-card-stats">
                  <div><span>Active auth</span><b>{active.length}</b></div>
                  <div><span>Pending</span><b>{pending.length}</b></div>
                  <div><span>Status</span>{badge("status", item.status)}</div>
                </div>
                <div className="asset-card-actions">
                  <button className="btn ghost" onClick={() => onView(item.id)}>View</button>
                  {onDelete && <button className="btn danger" onClick={() => onDelete(item.id)}>Delete</button>}
                </div>
              </article>
            );
          })}
          {!filtered.length && <div className="empty">No assets found.</div>}
        </div>}
      </div>
    </>
  );
}

function Rows({ rows, columns, onView, onDelete }: any) {
  const hasActions = onView || onDelete;
  return <table><thead><tr>{columns.map((c: string) => <th key={c}>{c}</th>)}{hasActions && <th>Actions</th>}</tr></thead><tbody>{rows.map((r: any) => <tr key={r.id}>{columns.map((c: string) => <td key={c}>{badge(c, r[c])}</td>)}{hasActions && <td><div className="toolbar">{onView && <button className="btn ghost" onClick={() => onView(r.id)}>View</button>}{onDelete && <button className="btn danger" onClick={() => onDelete(r.id)}>Delete</button>}</div></td>}</tr>)}</tbody></table>;
}
const badge = (key: string, value: any) => ["status","criticality","risk","type"].includes(key) ? <span className={`badge ${value}`}>{value}</span> : String(value ?? "-");

function Mcps({ state, query, setQuery, onNew, onView, onDelete }: any) {
  const rows = state.mcps.filter((m: any) => JSON.stringify(m).toLowerCase().includes(query.toLowerCase())).sort((a: any, b: any) => Number((b.uuaa || "").toLowerCase().startsWith(query.toLowerCase())) - Number((a.uuaa || "").toLowerCase().startsWith(query.toLowerCase()))).map((m: any) => ({ ...m, tools: m.tools.length, readTools: m.tools.filter((t: any) => t.type === "read").length, writeTools: m.tools.filter((t: any) => t.type !== "read").length }));
  return <><p className="hint">Los MCPs se tratan como servidores expuestos por Amazon Bedrock AgentCore Gateway: ADA gobierna la autorizacion, Gateway publica tools MCP y propaga identidad segun el modo configurado.</p><div className="panel"><div className="panel-head"><div className="panel-title">▦ MCPs</div><div className="toolbar"><input className="search" placeholder="Search MCPs by UUAA or name..." value={query} onChange={(e) => setQuery(e.target.value)} />{onNew && <button className="btn" onClick={onNew}>+ New MCP</button>}</div></div><Rows rows={rows} columns={["uuaa","name","gatewayId","authMode","identityMode","backendSystem","risk","tools","readTools","writeTools","status"]} onView={onView} onDelete={onDelete} /></div></>;
}

function Skills({ rows, state, query, setQuery, view, setView, onNew, onView, selectedUuaa }: any) {
  const tableRows = rows.filter((skill: any) => JSON.stringify(skill).toLowerCase().includes(query.toLowerCase())).map((skill: any) => {
    const versions = state.skillVersions.filter((version: any) => version.skill_id === skill.id && version.status === "approved");
    const latest = versions.at(-1)?.version || "-";
    return {
      ...skill,
      skillId: skill.ada_skill_id,
      ownerUuaa: skill.owner_uuaa,
      risk: skill.risk_level,
      dataClassification: skill.data_classification,
      usagePolicy: skill.usage_policy,
      latestApprovedVersion: latest,
      agentsUsing: state.agentSkillAssociations.filter((association: any) => association.skill_id === skill.id && association.authorization_status === "active").length,
      pendingRequests: state.requests.filter((request: any) => request.type === "agent_skill" && request.targetId === skill.id && request.status === "Pending").length,
      registryProvider: skill.registry_provider,
      registryStatus: skill.registry_record_status,
    };
  });
  const highRisk = tableRows.filter((skill: any) => ["High", "Critical"].includes(skill.risk)).length;
  const pending = tableRows.reduce((sum: number, skill: any) => sum + skill.pendingRequests, 0);
  return (
    <>
      <p className="hint">Repositorio corporativo de Skills reutilizables. Mostrando solo Skills cuyo Owner UUAA es {selectedUuaa}. Los Skills se asocian a agentes por version concreta, nunca por latest.</p>
      <div className="directory-shell">
        <div className="directory-toolbar">
          <input className="search directory-search" placeholder="Search skills by UUAA, domain or name..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="view-toggle" aria-label="View mode">
            <button className={view === "cards" ? "active" : ""} onClick={() => setView("cards")} title="Cards view">▦</button>
            <button className={view === "table" ? "active" : ""} onClick={() => setView("table")} title="Table view">☷</button>
          </div>
          {onNew && <button className="btn directory-new" onClick={onNew}>Create Skill</button>}
        </div>
        {view === "table" ? <div className="panel"><div className="panel-head"><div className="panel-title">✦ Skills</div></div><Rows rows={tableRows} columns={["name","skillId","ownerUuaa","domain","risk","usagePolicy","latestApprovedVersion","registryStatus","agentsUsing","pendingRequests"]} onView={onView} /></div> : <div className="directory-card-grid">{tableRows.map((skill: any) => (
          <article className="asset-card" key={skill.id}>
            <div className="asset-card-head">
              <div className="asset-avatar">✦</div>
              <div>
                <h3>{skill.name}</h3>
                <p>{skill.skillId}</p>
              </div>
              {badge("risk", skill.risk)}
            </div>
            <div className="asset-card-body">
              <p>{skill.domain} · {skill.dataClassification} · {skill.usagePolicy}</p>
              <div className="mini-tags"><span>{skill.ownerUuaa}</span><span>v{skill.latestApprovedVersion}</span><span>{skill.registryStatus}</span></div>
            </div>
            <div className="asset-card-stats">
              <div><span>Agents</span><b>{skill.agentsUsing}</b></div>
              <div><span>Pending</span><b>{skill.pendingRequests}</b></div>
              <div><span>High Risk</span><b>{highRisk}</b></div>
            </div>
            <div className="asset-card-actions"><button className="btn ghost" onClick={() => onView(skill.id)}>View</button></div>
          </article>
        ))}{!tableRows.length && <div className="empty">No skills found.</div>}</div>}
        {pending > 0 && <div className="hint"><b>{pending}</b> Skill authorization requests pending review.</div>}
      </div>
    </>
  );
}

function AuthorizationRequests({ requests, entityName, decide, canApprove, selectedUuaa }: any) {
  return <><p className="hint">Authorization Requests muestra solo peticiones relacionadas con la UUAA {selectedUuaa}. Project Owner y Operations pueden aprobar o rechazar.</p><div className="panel"><div className="panel-head"><b>Authorization Requests</b></div><table><thead><tr>{["Type","Source","Target","Requested","Requester","Approver","Purpose","Status","Actions"].map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{requests.map((r: any) => <tr key={r.id}><td>{r.type}</td><td>{entityName(r.sourceId)}</td><td>{entityName(r.targetId)}</td><td>{r.requestedAccess}</td><td>{r.requester}</td><td>{r.approver}</td><td>{r.purpose}</td><td>{badge("status", r.status)}</td><td>{r.status === "Pending" && canApprove ? <div className="toolbar"><button className="btn" onClick={() => decide(r.id, "Approved")}>Approve</button><button className="btn secondary" onClick={() => decide(r.id, "Partial")}>Partial</button><button className="btn danger" onClick={() => decide(r.id, "Rejected")}>Reject</button></div> : r.status === "Pending" ? "Pending approval" : "Closed"}</td></tr>)}</tbody></table></div></>;
}

function Field({ label, value, set, options }: any) { return <div className="field"><label>{label}</label><select value={value} onChange={(e) => set(e.target.value)}>{options.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>; }

function DetailModal({ detail, close, state, entityName, createRequest, deleteAsset, cancelRequest, revoke, addToolToMcp, associateSkillToAgent, selectedUuaa, uuaas, profile }: any) {
  const asset = detail.kind === "application" ? state.applications.find((a: any) => a.id === detail.id) : detail.kind === "collective" ? state.collectives.find((c: any) => c.id === detail.id) : detail.kind === "agent" ? state.agents.find((a: any) => a.id === detail.id) : detail.kind === "skill" ? state.skills.find((skill: any) => skill.id === detail.id) : state.mcps.find((m: any) => m.id === detail.id);
  const [request, setRequest] = useState<any>({ uuaa: selectedUuaa, agentId: state.agents.find((a: any) => (a.uuaa || "KDIT") === selectedUuaa)?.id || state.agents[0]?.id, mcpId: state.mcps.find((m: any) => (m.uuaa || "KDIT") === selectedUuaa)?.id || state.mcps[0]?.id, skillId: state.skills.find((skill: any) => skill.owner_uuaa === selectedUuaa)?.id || state.skills[0]?.id, skillVersion: "", access: "read", requestedToolIds: [], purpose: "Business controlled access", justification: "Requested from asset detail view", expiration: "31-12-2026" });
  const [requestModal, setRequestModal] = useState<string | null>(null);
  const [toolDraft, setToolDraft] = useState<any>({ name: "", type: "read", resource: "", risk: "Medium" });
  if (!asset) return null;

  const activeSubs = [...state.subscriptions.filter((s: any) => s.status !== "Revoked" && (s.sourceId === asset.id || s.targetId === asset.id || s.mcpId === asset.id)), ...state.agentSkillAssociations.filter((s: any) => s.authorization_status === "active" && (s.agent_id === asset.id || s.skill_id === asset.id))];
  const pendingRequests = state.requests.filter((r: any) => r.status === "Pending" && (r.sourceId === asset.id || r.targetId === asset.id || r.mcpId === asset.id || r.skillId === asset.id));
  const canDelete = activeSubs.length === 0 && pendingRequests.length === 0;

  const pendingFor = (type: string, match: (r: any) => boolean) => state.requests.filter((r: any) => r.status === "Pending" && r.type === type && match(r));
  const appAgentSubs = detail.kind === "application" ? [
    ...state.subscriptions.filter((s: any) => s.type === "application_agent" && s.sourceId === asset.id && s.status !== "Revoked"),
    ...pendingFor("application_agent", (r: any) => r.sourceId === asset.id),
  ] : [];
  const agentApps = detail.kind === "agent" ? [
    ...state.subscriptions.filter((s: any) => s.type === "application_agent" && s.targetId === asset.id && s.status !== "Revoked"),
    ...pendingFor("application_agent", (r: any) => r.targetId === asset.id),
  ] : [];
  const agentMcps = detail.kind === "agent" ? [
    ...state.subscriptions.filter((s: any) => s.type === "agent_mcp" && s.sourceId === asset.id && s.status !== "Revoked"),
    ...pendingFor("agent_mcp", (r: any) => r.sourceId === asset.id),
  ] : [];
  const mcpAgents = detail.kind === "mcp" ? state.subscriptions.filter((s: any) => s.type === "agent_mcp" && s.targetId === asset.id && s.status !== "Revoked") : [];
  const mcpCollectives = detail.kind === "mcp" ? state.subscriptions.filter((s: any) => s.type === "collective_mcp" && s.targetId === asset.id && s.status !== "Revoked") : [];
  const collectiveMcps = detail.kind === "collective" ? [
    ...state.subscriptions.filter((s: any) => s.type === "collective_mcp" && s.sourceId === asset.id && s.status !== "Revoked"),
    ...pendingFor("collective_mcp", (r: any) => r.sourceId === asset.id),
  ] : [];
  const filteredMcps = state.mcps.filter((m: any) => (m.uuaa || "KDIT") === request.uuaa);
  const selectedMcp = filteredMcps.find((m: any) => m.id === request.mcpId) || filteredMcps[0] || state.mcps[0];
  const filteredAgents = state.agents.filter((a: any) => (a.uuaa || "KDIT") === request.uuaa);
  const selectedSkill = state.skills.find((skill: any) => skill.id === request.skillId) || state.skills[0];
  const selectedSkillVersions = state.skillVersions.filter((version: any) => version.skill_id === selectedSkill?.id && version.status === "approved");
  const agentSkillAssociations = detail.kind === "agent" ? state.agentSkillAssociations.filter((association: any) => association.agent_id === asset.id && association.authorization_status !== "revoked") : [];
  const skillAssociations = detail.kind === "skill" ? state.agentSkillAssociations.filter((association: any) => association.skill_id === asset.id && association.authorization_status !== "revoked") : [];
  const skillVersions = detail.kind === "skill" ? state.skillVersions.filter((version: any) => version.skill_id === asset.id) : [];
  const currentSkillVersion = skillVersions.find((version: any) => version.status === "approved") || skillVersions[0];
  const skillRequests = detail.kind === "skill" ? state.requests.filter((request: any) => request.type === "agent_skill" && request.targetId === asset.id) : [];
  const skillRegistryRows = detail.kind === "skill" ? [{ id: "registry", provider: asset.registry_provider, registryId: asset.registry_id, recordId: asset.registry_record_id, recordArn: asset.registry_record_arn, recordStatus: asset.registry_record_status, lastSync: `${asset.last_sync_status} · ${asset.last_sync_date}` }] : [];
  const skillGovernanceRows = detail.kind === "skill" ? [{ id: "governance", ownerUuaa: asset.owner_uuaa, owner: asset.skill_owner, domain: asset.domain, risk: asset.risk_level, dataClassification: asset.data_classification, usagePolicy: asset.usage_policy, governanceRef: asset.governance_reference }] : [];
  const skillVersionRows = detail.kind === "skill" && currentSkillVersion ? [{ id: currentSkillVersion.id, version: currentSkillVersion.version, status: currentSkillVersion.status, artifactFormat: currentSkillVersion.artifact_format, artifactLocation: currentSkillVersion.artifact_location, registryRevision: currentSkillVersion.registry_record_revision_id, publishedAt: currentSkillVersion.published_at, usedByAgents: state.agentSkillAssociations.filter((association: any) => association.skill_id === asset.id && association.skill_version === currentSkillVersion.version).length }] : [];
  const canRequestAgent = profile === "Project Owner" || profile === "Application Manager";
  const canRequestMcp = profile === "Project Owner" || profile === "AI Engineer";
  const canManageSkills = profile === "Project Owner" || profile === "AI Engineer";
  const closeAll = () => {
    setRequestModal(null);
    close();
  };
  const openRequestModal = (type: string) => {
    if (type === "application_agent") setRequest((r: any) => ({ ...r, agentId: filteredAgents[0]?.id || r.agentId }));
    if (type === "agent_mcp" || type === "collective_mcp") setRequest((r: any) => ({ ...r, mcpId: filteredMcps[0]?.id || r.mcpId, requestedToolIds: [] }));
    if (type === "agent_skill") setRequest((r: any) => ({ ...r, skillId: selectedSkill?.id || r.skillId, skillVersion: selectedSkillVersions[0]?.version || r.skillVersion }));
    setRequestModal(type);
  };
  const toolNames = (mcpId: string, toolIds: string[] = []) => {
    if (!toolIds.length) return "All tools matching access level";
    const mcp = state.mcps.find((m: any) => m.id === mcpId);
    return toolIds.map((toolId: string) => mcp?.tools.find((tool: any) => tool.id === toolId)?.name || toolId).join(", ");
  };
  const subscriptionDetail = (subscription: any, mcpId = subscription.mcpId || subscription.targetId) => ({
    ...subscription,
    accessScope: subscription.accessLevel || subscription.requestedAccess,
    toolsScope: toolNames(mcpId, subscription.toolIds || subscription.requestedToolIds || []),
  });

  const submitApplicationAgentRequest = () => {
    createRequest({
      type: "application_agent",
      sourceId: asset.id,
      targetId: request.agentId,
      requestedAccess: "full",
      requestedToolIds: [],
      purpose: request.purpose,
      justification: request.justification,
      expiration: request.expiration,
    });
    closeAll();
  };

  const addToolFromDetail = () => {
    if (!toolDraft.name.trim()) return;
    addToolToMcp(asset.id, { id: newId("tool"), description: `${toolDraft.name} over ${toolDraft.resource || "resource"}`, sensitivity: toolDraft.risk, requiresApproval: toolDraft.type !== "read", status: "Active", gatewayRoute: `/tools/${toolDraft.name}`, toolSchema: "json-schema:v1", ...toolDraft });
    setToolDraft({ name: "", type: "read", resource: "", risk: "Medium" });
  };

  const submitAgentMcpRequest = () => {
    createRequest({
      type: "agent_mcp",
      sourceId: asset.id,
      targetId: request.mcpId,
      mcpId: request.mcpId,
      requestedAccess: request.access,
      requestedToolIds: request.access === "custom" ? request.requestedToolIds : [],
      purpose: request.purpose,
      justification: request.justification,
      expiration: request.expiration,
    });
    closeAll();
  };

  const submitAgentSkillRequest = () => {
    const version = request.skillVersion || selectedSkillVersions[0]?.version || "1.0.0";
    if (selectedSkill?.usage_policy === "open") {
      associateSkillToAgent(asset.id, selectedSkill.id, version);
    } else {
      createRequest({
        type: "agent_skill",
        sourceId: asset.id,
        targetId: selectedSkill.id,
        skillId: selectedSkill.id,
        requestedVersion: version,
        approvalPolicyApplied: selectedSkill.usage_policy,
        riskLevel: selectedSkill.risk_level,
        requestedAccess: "full",
        requestedToolIds: [],
        purpose: request.purpose,
        justification: request.justification,
        expiration: request.expiration,
      });
    }
    closeAll();
  };

  const submitCollectiveMcpRequest = () => {
    createRequest({
      type: "collective_mcp",
      sourceId: asset.id,
      targetId: request.mcpId,
      mcpId: request.mcpId,
      requestedAccess: request.access,
      requestedToolIds: request.access === "custom" ? request.requestedToolIds : [],
      purpose: request.purpose,
      justification: request.justification,
      expiration: request.expiration,
    });
    closeAll();
  };

  const requestTitle = requestModal === "application_agent" ? "Request authorization to invoke an agent" : requestModal === "agent_skill" ? "Associate or request Skill access" : "Request access to an MCP";
  const requestForm = () => {
    if (requestModal === "application_agent") return (
      <div className="modal-body form two">
        <Field label="UUAA" value={request.uuaa} set={(v: string) => setRequest((r: any) => ({ ...r, uuaa: v, agentId: state.agents.find((a: any) => (a.uuaa || "KDIT") === v)?.id || "" }))} options={uuaas.map((u: string) => ({ id: u, name: u }))} />
        <Field label="Agent requested" value={request.agentId} set={(v: string) => setRequest((r: any) => ({ ...r, agentId: v }))} options={filteredAgents} />
        <div className="field"><label>Purpose</label><input value={request.purpose} onChange={(e) => setRequest((r: any) => ({ ...r, purpose: e.target.value }))} /></div>
        <div className="field" style={{ gridColumn: "1 / -1" }}><label>Justification</label><textarea value={request.justification} onChange={(e) => setRequest((r: any) => ({ ...r, justification: e.target.value }))} /></div>
        <div className="modal-form-actions"><button className="btn secondary" type="button" onClick={() => setRequestModal(null)}>Cancel</button><button className="btn" type="button" onClick={submitApplicationAgentRequest}>Submit Agent Acces Request!</button></div>
      </div>
    );
    if (requestModal === "agent_skill") return (
      <div className="modal-body form two">
        <Field label="Skill" value={request.skillId} set={(v: string) => setRequest((r: any) => ({ ...r, skillId: v, skillVersion: state.skillVersions.find((version: any) => version.skill_id === v && version.status === "approved")?.version || "" }))} options={state.skills.map((skill: any) => ({ id: skill.id, name: `${skill.name} (${skill.owner_uuaa})` }))} />
        <Field label="Approved version" value={request.skillVersion || selectedSkillVersions[0]?.version || ""} set={(v: string) => setRequest((r: any) => ({ ...r, skillVersion: v }))} options={selectedSkillVersions.map((version: any) => ({ id: version.version, name: version.version }))} />
        <div className="field"><label>Usage policy</label><input value={selectedSkill?.usage_policy || "-"} readOnly /></div>
        <div className="field" style={{ gridColumn: "1 / -1" }}><label>Business justification</label><textarea value={request.justification} onChange={(e) => setRequest((r: any) => ({ ...r, justification: e.target.value }))} /></div>
        <div className="modal-form-actions"><button className="btn secondary" type="button" onClick={() => setRequestModal(null)}>Cancel</button><button className="btn" type="button" onClick={submitAgentSkillRequest}>{selectedSkill?.usage_policy === "open" ? "Associate Skill" : "Request Skill Access"}</button></div>
      </div>
    );
    return (
      <div className="modal-body form two">
        <Field label="UUAA" value={request.uuaa} set={(v: string) => setRequest((r: any) => ({ ...r, uuaa: v, mcpId: state.mcps.find((m: any) => (m.uuaa || "KDIT") === v)?.id || "", requestedToolIds: [] }))} options={uuaas.map((u: string) => ({ id: u, name: u }))} />
        <Field label="MCP requested" value={request.mcpId} set={(v: string) => setRequest((r: any) => ({ ...r, mcpId: v, requestedToolIds: [] }))} options={filteredMcps} />
        <div className="field"><label>Access level</label><select value={request.access} onChange={(e) => setRequest((r: any) => ({ ...r, access: e.target.value }))}><option value="read">Read tools</option><option value="write">Write tools</option><option value="full">Full MCP access</option><option value="custom">Specific tools</option></select></div>
        <div className="field"><label>Purpose</label><input value={request.purpose} onChange={(e) => setRequest((r: any) => ({ ...r, purpose: e.target.value }))} /></div>
        <div className="field"><label>Expiration</label><input value={request.expiration} onChange={(e) => setRequest((r: any) => ({ ...r, expiration: e.target.value }))} /></div>
        {request.access === "custom" && <ToolChecklist tools={selectedMcp?.tools || []} selected={request.requestedToolIds} setSelected={(toolIds: string[]) => setRequest((r: any) => ({ ...r, requestedToolIds: toolIds }))} />}
        <div className="field" style={{ gridColumn: "1 / -1" }}><label>Justification</label><textarea value={request.justification} onChange={(e) => setRequest((r: any) => ({ ...r, justification: e.target.value }))} /></div>
        <div className="modal-form-actions"><button className="btn secondary" type="button" onClick={() => setRequestModal(null)}>Cancel</button><button className="btn" type="button" onClick={requestModal === "collective_mcp" ? submitCollectiveMcpRequest : submitAgentMcpRequest}>{requestModal === "collective_mcp" ? "Submit ChatApps Collective -> MCP request" : "Submit Agent -> MCP request"}</button></div>
      </div>
    );
  };

  return (
    <div className="modal-backdrop">
      <div className="modal wide">
        <div className="modal-head"><h2>{asset.name}</h2><div className="toolbar"><button className="btn secondary" onClick={close}>Close</button><button className="btn danger" onClick={() => deleteAsset(detail.kind, asset.id)}>{canDelete ? "Delete asset" : "Delete blocked"}</button></div></div>
        <div className="modal-body">
          <p className="hint">{canDelete ? "Este asset no tiene suscripciones activas ni solicitudes pendientes, por lo que puede borrarse." : `No se puede borrar todavia: tiene ${activeSubs.length} suscripciones activas y ${pendingRequests.length} solicitudes pendientes.`}</p>
          {detail.kind === "application" || detail.kind === "collective" ? <div className="panel">
            <div className="panel-head"><b>Asset data</b></div>
            <KeyValues data={asset} />
          </div> : <div className="split">
            <div className="panel">
              <div className="panel-head"><b>Asset data</b></div>
              <KeyValues data={asset} />
            </div>
            <div className="panel">
              <div className="panel-head"><b>Related activity</b></div>
              <table><tbody><tr><td>Active subscriptions</td><td>{activeSubs.length}</td></tr><tr><td>Pending requests</td><td>{pendingRequests.length}</td></tr><tr><td>Status</td><td>{badge("status", asset.status)}</td></tr></tbody></table>
            </div>
          </div>}

          {(detail.kind === "agent" || detail.kind === "mcp") && <RegistryMapping kind={detail.kind} asset={asset} />}

          {detail.kind === "application" && <>
            <SectionTable title="Authorized agents" rows={appAgentSubs.map((s: any) => ({ ...s, agent: entityName(s.targetId), actions: s.status === "Pending" ? "Cancel request" : "" }))} columns={["agent","purpose","approver","status","expiration"]} cancelRequest={cancelRequest} revoke={revoke} headerAction={canRequestAgent ? <button className="btn panel-action" type="button" onClick={() => openRequestModal("application_agent")}>New request</button> : null} />
            {!canRequestAgent && <div className="hint">Solo Application Manager o Project Owner pueden solicitar autorizacion para invocar agentes desde una aplicacion.</div>}
          </>}

          {detail.kind === "agent" && <>
            <SectionTable title="Consumer applications" rows={agentApps.map((s: any) => ({ ...s, application: entityName(s.sourceId) }))} columns={["application","purpose","requester","status","expiration"]} cancelRequest={cancelRequest} />
            <SectionTable title="Authorized MCPs" rows={agentMcps.map((s: any) => subscriptionDetail({ ...s, mcp: entityName(s.targetId) }))} columns={["mcp","accessScope","toolsScope","conditions","approver","status","expiration"]} cancelRequest={cancelRequest} headerAction={canRequestMcp ? <button className="btn panel-action" type="button" onClick={() => openRequestModal("agent_mcp")}>New request</button> : null} />
            <SectionTable title="Skills used by this agent" rows={agentSkillAssociations.map((association: any) => ({ ...association, skill: entityName(association.skill_id), version: association.skill_version, status: association.authorization_status, risk: state.skills.find((skill: any) => skill.id === association.skill_id)?.risk_level, owner: state.skills.find((skill: any) => skill.id === association.skill_id)?.skill_owner, upgradePolicy: association.upgrade_policy }))} columns={["skill","version","status","risk","owner","upgradePolicy"]} headerAction={canManageSkills ? <button className="btn panel-action" type="button" onClick={() => openRequestModal("agent_skill")}>New request</button> : null} />
            {!canManageSkills && <div className="hint">Solo AI Engineer o Project Owner pueden asociar Skills a agentes.</div>}
            {!canRequestMcp && <div className="hint">Solo AI Engineer o Project Owner pueden solicitar autorizacion para usar MCPs desde un agente.</div>}
          </>}

          {detail.kind === "mcp" && <>
            <SectionTable title="Tools" rows={asset.tools} columns={["name","type","gatewayRoute","toolSchema","resource","risk","requiresApproval","status"]} />
            <div className="panel relation-panel">
              <div className="panel-head"><b>Add tool</b></div>
              <div className="modal-body">
                <div className="tool-editor">
                  <input placeholder="Tool name" value={toolDraft.name} onChange={(e) => setToolDraft((t: any) => ({ ...t, name: e.target.value }))} />
                  <select value={toolDraft.type} onChange={(e) => setToolDraft((t: any) => ({ ...t, type: e.target.value }))}><option value="read">read</option><option value="write">write</option><option value="critical_action">critical_action</option></select>
                  <input placeholder="Resource" value={toolDraft.resource} onChange={(e) => setToolDraft((t: any) => ({ ...t, resource: e.target.value }))} />
                  <select value={toolDraft.risk} onChange={(e) => setToolDraft((t: any) => ({ ...t, risk: e.target.value }))}><option>Medium</option><option>High</option><option>Critical</option></select>
                  <button className="btn" type="button" onClick={addToolFromDetail}>Add tool</button>
                </div>
              </div>
            </div>
            <SectionTable title="Authorized agents" rows={mcpAgents.map((s: any) => subscriptionDetail({ ...s, agent: entityName(s.sourceId) }, asset.id))} columns={["agent","accessScope","toolsScope","conditions","requester","status","expiration"]} revoke={revoke} />
            <SectionTable title="Authorized ChatApps collectives" rows={mcpCollectives.map((s: any) => subscriptionDetail({ ...s, collective: entityName(s.sourceId) }, asset.id))} columns={["collective","accessScope","toolsScope","conditions","requester","status","expiration"]} revoke={revoke} />
          </>}

          {detail.kind === "collective" && <>
            <SectionTable title="Authorized MCPs" rows={collectiveMcps.map((s: any) => subscriptionDetail({ ...s, mcp: entityName(s.targetId) }))} columns={["mcp","accessScope","toolsScope","conditions","approver","status","expiration"]} cancelRequest={cancelRequest} revoke={revoke} headerAction={canRequestMcp ? <button className="btn panel-action" type="button" onClick={() => openRequestModal("collective_mcp")}>New request</button> : null} />
            {!canRequestMcp && <div className="hint">Solo AI Engineer o Project Owner pueden solicitar autorizacion para usar MCPs desde colectivos ChatApps.</div>}
          </>}

          {detail.kind === "skill" && <>
            <div className="panel">
              <div className="panel-head"><b>Registry</b></div>
              <Rows rows={skillRegistryRows} columns={["provider","registryId","recordId","recordStatus","lastSync","recordArn"]} />
            </div>
            <div className="split relation-panel">
              <div className="panel"><div className="panel-head"><b>Governance</b></div><Rows rows={skillGovernanceRows} columns={["ownerUuaa","owner","domain","risk","dataClassification","usagePolicy","governanceRef"]} /></div>
              <div className="panel"><div className="panel-head"><b>Current Version</b></div><Rows rows={skillVersionRows} columns={["version","status","artifactFormat","registryRevision","publishedAt","usedByAgents"]} /></div>
            </div>
            <div className="panel relation-panel">
              <div className="panel-head"><b>Skill Specification</b><span>{currentSkillVersion?.artifact_location}</span></div>
              <div className="markdown-document"><pre>{currentSkillVersion?.specification_markdown || "No SKILL.md specification available for this Skill version."}</pre></div>
            </div>
            <SectionTable title="Agents Using This Skill" rows={skillAssociations.map((association: any) => ({ ...association, agent: entityName(association.agent_id), agentOwner: state.agents.find((agent: any) => agent.id === association.agent_id)?.owner, uuaa: state.agents.find((agent: any) => agent.id === association.agent_id)?.uuaa, versionUsed: association.skill_version, associationStatus: association.authorization_status, upgradePolicy: association.upgrade_policy }))} columns={["agent","agentOwner","uuaa","versionUsed","upgradePolicy","associationStatus"]} />
            <SectionTable title="Authorization Requests" rows={skillRequests.map((request: any) => ({ ...request, agent: entityName(request.sourceId), requestedVersion: request.requestedVersion, risk: request.riskLevel }))} columns={["agent","requestedVersion","requester","approver","risk","status","purpose"]} cancelRequest={cancelRequest} />
          </>}
        </div>
      </div>
      {requestModal && <div className="modal-backdrop request-modal-layer">
        <div className="modal request-modal">
          <div className="modal-head"><h2>{requestTitle}</h2><button className="btn secondary" type="button" onClick={() => setRequestModal(null)}>Close</button></div>
          {requestForm()}
        </div>
      </div>}
    </div>
  );
}

function RegistryMapping({ kind, asset }: any) {
  const rows = kind === "agent" ? [
    { ada: "Agent", aws: "AgentCore Registry entry", value: asset.registryAgentId },
    { ada: "Lifecycle", aws: "Registry stage + version", value: `${asset.deploymentStage} / ${asset.agentVersion}` },
    { ada: "Execution", aws: "AgentCore Runtime", value: asset.runtimeArn },
    { ada: "Identity", aws: "AgentCore Identity", value: asset.identityMode },
    { ada: "Telemetry", aws: "AgentCore Observability", value: asset.observability },
  ] : [
    { ada: "MCP", aws: "AgentCore Gateway MCP server", value: asset.mcpServerId },
    { ada: "Tool exposure", aws: "Gateway routes", value: asset.gatewayId },
    { ada: "Authentication", aws: "Gateway auth mode", value: asset.authMode },
    { ada: "Identity propagation", aws: "AgentCore Identity", value: asset.identityMode },
    { ada: "Telemetry", aws: "AgentCore Observability", value: asset.observability },
  ];
  return <div className="panel relation-panel"><div className="panel-head"><b>AWS AgentCore alignment</b></div><Rows rows={rows.map((r: any, i: number) => ({ id: `${kind}-map-${i}`, ...r }))} columns={["ada","aws","value"]} /></div>;
}

function KeyValues({ data }: any) {
  const entries = Object.entries(data).filter(([k]) => k !== "tools");
  return <table><tbody>{entries.map(([k, v]) => <tr key={k}><td>{k}</td><td>{typeof v === "string" ? badge(k, v) : String(v)}</td></tr>)}</tbody></table>;
}

function SectionTable({ title, rows, columns, cancelRequest, revoke, headerAction }: any) {
  const hasActions = Boolean(cancelRequest || revoke);
  const action = (row: any) => {
    if (row.status === "Pending" && cancelRequest) return <button className="btn danger" onClick={() => cancelRequest(row.id)}>Cancel request</button>;
    if (row.status !== "Pending" && revoke) return <button className="btn danger" onClick={() => revoke(row.id)}>Remove subscription</button>;
    return "-";
  };
  return <div className="panel relation-panel"><div className="panel-head"><b>{title}</b>{headerAction}</div>{rows.length ? <table><thead><tr>{columns.map((c: string) => <th key={c}>{c}</th>)}{hasActions && <th>Actions</th>}</tr></thead><tbody>{rows.map((r: any) => <tr key={r.id}>{columns.map((c: string) => <td key={c}>{badge(c, r[c])}</td>)}{hasActions && <td>{action(r)}</td>}</tr>)}</tbody></table> : <div className="empty">No related records yet.</div>}</div>;
}

function ToolChecklist({ tools, selected, setSelected }: any) {
  const toggle = (id: string) => {
    setSelected(selected.includes(id) ? selected.filter((toolId: string) => toolId !== id) : [...selected, id]);
  };
  return (
    <div className="field" style={{ gridColumn: "1 / -1" }}>
      <label>Specific tools requested</label>
      <div className="check-grid">
        {tools.map((tool: any) => (
          <label key={tool.id} className="check-row">
            <input type="checkbox" checked={selected.includes(tool.id)} onChange={() => toggle(tool.id)} />
            <span>{tool.name}</span>
            <span className={`badge ${tool.type}`}>{tool.type}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function EntityModal({ modal, close, state, addEntity, createRequest, selectedUuaa }: any) {
  const [form, setForm] = useState<any>({ country: "ES", environment: "prod", businessArea: "Retail Banking", requestedAccess: "read", requestedToolIds: [], expiration: "31-12-2026", type: "application_agent", uuaa: selectedUuaa, tools: [], registryProvider: "Amazon Bedrock AgentCore Registry", agentVersion: "1.0.0", deploymentStage: "registered", identityMode: "pre_authorized", protocol: "MCP via AgentCore Gateway", authMode: "iam", usage_policy: "approval_required", risk_level: "Medium", data_classification: "internal" });
  const [toolDraft, setToolDraft] = useState<any>({ name: "", type: "read", resource: "", risk: "Medium" });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const addToolDraft = () => {
    if (!toolDraft.name.trim()) return;
    set("tools", [...form.tools, { id: newId("tool"), description: `${toolDraft.name} over ${toolDraft.resource || "resource"}`, sensitivity: toolDraft.risk, requiresApproval: toolDraft.type !== "read", status: "Active", gatewayRoute: `/tools/${toolDraft.name}`, toolSchema: "json-schema:v1", ...toolDraft }]);
    setToolDraft({ name: "", type: "read", resource: "", risk: "Medium" });
  };
  const save = () => {
    if (modal === "request") createRequest(form);
    else addEntity(modal, form);
  };
  const title = modal === "request" ? "Create subscription request" : `Create ${modal}`;
  const requestTargetOptions = form.type === "application_agent" ? state.agents : form.type === "agent_skill" ? state.skills : state.mcps;
  const requestSourceOptions = form.type === "application_agent" ? state.applications : form.type === "collective_mcp" ? state.collectives : state.agents;
  return <div className="modal-backdrop"><div className="modal"><div className="modal-head"><h2>{title}</h2><button className="btn secondary" onClick={close}>Close</button></div><div className="modal-body"><p className="hint">Formulario guiado de maqueta. La UUAA se rellena con la seleccionada arriba: {selectedUuaa}. Los campos AWS son metadatos de alineacion, no conectan con AWS en local.</p><div className="form two">{modal !== "request" ? <><div className="field"><label>Name</label><input onChange={(e) => set("name", e.target.value)} /></div><div className="field"><label>UUAA</label><input value={form.uuaa} readOnly /></div><div className="field"><label>Owner</label><input onChange={(e) => set("owner", e.target.value)} placeholder="Business or technical owner" /></div><div className="field"><label>Business area / domain</label><input value={form.businessArea} onChange={(e) => set("businessArea", e.target.value)} /></div><div className="field"><label>Country</label><input value={form.country} onChange={(e) => set("country", e.target.value)} /></div>{modal === "skill" ? <><div className="field"><label>Usage policy</label><select value={form.usage_policy} onChange={(e) => set("usage_policy", e.target.value)}><option value="open">open</option><option value="restricted">restricted</option><option value="approval_required">approval_required</option></select></div><div className="field"><label>Risk level</label><select value={form.risk_level} onChange={(e) => set("risk_level", e.target.value)}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></div><div className="field"><label>Data classification</label><select value={form.data_classification} onChange={(e) => set("data_classification", e.target.value)}><option value="internal">internal</option><option value="confidential">confidential</option><option value="restricted">restricted</option></select></div><div className="field"><label>Skill ID</label><input placeholder="bbva.skill.example" onChange={(e) => set("ada_skill_id", e.target.value)} /></div></> : modal === "collective" ? <div className="field"><label>Conversational platform</label><select onChange={(e) => set("platform", e.target.value)}><option>ChatGPT Enterprise</option><option>Gemini Enterprise</option><option>Copilot Studio</option></select></div> : <div className="field"><label>Environment</label><select value={form.environment} onChange={(e) => set("environment", e.target.value)}><option>dev</option><option>pre</option><option>prod</option></select></div>}{modal === "agent" && <><div className="field"><label>Agent type</label><input onChange={(e) => set("type", e.target.value)} placeholder="advisor, service, risk..." /></div><div className="field"><label>Criticality</label><select onChange={(e) => set("criticality", e.target.value)}><option>Medium</option><option>High</option><option>Critical</option></select></div><div className="field"><label>Registry provider</label><input value={form.registryProvider} onChange={(e) => set("registryProvider", e.target.value)} /></div><div className="field"><label>Agent version</label><input value={form.agentVersion} onChange={(e) => set("agentVersion", e.target.value)} /></div><div className="field"><label>Deployment stage</label><select value={form.deploymentStage} onChange={(e) => set("deploymentStage", e.target.value)}><option>draft</option><option>registered</option><option>certified</option><option>deployed</option><option>retired</option></select></div><div className="field"><label>Identity mode</label><select value={form.identityMode} onChange={(e) => set("identityMode", e.target.value)}><option>workload</option><option>end_user</option><option>pre_authorized</option></select></div></>}{modal === "mcp" && <><div className="field"><label>Backend system</label><input onChange={(e) => set("backendSystem", e.target.value)} /></div><div className="field"><label>Risk</label><select onChange={(e) => set("risk", e.target.value)}><option>Medium</option><option>High</option><option>Critical</option></select></div><div className="field"><label>Protocol</label><input value={form.protocol} onChange={(e) => set("protocol", e.target.value)} /></div><div className="field"><label>Auth mode</label><select value={form.authMode} onChange={(e) => set("authMode", e.target.value)}><option>iam</option><option>oauth</option><option>api_key</option><option>none</option></select></div><div className="field"><label>Identity mode</label><select value={form.identityMode} onChange={(e) => set("identityMode", e.target.value)}><option>end_user</option><option>workload</option><option>pre_authorized</option></select></div><div className="field" style={{gridColumn: "1 / -1"}}><label>Tools</label><div className="tool-editor"><input placeholder="Tool name" value={toolDraft.name} onChange={(e) => setToolDraft((t: any) => ({ ...t, name: e.target.value }))} /><select value={toolDraft.type} onChange={(e) => setToolDraft((t: any) => ({ ...t, type: e.target.value }))}><option value="read">read</option><option value="write">write</option><option value="critical_action">critical_action</option></select><input placeholder="Resource" value={toolDraft.resource} onChange={(e) => setToolDraft((t: any) => ({ ...t, resource: e.target.value }))} /><button className="btn" type="button" onClick={addToolDraft}>Add tool</button></div>{form.tools.length ? <Rows rows={form.tools} columns={["name","type","gatewayRoute","resource","risk","status"]} /> : <div className="empty">Add at least the tools you want to expose in this MCP.</div>}</div></>}<div className="field" style={{gridColumn: "1 / -1"}}><label>Description</label><textarea onChange={(e) => set("description", e.target.value)} /></div></> : <><div className="field"><label>Request type</label><select value={form.type} onChange={(e) => set("type", e.target.value)}><option value="application_agent">Application &rarr; Agent</option><option value="agent_mcp">Agent &rarr; MCP</option><option value="collective_mcp">ChatApps Collective &rarr; MCP</option><option value="agent_skill">Agent &rarr; Skill</option></select></div><Field label="Source" value={form.sourceId || requestSourceOptions[0]?.id} set={(v: string) => set("sourceId", v)} options={requestSourceOptions} /><Field label="Target" value={form.targetId || requestTargetOptions[0]?.id} set={(v: string) => set("targetId", v)} options={requestTargetOptions} /><div className="field"><label>Requested access</label><select value={form.requestedAccess} onChange={(e) => set("requestedAccess", e.target.value as AccessLevel)}><option value="full">Full access</option><option value="read">Read tools</option><option value="write">Write tools</option><option value="custom">Specific tools</option></select></div><div className="field"><label>Purpose</label><input onChange={(e) => set("purpose", e.target.value)} /></div><div className="field"><label>Expiration</label><input value={form.expiration} onChange={(e) => set("expiration", e.target.value)} /></div><div className="field" style={{gridColumn: "1 / -1"}}><label>Justification</label><textarea onChange={(e) => set("justification", e.target.value)} /></div></>}</div></div><div className="modal-foot"><button className="btn secondary" onClick={close}>Cancel</button><button className="btn" onClick={save}>Confirm</button></div></div></div>;
}
