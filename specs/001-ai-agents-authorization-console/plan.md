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
- `Project Owner` o el owner del colectivo puede solicitar autorizacion ChatApps Collective &rarr; MCP.
- `Project Owner` puede realizar todas las acciones.
- `Operations` puede aprobar, aprobar parcialmente o rechazar Authorization Requests.
- Authorization Requests se filtran por la UUAA seleccionada en el breadcrumb.
- Un asset solo puede borrarse si no tiene autorizaciones activas ni solicitudes pendientes.
- Las aplicaciones nunca solicitan MCPs directamente; solicitan agentes.
- Los colectivos ChatApps no solicitan agentes; solicitan MCPs directamente.
- Desde un MCP se pueden revocar autorizaciones activas concedidas a agentes o colectivos.
- Las suscripciones MCP exponen `accessScope` y `toolsScope` para distinguir acceso completo, lectura, escritura o tools concretas.

## UX Decisions

- Applications y ChatApps Collectives abren por defecto en vista cards.
- Ambas vistas mantienen un toggle para alternar cards/tabla.
- El detalle de MCP incluye gestion de tools y listas de consumidores autorizados con revocacion.

## AWS AgentCore Mapping

- Agentes: `registryProvider`, `registryAgentId`, `agentVersion`, `runtimeArn`, `deploymentStage`, `identityMode`, `observability`.
- MCPs: `gatewayId`, `mcpServerId`, `protocol`, `authMode`, `identityMode`, `observability`.
- Tools: `gatewayRoute`, `toolSchema`, `type`, `resource`, `risk`, `requiresApproval`.
- La maqueta no llama a AWS; solo usa estos metadatos para preparar el modelo de integracion.

## Persistence

Los datos creados, solicitudes, autorizaciones y metadatos AWS mock se guardan en `localStorage` bajo `ada-ai-agents-console-state`.
