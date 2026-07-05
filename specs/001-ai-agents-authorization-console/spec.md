# Feature Specification: AI Agents Authorization Console

## User Story

Como equipo de plataforma ADA, quiero una consola enterprise para gestionar que aplicaciones, colectivos y agentes pueden consumir agentes y MCPs, con aprobaciones por owner, granularidad por tool y alineacion conceptual con AWS Agent Registry / Amazon Bedrock AgentCore.

## Scope

La solucion es un control plane de gobierno, no una implementacion productiva del protocolo MCP ni una integracion directa con AWS. La maqueta debe permitir operar una demo end-to-end con datos ficticios realistas de una entidad financiera y preparar el modelo para que el backend futuro pueda apoyarse en Amazon Bedrock AgentCore Registry, Runtime, Gateway, Identity y Observability.

## AWS AgentCore Alignment

ADA actua como la capa corporativa de gobierno y autorizacion. AWS AgentCore se modela como la capa tecnica donde se registran, despliegan y exponen agentes/tools:

- ADA Agent equivale a una entrada de AgentCore Registry con lifecycle, version, Runtime ARN, Identity mode y Observability.
- ADA MCP equivale a un MCP server expuesto por AgentCore Gateway, con gateway id, auth mode, identity propagation y metricas de invocacion.
- ADA Tool equivale a una tool publicada en Gateway, con route, schema, tipo read/write/critical_action, sensibilidad y aprobacion requerida.
- ADA Authorization Request es la decision corporativa previa a permitir invocaciones entre Application -> Agent, Agent -> MCP o ChatApps Collective -> MCP.
- UUAA se mantiene como particion corporativa principal y se usa para filtrar inventarios y solicitudes.

## Relationships

1. Application &rarr; Agent
   - Solicita: Application Owner.
   - Aprueba: Agent Owner.
   - Autoriza que una aplicacion invoque un agente.

2. Agent &rarr; MCP
   - Solicita: Agent Owner.
   - Aprueba: MCP Owner.
   - Autoriza que un agente consuma un MCP completo, tools de lectura, tools de escritura o tools concretas.

3. ChatApps Collective &rarr; MCP
   - Solicita: Collective Owner.
   - Aprueba: MCP Owner.
   - Autoriza que un colectivo use MCPs desde ChatGPT Enterprise, Gemini Enterprise u otro asistente conversacional.

## Functional Requirements

- Inventario de aplicaciones consumidoras.
- Inventario de colectivos ChatApps.
- Inventario de agentes con Agent Owner.
- Inventario de MCPs con MCP Owner y tools.
- Alta guiada de aplicaciones, colectivos, agentes, MCPs y tools.
- Solicitudes Application &rarr; Agent.
- Solicitudes Agent &rarr; MCP.
- Solicitudes ChatApps Collective &rarr; MCP.
- Aprobacion, rechazo y aprobacion parcial.
- Autorizaciones activas visibles desde el detalle de cada asset.
- Cancelacion de peticiones pendientes desde el detalle de aplicaciones, agentes y colectivos.
- Borrado de assets solo cuando no tienen autorizaciones activas ni solicitudes pendientes.
- Metadatos AgentCore en agentes: registry provider, registry agent id, version, runtime ARN, deployment stage, identity mode y observability.
- Metadatos AgentCore Gateway en MCPs/tools: gateway id, MCP server id, protocol, auth mode, identity mode, gateway route y tool schema.
- Alertas de gobierno: MCPs sin tools, tools pendientes de clasificacion, accesos criticos, solicitudes pendientes y expiraciones.

## Data Requirements

Datos iniciales para una entidad financiera:

- Areas: Retail Banking, Corporate Banking, Payments, Risk, Fraud Prevention, Wealth Management, Customer Service, Branch Network, Compliance, Data Governance.
- Aplicaciones: Mobile Banking, Branch Portal, CRM Next, Mortgage Origination, Payments Backoffice, Fraud Console, Wealth Hub, Compliance Workbench.
- Colectivos: Branch Employees Spain, Mortgage Advisors, Contact Center Agents, Fraud Analysts, Corporate Risk Team, Data Stewards.
- Agentes: CustomerServiceAgent, MortgageAdvisorAgent, FraudInvestigationAgent, PaymentsAssistantAgent, BranchOperationsAgent, WealthAdvisorAgent, ComplianceReviewAgent, CreditRiskAgent.
- MCPs: CustomerDataMCP, AccountsMCP, PaymentsMCP, CardsMCP, LoansMCP, FraudMCP, CRMCaseMCP, DocumentRetrievalMCP, RiskScoringMCP, ComplianceMCP.
- Tools read/write/critical_action con sensibilidad, riesgo y condiciones.
- UUAAs de prueba: KDIT, PAYM, FRAD, RISK, DATA, CARD, LOAN, WLTH.
- Metadatos AWS de prueba sin conexion real: AgentCore Registry ids, Runtime ARNs ficticios, Gateway ids y MCP server ids.

## UX Requirements

La UI debe replicar patrones ADA Console:

- Sidebar azul oscuro.
- Nueva seccion `AI AGENTS`.
- Header superior con breadcrumb, acciones e identidad de proyecto.
- Tablas densas enterprise.
- Botones azules.
- Badges de estado, riesgo, entorno y tipo.
- Hints contextuales en cada pantalla.
- Modales/drawers guiados.
- Empty states explicativos.

## Acceptance Criteria

- El usuario puede navegar por todas las secciones AI Agents.
- El usuario puede crear entidades y verlas persistidas durante la sesion.
- El usuario puede crear solicitudes y aprobar/rechazar.
- Las aprobaciones crean autorizaciones activas.
- La aprobacion parcial Agent/ChatApps Collective &rarr; MCP puede reducir el scope solicitado.
- La lista Authorization Requests queda filtrada por la UUAA seleccionada.
- Los roles Project Owner, Operations, AI Engineer y Application Manager condicionan las acciones disponibles.
- El detalle de agentes y MCPs muestra el mapping ADA -> AWS AgentCore.
- La app es desplegable en Vercel desde GitHub.
