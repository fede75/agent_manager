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
- `AI Engineer` puede crear agentes/MCPs y solicitar autorizacion Agent/ChatApps Collective &rarr; MCP.
- `Project Owner` puede realizar todas las acciones.
- `Operations` puede aprobar, aprobar parcialmente o rechazar Authorization Requests.
- Authorization Requests se filtran por la UUAA seleccionada en el breadcrumb.
- Un asset solo puede borrarse si no tiene autorizaciones activas ni solicitudes pendientes.

## AWS AgentCore Mapping

- Agentes: `registryProvider`, `registryAgentId`, `agentVersion`, `runtimeArn`, `deploymentStage`, `identityMode`, `observability`.
- MCPs: `gatewayId`, `mcpServerId`, `protocol`, `authMode`, `identityMode`, `observability`.
- Tools: `gatewayRoute`, `toolSchema`, `type`, `resource`, `risk`, `requiresApproval`.
- La maqueta no llama a AWS; solo usa estos metadatos para preparar el modelo de integracion.

## Persistence

Los datos creados, solicitudes, autorizaciones y metadatos AWS mock se guardan en `localStorage` bajo `ada-ai-agents-console-state`.
