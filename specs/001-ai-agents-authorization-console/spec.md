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
- ADA Authorization Request es la decision corporativa previa a permitir invocaciones entre Application -> Agent, Agent -> MCP o ChatApps Collective -> MCP, y se accede desde la seccion existente `Authorizations` del menu ADA.
- UUAA se mantiene como particion corporativa principal y se usa para filtrar inventarios y solicitudes.

## Relationships

1. Application &rarr; Agent
   - Solicita: Application Owner.
   - Aprueba: Agent Owner.
   - Autoriza que una aplicacion invoque un agente.
   - Una aplicacion no solicita acceso directo a MCPs; cualquier acceso a MCPs queda gobernado desde el agente.

2. Agent &rarr; MCP
   - Solicita: Agent Owner.
   - Aprueba: MCP Owner.
   - Autoriza que un agente consuma un MCP completo, tools de lectura, tools de escritura o tools concretas.

3. ChatApps Collective &rarr; MCP
   - Solicita: Collective Owner.
   - Aprueba: MCP Owner.
   - Autoriza que un colectivo use MCPs desde ChatGPT Enterprise, Gemini Enterprise u otro asistente conversacional.
   - Un colectivo no solicita acceso a agentes; su relacion gobernada es directa con MCPs.

## Functional Requirements

- Inventario de aplicaciones consumidoras.
- Inventario de colectivos ChatApps.
- Inventario de agentes con Agent Owner.
- Inventario de MCPs con MCP Owner y tools.
- Los inventarios de AI Applications, ChatApps Collectives, Agents y MCPs se filtran por la UUAA seleccionada en el breadcrumb superior.
- Alta guiada de aplicaciones, colectivos, agentes, MCPs y tools.
- Solicitudes Application &rarr; Agent.
- Solicitudes Agent &rarr; MCP.
- Solicitudes ChatApps Collective &rarr; MCP.
- La revision y aprobacion de solicitudes se realiza desde la opcion existente `Authorizations`, no desde una opcion duplicada dentro de `AI AGENTS`.
- Aprobacion, rechazo y aprobacion parcial.
- Autorizaciones activas visibles desde el detalle de cada asset.
- Las autorizaciones MCP deben mostrar si el acceso es completo, solo lectura, escritura o especifico por tools.
- Las autorizaciones MCP especificas por tools deben listar las tools autorizadas.
- Cancelacion de peticiones pendientes desde el detalle de aplicaciones, agentes y colectivos.
- Revocacion de autorizaciones activas desde el detalle del asset consumidor y tambien desde el detalle del MCP para agentes o colectivos autorizados.
- Borrado de assets solo cuando no tienen autorizaciones activas ni solicitudes pendientes.
- El detalle de MCP permite anadir nuevas tools clasificadas como read, write o critical_action.
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
- `AI AGENTS` contiene AI Applications, ChatApps Collectives, Agents y MCPs.
- La opcion existente `Authorizations` dentro de `PLATFORM` abre la gestion de Authorization Requests de la maqueta.
- Las opciones de menu fuera de `AI AGENTS`, excepto `Authorizations`, se muestran solo para conservar el look & feel ADA Console y, al pulsarlas, deben abrir un popup/modal con el mensaje "Funcionlidad no habilitada en la Maqueta. Usar funcionalidades dentro del apartado AI Agents".
- Header superior con breadcrumb, acciones e identidad de proyecto.
- Tablas densas enterprise.
- La vista por defecto de aplicaciones y ChatApps Collectives es en cards modernas con opcion de cambiar a tabla.
- Botones azules.
- Badges de estado, riesgo, entorno y tipo.
- Hints contextuales en cada pantalla.
- Modales/drawers guiados.
- Empty states explicativos.

## Acceptance Criteria

- El usuario puede navegar por todas las secciones AI Agents.
- El usuario puede acceder a Authorization Requests desde la opcion existente `Authorizations` del menu `PLATFORM`.
- Al pulsar cualquier opcion de menu fuera de AI Agents, salvo `Authorizations`, el sistema no navega a una pantalla funcional y abre un popup/modal con "Funcionlidad no habilitada en la Maqueta. Usar funcionalidades dentro del apartado AI Agents".
- El usuario puede crear entidades y verlas persistidas durante la sesion.
- El usuario puede crear solicitudes y aprobar/rechazar.
- Las aprobaciones crean autorizaciones activas.
- La aprobacion parcial Agent/ChatApps Collective &rarr; MCP puede reducir el scope solicitado.
- La lista Authorization Requests queda filtrada por la UUAA seleccionada.
- Al cambiar la UUAA seleccionada, AI Applications y ChatApps Collectives muestran solo registros de esa UUAA, igual que Agents y MCPs.
- Los roles Project Owner, Operations, AI Engineer y Application Manager condicionan las acciones disponibles.
- El detalle de agentes y MCPs muestra el mapping ADA -> AWS AgentCore.
- El detalle de colectivos solo permite gestionar autorizaciones ChatApps Collective -> MCP.
- El detalle de MCP permite ver y revocar agentes y colectivos autorizados, incluyendo scope de acceso y tools autorizadas.
- La app es desplegable en Vercel desde GitHub.
