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
- ADA Skill equivale a una entrada de AgentCore Registry de tipo `AGENT_SKILL`, reutilizable, versionada y asociable a agentes.
- ADA Skill Version equivale a una revision/version del registro tecnico.
- ADA Agent -> Skill Association equivale a una configuracion corporativa que indica que version concreta del Skill se inyecta en el runtime package del agente.
- ADA Authorization Request de tipo Agent -> Skill representa la aprobacion corporativa previa a permitir que un agente use un Skill cuando la politica lo requiera.
- UUAA se mantiene como particion corporativa principal y se usa para filtrar inventarios y solicitudes.

## Skill Concept

Un Skill representa un activo corporativo reutilizable compuesto por instrucciones, procedimientos, criterios operativos, contratos de entrada/salida y metadatos de gobierno que puede ser asociado a agentes para guiar su comportamiento.

En la maqueta, los Skills no se ejecutan realmente. La consola solo modela su registro, gobierno, versionado, asociacion a agentes y autorizacion.

Modelo conceptual:

```text
Skill Repository
        |
        | Agent Owner selects approved Skill version
        v
Agent -> Skill Association
        |
        v
Runtime injects selected Skill version into Agent package
```

Regla clave: un agente siempre se asocia a una version concreta de un Skill. Nunca a `latest`.

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

4. Agent &rarr; Skill
   - Solicita: Agent Owner.
   - Aprueba: Skill Owner solo si la politica del Skill lo requiere.
   - Autoriza que un agente use una version concreta de un Skill.
   - La asociacion puede ser mandatory u optional.
   - `usage_policy = open`: el Agent Owner puede asociar directamente una version approved.
   - `usage_policy = restricted`: la consola valida allowed_uuaas, allowed_agent_types, dominio, riesgo y runtime antes de asociar o solicitar.
   - `usage_policy = approval_required`: se crea Authorization Request de tipo Agent -> Skill y se aprueba desde `PLATFORM > Authorizations`.
   - La aprobacion parcial puede aprobar una version distinta, cambiar mandatory a optional o limitar el uso a un runtime concreto.

## Functional Requirements

- Inventario de aplicaciones consumidoras.
- Inventario de colectivos ChatApps.
- Inventario de agentes con Agent Owner.
- Inventario de MCPs con MCP Owner y tools.
- Inventario de Skills reutilizables y versionados, filtrado por UUAA.
- Los inventarios de AI Applications, ChatApps Collectives, Agents y MCPs se filtran por la UUAA seleccionada en el breadcrumb superior.
- Alta guiada de aplicaciones, colectivos, agentes, MCPs y tools.
- Alta guiada de Skills.
- Alta guiada de versiones de Skill.
- Solicitudes Application &rarr; Agent.
- Solicitudes Agent &rarr; MCP.
- Solicitudes ChatApps Collective &rarr; MCP.
- Solicitudes Agent &rarr; Skill cuando la politica lo requiera.
- La revision y aprobacion de solicitudes se realiza desde la opcion existente `Authorizations`, no desde una opcion duplicada dentro de `AI AGENTS`.
- Aprobacion, rechazo y aprobacion parcial.
- Autorizaciones activas visibles desde el detalle de cada asset.
- Las autorizaciones MCP deben mostrar si el acceso es completo, solo lectura, escritura o especifico por tools.
- Las autorizaciones MCP especificas por tools deben listar las tools autorizadas.
- Cancelacion de peticiones pendientes desde el detalle de aplicaciones, agentes y colectivos.
- Revocacion de autorizaciones activas desde el detalle del asset consumidor y tambien desde el detalle del MCP para agentes o colectivos autorizados.
- Borrado de assets solo cuando no tienen autorizaciones activas ni solicitudes pendientes.
- El detalle de MCP permite anadir nuevas tools clasificadas como read, write o critical_action.
- Asociacion de Skills a agentes siempre por version concreta.
- Soporte de Skills mandatory y optional.
- Visualizacion de agentes que usan cada Skill y version.
- Aviso de nuevas versiones disponibles en asociaciones Agent -> Skill.
- Bloqueo de asociacion a versiones retired.
- Warning al asociar o mantener versiones deprecated.
- Revocacion de asociaciones Agent -> Skill activas.
- Borrado de Skills solo si no tienen versiones activas, asociaciones activas ni solicitudes pendientes.
- Metadatos AgentCore en agentes: registry provider, registry agent id, version, runtime ARN, deployment stage, identity mode y observability.
- Metadatos AgentCore Gateway en MCPs/tools: gateway id, MCP server id, protocol, auth mode, identity mode, gateway route y tool schema.
- Metadatos AWS Agent Registry en Skills: registry provider, registry id, record id, record ARN, descriptor type, record status, endpoint type, sync status y sync date.
- Metadatos AWS Agent Registry en Skill Versions: record version, revision id, artifact format, artifact location y definition JSON location.
- Alertas de gobierno: MCPs sin tools, tools pendientes de clasificacion, accesos criticos, solicitudes pendientes y expiraciones.

## Data Requirements

Datos iniciales para una entidad financiera:

- Areas: Retail Banking, Corporate Banking, Payments, Risk, Fraud Prevention, Wealth Management, Customer Service, Branch Network, Compliance, Data Governance.
- Aplicaciones: Mobile Banking, Branch Portal, CRM Next, Mortgage Origination, Payments Backoffice, Fraud Console, Wealth Hub, Compliance Workbench.
- Colectivos: Branch Employees Spain, Mortgage Advisors, Contact Center Agents, Fraud Analysts, Corporate Risk Team, Data Stewards.
- Agentes: CustomerServiceAgent, MortgageAdvisorAgent, FraudInvestigationAgent, PaymentsAssistantAgent, BranchOperationsAgent, WealthAdvisorAgent, ComplianceReviewAgent, CreditRiskAgent.
- MCPs: CustomerDataMCP, AccountsMCP, PaymentsMCP, CardsMCP, LoansMCP, FraudMCP, CRMCaseMCP, DocumentRetrievalMCP, RiskScoringMCP, ComplianceMCP.
- Skills: GDPR Redaction Skill, Complaint Classification Skill, Fraud Investigation Runbook Skill, Credit Risk Policy Review Skill, MCP Security Review Skill, Data Product Onboarding Skill, Customer Response Drafting Skill.
- Tools read/write/critical_action con sensibilidad, riesgo y condiciones.
- UUAAs de prueba: KDIT, PAYM, FRAD, RISK, DATA, CARD, LOAN, WLTH.
- Metadatos AWS de prueba sin conexion real: AgentCore Registry ids, Runtime ARNs ficticios, Gateway ids y MCP server ids.

## UX Requirements

La UI debe replicar patrones ADA Console:

- Sidebar azul oscuro.
- Nueva seccion `AI AGENTS`.
- `AI AGENTS` contiene AI Applications, ChatApps Collectives, Agents y MCPs.
- `AI AGENTS` contiene tambien Skills.
- La opcion existente `Authorizations` dentro de `PLATFORM` abre la gestion de Authorization Requests de la maqueta.
- Las opciones de menu fuera de `AI AGENTS`, excepto `Authorizations`, se muestran solo para conservar el look & feel ADA Console y, al pulsarlas, deben abrir un popup/modal con el mensaje "Funcionlidad no habilitada en la Maqueta. Usar funcionalidades dentro del apartado AI Agents".
- Header superior con breadcrumb, acciones e identidad de proyecto.
- Tablas densas enterprise.
- La vista por defecto de aplicaciones y ChatApps Collectives es en cards modernas con opcion de cambiar a tabla.
- Skills se muestra en tabla enterprise densa con columnas Name, Skill ID, Owner UUAA, Domain, Risk, Data Classification, Usage Policy, Latest Approved Version, Status, Agents Using, Pending Requests, Registry Provider y Registry Status.
- El detalle de Skill muestra Overview, Versions, Agents Using This Skill, Authorization Requests, Governance y AWS Mapping como secciones visibles.
- El detalle de Agent muestra Skills mandatory y optional, con acciones para asociar, solicitar acceso, cambiar version, retirar asociacion y ver detalle del Skill.
- Botones azules.
- Badges de estado, riesgo, entorno y tipo.
- Hints contextuales en cada pantalla.
- Modales/drawers guiados.
- Empty states explicativos.

## Acceptance Criteria

- El usuario puede navegar por todas las secciones AI Agents.
- El usuario puede navegar a AI Agents > Skills.
- El usuario puede acceder a Authorization Requests desde la opcion existente `Authorizations` del menu `PLATFORM`.
- Al pulsar cualquier opcion de menu fuera de AI Agents, salvo `Authorizations`, el sistema no navega a una pantalla funcional y abre un popup/modal con "Funcionlidad no habilitada en la Maqueta. Usar funcionalidades dentro del apartado AI Agents".
- El usuario puede crear entidades y verlas persistidas durante la sesion.
- El usuario puede crear solicitudes y aprobar/rechazar.
- Las aprobaciones crean autorizaciones activas.
- La aprobacion parcial Agent/ChatApps Collective &rarr; MCP puede reducir el scope solicitado.
- La lista Authorization Requests queda filtrada por la UUAA seleccionada.
- La lista Authorization Requests incluye Application -> Agent, Agent -> MCP, ChatApps Collective -> MCP y Agent -> Skill, con filtros conceptuales por UUAA, request_type, status, requester, approver y risk_level.
- Al cambiar la UUAA seleccionada, AI Applications y ChatApps Collectives muestran solo registros de esa UUAA, igual que Agents y MCPs.
- Al cambiar la UUAA seleccionada, Skills muestra solo registros cuyo Owner UUAA coincide con la UUAA seleccionada.
- Un agente puede asociarse a una version approved concreta de un Skill, no a latest.
- Publicar una nueva version de un Skill no actualiza agentes existentes.
- Versiones deprecated siguen funcionando hasta retirement_date.
- Versiones retired no pueden asociarse a nuevos agentes.
- Una version major o con breaking_change requiere validacion explicita del Agent Owner.
- Por defecto `upgrade_policy = pinned`; `auto_patch` solo se permite para Skills low risk.
- Los roles Project Owner, Operations, AI Engineer y Application Manager condicionan las acciones disponibles.
- El detalle de agentes y MCPs muestra el mapping ADA -> AWS AgentCore.
- El detalle de colectivos solo permite gestionar autorizaciones ChatApps Collective -> MCP.
- El detalle de MCP permite ver y revocar agentes y colectivos autorizados, incluyendo scope de acceso y tools autorizadas.
- La app es desplegable en Vercel desde GitHub.
