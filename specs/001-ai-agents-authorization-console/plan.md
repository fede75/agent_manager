# Implementation Plan

## Stack

- Next.js App Router.
- React + TypeScript.
- CSS modular global sin dependencia runtime adicional.
- Estado cliente con `useState`.
- Seed inicial en TypeScript.
- Persistencia en `localStorage`.

## Architecture

- `src/app/page.tsx`: shell ADA, navegacion, vistas y modales.
- `src/lib/data.ts`: datos seed y tipos.
- `src/app/globals.css`: look & feel ADA.

## Authorization Rules

- `Application Manager` puede crear aplicaciones/colectivos y solicitar autorizacion Application &rarr; Agent.
- `AI Engineer` puede crear agentes/MCPs y solicitar autorizacion Agent &rarr; MCP.
- `AI Engineer` puede crear Skills, crear versiones y asociar Skills a agentes.
- `Project Owner` o el owner del colectivo puede solicitar autorizacion ChatApps Collective &rarr; MCP.
- `Project Owner` puede realizar todas las acciones.
- `Operations` puede aprobar, aprobar parcialmente o rechazar Authorization Requests.
- Authorization Requests se accede desde `PLATFORM > Authorizations` y se filtran por la UUAA seleccionada en el breadcrumb.
- Los inventarios de AI Applications, ChatApps Collectives, Agents y MCPs usan el mismo filtro por UUAA seleccionada.
- El inventario de Skills usa el mismo filtro por UUAA seleccionada, tomando `owner_uuaa` como particion.
- Agent -> Skill crea solicitud en `Authorizations` cuando `usage_policy = approval_required`; `open` asocia directamente una version approved; `restricted` valida constraints mock.
- Un asset solo puede borrarse si no tiene autorizaciones activas ni solicitudes pendientes.
- Las aplicaciones nunca solicitan MCPs directamente; solicitan agentes.
- Los colectivos ChatApps no solicitan agentes; solicitan MCPs directamente.
- Desde un MCP se pueden revocar autorizaciones activas concedidas a agentes o colectivos.
- Las suscripciones MCP exponen `accessScope` y `toolsScope` para distinguir acceso completo, lectura, escritura o tools concretas.

## UX Decisions

- AI Applications y ChatApps Collectives abren por defecto en vista cards.
- AI Applications, ChatApps Collectives y Skills abren por defecto en vista cards.
- Estas vistas mantienen un toggle para alternar cards/tabla.
- La seccion `AI AGENTS` no incluye una opcion propia de Authorization Requests; usa la opcion corporativa existente `Authorizations`.
- La seccion `AI AGENTS` incluye Skills como repositorio corporativo versionado.
- El detalle de MCP incluye gestion de tools y listas de consumidores autorizados con revocacion.
- El detalle de Skill muestra bloques curados de Registry, Governance, Current Version, especificacion Markdown, agentes consumidores y requests relacionadas.
- El detalle de Agent muestra una unica lista de Skills utilizados, con asociacion por version concreta y solicitudes Agent -> Skill.
- Los formularios de solicitud de acceso se abren en modal mediante botones `New request` en los listados relacionados.
- Las opciones de menu que no pertenecen a `AI AGENTS`, excepto `Authorizations`, no cambian la seccion activa; abren un popup/modal con el aviso literal "Funcionlidad no habilitada en la Maqueta. Usar funcionalidades dentro del apartado AI Agents".

## AWS AgentCore Mapping

- Agentes: `registryProvider`, `registryAgentId`, `agentVersion`, `runtimeArn`, `deploymentStage`, `identityMode`, `observability`.
- MCPs: `gatewayId`, `mcpServerId`, `protocol`, `authMode`, `identityMode`, `observability`.
- Tools: `gatewayRoute`, `toolSchema`, `type`, `resource`, `risk`, `requiresApproval`.
- Skills: `registry_provider`, `registry_id`, `registry_record_id`, `registry_record_arn`, `registry_record_status`, `last_sync_status`, `last_sync_date`.
- Skill Versions: `version`, `status`, `registry_record_revision_id`, `artifact_format`, `artifact_location`, `specification_markdown`, `published_at`.
- La maqueta no llama a AWS; solo usa estos metadatos para preparar el modelo de integracion.

## Persistence

Los datos creados, solicitudes, autorizaciones y metadatos AWS mock se guardan en `localStorage` bajo `ada-ai-agents-console-state`.
