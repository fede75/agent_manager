# Feature Specification: AI Agents Authorization Console

## User Story

Como equipo de plataforma ADA, quiero una consola enterprise para gestionar que aplicaciones, colectivos y agentes pueden consumir agentes y MCPs, con aprobaciones por owner, granularidad por tool, simulador runtime y auditoria trazable.

## Scope

La solucion es un control plane de gobierno, no una implementacion productiva del protocolo MCP. La maqueta debe permitir operar una demo end-to-end con datos ficticios realistas de una entidad financiera.

## Relationships

1. Application &rarr; Agent
   - Solicita: Application Owner.
   - Aprueba: Agent Owner.
   - Autoriza que una aplicacion invoque un agente.

2. Agent &rarr; MCP
   - Solicita: Agent Owner.
   - Aprueba: MCP Owner.
   - Autoriza que un agente consuma un MCP completo, tools de lectura, tools de escritura o tools concretas.

3. Collective &rarr; MCP
   - Solicita: Collective Owner.
   - Aprueba: MCP Owner.
   - Autoriza que un colectivo use MCPs desde ChatGPT Enterprise, Gemini Enterprise u otro asistente conversacional.

## Functional Requirements

- Inventario de aplicaciones consumidoras.
- Inventario de colectivos de usuarios.
- Inventario de agentes con Agent Owner.
- Inventario de MCPs con MCP Owner y tools.
- Alta guiada de aplicaciones, colectivos, agentes, MCPs y tools.
- Solicitudes Application &rarr; Agent.
- Solicitudes Agent &rarr; MCP.
- Solicitudes Collective &rarr; MCP.
- Aprobacion, rechazo y aprobacion parcial.
- Suscripciones activas y revocables.
- Simulador en dos modos:
  - Application &rarr; Agent &rarr; MCP &rarr; Tool.
  - Collective &rarr; Conversational Assistant &rarr; MCP &rarr; Tool.
- Propagacion de identidad de usuario final hacia MCP en runtime simulado.
- Auditoria automatica de creaciones, solicitudes, aprobaciones, rechazos, revocaciones y simulaciones.
- Alertas de gobierno: MCPs sin tools, tools pendientes de clasificacion, accesos criticos, solicitudes pendientes y expiraciones.

## Data Requirements

Datos iniciales para una entidad financiera:

- Areas: Retail Banking, Corporate Banking, Payments, Risk, Fraud Prevention, Wealth Management, Customer Service, Branch Network, Compliance, Data Governance.
- Aplicaciones: Mobile Banking, Branch Portal, CRM Next, Mortgage Origination, Payments Backoffice, Fraud Console, Wealth Hub, Compliance Workbench.
- Colectivos: Branch Employees Spain, Mortgage Advisors, Contact Center Agents, Fraud Analysts, Corporate Risk Team, Data Stewards.
- Agentes: CustomerServiceAgent, MortgageAdvisorAgent, FraudInvestigationAgent, PaymentsAssistantAgent, BranchOperationsAgent, WealthAdvisorAgent, ComplianceReviewAgent, CreditRiskAgent.
- MCPs: CustomerDataMCP, AccountsMCP, PaymentsMCP, CardsMCP, LoansMCP, FraudMCP, CRMCaseMCP, DocumentRetrievalMCP, RiskScoringMCP, ComplianceMCP.
- Tools read/write/critical_action con sensibilidad, riesgo y condiciones.

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
- Las aprobaciones crean suscripciones activas.
- La aprobacion parcial Agent/Collective &rarr; MCP puede reducir el scope solicitado.
- El simulador explica paso a paso la decision.
- La auditoria registra la identidad propagada, owners, decision y correlation ID.
- La app es desplegable en Vercel desde GitHub.
