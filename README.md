# Paróquia Nossa Senhora das Graças

Monorepo com **npm workspaces** + **Turborepo**.

## Estrutura

```text
.
├── apps/
│   ├── api/     # Backend REST (Fastify + Prisma + PostgreSQL)
│   └── web/     # Site público + painel admin (React + Vite)
├── deploy/      # Scripts de deploy no VPS
├── scripts/     # Utilitários (túnel DB, etc.)
├── turbo.json   # Pipeline do Turborepo
└── package.json # Raiz do monorepo
```

Inspiração de UX (sem cópia): portais católicos como Arquidiocese de Fortaleza / Celebre, priorizando **próxima missa**, avisos, agenda e navegação clara no mobile.

---

## Pré-requisitos

- Node.js 20+
- Docker (para PostgreSQL) **ou** um PostgreSQL local
- npm 10+

---

## Instalação

```bash
npm install
```

---

## Subir o banco

```bash
npm run db:up
```

Ou manualmente com Docker na porta `5433` (ver `docker-compose.yml`).

---

## Desenvolvimento

```bash
# API + Web em paralelo (Turborepo)
npm run dev

# Apenas um app
npm run dev:api
npm run dev:web

# Banco local (sem túnel de produção)
npm run dev:local
```

### Primeira vez na API

```bash
cp apps/api/.env.example apps/api/.env
npm run db:migrate
npm run db:seed
```

- API: http://localhost:3333
- Health: http://localhost:3333/api/health
- Swagger: http://localhost:3333/api/docs
- Site: http://localhost:5173
- Admin: http://localhost:5173/admin/login

### Frontend

```bash
cp apps/web/.env.example apps/web/.env
```

`VITE_API_URL` aponta para a API. Em desenvolvimento, o Vite também faz proxy de `/api` e `/uploads`.

### Banco de produção no dev (automático)

**Setup (uma vez):**

```bash
cp apps/api/.env.production.local.example apps/api/.env.production.local
nano apps/api/.env.production.local
```

Depois, `npm run dev` abre o túnel SSH e conecta na API ao banco de produção.

> Para banco **local**: `npm run dev:local` ou remova `apps/api/.env.production.local`.

---

## Scripts do monorepo (Turborepo)

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Sobe API e Web em paralelo |
| `npm run build` | Build de todos os apps (com cache) |
| `npm run lint` | Lint em todos os apps |
| `npm run typecheck` | Verificação TypeScript |
| `npm run db:migrate` | Migrations Prisma (API) |
| `npm run db:seed` | Seed do banco |
| `npm run db:studio` | Prisma Studio |

Filtros por app:

```bash
npx turbo run build --filter=paroquia-web
npx turbo run dev --filter=paroquia-api
```

---

## Arquitetura

```text
SITE / ADMIN  →  API Fastify  →  PostgreSQL
                     ↓
              StorageService (local; S3/R2/Cloudinary depois)
```

### Permissões (RBAC)

Perfis: `ADMIN`, `EDITOR`, `SECRETARIA`, `COMUNICACAO`

### Mídia

Upload com validação, WebP + thumbnail (`sharp`), biblioteca no admin.

---

## Produção

1. Trocar `JWT_SECRET` e senhas
2. Configurar `CORS_ORIGIN` e `PUBLIC_URL`
3. `npm run db:migrate` (ou `prisma migrate deploy` no container)
4. Não versionar `.env`

**Deploy automático:** [`deploy/DEPLOY.md`](deploy/DEPLOY.md)

O deploy usa Docker + GitHub Actions. O monorepo completo (`apps/api` + `apps/web`) deve estar em `/www` ou `/var/www` no servidor.

---

## Observações

- Dados sensíveis usam placeholders (`[ENDEREÇO]`, `[TELEFONE]`, etc.).
- Cache de build do Turborepo fica em `.turbo/` (ignorado pelo git).
