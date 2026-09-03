# Passo a passo — Deploy automático

Guia completo para publicar o site paroquial no VPS com **Apache + PM2 + GitHub Actions**.

**Resumo:** você configura o servidor uma vez em `/www`. Depois, cada `git push` na branch `master` atualiza o site automaticamente.

---

## Visão geral

| Onde | O que acontece |
|------|----------------|
| **Seu computador** | Código no GitHub + chave SSH |
| **GitHub** | Actions conecta no VPS e roda o deploy |
| **Servidor (`/www`)** | Apache serve o frontend; PM2 roda a API; Postgres fica no Docker (somente banco) |

---

# Parte 1 — No seu computador

## 1.1 Ter o projeto no GitHub

Se ainda não fez push do monorepo completo:

```bash
cd ~/Documentos/siteParoquial
git status
git add .
git commit -m "Preparar deploy"
git push origin master
```

Repositório: `https://github.com/Davim187/siteParoquial`

---

## 1.2 Criar chave SSH para o deploy

No **seu computador** (não no servidor):

```bash
ssh-keygen -t ed25519 -C "deploy-site-paroquial" -f ~/.ssh/deploy_paroquia -N ""
```

Isso gera dois arquivos:

- `~/.ssh/deploy_paroquia` → chave **privada** (vai no GitHub Secrets)
- `~/.ssh/deploy_paroquia.pub` → chave **pública** (vai no servidor)

---

## 1.3 Copiar a chave pública para o VPS

Substitua `SEU_IP` pelo IP do servidor (ex.: `84.46.251.102`):

```bash
ssh-copy-id -i ~/.ssh/deploy_paroquia.pub root@SEU_IP
```

Se `ssh-copy-id` não existir:

```bash
cat ~/.ssh/deploy_paroquia.pub | ssh root@SEU_IP "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

Teste o acesso:

```bash
ssh -i ~/.ssh/deploy_paroquia root@SEU_IP
```

Se entrar sem pedir senha, está ok. Digite `exit` para sair.

---

## 1.4 Configurar secrets no GitHub

1. Abra: **https://github.com/Davim187/siteParoquial/settings/secrets/actions**
2. Clique em **New repository secret** para cada item:

| Nome do secret | Valor |
|----------------|--------|
| `DEPLOY_HOST` | IP do VPS (ex.: `84.46.251.102`) |
| `DEPLOY_USER` | `root` |
| `DEPLOY_SSH_KEY` | Conteúdo **inteiro** da chave privada |

Para copiar a chave privada:

```bash
cat ~/.ssh/deploy_paroquia
```

Cole tudo no secret, incluindo as linhas `-----BEGIN ... KEY-----` e `-----END ... KEY-----`.

> **Opcional:** em vez de `DEPLOY_SSH_KEY`, pode usar `DEPLOY_PASSWORD` com a senha root (menos seguro).

> **Opcional:** `DEPLOY_PORT` = `22` se a porta SSH for diferente.

---

## 1.5 Clonar código no VPS (use HTTPS)

O servidor **não precisa** de chave SSH no GitHub se você clonar por **HTTPS** (padrão do `setup-server.sh`):

```bash
git clone https://github.com/Davim187/siteParoquial.git /www
```

> **Importante:** o deploy automático espera o projeto em **`/www`**, não em `/opt/siteParoquial`.

---

# Parte 2 — No servidor (VPS)

Conecte no VPS:

```bash
ssh root@SEU_IP
```

---

## 2.1 Primeira configuração (uma vez só)

### Caminho A — Script automático

Se o repositório **já está** em `/www`:

```bash
cd /www
git pull origin master
bash deploy/setup-server.sh
```

Se `/www` **ainda não existe**, clone primeiro:

```bash
git clone https://github.com/Davim187/siteParoquial.git /www
cd /www
bash deploy/setup-server.sh
```

O script faz:

- Instala Node.js 20, PM2 e Apache
- Instala Docker (somente para Postgres)
- Configura firewall (22, 80, 443)
- Clona o projeto em `/www` (se necessário)
- Cria `.env.production` inicial
- Configura virtual host do Apache

### Caminho B — Manual

```bash
apt-get update
apt-get install -y git curl apache2
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pm2
curl -fsSL https://get.docker.com | sh

git clone https://github.com/Davim187/siteParoquial.git /www
cd /www
cp .env.production.example .env.production
bash deploy/setup-apache.sh
```

---

## 2.2 Editar variáveis de produção

```bash
nano /www/.env.production
```

Ajuste **obrigatoriamente**:

| Variável | Exemplo |
|----------|---------|
| `POSTGRES_PASSWORD` | Senha forte para o banco (**não deixe o valor do exemplo**) |
| `DATABASE_URL` | `postgresql://paroquia:SENHA@127.0.0.1:5432/paroquia?schema=public` |
| `CORS_ORIGIN` | `https://paroquiansdasgracas.com.br` |
| `PUBLIC_URL` | Mesmo valor acima |
| `JWT_SECRET` | String longa e aleatória (mín. 32 caracteres) |

> Se aparecer `POSTGRES_PASSWORD is missing`, o arquivo `.env.production` não existe ou a senha não foi definida.

> **Importante:** `DATABASE_URL` deve usar `127.0.0.1`, não `postgres` (a API roda fora do Docker).

Salvar: `Ctrl+O`, Enter, `Ctrl+X`.

---

## 2.3 Primeiro deploy manual

```bash
cd /www
bash deploy/deploy.sh
```

Aguarde o build (pode levar alguns minutos na primeira vez).

Verifique se subiu:

```bash
pm2 status
systemctl status apache2
curl -I http://localhost
curl http://localhost/api/health
```

---

## 2.4 Acessar o site

- **Site:** `http://SEU_IP` ou `https://paroquiansdasgracas.com.br`
- **Admin:** `/admin/login`
- Crie um usuário administrador real pelo painel ou diretamente no banco. **Não** rode o seed de desenvolvimento em produção.

### HTTPS com Certbot (recomendado)

```bash
apt-get install -y certbot python3-certbot-apache
certbot --apache -d paroquiansdasgracas.com.br -d www.paroquiansdasgracas.com.br
```

---

# Parte 3 — Deploy automático (dia a dia)

Depois que a Parte 1 e 2 estiverem ok:

## No computador

```bash
cd ~/Documentos/siteParoquial
# faça suas alterações...
git add .
git commit -m "Descrição da mudança"
git push origin master
```

## O que acontece sozinho

1. GitHub Actions dispara o workflow **Deploy produção**
2. Conecta no VPS via SSH
3. Executa `bash deploy/deploy.sh`, que:
   - Atualiza código em `/www`
   - Sobe Postgres (Docker)
   - Faz build do web e da API
   - Aplica migrations
   - Recarrega Apache e reinicia API no PM2

Acompanhe em: **https://github.com/Davim187/siteParoquial/actions**

---

# Acessar o banco pelo Beekeeper Studio

O Postgres fica exposto **somente em `127.0.0.1:5432` no VPS** (não abre na internet).

## Diagnóstico no VPS

```bash
cd /www
bash deploy/check-db.sh
```

---

## Método recomendado — túnel SSH manual

**Terminal 1 (deixe aberto):**
```bash
ssh -N -L 5432:127.0.0.1:5432 root@SEU_IP
```

**Beekeeper — nova conexão PostgreSQL (aba SSH Tunnel DESLIGADA):**

| Campo | Valor |
|-------|--------|
| Host | `127.0.0.1` |
| Port | `5432` |
| User | `paroquia` |
| Password | valor de `POSTGRES_PASSWORD` no `.env.production` |
| Database | `paroquia` |
| SSL | Disabled |

---

# Parte 4 — Comandos úteis no servidor

```bash
cd /www

# Status da API
pm2 status
pm2 logs paroquia-api

# Status do Apache
systemctl status apache2
tail -f /var/log/apache2/paroquia-access.log

# Status do Postgres
docker compose -f docker-compose.prod.yml ps

# Deploy manual
bash deploy/deploy.sh

# Reiniciar só a API
pm2 restart paroquia-api

# Recarregar Apache (após mudar config)
systemctl reload apache2
```

---

# Checklist rápido

### Computador
- [ ] Código no GitHub (`master`)
- [ ] Chave SSH `deploy_paroquia` criada
- [ ] Chave pública no VPS (`authorized_keys`)
- [ ] Secrets `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` no GitHub

### Servidor
- [ ] Node 20 + PM2 instalados
- [ ] Apache configurado (`deploy/setup-apache.sh`)
- [ ] Docker instalado (Postgres)
- [ ] Projeto em `/www`
- [ ] `.env.production` configurado (`DATABASE_URL` com `127.0.0.1`)
- [ ] `bash deploy/deploy.sh` rodou sem erro
- [ ] Site abre em `https://paroquiansdasgracas.com.br`

### Segurança (produção)
- [ ] Trocar senha do admin do painel
- [ ] Trocar `JWT_SECRET` e `POSTGRES_PASSWORD`
- [ ] Trocar senha root do VPS
- [ ] Preferir chave SSH em vez de senha
- [ ] HTTPS com Certbot

---

# Problemas comuns

| Erro | Solução |
|------|---------|
| `missing server host` | Criar secret `DEPLOY_HOST` no GitHub |
| `Repositório não encontrado em /www` | Rodar clone + setup no servidor |
| `.env.production não encontrado` | `cp .env.production.example .env.production` e editar |
| API não responde | `pm2 logs paroquia-api` — verificar `DATABASE_URL` com `127.0.0.1` |
| Site 404 no refresh | Verificar RewriteRule do Apache em `deploy/apache/paroquia.conf` |
| Permission denied (SSH) | Verificar chave pública no VPS e secret `DEPLOY_SSH_KEY` |
| `POSTGRES_PASSWORD is missing` | Edite `/www/.env.production` e defina a senha |
| Erro Prisma OpenSSL | Instalar deps: `apt install openssl libheif1 imagemagick` |

---

# Estrutura no servidor

```
/www/
├── apps/
│   ├── api/              # Backend (PM2 roda dist/server.js)
│   └── web/
│       └── dist/         # Build estático servido pelo Apache
├── deploy/
│   ├── apache/           # Virtual host
│   ├── ecosystem.config.cjs  # Config PM2
│   └── deploy.sh
├── docker-compose.prod.yml   # Somente Postgres
├── .env.production       # Configurações (NÃO commitar)
└── ...
```

O **Apache** serve o frontend e faz proxy de `/api` e `/uploads` para a API no **PM2** (porta 3333).
