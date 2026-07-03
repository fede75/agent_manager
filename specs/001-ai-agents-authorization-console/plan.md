# Implementation Plan

## Stack

- Next.js App Router.
- React + TypeScript.
- CSS modular global sin dependencia runtime adicional.
- Estado cliente con `useReducer`.
- Seed inicial en TypeScript.
- Persistencia en `localStorage`.

## Architecture

- `src/app/page.tsx`: shell ADA, navegacion, vistas y modales.
- `src/lib/data.ts`: datos seed y tipos.
- `src/app/globals.css`: look & feel ADA.

## Runtime Rules

Application mode:

1. Verificar suscripcion activa Application &rarr; Agent.
2. Verificar suscripcion activa Agent &rarr; MCP.
3. Evaluar scope: full, read, write o tools especificas.
4. Si tool critica o requiere aprobacion, devolver `require approval`.
5. Si todo cumple, devolver `allow`; si no, `deny`.

Conversational mode:

1. Verificar suscripcion activa Collective &rarr; MCP.
2. Evaluar scope.
3. Propagar `endUserIdentity`.
4. Devolver decision explicada.

## Persistence

Los datos creados, solicitudes, suscripciones y auditoria se guardan en `localStorage` bajo `ada-ai-agents-console-state`.
