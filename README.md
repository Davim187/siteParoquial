# Paróquia Nossa Senhora das Graças

Sistema profissional composto por:

- `web/` — site público + painel administrativo (React + Vite + TypeScript + Tailwind)
- `api/` — backend REST (Fastify + Prisma + PostgreSQL)
- PostgreSQL via Docker (porta `5433` neste ambiente)

Inspiração de UX (sem cópia): portais católicos como Arquidiocese de Fortaleza / Celebre, priorizando **próxima missa**, avisos, agenda e navegação clara no mobile.

---

## Pré-requisitos

- Node.js 20+
- Docker (para PostgreSQL) **ou** um PostgreSQL local
- npm 10+

---

## Subir o banco

```bash
docker run -d --name paroquia-postgres \
  -e POSTGRES_USER=paroquia \
  -e POSTGRES_PASSWORD=paroquia \
  -e POSTGRES_DB=paroquia \
  -p 5433:5432 \
  -v paroquia_pg:/var/lib/postgresql/data \
  postgres:16-alpine
```

> A porta `5433` evita conflito com PostgreSQL já instalado na máquina. Ajuste `DATABASE_URL` se preferir `5432`.

---

## API

```bash
cp api/.env.example api/.env
npm install
cd api
npx prisma migrate dev
npx prisma db seed
npm run dev
```

- API: http://localhost:3333
- Health: http://localhost:3333/api/health
- Swagger: http://localhost:3333/api/docs

### Usuário demo (seed)

- E-mail: `admin@demo.paroquia`
- Senha: `Admin@123456`

**Troque essa senha em produção.**

### Variáveis principais (`api/.env`)

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Conexão PostgreSQL |
| `JWT_SECRET` | Segredo JWT (mín. 32 caracteres) |
| `CORS_ORIGIN` | Origem do frontend |
| `PUBLIC_URL` | URL pública da API (uploads) |
| `STORAGE_PROVIDER` | `local` (preparado para S3/R2/Cloudinary) |
| `UPLOAD_DIR` | Pasta local de uploads |
| `MAX_UPLOAD_MB` | Limite de upload |

---

## Frontend

```bash
cp web/.env.example web/.env
npm install
npm run dev -w web
```

- Site: http://localhost:5173
- Admin: http://localhost:5173/admin/login

`VITE_API_URL` aponta para a API. Em desenvolvimento, o Vite também faz proxy de `/api` e `/uploads`.

---

## Scripts do monorepo

```bash
npm run dev:web
npm run dev:api
npm run build
npm run db:migrate -w api
npm run db:seed -w api
```

---

## Arquitetura

```text
SITE / ADMIN  →  API Fastify  →  PostgreSQL
                     ↓
              StorageService (local agora; S3/R2/Cloudinary depois)
```

### Permissões (RBAC)

Perfis: `ADMIN`, `EDITOR`, `SECRETARIA`, `COMUNICACAO`

O admin tem acesso total. Os demais recebem permissões específicas via seed.

### Mídia

- Upload com validação MIME/tamanho
- Conversão para WebP + thumbnail (`sharp`)
- Metadados no banco; arquivos fora do banco
- Biblioteca de mídia + `MediaPicker` no admin

---

## Produção (checklist)

1. Trocar `JWT_SECRET`
2. Trocar senha do admin
3. Configurar `CORS_ORIGIN` e `PUBLIC_URL`
4. Usar storage em nuvem quando necessário
5. `prisma migrate deploy`
6. Não versionar `.env`

---

## Deploy automático (VPS)

**Guia completo:** [`deploy/DEPLOY.md`](deploy/DEPLOY.md)

O projeto inclui Docker + GitHub Actions para publicar no servidor a cada push na branch `main`/`master`.

### 1. Preparar o servidor (uma vez)

No VPS (com acesso root/SSH):

```bash
# Envie a chave pública do GitHub/deploy para o servidor antes, se usar clone via SSH
bash deploy/setup-server.sh
nano /www/.env.production   # senha do Postgres, domínio/IP, JWT
bash deploy/deploy.sh
```

O site ficará em `http://SEU_IP` (porta 80).

### 2. Secrets no GitHub

Em **Settings → Secrets and variables → Actions** do repositório:

| Secret | Valor |
|---|---|
| `DEPLOY_HOST` | IP ou domínio do VPS |
| `DEPLOY_USER` | `root` (ou usuário com Docker) |
| `DEPLOY_SSH_KEY` | chave privada SSH (não use senha no workflow) |
| `DEPLOY_PORT` | `22` (opcional) |

> **Segurança:** use autenticação por chave SSH. Não commite senhas no repositório.

### 3. Repositório

O deploy espera o **monorepo completo** (`web/` + `api/`) em `/www`.

Após cada push em `main`/`master`, o workflow executa `deploy/deploy.sh` no servidor.

### Comandos úteis no servidor

```bash
cd /www
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f api
bash deploy/deploy.sh   # deploy manual
```

---

## Observações

- Dados sensíveis e contatos reais da paróquia usam placeholders (`[ENDEREÇO]`, `[TELEFONE]`, etc.).
- O sistema está preparado para crescer (inscrições, dízimo, app mobile) sem acoplar o frontend ao banco.
