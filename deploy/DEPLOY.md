# Deploy — Paróquia N.S. das Graças

**Stack:** Apache (frontend) · PM2 (API) · Docker (Postgres) · GitHub Actions

---

## Estrutura

```
deploy/
├── deploy.sh              # Comando principal
├── setup.sh               # Configuração inicial do VPS
├── doctor.sh              # Diagnóstico
├── ecosystem.config.cjs   # PM2
├── lib.sh                 # Carrega módulos
└── lib/
    ├── common.sh          # Paths, env, git
    ├── build.sh           # npm ci + build
    ├── postgres.sh        # Docker Postgres + migrations
    ├── pm2.sh             # API
    └── apache.sh          # Apache + HTTPS
```

---

## Comandos

| Comando | O que faz |
|---------|-----------|
| `bash deploy/setup.sh` | Instala Node, PM2, Docker, Apache (uma vez) |
| `bash deploy/deploy.sh` | Deploy completo |
| `bash deploy/deploy.sh api` | Só API (build + PM2) |
| `bash deploy/deploy.sh web` | Só frontend + Apache |
| `bash deploy/deploy.sh ssl` | Só certificado HTTPS |
| `bash deploy/doctor.sh` | Diagnóstico do ambiente |

---

## Primeira vez no VPS

```bash
git clone https://github.com/Davim187/siteParoquial.git /var/www
cd /var/www
bash deploy/setup.sh
nano .env.production   # configure senhas e domínio
bash deploy/deploy.sh
```

### `.env.production` obrigatório

```
POSTGRES_PASSWORD=senha-forte
DATABASE_URL=postgresql://paroquia:senha-forte@127.0.0.1:5432/paroquia?schema=public
JWT_SECRET=string-longa-minimo-32-caracteres
PUBLIC_URL=https://paroquiansdasgracas.com.br
CORS_ORIGIN=https://paroquiansdasgracas.com.br
ACME_EMAIL=seu-email@gmail.com
```

> Use **domínio** em `PUBLIC_URL`, não IP.  
> `DATABASE_URL` usa `127.0.0.1`, não `postgres`.

---

## Deploy automático (GitHub Actions)

Secrets necessários: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`

Cada push em `master` executa `bash deploy/deploy.sh` no VPS.

---

## Problemas comuns

| Sintoma | Solução |
|---------|---------|
| `turbo: not found` | `NODE_ENV=development npm ci` |
| `tsc lib.es2022 not found` | Idem — devDependencies não instaladas |
| API 503 | `bash deploy/deploy.sh api` |
| HTTPS não funciona | `bash deploy/deploy.sh ssl` |
| `Listen 443` duplicado | `bash deploy/doctor.sh` → depois `bash deploy/deploy.sh ssl` |
| Imagens 404 | Uploads em `apps/api/uploads` (volume Docker antigo precisa ser copiado) |

---

## Backup diário (Google Drive)

Todo dia às 03:00 (horário de Brasília) o servidor salva o **banco** (`banco.sql.gz`) e as **fotos** (`fotos.tar`)
no Google Drive, em `backups-paroquia/AAAA-MM-DD/`. Só os **3 últimos dias** ficam guardados; os mais antigos são apagados.

**Primeira vez** (no VPS, como root):

```bash
cd /var/www
bash deploy/backup.sh setup
```

O servidor não tem navegador, então ele mostra um comando `rclone authorize "drive" ...`.
No seu PC: `winget install Rclone.Rclone`, rode esse comando, entre na conta Google e cole
o token que aparecer de volta no servidor. No fim ele já faz o primeiro backup.

| Comando | O que faz |
|---------|-----------|
| `bash deploy/backup.sh run` | Backup agora |
| `bash deploy/backup.sh list` | Lista backups no Drive |
| `bash deploy/backup.sh status` | Próxima execução + último log |
| `bash deploy/backup.sh restore 2026-11-22` | Restaura banco + fotos daquele dia |

Opcional no `.env.production`: `BACKUP_KEEP=3`, `BACKUP_TIME=03:00`, `BACKUP_FOLDER=backups-paroquia`, `BACKUP_REMOTE=gdrive`.

---

## Beekeeper (banco)

```bash
# No PC — túnel SSH
ssh -N -L 5432:127.0.0.1:5432 root@SEU_IP

# Beekeeper: Host=127.0.0.1 Port=5432 User=paroquia Database=paroquia
```

Senha = `POSTGRES_PASSWORD` do `.env.production`.
