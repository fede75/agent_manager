# ADA AI Agents Authorization Console

Maqueta funcional para gobernar aplicaciones, colectivos, agentes de IA, MCPs, tools, suscripciones, aprobaciones, simulacion y auditoria dentro de una consola con look & feel ADA.

## Estructura

- `specs/001-ai-agents-authorization-console/spec.md`: especificacion funcional estilo Speckit.
- `specs/001-ai-agents-authorization-console/plan.md`: plan tecnico.
- `specs/001-ai-agents-authorization-console/tasks.md`: backlog de implementacion.
- `prototype/`: aplicacion Next.js lista para ejecutar localmente y desplegar en Vercel.

## Ejecucion local

```bash
cd prototype
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Despliegue en Vercel

1. Crear un repositorio GitHub y subir este proyecto.
2. En Vercel, importar el repo.
3. Configurar `prototype` como root directory.
4. Build command: `npm run build`.
5. Output: Next.js default.

La maqueta usa datos mock y persistencia en `localStorage`, sin backend ni autenticacion real.
