# Passo a passo — Deploy automático

Guia completo para publicar o site paroquial no VPS com **Docker + GitHub Actions**.

**Resumo:** você configura o servidor uma vez em `/www`. Depois, cada `git push` na branch `master` atualiza o site automaticamente.

---

## Visão geral

| Onde | O que acontece |
|------|----------------|
| **Seu computador** | Código no GitHub + chave SSH |
| **GitHub** | Actions conecta no VPS e roda o deploy |
| **Servidor (`/www`)** | Docker sobe PostgreSQL + API + Nginx (site na porta 80) |

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

### (Opcional) SSH no VPS

Só use SSH se preferir. Gere uma chave no servidor e cadastre como **Deploy Key** em  
GitHub → repositório → Settings → Deploy keys:

```bash
ssh-keygen -t ed25519 -C "vps-site-paroquial" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
```

Depois clone com:

```bash
git clone git@github.com:Davim187/siteParoquial.git /www
```

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

Se aparecer *branches divergentes*, alinhe o servidor ao GitHub (descarta commits locais no VPS):

```bash
cd /www
git fetch origin
git reset --hard origin/master
```

Se `/www` **ainda não existe**, clone primeiro:

```bash
git clone https://github.com/Davim187/siteParoquial.git /www
cd /www
bash deploy/setup-server.sh
```

O script faz:

- Instala Docker
- Remove Apache/Nginx do sistema (libera porta 80)
- Configura firewall (22, 80, 443)
- Clona o projeto em `/www` (se necessário)
- Cria `.env.production` inicial

### Caminho B — Manual

```bash
apt-get update
apt-get install -y git curl
curl -fsSL https://get.docker.com | sh
systemctl enable docker && systemctl start docker

git clone https://github.com/Davim187/siteParoquial.git /www
cd /www
bash deploy/remove-apache.sh
cp .env.production.example .env.production
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
| `CORS_ORIGIN` | `http://SEU_IP` ou `https://seudominio.com.br` |
| `PUBLIC_URL` | Mesmo valor acima |
| `JWT_SECRET` | String longa e aleatória (mín. 32 caracteres) |

> Se aparecer `POSTGRES_PASSWORD is missing`, o arquivo `.env.production` não existe ou a senha não foi definida.

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
docker compose -f docker-compose.prod.yml ps
curl -I http://localhost
```

---

## 2.4 Acessar o site

- **Site:** `http://SEU_IP`
- **Admin:** `http://SEU_IP/admin/login`
- **Login demo (trocar em produção):**
  - E-mail: `admin@demo.paroquia`
  - Senha: `Admin@123456`

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
3. Atualiza código em `/www`
4. Remove Apache se voltou a subir
5. Rebuild dos containers Docker
6. Roda migrations e seed

Acompanhe em: **https://github.com/Davim187/siteParoquial/actions**

---

# Acessar o banco pelo Beekeeper Studio

O Postgres fica exposto **somente em `127.0.0.1:5432` no VPS** (não abre na internet). O Beekeeper conecta via **túnel SSH**.

## 1. No VPS — aplicar a configuração de porta

Depois de atualizar o código:

```bash
cd /var/www   # ou /www
git pull origin master   # ou git reset --hard origin/master
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

Confirme que a porta está escutando só localmente:

```bash
ss -tlnp | grep 5432
```

Deve aparecer `127.0.0.1:5432`.

## 2. No Beekeeper Studio — nova conexão

1. **New Connection** → **PostgreSQL**
2. Aba **Connection**:
   - **Host**: `127.0.0.1`
   - **Port**: `5432`
   - **User**: `paroquia`
   - **Password**: valor de `POSTGRES_PASSWORD` no `.env.production` do VPS
   - **Default Database**: `paroquia`
3. Aba **SSH Tunnel** (ativar):
   - **SSH Host**: IP do VPS (ex.: `84.46.251.102`)
   - **SSH Port**: `22`
   - **SSH User**: `root`
   - **Auth**: chave privada (`~/.ssh/deploy_paroquia`) ou senha
4. **Test** → **Connect**

> Com o túnel SSH, o Beekeeper entra no VPS e acessa o Postgres como se fosse local — sem expor o banco na internet.

---

# Parte 4 — Comandos úteis no servidor

```bash
cd /www

# Ver containers
docker compose -f docker-compose.prod.yml ps

# Ver logs da API
docker compose -f docker-compose.prod.yml logs -f api

# Ver logs do site (Nginx)
docker compose -f docker-compose.prod.yml logs -f web

# Deploy manual
bash deploy/deploy.sh

# Parar tudo
docker compose -f docker-compose.prod.yml down

# Subir de novo
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

---

# Checklist rápido

### Computador
- [ ] Código no GitHub (`master`)
- [ ] Chave SSH `deploy_paroquia` criada
- [ ] Chave pública no VPS (`authorized_keys`)
- [ ] Secrets `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` no GitHub

### Servidor
- [ ] Docker instalado
- [ ] Projeto em `/www`
- [ ] `.env.production` configurado
- [ ] `bash deploy/deploy.sh` rodou sem erro
- [ ] Site abre em `http://SEU_IP`
- [ ] Apache removido (porta 80 livre)

### Segurança (produção)
- [ ] Trocar senha do admin do painel
- [ ] Trocar `JWT_SECRET` e `POSTGRES_PASSWORD`
- [ ] Trocar senha root do VPS
- [ ] Preferir chave SSH em vez de senha

---

# Problemas comuns

| Erro | Solução |
|------|---------|
| `missing server host` | Criar secret `DEPLOY_HOST` no GitHub |
| `Repositório não encontrado em /www` | Rodar clone + setup no servidor |
| `.env.production não encontrado` | `cp .env.production.example .env.production` e editar |
| Porta 80 em uso | `bash deploy/remove-apache.sh` |
| Permission denied (SSH) | Verificar chave pública no VPS e secret `DEPLOY_SSH_KEY` |
| `Permission denied (publickey)` ao clonar | Use HTTPS: `git clone https://github.com/Davim187/siteParoquial.git /www` |
| Clone em `/opt/siteParoquial` | O deploy usa `/www`. Remova a pasta errada e clone de novo em `/www` |
| `POSTGRES_PASSWORD is missing` | Edite `/www/.env.production` (ou `/var/www/.env.production`) e defina a senha |
| Erro Prisma `debian-openssl-3.0.x` | Rebuild da API: `docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build api` |

---

# Estrutura no servidor

```
/www/
├── api/                  # Backend
├── web/                  # Frontend (build vai pro container Nginx)
├── deploy/               # Scripts de deploy
├── docker-compose.prod.yml
├── .env.production       # Configurações (NÃO commitar)
└── ...
```

O site público é servido pelo **Nginx dentro do Docker** na porta **80**. Não é necessário Apache no servidor.
