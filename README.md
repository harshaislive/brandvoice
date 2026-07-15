# Beforest Brand Voice Transformer

Next.js application for transforming content into Beforest's brand voice with Azure OpenAI and PostgreSQL.

## Local development

Requirements: Node.js 20 and PostgreSQL 15 or newer.

1. Copy `.env.example` to `.env` and set the values.
2. Install dependencies with `npm ci`.
3. Create/update the schema with `npm run db:migrate`.
4. Start development with `npm run dev`.

The app listens on `http://localhost:3000` by default.

## Coolify deployment

Deploy this repository with the included `Dockerfile` and attach a separate Coolify PostgreSQL resource in the same project/environment.

Set these application environment variables in Coolify:

```env
DATABASE_URL=postgresql://USER:PASSWORD@INTERNAL_POSTGRES_HOST:5432/DATABASE
AZURE_OPENAI_ENDPOINT=https://RESOURCE.services.ai.azure.com/
AZURE_OPENAI_KEY=...
AZURE_OPENAI_DEPLOYMENT_NAME=...
AZURE_OPENAI_API_VERSION=2024-10-21
JWT_SECRET_KEY=...
SETTINGS_PASSCODE=...
# Optional on first deployment: creates/promotes this admin account
ADMIN_EMAIL=admin@beforest.co
ADMIN_PASSWORD=...
```

Use the PostgreSQL resource's internal URL; do not expose the database publicly. The container runs the idempotent schema migration before starting the server. Route the application domain to port `3000`.

Public registration is disabled. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` for the first migration to bootstrap an administrator, then use **Users** in the app to create invitation-only accounts. The bootstrap variables can be removed after the first successful deployment; the admin account remains in PostgreSQL.

Configure scheduled PostgreSQL backups in Coolify. The application container is stateless and does not require persistent storage.

## Commands

- `npm run dev` — development server
- `npm run build` — production build
- `npm run db:migrate` — apply the PostgreSQL schema
- `npm start` — migrate and run the standalone production server
