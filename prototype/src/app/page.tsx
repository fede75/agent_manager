"use client";

import { useEffect, useState } from "react";
import { AppState, AccessLevel, RequestType, seedState, newId, nowStamp } from "@/lib/data";

const storageKey = "ada-ai-agents-console-state";
const sections = ["Dashboard", "Applications", "User Collectives", "Agents", "MCPs", "Subscriptions", "Requests", "Simulator", "Audit", "Policies"];
const icons: Record<string, string> = { Dashboard: "◉", Applications: "▣", "User Collectives": "◎", Agents: "✣", MCPs: "▦", Subscriptions: "↔", Requests: "☑", Simulator: "▷", Audit: "≡", Policies: "⚙" };

export default function Home() {
  const [state, setState] = useState<AppState>(seedState);
  const [section, setSection] = useState("Dashboard");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<string | null>(null);
  const [simMode, setSimMode] = useState<"application" | "collective">("application");
  const [sim, setSim] = useState({ app: "app-crm", collective: "col-mortgage", agent: "agt-customer", mcp: "mcp-customer", tool: "t-profile", endUser: "u123456@bbva.com", purpose: "customer_support" });
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setState(JSON.parse(saved));
  }, []);
  useEffect(() => localStorage.setItem(storageKey, JSON.stringify(state)), [state]);

  const audit = (actor: string, action: string, entity: string, decision: string, reason: string) => {
    setState((s) => ({ ...s, audit: [{ id: newId("aud"), timestamp: nowStamp(), actor, action, entity, decision, reason, correlationId: `ADA-${Math.floor(Math.random() * 90000 + 10000)}` }, ...s.audit] }));
  };

  const addEntity = (kind: string, data: any) => {
    setState((s) => {
      const next: AppState = { ...s };
      if (kind === "application") next.applications = [{ id: newId("app"), status: "Active", ...data }, ...s.applications];
      if (kind === "collective") next.collectives = [{ id: newId("col"), status: "Active", ...data }, ...s.collectives];
      if (kind === "agent") next.agents = [{ id: newId("agt"), status: "Active", ...data }, ...s.agents];
      if (kind === "mcp") next.mcps = [{ id: newId("mcp"), status: "Active", tools: [], ...data }, ...s.mcps];
      return next;
    });
    audit("Project Owner", `${kind}_created`, data.name, "allow", "Created from guided console form");
    setModal(null);
  };

  const createRequest = (data: any) => {
    const type = data.type as RequestType;
    const approver = type === "application_agent" ? state.agents.find((a) => a.id === data.targetId)?.owner : state.mcps.find((m) => m.id === data.targetId)?.owner;
    const requester = type === "application_agent" ? state.applications.find((a) => a.id === data.sourceId)?.owner : type === "agent_mcp" ? state.agents.find((a) => a.id === data.sourceId)?.owner : state.collectives.find((c) => c.id === data.sourceId)?.owner;
    const req = { id: newId("req"), status: "Pending", accessLevel: data.requestedAccess, toolIds: data.requestedToolIds || [], requestedToolIds: data.requestedToolIds || [], requester, approver, conditions: "", updated: nowStamp(), ...data };
    setState((s) => ({ ...s, requests: [req, ...s.requests] }));
    audit(requester || "requester", "subscription_requested", type, "pending", data.justification || "Subscription request submitted");
    setModal(null);
  };

  const decide = (id: string, decision: "Approved" | "Rejected" | "Partial") => {
    const req = state.requests.find((r) => r.id === id);
    if (!req) return;
    setState((s) => ({
      ...s,
      requests: s.requests.map((r) => r.id === id ? { ...r, status: decision, updated: nowStamp(), conditions: decision === "Partial" ? "Approved with reduced scope and audit required" : r.conditions } : r),
      subscriptions: decision === "Rejected" ? s.subscriptions : [{ ...req, id: newId("sub"), status: decision === "Partial" ? "Partial" : "Active", accessLevel: decision === "Partial" ? "read" : req.requestedAccess, toolIds: decision === "Partial" ? [] : req.requestedToolIds, updated: nowStamp(), conditions: decision === "Partial" ? "Read-only partial approval" : "Approved by owner" }, ...s.subscriptions],
    }));
    audit(req.approver, `request_${decision.toLowerCase()}`, req.type, decision, decision === "Rejected" ? "Owner rejected the subscription request" : "Subscription created or updated");
  };

  const revoke = (id: string) => {
    setState((s) => ({ ...s, subscriptions: s.subscriptions.map((sub) => sub.id === id ? { ...sub, status: "Revoked", updated: nowStamp() } : sub) }));
    audit("Project Owner", "subscription_revoked", id, "deny", "Subscription revoked from console");
  };

  const entityName = (id?: string) => [...state.applications, ...state.collectives, ...state.agents, ...state.mcps].find((e: any) => e.id === id)?.name || id || "-";
  const mcp = state.mcps.find((m) => m.id === sim.mcp) || state.mcps[0];
  const tools = mcp?.tools || [];

  const canUseTool = (sub: any, tool: any) => sub && sub.status !== "Revoked" && (sub.accessLevel === "full" || sub.accessLevel === tool.type || (sub.accessLevel === "read" && tool.type === "read") || (sub.accessLevel === "write" && tool.type === "write") || (sub.accessLevel === "custom" && sub.toolIds.includes(tool.id)));
  const runSimulation = () => {
    const tool = tools.find((t) => t.id === sim.tool) || tools[0];
    const steps: any[] = [];
    let final = "allow";
    if (simMode === "application") {
      const aa = state.subscriptions.find((s) => s.type === "application_agent" && s.sourceId === sim.app && s.targetId === sim.agent && s.status !== "Revoked");
      steps.push({ ok: !!aa, text: `${entityName(sim.app)} ${aa ? "is" : "is not"} subscribed to ${entityName(sim.agent)}.` });
      const am = state.subscriptions.find((s) => s.type === "agent_mcp" && s.sourceId === sim.agent && s.targetId === sim.mcp && s.status !== "Revoked");
      steps.push({ ok: !!am, text: `${entityName(sim.agent)} ${am ? "is" : "is not"} subscribed to ${entityName(sim.mcp)}.` });
      const toolOk = canUseTool(am, tool);
      steps.push({ ok: toolOk, text: `${tool.name} is a ${tool.type} tool; approved scope ${am?.accessLevel || "none"}.` });
      if (!aa || !am || !toolOk) final = "deny";
    } else {
      const cm = state.subscriptions.find((s) => s.type === "collective_mcp" && s.sourceId === sim.collective && s.targetId === sim.mcp && s.status !== "Revoked");
      steps.push({ ok: !!cm, text: `${entityName(sim.collective)} ${cm ? "is" : "is not"} subscribed to ${entityName(sim.mcp)} for conversational usage.` });
      const toolOk = canUseTool(cm, tool);
      steps.push({ ok: toolOk, text: `${tool.name} is a ${tool.type} tool; approved scope ${cm?.accessLevel || "none"}.` });
      if (!cm || !toolOk) final = "deny";
    }
    if (final === "allow" && (tool.type === "critical_action" || tool.requiresApproval)) final = "require approval";
    steps.push({ ok: true, warn: true, text: `End user identity propagated to MCP runtime: ${sim.endUser}.` });
    const out = { final, tool, steps, correlationId: `ADA-${Math.floor(Math.random() * 90000 + 10000)}` };
    setResult(out);
    audit(sim.endUser, "access_simulated", `${entityName(sim.mcp)}.${tool.name}`, final, steps.map((s) => s.text).join(" "));
  };

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand"><span>ADA</span><span className="brand-mark">Λ</span><span>console</span></div>
        <div className="group-title">PLATFORM</div>
        <div className="nav"><button className={section === "Dashboard" ? "active" : ""} onClick={() => setSection("Dashboard")}>◉ Dashboard</button></div>
        <div className="group-title">AI AGENTS</div>
        <div className="nav">{sections.slice(1).map((s) => <button key={s} className={section === s ? "active" : ""} onClick={() => setSection(s)}><span>{icons[s]}</span>{s}</button>)}</div>
      </aside>
      <main className="main">
        <div className="top"><div className="title">☰ <span>{section.toUpperCase()}</span></div><div className="top-actions">♡ ⚐ ▦ <span className="chip">Project Owner</span><span className="avatar">FE</span></div></div>
        <div className="crumbs"><span>Sandbox / <b>AI Agents</b> / {section}</span><span className="chips"><span className="chip blue">ES</span><span className="chip">GL</span><span className="chip">PROD</span></span></div>
        <div className="content">
          {section === "Dashboard" && <Dashboard state={state} setSection={setSection} />}
          {section === "Applications" && <Inventory title="Applications" hint="Las aplicaciones consumidoras son sistemas o canales que pueden solicitar acceso a agentes. Una aplicacion no accede directamente a MCPs." rows={state.applications} columns={["name","owner","businessArea","country","environment","status"]} query={query} setQuery={setQuery} onNew={() => setModal("application")} />}
          {section === "User Collectives" && <Inventory title="User Collectives" hint="Los colectivos representan grupos de usuarios que utilizan asistentes conversacionales enterprise como ChatGPT Enterprise o Gemini Enterprise." rows={state.collectives} columns={["name","owner","businessArea","country","platform","status"]} query={query} setQuery={setQuery} onNew={() => setModal("collective")} />}
          {section === "Agents" && <Inventory title="Agents" hint="Los agentes encapsulan capacidades de IA. Pueden ser consumidos por aplicaciones y solicitar acceso a MCPs." rows={state.agents} columns={["name","type","owner","businessArea","country","environment","criticality","status"]} query={query} setQuery={setQuery} onNew={() => setModal("agent")} />}
          {section === "MCPs" && <Mcps state={state} query={query} setQuery={setQuery} onNew={() => setModal("mcp")} />}
          {section === "Subscriptions" && <Subscriptions state={state} entityName={entityName} revoke={revoke} />}
          {section === "Requests" && <Requests state={state} entityName={entityName} decide={decide} onNew={() => setModal("request")} />}
          {section === "Simulator" && <Simulator state={state} sim={sim} setSim={setSim} simMode={simMode} setSimMode={setSimMode} mcp={mcp} tools={tools} runSimulation={runSimulation} result={result} />}
          {section === "Audit" && <Audit state={state} />}
          {section === "Policies" && <Policies />}
        </div>
      </main>
      {modal && <EntityModal modal={modal} close={() => setModal(null)} state={state} addEntity={addEntity} createRequest={createRequest} />}
    </div>
  );
}

function Dashboard({ state, setSection }: any) {
  const metrics = [["Applications", state.applications.length], ["Collectives", state.collectives.length], ["Agents", state.agents.length], ["MCPs", state.mcps.length], ["Tools", state.mcps.flatMap((m: any) => m.tools).length], ["Active subscriptions", state.subscriptions.filter((s: any) => s.status === "Active").length], ["Pending requests", state.requests.filter((r: any) => r.status === "Pending").length], ["Audit events", state.audit.length]];
  return <><p className="hint">Control plane de gobierno para Application &rarr; Agent, Agent &rarr; MCP y Collective &rarr; MCP. Use esta pantalla para detectar trabajo pendiente y navegar a los flujos clave.</p><div className="grid">{metrics.map(([k,v]: any) => <div className="metric" key={k}><span>{k}</span><strong>{v}</strong></div>)}</div><div className="split"><div className="panel"><div className="panel-head"><b>Pending approvals</b><button className="btn ghost" onClick={() => setSection("Requests")}>Open requests</button></div><Rows rows={state.requests.filter((r: any) => r.status === "Pending")} columns={["type","requester","approver","purpose","status"]} /></div><div className="panel"><div className="panel-head"><b>Governance alerts</b></div><table><tbody><tr><td>Critical tools require human approval</td><td><span className="badge Critical">Critical</span></td></tr><tr><td>New MCP tools blocked until classified</td><td><span className="badge Medium">Medium</span></td></tr><tr><td>End user identity must be propagated to MCP runtime</td><td><span className="badge High">High</span></td></tr></tbody></table></div></div></>;
}

function Inventory({ title, hint, rows, columns, query, setQuery, onNew }: any) {
  const filtered = rows.filter((r: any) => JSON.stringify(r).toLowerCase().includes(query.toLowerCase()));
  return <><p className="hint">{hint}</p><div className="panel"><div className="panel-head"><div className="panel-title">{icons[title] || "▣"} {title}</div><div className="toolbar"><input className="search" placeholder={`Search ${title.toLowerCase()} by name...`} value={query} onChange={(e) => setQuery(e.target.value)} /><button className="btn" onClick={onNew}>+ New</button></div></div><Rows rows={filtered} columns={columns} /></div></>;
}

function Rows({ rows, columns }: any) {
  return <table><thead><tr>{columns.map((c: string) => <th key={c}>{c}</th>)}<th>Actions</th></tr></thead><tbody>{rows.map((r: any) => <tr key={r.id}>{columns.map((c: string) => <td key={c}>{badge(c, r[c])}</td>)}<td><button className="btn ghost">View</button></td></tr>)}</tbody></table>;
}
const badge = (key: string, value: any) => ["status","criticality","risk","type"].includes(key) ? <span className={`badge ${value}`}>{value}</span> : String(value ?? "-");

function Mcps({ state, query, setQuery, onNew }: any) {
  const rows = state.mcps.filter((m: any) => JSON.stringify(m).toLowerCase().includes(query.toLowerCase())).map((m: any) => ({ ...m, tools: m.tools.length, readTools: m.tools.filter((t: any) => t.type === "read").length, writeTools: m.tools.filter((t: any) => t.type !== "read").length }));
  return <><p className="hint">Los MCPs exponen tools consumidas por agentes o colectivos autorizados. Cada MCP tiene un owner responsable de aprobar accesos.</p><div className="panel"><div className="panel-head"><div className="panel-title">▦ MCPs</div><div className="toolbar"><input className="search" placeholder="Search MCPs..." value={query} onChange={(e) => setQuery(e.target.value)} /><button className="btn" onClick={onNew}>+ New MCP</button></div></div><Rows rows={rows} columns={["name","owner","businessArea","backendSystem","environment","risk","tools","readTools","writeTools","status"]} /></div></>;
}

function Subscriptions({ state, entityName, revoke }: any) {
  return <><p className="hint">Vista unica de suscripciones activas: Application &rarr; Agent, Agent &rarr; MCP y Collective &rarr; MCP. Desde aqui puede revocar accesos existentes.</p><div className="panel"><div className="panel-head"><b>Subscriptions</b></div><table><thead><tr>{["Type","Source","Target","Access","Tools","Approver","Status","Expiration","Actions"].map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{state.subscriptions.map((s: any) => <tr key={s.id}><td>{s.type}</td><td>{entityName(s.sourceId)}</td><td>{entityName(s.targetId)}</td><td>{s.accessLevel}</td><td>{s.toolIds.length || "All by scope"}</td><td>{s.approver}</td><td>{badge("status", s.status)}</td><td>{s.expiration}</td><td><button className="btn danger" onClick={() => revoke(s.id)}>Revoke</button></td></tr>)}</tbody></table></div></>;
}

function Requests({ state, entityName, decide, onNew }: any) {
  return <><p className="hint">Las solicitudes son peticiones pendientes de aprobacion. Application &rarr; Agent las aprueba Agent Owner; Agent/Collective &rarr; MCP las aprueba MCP Owner.</p><div className="panel"><div className="panel-head"><b>Requests</b><button className="btn" onClick={onNew}>+ New request</button></div><table><thead><tr>{["Type","Source","Target","Requested","Requester","Approver","Purpose","Status","Actions"].map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{state.requests.map((r: any) => <tr key={r.id}><td>{r.type}</td><td>{entityName(r.sourceId)}</td><td>{entityName(r.targetId)}</td><td>{r.requestedAccess}</td><td>{r.requester}</td><td>{r.approver}</td><td>{r.purpose}</td><td>{badge("status", r.status)}</td><td>{r.status === "Pending" ? <div className="toolbar"><button className="btn" onClick={() => decide(r.id, "Approved")}>Approve</button><button className="btn secondary" onClick={() => decide(r.id, "Partial")}>Partial</button><button className="btn danger" onClick={() => decide(r.id, "Rejected")}>Reject</button></div> : "Closed"}</td></tr>)}</tbody></table></div></>;
}

function Simulator({ state, sim, setSim, simMode, setSimMode, mcp, tools, runSimulation, result }: any) {
  const set = (k: string, v: string) => setSim((s: any) => ({ ...s, [k]: v, ...(k === "mcp" ? { tool: state.mcps.find((m: any) => m.id === v)?.tools[0]?.id } : {}) }));
  return <><p className="hint">Use el simulador para comprobar paso a paso si una aplicacion, agente o colectivo puede utilizar una tool concreta. La identidad del usuario final se propaga siempre al MCP simulado.</p><div className="split"><div className="panel"><div className="panel-head"><b>Authorization simulator</b><div className="toolbar"><button className={`btn ${simMode === "application" ? "" : "secondary"}`} onClick={() => setSimMode("application")}>Application mode</button><button className={`btn ${simMode === "collective" ? "" : "secondary"}`} onClick={() => setSimMode("collective")}>Conversational mode</button></div></div><div className="modal-body form two">{simMode === "application" ? <><Field label="Application" value={sim.app} set={(v: string) => set("app", v)} options={state.applications} /><Field label="Agent" value={sim.agent} set={(v: string) => set("agent", v)} options={state.agents} /></> : <Field label="User Collective" value={sim.collective} set={(v: string) => set("collective", v)} options={state.collectives} />}<Field label="MCP" value={sim.mcp} set={(v: string) => set("mcp", v)} options={state.mcps} /><Field label="Tool" value={sim.tool} set={(v: string) => set("tool", v)} options={tools} /><div className="field"><label>End user identity</label><input value={sim.endUser} onChange={(e) => set("endUser", e.target.value)} /></div><div className="field"><label>Purpose</label><input value={sim.purpose} onChange={(e) => set("purpose", e.target.value)} /></div><button className="btn" onClick={runSimulation}>Run evaluation</button></div></div><div className="result">{result ? <><h3>Decision: {result.final}</h3><p>Correlation ID: {result.correlationId}</p><div className="steps">{result.steps.map((s: any, i: number) => <div key={i} className={`step ${s.warn ? "warn" : s.ok ? "ok" : "no"}`}>{s.text}</div>)}</div></> : "Run a simulation to see the authorization trace."}</div></div></>;
}

function Field({ label, value, set, options }: any) { return <div className="field"><label>{label}</label><select value={value} onChange={(e) => set(e.target.value)}>{options.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>; }
function Audit({ state }: any) { return <><p className="hint">Auditoria automatica de acciones relevantes, decisiones, simulaciones y correlation IDs.</p><div className="panel"><div className="panel-head"><b>Audit</b></div><Rows rows={state.audit} columns={["timestamp","actor","action","entity","decision","reason","correlationId"]} /></div></>; }
function Policies() { return <><p className="hint">Politicas base de la maqueta. En una version productiva se conectarian a un motor de decision runtime.</p><div className="panel"><div className="panel-head"><b>Policies</b></div><table><tbody>{["Deny if no explicit subscription exists","MCP Owner approves Agent/Collective &rarr; MCP","Agent Owner approves Application &rarr; Agent","Critical actions require approval or human-in-the-loop","End user identity must be propagated to MCP runtime","New tools require classification before broad access"].map((p) => <tr key={p}><td>{p}</td><td><span className="badge Active">Active</span></td></tr>)}</tbody></table></div></>; }

function EntityModal({ modal, close, state, addEntity, createRequest }: any) {
  const [form, setForm] = useState<any>({ country: "ES", environment: "prod", businessArea: "Retail Banking", requestedAccess: "read", requestedToolIds: [], expiration: "31-12-2026", type: "application_agent" });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const save = () => {
    if (modal === "request") createRequest(form);
    else addEntity(modal, form);
  };
  const title = modal === "request" ? "Create subscription request" : `Create ${modal}`;
  const requestTargetOptions = form.type === "application_agent" ? state.agents : state.mcps;
  const requestSourceOptions = form.type === "application_agent" ? state.applications : form.type === "agent_mcp" ? state.agents : state.collectives;
  return <div className="modal-backdrop"><div className="modal"><div className="modal-head"><h2>{title}</h2><button className="btn secondary" onClick={close}>Close</button></div><div className="modal-body"><p className="hint">Formulario guiado de maqueta. Complete los campos principales y revise el owner aprobador antes de confirmar.</p><div className="form two">{modal !== "request" ? <><div className="field"><label>Name</label><input onChange={(e) => set("name", e.target.value)} /></div><div className="field"><label>Owner</label><input onChange={(e) => set("owner", e.target.value)} placeholder="Business or technical owner" /></div><div className="field"><label>Business area</label><input value={form.businessArea} onChange={(e) => set("businessArea", e.target.value)} /></div><div className="field"><label>Country</label><input value={form.country} onChange={(e) => set("country", e.target.value)} /></div>{modal === "collective" ? <div className="field"><label>Conversational platform</label><select onChange={(e) => set("platform", e.target.value)}><option>ChatGPT Enterprise</option><option>Gemini Enterprise</option><option>Copilot Studio</option></select></div> : <div className="field"><label>Environment</label><select value={form.environment} onChange={(e) => set("environment", e.target.value)}><option>dev</option><option>pre</option><option>prod</option></select></div>}{modal === "agent" && <><div className="field"><label>Agent type</label><input onChange={(e) => set("type", e.target.value)} placeholder="advisor, service, risk..." /></div><div className="field"><label>Criticality</label><select onChange={(e) => set("criticality", e.target.value)}><option>Medium</option><option>High</option><option>Critical</option></select></div></>}{modal === "mcp" && <><div className="field"><label>Backend system</label><input onChange={(e) => set("backendSystem", e.target.value)} /></div><div className="field"><label>Risk</label><select onChange={(e) => set("risk", e.target.value)}><option>Medium</option><option>High</option><option>Critical</option></select></div></>}<div className="field" style={{gridColumn: "1 / -1"}}><label>Description</label><textarea onChange={(e) => set("description", e.target.value)} /></div></> : <><div className="field"><label>Request type</label><select value={form.type} onChange={(e) => set("type", e.target.value)}><option value="application_agent">Application &rarr; Agent</option><option value="agent_mcp">Agent &rarr; MCP</option><option value="collective_mcp">Collective &rarr; MCP</option></select></div><Field label="Source" value={form.sourceId || requestSourceOptions[0]?.id} set={(v: string) => set("sourceId", v)} options={requestSourceOptions} /><Field label="Target" value={form.targetId || requestTargetOptions[0]?.id} set={(v: string) => set("targetId", v)} options={requestTargetOptions} /><div className="field"><label>Requested access</label><select value={form.requestedAccess} onChange={(e) => set("requestedAccess", e.target.value as AccessLevel)}><option value="full">Full MCP access</option><option value="read">Read tools</option><option value="write">Write tools</option><option value="custom">Specific tools</option></select></div><div className="field"><label>Purpose</label><input onChange={(e) => set("purpose", e.target.value)} /></div><div className="field"><label>Expiration</label><input value={form.expiration} onChange={(e) => set("expiration", e.target.value)} /></div><div className="field" style={{gridColumn: "1 / -1"}}><label>Justification</label><textarea onChange={(e) => set("justification", e.target.value)} /></div></>}</div></div><div className="modal-foot"><button className="btn secondary" onClick={close}>Cancel</button><button className="btn" onClick={save}>Confirm</button></div></div></div>;
}
