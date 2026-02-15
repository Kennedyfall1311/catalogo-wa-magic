# 📦 Guia de Instalação em VPS — Catálogo

> Documentação completa para instalar e rodar o catálogo em uma **VPS** (Ubuntu/Debian) com **PostgreSQL**, **Express.js** e **Nginx**.

---

## 📋 Índice

1. [Requisitos da VPS](#1-requisitos-da-vps)
2. [Preparar o Servidor](#2-preparar-o-servidor)
3. [Instalar Node.js](#3-instalar-nodejs)
4. [Instalar e Configurar PostgreSQL](#4-instalar-e-configurar-postgresql)
5. [Criar o Banco e Todas as Tabelas](#5-criar-o-banco-e-todas-as-tabelas)
6. [Clonar e Configurar o Projeto](#6-clonar-e-configurar-o-projeto)
7. [Liberar Portas no Firewall](#7-liberar-portas-no-firewall)
8. [Iniciar o Backend com PM2](#8-iniciar-o-backend-com-pm2)
9. [Build do Frontend](#9-build-do-frontend)
10. [Configurar Nginx](#10-configurar-nginx)
11. [SSL com Let's Encrypt (HTTPS)](#11-ssl-com-lets-encrypt-https)
12. [Verificar se Tudo Funciona](#12-verificar-se-tudo-funciona)
13. [Estrutura de Arquivos na VPS](#13-estrutura-de-arquivos-na-vps)
14. [API REST — Referência](#14-api-rest--referência)
15. [Comandos Úteis](#15-comandos-úteis)
16. [Solução de Problemas](#16-solução-de-problemas)
17. [Backup Automático](#17-backup-automático)

---

## 1. Requisitos da VPS

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| **RAM** | 1 GB | 2 GB+ |
| **CPU** | 1 vCPU | 2 vCPU |
| **Disco** | 20 GB SSD | 40 GB+ SSD |
| **SO** | Ubuntu 22.04+ / Debian 12+ | Ubuntu 24.04 LTS |
| **Acesso** | SSH root ou sudo | — |

Provedores populares: **Contabo**, **Hetzner**, **DigitalOcean**, **Vultr**, **Oracle Cloud** (free tier).

---

## 2. Preparar o Servidor

Conecte à VPS via SSH e atualize tudo:

```bash
ssh root@SEU_IP_DA_VPS

# Atualizar pacotes
apt update && apt upgrade -y

# Instalar utilitários essenciais
apt install -y curl git build-essential ufw nginx
```

---

## 3. Instalar Node.js

```bash
# Instalar Node.js 20 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verificar instalação
node -v    # v20.x.x
npm -v     # 10.x.x

# Instalar PM2 globalmente (gerenciador de processos)
npm install -g pm2
```

---

## 4. Instalar e Configurar PostgreSQL

### 4.1 — Instalar

```bash
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
```

### 4.2 — Definir senha do usuário postgres

```bash
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'SUA_SENHA_FORTE_AQUI';"
```

> ⚠️ **ANOTE ESTA SENHA** — você vai usá-la na `DATABASE_URL`.

### 4.3 — Verificar se está rodando

```bash
systemctl status postgresql
# Deve mostrar: active (running)
```

### 4.4 — Configurar acesso local

Edite o arquivo `pg_hba.conf`:

```bash
# Encontrar o arquivo
find /etc/postgresql -name pg_hba.conf
# Geralmente: /etc/postgresql/16/main/pg_hba.conf

nano /etc/postgresql/16/main/pg_hba.conf
```

Certifique-se de que estas linhas existam:
```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

Reinicie após alterar:
```bash
systemctl restart postgresql
```

### 4.5 — Testar conexão

```bash
psql -U postgres -h localhost -p 5432
# Se pedir senha, digite a que você definiu
# Se conectar com sucesso: postgres=#
# Para sair: \q
```

---

## 5. Criar o Banco e Todas as Tabelas

### 5.1 — Criar o banco de dados

```bash
sudo -u postgres psql -c "CREATE DATABASE catalogo;"
```

### 5.2 — Executar o schema completo

Conecte ao banco e execute **todo** o SQL abaixo:

```bash
psql -U postgres -h localhost -d catalogo
```

```sql
-- ═══════════════════════════════════════════════════════════
-- SCHEMA COMPLETO DO CATÁLOGO — VPS
-- Execute este bloco inteiro de uma vez
-- ═══════════════════════════════════════════════════════════

-- Extensões
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tipos customizados
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════
-- TABELAS
-- ═══════════════════════════════════════════════════════════

-- Roles de usuário (compatibilidade)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Categorias de produto
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Produtos
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  slug TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '/placeholder.svg',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN NOT NULL DEFAULT false,
  featured_order INTEGER NOT NULL DEFAULT 0,
  quick_filter_1 BOOLEAN NOT NULL DEFAULT false,
  quick_filter_2 BOOLEAN NOT NULL DEFAULT false,
  brand TEXT,
  reference TEXT,
  manufacturer_code TEXT,
  unit_of_measure TEXT,
  quantity NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Configurações da loja
CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT ''
);

-- Condições de pagamento
CREATE TABLE IF NOT EXISTS public.payment_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Banners (carrossel)
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  link TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Abas do catálogo (filtros rápidos customizáveis)
CREATE TABLE IF NOT EXISTS public.catalog_tabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  filter_type TEXT NOT NULL DEFAULT 'all',
  filter_value TEXT,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pedidos
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_cpf_cnpj TEXT,
  payment_method TEXT,
  notes TEXT,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  shipping_fee NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Itens do pedido
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_code TEXT,
  unit_price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- FUNÇÕES E TRIGGERS
-- ═══════════════════════════════════════════════════════════

-- Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para products
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para orders
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função de verificação de role (compatibilidade)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ═══════════════════════════════════════════════════════════
-- DADOS INICIAIS
-- ═══════════════════════════════════════════════════════════

INSERT INTO public.store_settings (key, value) VALUES
  ('whatsapp_number', '5511999999999'),
  ('store_name', 'Catálogo'),
  ('store_subtitle', 'Distribuidora'),
  ('payment_conditions_enabled', 'false'),
  ('shipping_enabled', 'false'),
  ('shipping_fee', '0'),
  ('minimum_order_enabled', 'false'),
  ('minimum_order_value', '0'),
  ('hide_products_without_photo', 'false'),
  ('catalog_first_page_mode', 'default'),
  ('show_quick_filters_mobile', 'true'),
  ('show_brand_filter_mobile', 'true')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.categories (name, slug) VALUES
  ('Roupas', 'roupas'),
  ('Calçados', 'calcados'),
  ('Acessórios', 'acessorios'),
  ('Promoções', 'promocoes')
ON CONFLICT (slug) DO NOTHING;
```

### 5.3 — Verificar se as tabelas foram criadas

```bash
psql -U postgres -h localhost -d catalogo -c "\dt"
```

Resultado esperado:
```
              List of relations
 Schema |        Name        | Type  |  Owner
--------+--------------------+-------+----------
 public | banners            | table | postgres
 public | catalog_tabs       | table | postgres
 public | categories         | table | postgres
 public | order_items        | table | postgres
 public | orders             | table | postgres
 public | payment_conditions | table | postgres
 public | products           | table | postgres
 public | store_settings     | table | postgres
 public | user_roles         | table | postgres
```

---

## 6. Clonar e Configurar o Projeto

### 6.1 — Clonar o repositório

```bash
mkdir -p /var/www
cd /var/www
git clone <URL_DO_REPOSITORIO> catalogo
cd catalogo
```

### 6.2 — Instalar dependências

```bash
npm install
```

### 6.3 — Criar a pasta de uploads

```bash
mkdir -p public/uploads
chmod 755 public/uploads
```

### 6.4 — Configurar variáveis de ambiente

Crie o arquivo `.env` na raiz do projeto:

```bash
cat > .env << 'EOF'
# ═══════════════════════════════════════════════════
# MODO DE OPERAÇÃO — OBRIGATÓRIO para VPS
# ═══════════════════════════════════════════════════
VITE_API_MODE=postgres

# ═══════════════════════════════════════════════════
# URL DA API (será proxiada pelo Nginx)
# ═══════════════════════════════════════════════════
# Em produção com Nginx, use o domínio/IP público:
VITE_API_URL=http://SEU_DOMINIO_OU_IP/api

# ═══════════════════════════════════════════════════
# BANCO DE DADOS
# ═══════════════════════════════════════════════════
DATABASE_URL=postgresql://postgres:SUA_SENHA@localhost:5432/catalogo

# ═══════════════════════════════════════════════════
# PORTA DO BACKEND (padrão: 3001)
# ═══════════════════════════════════════════════════
PORT=3001
EOF
```

> ⚠️ **SUBSTITUA:**
> - `SUA_SENHA` → senha que você definiu no passo 4.2
> - `SEU_DOMINIO_OU_IP` → seu domínio (ex: `catalogo.meusite.com`) ou IP público da VPS (ex: `123.45.67.89`)

---

## 7. Liberar Portas no Firewall

O catálogo precisa das seguintes portas:

| Porta | Serviço | Acesso |
|-------|---------|--------|
| **22** | SSH | Remoto (você) |
| **80** | HTTP (Nginx) | Público |
| **443** | HTTPS (Nginx + SSL) | Público |
| **3001** | Backend Express | Apenas local (via Nginx proxy) |
| **5432** | PostgreSQL | Apenas local |

### Configurar UFW (Firewall do Ubuntu)

```bash
# Habilitar UFW
ufw enable

# Liberar SSH (IMPORTANTE: faça isso PRIMEIRO para não perder acesso!)
ufw allow 22/tcp

# Liberar HTTP e HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# NÃO libere 3001 e 5432 externamente (segurança!)
# O Nginx faz proxy reverso para o Express na porta 3001
# O PostgreSQL só aceita conexões locais

# Verificar regras
ufw status verbose
```

Resultado esperado:
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

> 🔒 **Segurança:** As portas 3001 (Express) e 5432 (PostgreSQL) ficam **fechadas** para acesso externo. O Nginx faz o proxy.

---

## 8. Iniciar o Backend com PM2

```bash
cd /var/www/catalogo

# Iniciar o backend
pm2 start "npx tsx server/index.ts" --name catalogo-api --cwd /var/www/catalogo

# Verificar se está rodando
pm2 status

# Ver logs em tempo real
pm2 logs catalogo-api

# Testar localmente
curl http://localhost:3001/api/health
# Resposta: {"status":"ok","mode":"postgres"}

# Configurar para iniciar automaticamente no boot
pm2 startup
pm2 save
```

### Comandos PM2 úteis

```bash
pm2 restart catalogo-api    # Reiniciar
pm2 stop catalogo-api       # Parar
pm2 delete catalogo-api     # Remover
pm2 logs catalogo-api       # Ver logs
pm2 monit                   # Monitor em tempo real
```

---

## 9. Build do Frontend

```bash
cd /var/www/catalogo

# Compilar o frontend para produção
npm run build

# Os arquivos estáticos serão gerados em dist/
ls dist/
# Deve conter: index.html, assets/, etc.
```

---

## 10. Configurar Nginx

### 10.1 — Criar a configuração do site

```bash
nano /etc/nginx/sites-available/catalogo
```

Cole o conteúdo abaixo:

```nginx
server {
    listen 80;
    server_name SEU_DOMINIO_OU_IP;

    # Tamanho máximo de upload (50MB para imagens)
    client_max_body_size 50M;

    # ─── Frontend estático (React build) ───
    root /var/www/catalogo/dist;
    index index.html;

    # SPA — todas as rotas redirecionam para index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # ─── Proxy reverso para API Express ───
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }

    # ─── Imagens uploadadas ───
    location /uploads/ {
        alias /var/www/catalogo/public/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # ─── Cache para assets estáticos ───
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

> ⚠️ **Substitua `SEU_DOMINIO_OU_IP`** pelo seu domínio ou IP.

### 10.2 — Ativar o site e reiniciar Nginx

```bash
# Ativar o site
ln -sf /etc/nginx/sites-available/catalogo /etc/nginx/sites-enabled/

# Remover configuração padrão (opcional)
rm -f /etc/nginx/sites-enabled/default

# Testar configuração
nginx -t
# Deve retornar: syntax is ok / test is successful

# Reiniciar Nginx
systemctl restart nginx
systemctl enable nginx
```

---

## 11. SSL com Let's Encrypt (HTTPS)

> 📌 **Só funciona com domínio** — se estiver usando apenas IP, pule esta etapa.

```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Gerar certificado SSL
certbot --nginx -d SEU_DOMINIO

# Seguir as instruções interativas (email, aceitar termos)
# O Certbot configurará o Nginx automaticamente para HTTPS

# Renovação automática (já vem configurada, mas teste):
certbot renew --dry-run
```

Após o SSL, atualize o `.env` para usar HTTPS:
```bash
# No .env, mude:
VITE_API_URL=https://SEU_DOMINIO/api
```

E faça rebuild do frontend:
```bash
cd /var/www/catalogo
npm run build
```

---

## 12. Verificar se Tudo Funciona

### Checklist de verificação

```bash
# 1. PostgreSQL rodando?
systemctl status postgresql

# 2. Tabelas existem?
psql -U postgres -h localhost -d catalogo -c "\dt"

# 3. Backend rodando?
pm2 status
curl http://localhost:3001/api/health

# 4. Nginx rodando?
systemctl status nginx

# 5. Acessar pelo navegador:
#    http://SEU_DOMINIO_OU_IP        → Catálogo público
#    http://SEU_DOMINIO_OU_IP/admin  → Painel administrativo

# 6. Testar criação de produto via API:
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Produto Teste",
    "code": "TST001",
    "slug": "produto-teste",
    "price": 29.90,
    "active": true
  }'

# 7. Verificar se o produto aparece:
curl http://localhost:3001/api/products | head -c 200
```

### Testar o fluxo completo

1. Acesse `http://SEU_DOMINIO_OU_IP/admin`
2. Clique em **Produtos** → **Novo**
3. Preencha nome, código, preço
4. Salve — o produto deve aparecer no catálogo público

---

## 13. Estrutura de Arquivos na VPS

```
/var/www/catalogo/
├── dist/                          # Frontend compilado (servido pelo Nginx)
├── server/                        # Backend Express.js
│   ├── index.ts                   # Servidor principal (porta 3001)
│   ├── db.ts                      # Pool de conexão PostgreSQL
│   └── routes/
│       ├── products.ts            # CRUD de produtos + upsert em lote
│       ├── categories.ts          # CRUD de categorias
│       ├── settings.ts            # Configurações da loja
│       ├── banners.ts             # CRUD de banners
│       ├── payment-conditions.ts  # Condições de pagamento
│       ├── upload.ts              # Upload de imagens (multipart + base64)
│       └── auth.ts                # Autenticação mock (admin aberto)
├── public/
│   └── uploads/                   # Imagens uploadadas (produtos, banners, logo)
├── src/                           # Código fonte React (só para desenvolvimento)
├── .env                           # Variáveis de ambiente
└── package.json                   # Dependências
```

---

## 14. API REST — Referência

Base URL: `http://SEU_DOMINIO_OU_IP/api`

### Produtos

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/products` | Listar todos os produtos |
| `GET` | `/products/slug/:slug` | Buscar por slug (URL amigável) |
| `GET` | `/products/code/:code` | Buscar por código/SKU |
| `POST` | `/products` | Criar produto |
| `PUT` | `/products/:id` | Atualizar produto |
| `DELETE` | `/products/:id` | Remover produto |
| `POST` | `/products/upsert` | Importação em lote (upsert por código) |

**Exemplo — criar produto via cURL:**
```bash
curl -X POST http://SEU_DOMINIO_OU_IP/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Camiseta Básica",
    "code": "CAM001",
    "slug": "camiseta-basica",
    "price": 49.90,
    "original_price": 69.90,
    "description": "Camiseta de algodão",
    "image_url": "/placeholder.svg",
    "category_id": null,
    "active": true,
    "brand": "Marca X",
    "reference": "REF-001",
    "manufacturer_code": "FAB-001",
    "unit_of_measure": "UN",
    "quantity": 100
  }'
```

### Categorias

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/categories` | Listar |
| `POST` | `/categories` | Criar |
| `POST` | `/categories/batch` | Criar em lote |
| `PUT` | `/categories/:id` | Atualizar |
| `DELETE` | `/categories/:id` | Remover |

### Configurações

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/settings` | Listar todas |
| `PUT` | `/settings/:key` | Atualizar configuração |

### Banners

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/banners` | Listar |
| `POST` | `/banners` | Criar |
| `PUT` | `/banners/:id` | Atualizar |
| `DELETE` | `/banners/:id` | Remover |

### Condições de Pagamento

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/payment-conditions` | Listar |
| `POST` | `/payment-conditions` | Criar |
| `PUT` | `/payment-conditions/:id` | Atualizar |
| `DELETE` | `/payment-conditions/:id` | Remover |

### Upload de Imagens

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/upload/image` | Upload multipart (campo `image`) |
| `POST` | `/upload/base64` | Upload base64 (`{ data, filename }`) |

### Autenticação (modo VPS)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/auth/session` | Retorna sessão admin (sempre autenticado) |
| `POST` | `/auth/login` | Login mock |
| `POST` | `/auth/logout` | Logout mock |

> ⚠️ No modo VPS/PostgreSQL, o admin é **aberto** (sem autenticação). Para proteger, use **autenticação básica no Nginx** (veja seção 16).

### Health Check

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/health` | Status do servidor |

---

## 15. Comandos Úteis

### PostgreSQL

```bash
# Conectar ao banco
psql -U postgres -h localhost -d catalogo

# Listar tabelas
\dt

# Ver estrutura de uma tabela
\d products

# Contar produtos
SELECT COUNT(*) FROM products;

# Ver produtos sem imagem
SELECT name, code FROM products
WHERE image_url = '/placeholder.svg' OR image_url IS NULL;

# Backup do banco
pg_dump -U postgres catalogo > /root/backup_catalogo_$(date +%Y%m%d).sql

# Restaurar backup
psql -U postgres catalogo < backup_catalogo.sql
```

### Projeto

```bash
# Atualizar código (git pull + rebuild)
cd /var/www/catalogo
git pull
npm install
npm run build
pm2 restart catalogo-api

# Ver logs do backend
pm2 logs catalogo-api --lines 50

# Verificar uso de disco das imagens
du -sh /var/www/catalogo/public/uploads/
```

---

## 16. Solução de Problemas

| Problema | Causa provável | Solução |
|----------|----------------|---------|
| `relation "products" does not exist` | Tabelas não foram criadas | Execute o SQL da seção 5.2 |
| `connection refused` (5432) | PostgreSQL parado | `systemctl start postgresql` |
| `connection refused` (3001) | Backend parado | `pm2 restart catalogo-api` |
| Site não carrega pelo IP | Nginx parado ou mal configurado | `nginx -t && systemctl restart nginx` |
| `502 Bad Gateway` | Backend não está rodando | `pm2 status` → reinicie se offline |
| `413 Request Entity Too Large` | Nginx bloqueando upload grande | Adicione `client_max_body_size 50M;` no Nginx |
| Imagens não aparecem | Pasta uploads inexistente ou path errado | `mkdir -p /var/www/catalogo/public/uploads` |
| Produto criado no admin não aparece | `active = false` ou erro silencioso | Verifique: `SELECT * FROM products ORDER BY created_at DESC LIMIT 5;` |
| CORS error no navegador | `VITE_API_URL` incorreta no `.env` | Deve apontar para o domínio/IP público, não localhost |
| Admin não salva produto | Backend retornando erro | `pm2 logs catalogo-api` para ver o erro |
| Frontend desatualizado após mudança | Build antigo em cache | `npm run build` e force reload (Ctrl+Shift+R) |

### Proteger o Admin com Autenticação Básica (Nginx)

```bash
# Instalar htpasswd
apt install -y apache2-utils

# Criar usuário admin
htpasswd -c /etc/nginx/.htpasswd admin
# Digitar a senha quando solicitado

# Adicionar no bloco do Nginx (dentro de server {}):
# location /admin {
#     auth_basic "Área Administrativa";
#     auth_basic_user_file /etc/nginx/.htpasswd;
#     try_files $uri $uri/ /index.html;
# }

# Reiniciar Nginx
systemctl restart nginx
```

---

## 17. Backup Automático

### Criar script de backup

```bash
cat > /root/backup-catalogo.sh << 'SCRIPT'
#!/bin/bash
BACKUP_DIR="/root/backups"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M)

# Backup do banco
pg_dump -U postgres catalogo > $BACKUP_DIR/db_$DATE.sql

# Backup das imagens
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C /var/www/catalogo/public uploads/

# Remover backups com mais de 30 dias
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup concluído: $DATE"
SCRIPT

chmod +x /root/backup-catalogo.sh
```

### Agendar via cron (diário às 3h da manhã)

```bash
crontab -e
# Adicionar a linha:
0 3 * * * /root/backup-catalogo.sh >> /var/log/backup-catalogo.log 2>&1
```

---

## Resumo Rápido — Copiar e Colar

```bash
# ═══════════════════════════════════════════════════
# INSTALAÇÃO COMPLETA EM UMA VPS UBUNTU
# ═══════════════════════════════════════════════════

# 1. Preparar servidor
apt update && apt upgrade -y
apt install -y curl git build-essential ufw nginx postgresql postgresql-contrib

# 2. Node.js + PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2

# 3. PostgreSQL
systemctl start postgresql && systemctl enable postgresql
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'MINHA_SENHA';"
sudo -u postgres psql -c "CREATE DATABASE catalogo;"

# 4. Criar tabelas (copie o SQL da seção 5.2 e execute):
psql -U postgres -h localhost -d catalogo
# ... cole todo o SQL e execute ...

# 5. Clonar projeto
cd /var/www
git clone <URL_DO_REPOSITORIO> catalogo
cd catalogo
npm install
mkdir -p public/uploads

# 6. Configurar .env
cat > .env << EOF
VITE_API_MODE=postgres
VITE_API_URL=http://MEU_IP/api
DATABASE_URL=postgresql://postgres:MINHA_SENHA@localhost:5432/catalogo
PORT=3001
EOF

# 7. Build frontend
npm run build

# 8. Iniciar backend
pm2 start "npx tsx server/index.ts" --name catalogo-api --cwd /var/www/catalogo
pm2 startup && pm2 save

# 9. Firewall
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw enable

# 10. Nginx (crie o arquivo de config conforme seção 10)
# ...

# 11. Pronto! Acesse:
#     http://MEU_IP        → Catálogo
#     http://MEU_IP/admin  → Admin
```
