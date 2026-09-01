# API — Paróquia Nossa Senhora das Graças

Fastify + Prisma + PostgreSQL.

## Desenvolvimento

```bash
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Documentação OpenAPI: `/api/docs`

## Estrutura

- `src/modules` — rotas e serviços por domínio
- `src/storage` — abstração de upload (local hoje)
- `prisma` — schema, migrations e seed
